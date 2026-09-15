export type CategoriaActivo =
  | "Equipo_computo"
  | "periferico"
  | "red infraestructura";

export type EstadoActivo =
  | "disponible"
  | "asignado"
  | "en_prestamo"
  | "en_mantenimiento"
  | "dado_de_baja";
export type Ubicacion_Tipo = "bodega_central" | "tienda";

export interface ActivoTI {
  id: string;
  codigo_inventario: string;
  categoria: CategoriaActivo;
  tipo: string;
  subtipo?: string | null;
  marca?: string | null;
  modelo?: string | null;
  numero_serie: string;
  fecha_ingreso: string;
  proveedor?: string | null;
  estado: EstadoActivo;
  ubicacion_tipo: Ubicacion_Tipo;
  tienda_id?: string | null;
  usuario_asignado_id?: string | null;
  fecha_fin_garantia?: string | null;
  notas?: string | null;
  prestamo_activo_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export type CrearActivoDTO = Omit<
  ActivoTI,
  | "id"
  | "created_at"
  | "updated_at"
  | "created_by"
  | "updated_by"
  | "prestamo_activo_id"
>;

export type ActualizarActivoDTO = Partial<CrearActivoDTO>;

export interface ActivoTIErrors {
  codigo_inventario?: string;
  categoria?: string;
  tipo?: string;
  numero_serie?: string;
  estado?: string;
  fecha_ingreso?: string;
  ubicacion_tipo?: string;
  general?: string;
  tienda_id?: string;
}

export const validarActivoTI = (
  data: Partial<CrearActivoDTO>,
): ActivoTIErrors => {
  const errors: ActivoTIErrors = {};

  if (!data.codigo_inventario?.trim()) {
    errors.codigo_inventario = "El código de invetario es obligatorio";
  }

  if (!data.numero_serie?.trim()) {
    errors.numero_serie = "El numero de serie es obligatorio";
  }
  if (!data.categoria) {
    errors.categoria = "Debe seleccionar una categoria valida";
  }
  if (!data.tipo?.trim()) {
    errors.tipo = "El tipo de activo es obligatorio";
  }
  if (data.ubicacion_tipo == "tienda" && !data.tienda_id) {
    errors.tienda_id = "Debe seleccionar una tienda si la ubicacion es Tienda";
  }

  return errors;
};
