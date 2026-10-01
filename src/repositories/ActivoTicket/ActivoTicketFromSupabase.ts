import type {
  ActivoTicket,
  CrearActivoTicketDTO,
} from "../../Models/ActivoTicket";
import { supabase } from "../../Services/Supabase.service";
import { SupabaseActivosTIRepository } from "../ActivosTIRepository/ActivosTIFromSupabase";
import type {
  FilterActivoTicket,
  ActivoTicketLoadResult,
  ActivoTicketRepository,
} from "./ActivoTicketRepository";

export class SupabaseActivoTicketRepository implements ActivoTicketRepository {
  private readonly tableName = "TBL_Solvi_Activos_TI_Tickets";
  private readonly batchSize = 100;
  // Reutiliza el mapeo del activo (columnas *_asignado, etc.)
  private readonly activosRepo = new SupabaseActivosTIRepository();

  private sanitizeSearchValue(value: string): string {
    return value.replace(/[,%()]/g, " ").trim();
  }
  private buildActivoTicketQuery(
    filter?: FilterActivoTicket,
    includeCount = false,
  ) {
    let query = supabase
      .from(this.tableName)
      .select(
        "*, activo:TBL_Solvi_activos_ti(*)",
        includeCount ? { count: "exact" } : undefined,
      );

    if (filter?.activo_id) {
      query = query.eq("activo_id", filter.activo_id);
    }
    if (filter?.ticket_id) {
      query = query.eq("ticket_id", filter.ticket_id);
    }
    const trimmedSearch = String(filter?.search ?? "").trim();
    let searchFilters = "";
    if (trimmedSearch) {
      const searchValue = this.sanitizeSearchValue(trimmedSearch);
      if (searchValue) {
        const searchPattern = `%${searchValue}%`;
        searchFilters = [`vinculado_por_nombre.ilike.${searchPattern}`].join(
          ",",
        );
      }
    }
    if (searchFilters) {
      query = query.or(searchFilters);
    }
    query = query.order("fecha_vinculacion", { ascending: false });

    return query;
  }
  async loadActivoTicket(
    filter?: FilterActivoTicket,
  ): Promise<ActivoTicketLoadResult> {
    try {
      const pageSize = Math.max(1, Number(filter?.pageSize ?? 10));
      const pageIndex = Math.max(1, Number(filter?.pageIndex ?? 1));

      if (filter?.paginated) {
        const from = (pageIndex - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, error, count } = await this.buildActivoTicketQuery(
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
        const { data, error, count } = await this.buildActivoTicketQuery(
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
        message: error?.message ?? "Error cargando...",
      };
    }
  }
  async createActivoTicket(payload: CrearActivoTicketDTO): Promise<{
    data: ActivoTicket | null;
    status: boolean;
    message: string | null;
  }> {
    try {
      const supabaseActivoTicket = {
        vinculado_por_nombre: payload.vinculado_por_nombre,
        activo_id: payload.activo_id,
        ticket_id: payload.ticket_id,
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(supabaseActivoTicket)
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
  toModel(bdModel: any): ActivoTicket {
    return {
      id: bdModel.id,
      fecha_vinculacion: bdModel.fecha_vinculacion,
      activo_id: bdModel.activo_id,
      ticket_id: bdModel.ticket_id,
      vinculado_por_nombre: bdModel.vinculado_por_nombre,
      activo: bdModel.activo ? this.activosRepo.toModel(bdModel.activo) : null,
    };
  }
}
