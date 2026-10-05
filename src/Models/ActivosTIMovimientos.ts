export const ESTADOS_ACTIVO = {
  Disponible: "Disponible",
  Asignado: "Asignado",
  en_prestamo: "En Prestamo",
} as const;

export type EstadoActivo = keyof typeof ESTADOS_ACTIVO;

export interface ActivoMovimientoResumenActivo {
  codigo_inventario: string;
  tipo: string;
  marca?: string | null;
  modelo?: string | null;
  numero_serie: string;
}

export interface ActivoMovimiento {
  id: string;
  activo_id: string;
  activo?: ActivoMovimientoResumenActivo | null;
  ubicacion_origen?: string;
  ubicacion_destino: string;
  usuario_origen_nombre?: string;
  usuario_origen_correo?: string;
  usuario_destino_correo?: string;
  usuario_destino_nombre?: string;
  estado_anterior?: string;
  estado_nuevo?: EstadoActivo;
  responsable_correo: string;
  responsable_nombre: string;
  ticket_id?: string;
  fecha_evento: string;
  comentario?: string;
}
export type CrearActivoMovimientoDTO = Omit<
  ActivoMovimiento,
  "id" | "fecha_evento" | "activo"
>;

export interface MovimientoErrors {
  estado_nuevo?: string;
  responsable_correo?: string;
  responsable_nombre?: string;
  usuario_destino_nombre?: string;
  usuario_destino_correo?: string;
}

export const ValidarMovimiento = (
  data: Partial<CrearActivoMovimientoDTO>,
): MovimientoErrors => {
  const errors: MovimientoErrors = {};

  if (!data.estado_nuevo?.trim()) {
    errors.estado_nuevo = "Debe seleccionar un estado";
  }
  if (!data.responsable_correo?.trim()) {
    errors.responsable_correo = "Debe seleccionar un correo del responsable";
  }
  if (!data.responsable_nombre?.trim()) {
    errors.responsable_nombre = "Debe seleccionar el nombre del responsable";
  }

  return errors;
};
