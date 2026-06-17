import type { Ticket } from "../../../Models/Tickets";
import { parseDateFlex } from "../../../utils/Date";

export function calcularColorEstado(ticket: Ticket): string {
  const estado = (ticket.Estadodesolicitud ?? "").toLowerCase();
  console.log(estado)

  if (estado === "cerrado" || estado === "cerrado fuera de tiempo") {
    return "rgb(32, 32, 32)";
  }

  if (!ticket.FechaApertura || !ticket.FechaMaxima) {
    return "rgba(255,0,0,1)";
  }

  const inicio = parseDateFlex(ticket.FechaApertura)?.getTime() ?? Number.NaN;
  const fin = parseDateFlex(ticket.FechaMaxima)?.getTime() ?? Number.NaN;
  const ahora = Date.now();

  if (isNaN(inicio) || isNaN(fin)) {
    return "rgba(255,0,0,1)";
  }

  const horasTotales = (fin - inicio) / 3_600_000;
  const horasRestantes = (fin - ahora) / 3_600_000;

  if (horasTotales <= 0 || horasRestantes <= 0) {
    return "rgba(255,0,0,1)";
  }

  const p = Math.max(0, Math.min(1, horasRestantes / horasTotales));

  const r = p > 0.5 ? 34 : p > 0.1 ? 255 : 255;
  const g = p > 0.5 ? 139 : p > 0.1 ? 165 : 0;
  const b = p > 0.5 ? 34 : p > 0.1 ? 0 : 0;

  const alpha = Math.max(0.3, 1 - p);
  return `rgba(${r},${g},${b},${alpha})`;
}
