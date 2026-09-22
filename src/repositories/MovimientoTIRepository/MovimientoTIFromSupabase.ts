import type {
  ActivoMovimiento,
  CrearActivoMovimientoDTO,
} from "../../Models/ActivosTIMovimientos";
import type {
  FilterActivosMovimiento,
  MovimientosLoadResult,
  MovimientosTIRepository,
} from "./MovimientosTIRepository";
import { supabase } from "../../Services/Supabase.service";

export class SupabaseMovimientosTIRepository implements MovimientosTIRepository {
  private readonly tableName = "TBL_Solvi_Activos_TI_Movimientos";
  private readonly batchSize = 100;

  private buildActivoQuery(
    filter?: FilterActivosMovimiento,
    includeCount = false,
  ) {
    let query = supabase
      .from(this.tableName)
      .select("*", includeCount ? { count: "exact" } : undefined);

    if (filter?.activo_id) {
      query = query.eq("activo_id", filter.activo_id);
    }
    if (filter?.tipo_evento) {
      query = query.eq("tipo_evento", filter.tipo_evento);
    }
    if (filter?.responsable_id) {
      query = query.eq("responsable_id", filter.responsable_id);
    }
    if (filter?.range) {
      const nextDay = new Date(filter.range.to);
      nextDay.setDate(nextDay.getDate() + 1);
      ((query = query.gte("fecha_evento", filter.range.from)),
        (query = query.lte("fecha_evento", nextDay.toISOString())));
    }
    const trimmedSearch = String(filter?.search ?? "").trim();
    if (trimmedSearch) {
      const searchPattern = `%${trimmedSearch}%`;
      query = query.or(
        `comentario.ilike.${searchPattern},ubicacion_destino.ilike.${searchPattern},ubicacion_origen.iñike.${searchPattern}`,
      );
    }
    //Por orden, mas recientes primeros
    const sortField = filter?.sortField ?? "id";
    const ascending = filter?.sortDir === "asc";
    query = query.order(sortField, { ascending });

    if (sortField != "id") {
      query = query.order("id", { ascending: false });
    }

    return query;
  }
  async loadMovimientos(
    filter?: FilterActivosMovimiento,
  ): Promise<MovimientosLoadResult> {
    try {
      const pageSize = Math.max(1, Number(filter?.pageSize ?? 10));
      const pageIndex = Math.max(1, Number(filter?.pageIndex ?? 1));

      if (filter?.paginated) {
        const from = (pageIndex - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, error, count } = await this.buildActivoQuery(
          filter,
          true,
        ).range(from, to);

        if (error) {
          return {
            data: [],
            message: error.message,
            status: false,
          };
        }

        return {
          data: data.map((d) => this.toModel(d)) ?? [],
          hasNext: from + (data?.length ?? 0) < (count ?? 0),
          message: null,
          pageIndex,
          pageSize,
          status: true,
          total: count ?? data?.length ?? 0,
        };
      }

      const allRows: any[] = [];
      let from = 0;
      let total = 0;
      while (true) {
        const to = from + this.batchSize - 1;
        const { data, error, count } = await this.buildActivoQuery(
          filter,
          from === 0,
        ).range(from, to);
        if (error) {
          return {
            data: [],
            message: error.message,
            status: false,
          };
        }
        const rows = data ?? [];
        if (from === 0) {
          total = count ?? rows.length;
        }
        allRows.push(...rows);

        if (!rows.length || rows.length < this.batchSize) {
          break;
        }

        if (total > 0 && allRows.length >= total) {
          break;
        }

        from += this.batchSize;
      }
      return {
        data: allRows.map((d) => this.toModel(d)),
        hasNext: false,
        message: null,
        pageIndex,
        pageSize,
        status: true,
        total: total || allRows.length,
      };
    } catch (error: any) {
      return {
        data: [],
        status: false,
        message: error?.message ?? "Error cargando el historial de movimientos",
      };
    }
  }
  async createMovimientos(payload: CrearActivoMovimientoDTO): Promise<{
    data: ActivoMovimiento | null;
    status: boolean;
    message: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(payload)
        .select()
        .single();
      if (error) {
        return {
          data: null,
          message: error.message,
          status: false,
        };
      }
      return {
        data: this.toModel(data),
        message: null,
        status: true,
      };
    } catch (e: any) {
      return {
        data: null,
        status: false,
        message:
          e?.message ?? "Error al registrar el movimiento en la bitácora",
      };
    }
  }
  async getMovimientosById(id: string): Promise<{
    data: ActivoMovimiento | null;
    status: boolean;
    message: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        return {
          data: null,
          message: error.message,
          status: false,
        };
      }

      return {
        data: this.toModel(data),
        message: null,
        status: true,
      };
    } catch (error: any) {
      return {
        data: null,
        status: false,
        message: error?.message ?? "Error buscando el movmiento solicitado",
      };
    }
  }
  private toModel(bdModel: any): ActivoMovimiento {
    return {
      id: bdModel.id,
      activo_id: bdModel.activo_id,
      tipo_evento: bdModel.tipo_evento,
      ubicacion_origen: bdModel.ubicacion_origen,
      ubicacion_destino: bdModel.ubicacion_destino,
      usuario_origen_id: bdModel.usuario_origen_id,
      usuario_destino_id: bdModel.usuario_destino_id,
      estado_anterior: bdModel.estado_anterior,
      estado_nuevo: bdModel.estado_nuevo,
      responsable_id: bdModel.responsable_id,
      ticket_id: bdModel.ticket_id,
      fecha_evento: bdModel.fecha_evento,
      comentario: bdModel.comentario,
    };
  }
}
