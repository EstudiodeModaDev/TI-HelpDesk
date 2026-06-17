import type { Ticket } from "../../../Models/Tickets";
import type { TZDate } from "@date-fns/tz";
import { toGraphDateTime } from "../../../utils/Date";
import { ESTADO_EN_ATENCION } from "./ticketConstants";
import { pickTecnicoConMenosCasos } from "./ticketAssignment";
import type { UsuariosSPRepository } from "../../../repositories/UsuariosRepository/UsuariosSPRepository";


export async function buildNuevoUsuarioTicketPayload(
  params: {
    ans: string; 
    motivo: string; 
    descripcion: string; 
    solicitante?: { name?: string; email?: string };
    solucion: TZDate | Date | null},
    usuarios: UsuariosSPRepository
): Promise<Ticket> {
  const resolutor = await pickTecnicoConMenosCasos(usuarios)
  return {
    AsuntoTicket: params.motivo,
    Descripcion: params.descripcion,
    FechaApertura: toGraphDateTime(new Date()),
    FechaMaxima: toGraphDateTime(params.solucion as any),
    Nombreresolutor: resolutor?.Title,
    Correoresolutor: resolutor?.Correo,
    Solicitante: params.solicitante?.name,
    CorreoSolicitante: params.solicitante?.email,
    Estadodesolicitud: ESTADO_EN_ATENCION,
  };
}