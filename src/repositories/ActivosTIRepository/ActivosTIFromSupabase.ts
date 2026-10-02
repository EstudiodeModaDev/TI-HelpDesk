import type {
  ActivoTI,
  ActualizarActivoDTO,
  CrearActivoDTO,
} from "../../Models/ActivoTI";
import { supabase } from "../../Services/Supabase.service";
import type {
  FilterActivosTI,
  ActivosTILoadResult,
  ActivosTIRepository,
} from "./ActivosTIRepository";

export class SupabaseActivosTIRepository implements ActivosTIRepository {
  private readonly tableName = "TBL_Solvi_activos_ti";
  private readonly batchSize = 100;

  private sanitizeSearchValue(value: string): string {
    return value.replace(/[,%()]/g, " ").trim();
  }
  private buildActivoQuery(filter?: FilterActivosTI, includeCount = false) {
    let query = supabase
      .from(this.tableName)
      .select("*", includeCount ? { count: "exact" } : undefined);

    // if (filter?.categoria) {
    //   query = query.eq("categoria", filter.categoria);
    // }
    if (filter?.estado) {
      query = query.eq("estado", filter.estado);
    }
    if (filter?.ubicacion_tipo) {
      query = query.eq("ubicacion_tipo", filter.ubicacion_tipo);
    }
    const trimmedSearch = String(filter?.search ?? "").trim();
    let searchFilters = "";
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
    query = query.order("created_at", { ascending: false });

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
        message: error?.message ?? "Error cargando los activos registrados",
      };
    }
  }
  async createActivo(payload: CrearActivoDTO): Promise<{
    data: ActivoTI | null;
    status: boolean;
    message: string | null;
  }> {
    try {
      const supabaseActivo = {
        codigo_inventario: payload.codigo_inventario ?? "",
        // categoria: payload.categoria,
        tipo: payload.tipo ?? "",
        marca: payload.marca ?? null,
        modelo: payload.modelo ?? null,
        numero_serie: payload.numero_serie ?? "",
        fecha_ingreso: payload.fecha_ingreso ?? new Date().toISOString(),
        estado: payload.estado ?? "Disponible",
        ubicacion_tipo: payload.ubicacion_tipo ?? "bodega_central",
        nombre_usuario_asignado: payload.nombre_usuario || null,
        correo_usuario_asignado: payload.correo_usuario || null,
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
    payload: ActualizarActivoDTO,
  ): Promise<{
    data: ActivoTI | null;
    status: boolean;
    message: string | null;
  }> {
    try {
      // En BD el usuario actual se guarda en columnas *_asignado
      const { nombre_usuario, correo_usuario, ...rest } = payload;
      const supabasePayload: Record<string, unknown> = { ...rest };
      if (nombre_usuario !== undefined)
        supabasePayload.nombre_usuario_asignado = nombre_usuario;
      if (correo_usuario !== undefined)
        supabasePayload.correo_usuario_asignado = correo_usuario;

      const { data, error } = await supabase
        .from(this.tableName)
        .update(supabasePayload)
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
  async getActivoBySerial(serial: string): Promise<{
    data: ActivoTI | null;
    status: boolean;
    message: string | null;
  }> {
    try {
      const limpio = serial.trim().replace(/[\\%_]/g, "\\$%");
      if (!limpio) {
        return { data: null, status: true, message: null };
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .ilike("numero_serie", limpio)
        .limit(1)
        .maybeSingle();

      if (error) {
        return { data: null, status: false, message: error.message };
      }

      return {
        data: data ? this.toModel(data) : null,
        status: true,
        message: null,
      };
    } catch (e: any) {
      return {
        data: null,
        status: false,
        message: e?.message ?? "Error buscando el activo por serial",
      };
    }
  }

  toModel(bdModel: any): ActivoTI {
    return {
      id: bdModel.id,
      codigo_inventario: bdModel.codigo_inventario,
      // categoria: bdModel.categoria,
      tipo: bdModel.tipo,
      marca: bdModel.marca,
      modelo: bdModel.modelo,
      numero_serie: bdModel.numero_serie,
      fecha_ingreso: bdModel.fecha_ingreso,
      estado: bdModel.estado,
      ubicacion_tipo: bdModel.ubicacion_tipo,
      nombre_usuario: bdModel.nombre_usuario_asignado,
      correo_usuario: bdModel.correo_usuario_asignado,
      prestamo_activo_id: bdModel.prestamo_activo_id,
      created_at: bdModel.created_at,
      updated_at: bdModel.updated_at,
      created_by: bdModel.created_by,
      updated_by: bdModel.updated_by,
    };
  }
}
