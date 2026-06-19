import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  GraphMessage,
  MailTicketMapRecord,
  ResolverAssignment,
  StoredFileRecord,
  TicketFileInsert,
  TicketInsertPayload,
  TicketRecord,
} from "./types.ts";

function buildTicketPayload(
  message: GraphMessage,
  descripcion: string,
  _storageFolder: string,
  resolver: ResolverAssignment | null,
  source = "outlook_graph",
): TicketInsertPayload {
  const requester = message.from?.emailAddress ?? message.sender?.emailAddress ?? {};
  const titulo = (message.subject?.trim() || "Sin asunto").slice(0, 500);
  const hasResolver = !!resolver;
  const fechaActual = new Date();
  const fechaMaxima = new Date(fechaActual);
  fechaMaxima.setHours(fechaMaxima.getHours() + 2);

  return {
    ticket_solvi_titulo: titulo,
    ticket_solvi_descripcion: descripcion,
    ticket_solvi_correo_solicitante: requester.address ?? null,
    ticket_solvi_solicitante: requester.name ?? null,
    ticket_solvi_fuente: source,
    ticket_solvi_estado: hasResolver ? "En Atención" : "pendiente_asignacion",
    ticket_solvi_mail_conversation_id: message.id,
    ticket_solvi_resolutor: resolver?.nombre_resolutor ?? null,
    ticket_solvi_correo_resolutor: resolver?.correo_resolutor ?? null,
    ticket_solvi_fechaapertura: fechaActual.toISOString(),
    ticket_solvi_fechamaxima: fechaMaxima.toISOString(),
  };
}

function resolveTicketPrimaryId(record: Record<string, unknown>): string {
  const candidates = [record.ticket_solvi_id, record.id];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }

  throw new Error("Ticket record did not include a usable identifier");
}

function normalizeAttachmentTicketId(ticketId: string): string | number {
  const numericId = Number(ticketId);
  return Number.isFinite(numericId) ? numericId : ticketId;
}

export async function findExistingTicketId(
  supabase: SupabaseClient,
  message: GraphMessage,
): Promise<string | null> {
  const graphMessageId = message.id;
  const internetMessageId = message.internetMessageId ?? null;

  const mapTicketId = await findTicketIdInTable(
    supabase,
    "TBL_Ticket_Solvi",
    graphMessageId,
    internetMessageId,
  );
  
  if (mapTicketId) {
    return mapTicketId;
  }

  return await findTicketIdInTable(
    supabase,
    "TBL_Ticket_Solvi",
    graphMessageId,
    internetMessageId,
  );
}

async function findTicketIdInTable(
  supabase: SupabaseClient,
  table: "TBL_Ticket_Solvi",
  graphMessageId: string,
  internetMessageId: string | null,
): Promise<string | null> {
  const graphQuery = await supabase
    .from(table)
    .select("*")
    .eq("ticket_solvi_mail_conversation_id", graphMessageId)
    .order("ticket_solvi_id", { ascending: false })
    .limit(1);

  if (graphQuery.error) {
    throw new Error(
      `Failed to query ${table} by ticket_solvi_mail_conversation_id: ${graphQuery.error.message}`,
    );
  }

  const graphMatch = Array.isArray(graphQuery.data) ? graphQuery.data[0] : null;
  if (graphMatch) {
    return resolveTicketPrimaryId(graphMatch as Record<string, unknown>);
  }

  if (!internetMessageId) {
    return null;
  }

  return null;
}

export async function createTicket(
  supabase: SupabaseClient,
  message: GraphMessage,
  descripcion: string,
  storageFolder: string,
  resolver: ResolverAssignment | null,
  source = "outlook_graph",
): Promise<TicketRecord> {
  const payload = buildTicketPayload(
    message,
    descripcion,
    storageFolder,
    resolver,
    source,
  );

  const { data, error } = await supabase
    .from("TBL_Ticket_Solvi")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create ticket: ${error.message}`);
  }

  return {
    ...(data as TicketRecord),
    id: resolveTicketPrimaryId(data as Record<string, unknown>),
  };
}

export async function saveTicketFiles(
  supabase: SupabaseClient,
  ticketId: string,
  files: StoredFileRecord[],
): Promise<void> {
  if (files.length === 0) {
    return;
  }

  const relationTicketId = normalizeAttachmentTicketId(ticketId);
  const payload: TicketFileInsert[] = files.map((file) => ({
    id_ticket: relationTicketId,
    attachment_path: file.url,
    file_name: file.filename,
    attachment_type: "Creacion",
    storage_bucket: file.bucket,
  }));

  const { error } = await supabase
    .from("TBL_Ticket_Attachments_Solvi")
    .insert(payload);

  if (error) {
    throw new Error(`Failed to save ticket files: ${error.message}`);
  }
}
