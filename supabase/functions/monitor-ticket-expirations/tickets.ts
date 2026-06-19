import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { MonitorConfig, Ticket, Tracking } from "./types.ts";

const TICKETS_TABLE = "TBL_Ticket_Solvi";
const TRACKING_TABLE = "TBL_Seguimientos_Solvi";

export const EXPIRED_TRACKING_TYPE = "Cambio automático a Fuera de tiempo";
export const WARNING_TRACKING_TYPE = "Alerta automática de vencimiento";
export const SYSTEM_ACTOR_NAME = "Sistema";

function toTicketIdNumber(ticketId: number | string): number {
  const parsed = Number(ticketId);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric ticket id: ${ticketId}`);
  }

  return parsed;
}

export function createAdminClient(config: MonitorConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function fetchOpenTicketsPage(
  supabase: SupabaseClient,
  pageSize: number,
  from: number,
): Promise<Ticket[]> {
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from(TICKETS_TABLE)
    .select(
      [
        "ticket_solvi_id",
        "ticket_solvi_titulo",
        "ticket_solvi_estado",
        "ticket_solvi_resolutor",
        "ticket_solvi_correo_resolutor",
        "ticket_solvi_fechamaxima",
      ].join(","),
    )
    .in("ticket_solvi_estado", ["En Atención", "En Atencion"])
    .neq("ticket_solvi_resolutor", "Automatizaciones")
    .not("ticket_solvi_fechamaxima", "is", null)
    .order("ticket_solvi_id", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to query tickets: ${error.message}`);
  }

  return (data ?? []) as Ticket[];
}

export async function updateTicketStatus(
  supabase: SupabaseClient,
  ticketId: number | string,
  status: string,
): Promise<void> {
  const { error } = await supabase
    .from(TICKETS_TABLE)
    .update({ ticket_solvi_estado: status })
    .eq("ticket_solvi_id", ticketId);

  if (error) {
    throw new Error(
      `Failed to update ticket ${ticketId} to status ${status}: ${error.message}`,
    );
  }
}

export async function createTracking(
  supabase: SupabaseClient,
  tracking: Tracking,
): Promise<void> {
  const { error } = await supabase.from(TRACKING_TABLE).insert(tracking);
  if (error) {
    throw new Error(
      `Failed to create tracking for ticket ${tracking.seguimientos_solvi_id_ticket}: ${error.message}`,
    );
  }
}

export async function hasTrackingEvent(
  supabase: SupabaseClient,
  ticketId: number | string,
  trackingType: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from(TRACKING_TABLE)
    .select("seguimientos_solvi_id", { head: false })
    .eq("seguimientos_solvi_id_ticket", toTicketIdNumber(ticketId))
    .eq("seguimientos_solvi_tipo_de_accion", trackingType)
    .limit(1);

  if (error) {
    throw new Error(
      `Failed to validate tracking duplication for ticket ${ticketId}: ${error.message}`,
    );
  }

  return Array.isArray(data) && data.length > 0;
}

export function buildExpiredTracking(
  ticket: Ticket,
  actionDateIso: string,
): Tracking {
  return {
    seguimientos_solvi_id_ticket: toTicketIdNumber(ticket.ticket_solvi_id),
    seguimientos_solvi_tipo_de_accion: EXPIRED_TRACKING_TYPE,
    seguimientos_solvi_action_date: actionDateIso,
    seguimientos_solvi_descripcion:
      "El ticket superó la fecha máxima de solución y fue marcado automáticamente como Fuera de tiempo.",
    seguimientos_solvi_correo_actor: "",
    seguimientos_solvi_actor: SYSTEM_ACTOR_NAME,
  };
}

export function buildWarningTracking(
  ticket: Ticket,
  actionDateIso: string,
  hoursRemaining: number,
): Tracking {
  return {
    seguimientos_solvi_id_ticket: toTicketIdNumber(ticket.ticket_solvi_id),
    seguimientos_solvi_tipo_de_accion: WARNING_TRACKING_TYPE,
    seguimientos_solvi_action_date: actionDateIso,
    seguimientos_solvi_descripcion:
      `Se envió una alerta automática de vencimiento al resolutor. Tiempo restante aproximado: ${hoursRemaining.toFixed(2)} horas.`,
    seguimientos_solvi_correo_actor: "",
    seguimientos_solvi_actor: SYSTEM_ACTOR_NAME,
  };
}
