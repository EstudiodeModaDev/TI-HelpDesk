import type {
  ActivoTI,
  CategoriaActivo,
  EstadoActivo,
  Ubicacion_Tipo,
  CrearActivoDTO,
  ActualizarActivoDTO,
} from "../../Models/ActivoTI";

export type FilterActivosTI = {
  categoria?: CategoriaActivo;
  estado?: EstadoActivo;
  ubicacion_tipo?: Ubicacion_Tipo;
  search?: string;
  usuario_asignado_id?: string;
  pageSize?: number;
  pageIndex?: number;
  paginated?: boolean;
};
export type ActivosTILoadResult = {
  data: ActivoTI[];
  status: boolean;
  message: string | null;
  total?: number;
  pageSize?: number;
  pageIndex?: number;
  hasNext?: boolean;
};
export interface ActivosTIRepository {
  loadActivos(filter?: FilterActivosTI): Promise<ActivosTILoadResult>;
  createActivo(payload: CrearActivoDTO): Promise<{
    data: ActivoTI | null;
    status: boolean;
    message: string | null;
  }>;
  updateActivo(
    id: string,
    payload: ActualizarActivoDTO,
  ): Promise<{
    data: ActivoTI | null;
    status: boolean;
    message: string | null;
  }>;
  getActivoById(id: string): Promise<{
    data: ActivoTI | null;
    status: boolean;
    message: string | null;
  }>;
}
