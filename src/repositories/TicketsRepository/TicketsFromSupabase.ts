import type { SupabaseTickets } from "../../Models/DTO/Tickets";
import type { Ticket } from "../../Models/Tickets";
import { supabase } from "../../Services/Supabase.service";
import type { filterTickets, TicketsLoadResult, TicketsRepository } from "./TicketRepository";


export class SupabaseTicketRepository implements TicketsRepository {
  private readonly tableName = "TBL_Ticket_Solvi";

  private normalizeTicketStatuses(ticketStatus?: string[]): string[] {
    return (ticketStatus ?? [])
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
  }

  private sanitizeSearchValue(value: string): string {
    return value.replace(/[,%()]/g, " ").trim();
  }

  private resolveSortField(sortField?: filterTickets["sortField"]): string {
    switch (sortField) {
      case "Title":
        return "ticket_solvi_titulo";
      case "resolutor":
        return "ticket_solvi_resolutor";
      case "FechaApertura":
        return "ticket_solvi_fechaapertura";
      case "TiempoSolucion":
        return "ticket_solvi_fechamaxima";
      case "id":
      default:
        return "ticket_solvi_id";
    }
  }

  async loadTickets(filter?: filterTickets): Promise<TicketsLoadResult> {
    try {
      
      let query = supabase.from(this.tableName).select("*", {count: "exact"});

      const statuses = this.normalizeTicketStatuses(filter?.ticketStatus);
      if (statuses.length) {
        query = query.in("ticket_solvi_estado", statuses);
      }

      if(filter?.fuente){
        query = query.eq("ticket_solvi_fuente", filter.fuente)
      }

      if (filter?.range) {
        const nextDay = new Date(filter.range.to);
        nextDay.setDate(nextDay.getDate() + 1); 
        query = query.gte("ticket_solvi_fechaapertura", filter.range.from)
        query = query.lte("ticket_solvi_fechaapertura", nextDay.toISOString())
      }

      if(filter?.padreId){
        query = query.eq("ticket_solvi_id_casopadre", filter.padreId)
      }

      if(filter?.resolutor && filter.resolutor !== "all"){
        query = query.eq("ticket_solvi_correo_resolutor", filter.resolutor)
      }

      const currentUserFilters = filter?.currentUser
        ? [
            `ticket_solvi_correo_resolutor.eq.${filter.currentUser}`,
            `ticket_solvi_correo_solicitante.eq.${filter.currentUser}`,
            `ticket_solvi_correo_observador.eq.${filter.currentUser}`,
          ].join(",")
        : "";
      const trimmedSearch = String(filter?.search ?? "").trim();
      let searchFilters = "";
      if (trimmedSearch) {
        const searchValue = this.sanitizeSearchValue(trimmedSearch);
        if (searchValue) {
          const searchPattern = `%${searchValue}%`;
          searchFilters = [
            `ticket_solvi_titulo.ilike.${searchPattern}`,
            `ticket_solvi_solicitante.ilike.${searchPattern}`,
            `ticket_solvi_resolutor.ilike.${searchPattern}`,
          ].join(",");
        }
      }

      if (currentUserFilters && searchFilters) {
        query = query.or(`and(or(${currentUserFilters}),or(${searchFilters}))`);
      } else if (currentUserFilters) {
        query = query.or(currentUserFilters);
      } else if (searchFilters) {
        query = query.or(searchFilters);
      }

      const resolvedSortField = this.resolveSortField(filter?.sortField);
      const ascending = filter?.sortDir === "asc";
      query = query.order(resolvedSortField, { ascending });

      if (resolvedSortField !== "ticket_solvi_id") {
        query = query.order("ticket_solvi_id", { ascending: false });
      }

      const pageSize = Math.max(1, Number(filter?.pageSize ?? 10));
      const pageIndex = Math.max(1, Number(filter?.pageIndex ?? 1));
      const from = (pageIndex - 1) * pageSize;
      const to = from + pageSize - 1;

      if (filter?.paginated) {
        query = query.range(from, to);
      }

      console.log(query)

      const { data, error, count } = await query;

      if (error) {
        return {
          data: [],
          message: error.message,
          status: false,
        };
      }

      return {
        data: data.map((d) => {return this.toModel(d)}) ?? [],
        hasNext: filter?.paginated ? from + (data?.length ?? 0) < (count ?? 0) : false,
        message: null,
        pageIndex,
        pageSize,
        status: true,
        total: count ?? data?.length ?? 0,
      };
    } catch (error: any) {
      return {
        data: [],
        status: false,
        message: error?.message ?? "Error cargando los tickets registrados",
      };
    }
  }

  async createTicket(payload: Partial<Ticket>): Promise<{data: Ticket | null, status: boolean, message: string | null}> {
    try {

      const supabaseTicket: SupabaseTickets ={
        ticket_solvi_ans: payload.ANS ?? "",
        ticket_solvi_articulo: payload.Articulo ?? "",
        ticket_solvi_categoria: payload.Categoria ?? "",
        ticket_solvi_correo_observador: payload.Observador ?? "",
        ticket_solvi_correo_resolutor: payload.Correoresolutor ?? "",
        ticket_solvi_correo_solicitante: payload.CorreoSolicitante ?? "",
        ticket_solvi_descripcion: payload.Descripcion ?? "",
        ticket_solvi_estado: payload.Estadodesolicitud ?? "",
        ticket_solvi_fechaapertura: payload.FechaApertura ?? "",
        ticket_solvi_fechamaxima: payload.FechaMaxima ?? "",
        ticket_solvi_fuente: payload.Fuente ?? "",
        ticket_solvi_id_casopadre: payload.IdCasoPadre ? Number(payload.IdCasoPadre) : null,
        ticket_solvi_observador: payload.Observador ?? "",
        ticket_solvi_resolutor: payload.Nombreresolutor ?? "",
        ticket_solvi_solicitante: payload.Solicitante ?? "",
        ticket_solvi_subcategoria: payload.SubCategoria ?? "",
        ticket_solvi_titulo: payload.AsuntoTicket ?? "",
        ticket_solvi_attachemnt_path: "",
        ticket_solvi_attachment_name: "",
      }

      console.log(supabaseTicket)

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(supabaseTicket)
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
        message: e?.message ?? "Error creando el ticket",
        status: false,
      };
    }
  }

  async updateTicket(id: string, payload: any): Promise<{data: Ticket | null, status: boolean, message: string | null}> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(payload)
        .eq("ticket_solvi_id", id)
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
        message: e?.message ?? "Error actualizando el ticket",
        status: false,
      };
    }
  }

  async getTicketById(id: string): Promise<{data: Ticket | null, status: boolean, message: string | null}> {
    try {
      const query = supabase.from(this.tableName).select("*").eq("ticket_solvi_id", id).single()


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
        message: error?.message ?? "Error cargando los tickets registrados",
      };
    }
  }

  async countTickets(resolutorMail: string, status: "En atención" | "Fuera de tiempo"): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("ticket_solvi_correo_resolutor", resolutorMail)
      .eq("ticket_solvi_estado", status);


    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }

  toModel(bdModel: any): Ticket{
      const toRetun = {
      ANS: bdModel.ticket_solvi_ans,
      Articulo: bdModel.ticket_solvi_articulo,
      Categoria: bdModel.ticket_solvi_categoria,
      CorreoObservador: bdModel.ticket_solvi_correo_observador,
      Correoresolutor: bdModel.ticket_solvi_correo_resolutor,
      CorreoSolicitante: bdModel.ticket_solvi_correo_solicitante,
      Descripcion: bdModel.ticket_solvi_descripcion,
      Estadodesolicitud: bdModel.ticket_solvi_estado,
      FechaApertura: bdModel.ticket_solvi_fechaapertura,
      Fuente: bdModel.ticket_solvi_fuente,
      ID: bdModel.ticket_solvi_id,
      IdCasoPadre: bdModel.ticket_solvi_id_casopadre,
      Nombreresolutor: bdModel.ticket_solvi_resolutor,
      Observador: bdModel.ticket_solvi_correo_observador,
      Solicitante: bdModel.ticket_solvi_solicitante,
      SubCategoria: bdModel.ticket_solvi_subcategoria,
      FechaMaxima: bdModel.ticket_solvi_fechamaxima,
      FechaCierreReal: bdModel.FechaCierreReal,
      MinutosNocturnos: bdModel.MinutosNocturnos,
      MinutosDominicales: bdModel.MinutosDominicales,
      MinutosFestivos: bdModel.MinutosFestivos,
      MinutosTotales: bdModel.MinutosTotales,
      AsuntoTicket: bdModel.ticket_solvi_titulo,
      Title: bdModel.ticket_solvi_titulo,

    }

    return toRetun

  }
}
