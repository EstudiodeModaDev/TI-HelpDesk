import type {
  ActivoMovimiento,
  EstadoActivo,
  CrearActivoMovimientoDTO,
} from "../../Models/ActivosTIMovimientos";
import type { DateRange } from "../../Models/Filtros";

export type FilterActivosMovimiento = {
  activo_id?: string;
  estado_nuevo?: EstadoActivo;
  responsable_nombre?: string;
  range?: DateRange;
  search?: string;
  pageSize?: number;
  pageIndex?: number;
  paginated?: boolean;
  sortField?: string;
  sortDir?: "asc" | "desc";
};
export type MovimientosLoadResult = {
  data: ActivoMovimiento[];
  status: boolean;
  message: string | null;
  total?: number;
  pageSize?: number;
  pageIndex?: number;
  hasNext?: boolean;
};
export interface MovimientosTIRepository {
  loadMovimientos(
    filter?: FilterActivosMovimiento,
  ): Promise<MovimientosLoadResult>;
  createMovimientos(payload: CrearActivoMovimientoDTO): Promise<{
    data: ActivoMovimiento | null;
    status: boolean;
    message: string | null;
  }>;
  getMovimientosById(id: string): Promise<{
    data: ActivoMovimiento | null;
    status: boolean;
    message: string | null;
  }>;
}
