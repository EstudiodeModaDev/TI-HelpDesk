export interface MonitorConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  msTenantId: string;
  msClientId: string;
  msClientSecret: string;
  graphScope: string;
  mailboxUser: string;
  warningThresholdHours: number;
  pageSize: number;
}

export interface ColombiaNow {
  utcDate: Date;
  localDate: Date;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
  isoLocal: string;
  dateKey: string;
}

export interface Ticket {
  ticket_solvi_id: number | string;
  ticket_solvi_titulo: string | null;
  ticket_solvi_estado: string | null;
  ticket_solvi_resolutor: string | null;
  ticket_solvi_correo_resolutor: string | null;
  ticket_solvi_fechamaxima: string | null;
}

export interface Tracking {
  seguimientos_solvi_id_ticket: number;
  seguimientos_solvi_tipo_de_accion: string;
  seguimientos_solvi_action_date: string;
  seguimientos_solvi_descripcion: string;
  seguimientos_solvi_correo_actor: string;
  seguimientos_solvi_actor: string;
}

export interface ExecutionSummary {
  ok: boolean;
  processed: number;
  expired: number;
  warningsSent: number;
  skipped: number;
  errors: string[];
  reason: string | null;
}

export interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface GraphMailPayload {
  to: string;
  subject: string;
  htmlContent: string;
}
