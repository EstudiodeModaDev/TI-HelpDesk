export const CATEGORIAS_ACTIVO = {
  equipo_computo: "Equipo de cómputo",
  periferico: "Periférico",
  red_infraestructura: "Red / Infraestructura",
} as const;

export const ESTADOS_ACTIVO = {
  disponible: "Disponible",
  asignado: "Asignado",
  en_prestamo: "En préstamo",
  en_mantenimiento: "En mantenimiento",
  dado_de_baja: "Dado de baja",
} as const;

export const UBICACIONES_ACTIVO = {
  bodega_central: "Bodega central",
  tienda: "Tienda",
} as const;

export type CategoriaActivo = keyof typeof CATEGORIAS_ACTIVO;
export type EstadoActivo = keyof typeof ESTADOS_ACTIVO;
export type Ubicacion_Tipo = keyof typeof UBICACIONES_ACTIVO;

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
  nombre_usuario: string;
  correo_usuario: string;
  notas?: string | null;
  prestamo_activo_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
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
  nombre_usuario?: string;
  correo_usuario?: string;
  general?: string;
}

export const validarActivoTI = (
  data: Partial<CrearActivoDTO>,
): ActivoTIErrors => {
  const errors: ActivoTIErrors = {};

  if (!data.codigo_inventario?.trim()) {
    errors.codigo_inventario = "El código de inventario es obligatorio";
  }
  if (!data.numero_serie?.trim()) {
    errors.numero_serie = "El número de serie es obligatorio";
  }
  if (!data.ubicacion_tipo?.trim()) {
    errors.ubicacion_tipo = "Debe seleccionar una ubicación";
  }
  if (!data.categoria?.trim()) {
    errors.categoria = "Debe seleccionar una categoria valida";
  }
  if (!data.tipo?.trim()) {
    errors.tipo = "El tipo de activo es obligatorio";
  }
  if (!data.nombre_usuario?.trim()) {
    errors.nombre_usuario = "El nombre del usuario es obligatorio";
  }
  if (!data.correo_usuario?.trim()) {
    errors.correo_usuario = "El correo del usuario es obligatorio";
  }

  return errors;
};
