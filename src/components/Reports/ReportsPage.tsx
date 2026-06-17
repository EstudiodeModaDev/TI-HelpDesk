import * as React from "react";
import * as XLSX from "xlsx";
import type { Ticket } from "../../Models/Tickets";
import { toISODateTimeFlex } from "../../utils/Date";
import { norm } from "../../utils/Commons";
import "./Reports.css";
import { useRepositories } from "../../repositories/repositoriesContext";
import type { TicketsRepository } from "../../repositories/TicketsRepository/TicketRepository";

type MonthWindow = {
  label: string;
  fileLabel: string;
  start: Date;
  endExclusive: Date;
};

type ExportState = "idle" | "loading" | "success" | "error";

type MonthSummary = {
  mes: string;
  total: number;
  disponibilidad: number;
  cerrados: number;
  cerradosFueraDeTiempo: number;
  abiertos: number;
};

type ResolverSummary = {
  mes: string;
  resolutor: string;
  total: number;
  disponibilidad: number;
  cerrados: number;
  cerradosFueraDeTiempo: number;
  abiertos: number;
};

function getMonthWindow(baseDate: Date, offset: number): MonthWindow {
  const start = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + offset, 1, 0, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + offset + 1, 1, 0, 0, 0, 0));

  return {
    label: start.toLocaleString("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }),
    fileLabel: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    start,
    endExclusive,
  };
}


async function getAllTicketsForRange(service: TicketsRepository, range: MonthWindow): Promise<Ticket[]> {
  const firstPage = await service.loadTickets({range: {from: String(range.start), to: String(range.endExclusive)}});

  const allTickets = [...firstPage.data];

  return allTickets;
}

function normalizeText(value?: string | null): string {
  return String(value ?? "").trim();
}

function isDisponibilidad(ticket: Ticket): boolean {
  return norm(ticket.Fuente) === "disponibilidad";
}

function classifyEstado(ticket: Ticket) {
  const estado = norm(ticket.Estadodesolicitud);

  return {
    cerrado: estado === "cerrado" || estado === "cerrado a tiempo",
    cerradoFueraDeTiempo: estado === "fuera de tiempo" || estado === "cerrado fuera de tiempo",
  };
}

function splitResolvers(ticket: Ticket): string[] {
  const name = normalizeText(ticket.Nombreresolutor);
  const email = normalizeText(ticket.Correoresolutor);
  const raw = email || name;

  if (!raw) return ["(Sin resolutor)"];

  const names = raw
    .split(/[;,]/)
    .map((part) => part.replace(/<.*?>/g, "").trim())
    .filter(Boolean);

  return names.length ? Array.from(new Set(names)) : ["(Sin resolutor)"];
}

function toExcelRows(tickets: Ticket[]) {
  return tickets.map((ticket) => ({
    ID: ticket.ID ?? "",
    Asunto: normalizeText(ticket.AsuntoTicket),
    Solicitante: normalizeText(ticket.Solicitante),
    "Correo solicitante": normalizeText(ticket.CorreoSolicitante),
    Resolutor: normalizeText(ticket.Nombreresolutor),
    "Correo resolutor": normalizeText(ticket.Correoresolutor),
    Estado: normalizeText(ticket.Estadodesolicitud),
    Fuente: normalizeText(ticket.Fuente),
    Categoria: normalizeText(ticket.Categoria),
    Subcategoria: normalizeText(ticket.SubCategoria),
    Articulo: normalizeText(ticket.Articulo),
    "Fecha apertura": toISODateTimeFlex(ticket.FechaApertura) || "",
    "Tiempo solucion": toISODateTimeFlex(ticket.FechaMaxima) || "",
    ANS: normalizeText(ticket.ANS),
    Observador: normalizeText(ticket.Observador),
    "Correo observador": normalizeText(ticket.CorreoObservador),
    "Caso padre": normalizeText(ticket.IdCasoPadre),
  }));
}

function buildMonthSummary(label: string, tickets: Ticket[]): MonthSummary {
  let disponibilidad = 0;
  let cerrados = 0;
  let cerradosFueraDeTiempo = 0;

  for (const ticket of tickets) {
    if (isDisponibilidad(ticket)) disponibilidad++;

    const estado = classifyEstado(ticket);
    if (estado.cerrado) cerrados++;
    if (estado.cerradoFueraDeTiempo) cerradosFueraDeTiempo++;
  }

  return {
    mes: label,
    total: tickets.length,
    disponibilidad,
    cerrados,
    cerradosFueraDeTiempo,
    abiertos: tickets.length - (cerrados + cerradosFueraDeTiempo),
  };
}

function buildResolverSummary(label: string, tickets: Ticket[]): ResolverSummary[] {
  const byResolver = new Map<string, Omit<ResolverSummary, "mes" | "resolutor">>();

  for (const ticket of tickets) {
    const resolvers = splitResolvers(ticket);
    const disponibilidad = isDisponibilidad(ticket);
    const estado = classifyEstado(ticket);

    for (const resolutor of resolvers) {
      const entry = byResolver.get(resolutor) ?? {
        total: 0,
        disponibilidad: 0,
        cerrados: 0,
        cerradosFueraDeTiempo: 0,
        abiertos: 0,
      };

      entry.total++;
      if (disponibilidad) entry.disponibilidad++;
      if (estado.cerrado) entry.cerrados++;
      if (estado.cerradoFueraDeTiempo) entry.cerradosFueraDeTiempo++;

      byResolver.set(resolutor, entry);
    }
  }

  return Array.from(byResolver.entries())
    .map(([resolutor, values]) => ({
      mes: label,
      resolutor,
      ...values,
      abiertos: values.total - (values.cerrados + values.cerradosFueraDeTiempo),
    }))
    .sort((a, b) => b.total - a.total || a.resolutor.localeCompare(b.resolutor, "es", { sensitivity: "base" }));
}

function makeSheetName(label: string): string {
  const cleaned = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/*?:[\]]/g, "")
    .trim();

  return cleaned.slice(0, 31) || "Tickets";
}

export default function ReportsPage() {
  const { tickets } = useRepositories();
  const [state, setState] = React.useState<ExportState>("idle");
  const [message, setMessage] = React.useState("Exporta los tickets del mes actual y del mes anterior en un solo archivo de Excel.");
  const [monthSummaries, setMonthSummaries] = React.useState<MonthSummary[]>([]);
  const [resolverSummaries, setResolverSummaries] = React.useState<ResolverSummary[]>([]);

  const currentMonth = React.useMemo(() => getMonthWindow(new Date(), 0), []);
  const previousMonth = React.useMemo(() => getMonthWindow(new Date(), -1), []);

  const handleExport = React.useCallback(async () => {
    setState("loading");
    setMessage(`Leyendo tickets de ${currentMonth.label} y ${previousMonth.label}...`);

    try {
      const [currentTickets, previousTickets] = await Promise.all([
        getAllTicketsForRange(tickets!, currentMonth),
        getAllTicketsForRange(tickets!, previousMonth),
      ]);

      const workbook = XLSX.utils.book_new();
      const resumenMeses = [
        buildMonthSummary(currentMonth.label, currentTickets),
        buildMonthSummary(previousMonth.label, previousTickets),
      ];
      const resumenResolutores = [
        ...buildResolverSummary(currentMonth.label, currentTickets),
        ...buildResolverSummary(previousMonth.label, previousTickets),
      ];

      setMonthSummaries(resumenMeses);
      setResolverSummaries(resumenResolutores);

      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumenMeses), "Resumen");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(resumenResolutores), "Resolutores");
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(toExcelRows(currentTickets)),
        makeSheetName(`Tickets ${currentMonth.label}`)
      );
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(toExcelRows(previousTickets)),
        makeSheetName(`Tickets ${previousMonth.label}`)
      );

      const fileName = `ReporteTickets_${currentMonth.fileLabel}_${previousMonth.fileLabel}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setState("success");
      setMessage(
        `Excel generado con resumen mensual, resolutores y detalle de ${currentMonth.label} y ${previousMonth.label}.`
      );
    } catch (error: any) {
      setState("error");
      setMonthSummaries([]);
      setResolverSummaries([]);
      setMessage(error?.message ?? "No fue posible generar el reporte de tickets.");
    }
  }, [tickets, currentMonth, previousMonth]);

  return (
    <section className="reports-page">
      <div className="reports-card">
        <p className="reports-eyebrow">Reportes</p>
        <h2>Exportar tickets a Excel</h2>
        <p className="reports-copy">
          Este reporte toma todos los tickets abiertos entre el{" "}
          <strong>{currentMonth.start.toLocaleDateString("es-CO", { timeZone: "UTC" })}</strong> y el{" "}
          <strong>{new Date(currentMonth.endExclusive.getTime() - 1).toLocaleDateString("es-CO", { timeZone: "UTC" })}</strong>,
          y tambi&eacute;n los del mes anterior.
        </p>

        <div className="reports-periods">
          <div className="reports-period">
            <span className="reports-period__label">Mes actual</span>
            <strong>{currentMonth.label}</strong>
          </div>
          <div className="reports-period">
            <span className="reports-period__label">Mes anterior</span>
            <strong>{previousMonth.label}</strong>
          </div>
        </div>

        <button type="button" className="btn btn-primary reports-button" onClick={handleExport} disabled={state === "loading"}>
          {state === "loading" ? "Generando Excel..." : "Generar Excel"}
        </button>

        <p className={`reports-status reports-status--${state}`}>{message}</p>
      </div>

      {monthSummaries.length > 0 && (
        <div className="reports-card">
          <h3>Resumen por mes</h3>
          <div className="reports-tableWrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Total</th>
                  <th>Disponibilidad</th>
                  <th>Cerrados</th>
                  <th>Cerrados fuera de tiempo</th>
                  <th>Abiertos</th>
                </tr>
              </thead>
              <tbody>
                {monthSummaries.map((row) => (
                  <tr key={row.mes}>
                    <td>{row.mes}</td>
                    <td>{row.total}</td>
                    <td>{row.disponibilidad}</td>
                    <td>{row.cerrados}</td>
                    <td>{row.cerradosFueraDeTiempo}</td>
                    <td>{row.abiertos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resolverSummaries.length > 0 && (
        <div className="reports-card">
          <h3>Resumen por resolutor</h3>
          <div className="reports-tableWrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Resolutor</th>
                  <th>Total</th>
                  <th>Dispo</th>
                  <th>Cerrados</th>
                  <th>Cerrados fuera de tiempo</th>
                  <th>Abiertos</th>
                </tr>
              </thead>
              <tbody>
                {resolverSummaries.map((row) => (
                  <tr key={`${row.mes}-${row.resolutor}`}>
                    <td>{row.mes}</td>
                    <td>{row.resolutor}</td>
                    <td>{row.total}</td>
                    <td>{row.disponibilidad}</td>
                    <td>{row.cerrados}</td>
                    <td>{row.cerradosFueraDeTiempo}</td>
                    <td>{row.abiertos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
