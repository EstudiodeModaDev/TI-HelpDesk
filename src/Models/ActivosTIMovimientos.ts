export const TIPO_EVENTO = {
  alta: "Alta",
  traslado: "Traslado",
  asignacion: "Asignacion",
  cambio_estado: "Cambio de Estado",
  baja: "Baja",
  vinculo_prestamo: "Vinculo Prestamo",
} as const;

export type TipoEvento = keyof typeof TIPO_EVENTO;

export interface ActivoMovimiento {
  id: string;
  activo_id: string;
  tipo_evento: TipoEvento;
  ubicacion_origen?: string;
  ubicacion_destino?: string;
  usuario_origen_id?: string;
  usuario_destino_id?: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  responsable_id: string;
  ticket_id?: string;
  fecha_evento: string;
  comentario?: string;
}
export type CrearActivoMovimientoDTO = Omit<
  ActivoMovimiento,
  "id" | "fecha_evento"
>;

export interface MovimientoErrors {
  tipo_evento?: string;
}

export const ValidarMovimiento = (
  data: Partial<CrearActivoMovimientoDTO>,
): MovimientoErrors => {
  const errors: MovimientoErrors = {};

  if (!data.tipo_evento?.trim()) {
    errors.tipo_evento = "Debe seleccionar un tipo de evento";
  }
  return errors;
};
