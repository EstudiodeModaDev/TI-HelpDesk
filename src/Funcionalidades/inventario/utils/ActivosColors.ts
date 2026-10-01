import type { EstadoActivo } from "../../../Models/ActivosTIMovimientos";

const COLORES_ESTADO: Record<EstadoActivo, string> = {
  Disponible: "rgb(34, 197, 94)",
  Asignado: "rgb(59, 130, 246)",
  en_prestamo: "rgb(245, 158, 11)",
};

export function colorEstadoActivo(estado?: EstadoActivo | null): string {
  return (estado && COLORES_ESTADO[estado]) || "rgb(150, 150, 150)";
}
