import type { ActivoTI } from "../../Models/ActivoTI";
import { supabase } from "../../Services/Supabase.service";
import type {
  FilterActivosTI,
  ActivosTILoadResult,
  ActivosTIRepository,
} from "./ActivosTIRepository";

export class SupabaseActivosTIRepository implements ActivosTIRepository {
  private readonly tableName = "activos_ti";
  private readonly batchSize = 100;

  private sanitizeSearchValue(value: string): string {
    return value.replace(/[,%()]/g, " ").trim();
  }
  private buildActivoQuery(filter?: FilterActivosTI, includeCount = false) {
    let query = supabase
      .from(this.tableName)
      .select("*", includeCount ? { count: "exact" } : undefined);

    if (filter?.categoria) {
      query = query.eq("categoria", filter.categoria);
    }
    if (filter?.estado) {
      query = query.eq("estado", filter.categoria);
    }
    if (filter?.ubicacion_tipo) {
      query = query.eq("ubicacion_tipo", filter.ubicacion_tipo);
    }
    if (filter?.usuario_asignado_id) {
      query = query.eq("usuario_asignado_id", filter.usuario_asignado_id);
    }
    const trimmedSearch = String(filter?.search ?? "").trim();
    let searchFilters = " ";
    if (trimmedSearch) {
      const searchValue = this.sanitizeSearchValue(trimmedSearch);
      if (searchValue) {
        const searchPattern = `%${searchValue}%`;
        searchFilters = [
          `numero_serie.ilike.${searchPattern}`,
          `codigo_inventario.ilike.${searchPattern}`,
          `tipo.ilike.${searchPattern}`,
          `marca.ilike.${searchPattern}`,
          `modelo.ilike.${searchPattern}`,
        ].join(",");
      }
    }

    if (searchFilters) {
      query = query.or(searchFilters);
    }
    query = query.order("create_at", { ascending: false });

    return query;
  }
  async loadActivos(filter?: FilterActivosTI): Promise<ActivosTILoadResult> {
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
        message: error?.message ?? "Error cargando los tickets registrados",
      };
    }
  }
  async createActivo(payload: Partial<ActivoTI>): Promise<{
    data: ActivoTI | null;
    status: boolean;
    message: string | null;
  }> {
    try {
      const supabaseActivo = {
        codigo_inventario: payload.codigo_inventario ?? "",
        categoria: payload.categoria,
        tipo: payload.tipo ?? "",
        subtipo: payload.subtipo ?? null,
        marca: payload.marca ?? null,
        modelo: payload.modelo ?? null,
        numero_serie: payload.numero_serie ?? "",
        fecha_ingreso: payload.fecha_ingreso ?? new Date().toISOString(),
        proveedor: payload.proveedor ?? null,
        estado: payload.estado ?? "disponible",
        ubicacion_tipo: payload.ubicacion_tipo ?? "bodega_central",
        tienda_id: payload.tienda_id ?? null,
        usuario_asignado_id: payload.usuario_asignado_id ?? null,
        fecha_fin_garantia: payload.fecha_fin_garantia ?? null,
        notas: payload.notas ?? null,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(supabaseActivo)
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
        message: e?.message ?? "Error creando el activo",
        status: false,
      };
    }
  }
  async updateActivo(
    id: string,
    payload: any,
  ): Promise<{
    data: ActivoTI | null;
    status: boolean;
    message: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(payload)
        .eq("id", id)
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
        message: e?.message ?? "Error actualizando el activo",
        status: false,
      };
    }
  }
  async getActivoById(id: string): Promise<{
    data: ActivoTI | null;
    status: boolean;
    message: string | null;
  }> {
    try {
      const query = supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await query;

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
        message: error?.message ?? "Error cargando el activo solicitado",
      };
    }
  }
  toModel(bdModel: any): ActivoTI {
    return {
      id: bdModel.id,
      codigo_inventario: bdModel.codigo_inventario,
      categoria: bdModel.categoria,
      tipo: bdModel.tipo,
      subtipo: bdModel.subtipo,
      marca: bdModel.marca,
      modelo: bdModel.modelo,
      numero_serie: bdModel.numero_serie,
      fecha_ingreso: bdModel.fecha_ingreso,
      proveedor: bdModel.proveedor,
      estado: bdModel.estado,
      ubicacion_tipo: bdModel.ubicacion_tipo,
      tienda_id: bdModel.tienda_id,
      usuario_asignado_id: bdModel.usuario_asignado_id,
      fecha_fin_garantia: bdModel.fecha_fin_garantia,
      notas: bdModel.notas,
      prestamo_activo_id: bdModel.prestamo_activo_id,
      created_at: bdModel.created_at,
      updated_at: bdModel.updated_at,
      created_by: bdModel.created_by,
      updated_by: bdModel.updated_by,
    };
  }
}
