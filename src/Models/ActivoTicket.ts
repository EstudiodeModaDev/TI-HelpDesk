// Va a reutilizar el modelo de activosTI

import type { ActivoTI } from "./ActivoTI";

export interface ActivoTicket {
  id: string;
  activo_id: string;
  ticket_id: number;
  fecha_vinculacion: string;
  vinculado_por_nombre: string;
  activo?: ActivoTI | null;
}
export type CrearActivoTicketDTO = Omit<
  ActivoTicket,
  "id" | "fecha_vinculacion" | "activo"
>;
