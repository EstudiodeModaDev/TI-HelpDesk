import * as XLSX from "xlsx";
import type { Ticket } from "../../../Models/Tickets";
import type { TicketsRepository } from "../../../repositories/TicketsRepository/TicketRepository";
import { toGraphDateTime } from "../../../utils/Date";
import { addHours } from "date-fns";

type ExcelRow = Record<string, unknown>;;

type ImportTicketsParams = {
  file: File;
  TicketsSvc: TicketsRepository;
};

type ImportError = {
  row: number;
  message: string;
};

export type ImportTicketsResult = {
  created: number;
  processed: number;
  skipped: number;
  errors: ImportError[];
};

const HEADER_ALIASES = {
  asunto: ["solicitante"],
  descripcion: ["descripcion"],
  fuente: ["fuente",],
  categoria: ["categoria"],
  subcategoria: ["subcategoria",],
  articulo: ["articulo",],
  solicitante: ["solicitante"],
  correoSolicitante: ["correoSolicitante"],
  resolutor: ["resolutor"],
  correoResolutor: ["correoresolutor"],
  IdPadre: ["Id Padre"],
  cerrado: ["¿Resuelto?"],
} as const;

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCell(row: ExcelRow, aliases: readonly string[]): unknown {
  for (const [rawKey, value] of Object.entries(row)) {
    const normalizedKey = normalizeHeader(rawKey);
    if (aliases.some((alias) => normalizedKey === alias)) {
      return value;
    }
  }

  return undefined;
}

function toText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function isRowEmpty(row: ExcelRow): boolean {
  return Object.values(row).every((value) => toText(value) === "");
}

function toDateValue(value: unknown, fallback?: string): string | undefined {
  if (value == null || value === "") {
    return fallback;
  }

  if (value instanceof Date) {
    return toGraphDateTime(value);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return fallback;

    const date = new Date(
      parsed.y,
      parsed.m - 1,
      parsed.d,
      parsed.H ?? 0,
      parsed.M ?? 0,
      parsed.S ?? 0
    );

    return toGraphDateTime(date);
  }

  return toGraphDateTime(String(value)) ?? fallback;
}

function mapRowToTicket(row: ExcelRow, rowNumber: number,): Ticket {
  const now = new Date();
  const toReturn: Ticket = {
    IdCasoPadre: String(getCell(row, HEADER_ALIASES.IdPadre)),
    AsuntoTicket: toText(getCell(row, HEADER_ALIASES.asunto)) || `Ticket masivo fila ${rowNumber}`,
    Descripcion: toText(getCell(row, HEADER_ALIASES.descripcion)) || "",
    Fuente: toText(getCell(row, HEADER_ALIASES.fuente)) || "Carga masiva",
    Categoria: toText(getCell(row, HEADER_ALIASES.categoria)) || "",
    SubCategoria: toText(getCell(row, HEADER_ALIASES.subcategoria)) || "",
    Articulo: toText(getCell(row, HEADER_ALIASES.articulo)) || "",
    Solicitante: toText(getCell(row, HEADER_ALIASES.solicitante)) || "",
    CorreoSolicitante: toText(getCell(row, HEADER_ALIASES.correoSolicitante)) || "",
    Nombreresolutor: toText(getCell(row, HEADER_ALIASES.resolutor)) || "",
    Correoresolutor: toText(getCell(row, HEADER_ALIASES.correoResolutor)) || "",
    Estadodesolicitud: normalizeHeader(toText(getCell(row, HEADER_ALIASES.cerrado))) === "si" ? "Cerrado" : "En atención",
    FechaApertura: toGraphDateTime(now),
    FechaMaxima: toDateValue(addHours(new Date(), 8)),
  }
  return toReturn
  
}

export async function importTicketsFromExcel({file, TicketsSvc,}: ImportTicketsParams): Promise<ImportTicketsResult> {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("El archivo no contiene hojas para procesar.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
    defval: "",
    raw: false,
  });

  const result: ImportTicketsResult = {
    created: 0,
    processed: 0,
    skipped: 0,
    errors: [],
  };

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;

    if (isRowEmpty(row)) {
      result.skipped += 1;
      continue;
    }

    result.processed += 1;

    const payload = mapRowToTicket(row, rowNumber);

    if (!payload.AsuntoTicket || !payload.Descripcion) {
      result.errors.push({
        row: rowNumber,
        message: "La fila no tiene asunto o descripcion.",
      });
      continue;
    }

    const created = await TicketsSvc.createTicket(payload);

    if (!created.status) {
      result.errors.push({
        row: rowNumber,
        message: created.message ?? "No fue posible crear el ticket.",
      });
      continue;
    }

    result.created += 1;
  }

  return result;
}
