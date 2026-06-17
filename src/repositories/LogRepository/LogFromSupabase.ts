import type { LogDTO } from "../../Models/DTO/Log";
import type { Log } from "../../Models/Log";
import { supabase } from "../../Services/Supabase.service";
import type { filterLogRepository, logLoadResult, LogRepository } from "./LogRespository";


export class LogFromSupabase implements LogRepository {
  private readonly tableName = "TBL_Seguimientos_Solvi";

  async loadLogs(filter?: filterLogRepository): Promise<logLoadResult> {
    try {
      
      let query = supabase.from(this.tableName).select("*",);

      if (filter?.seguimientos_solvi_id_ticket) {
        query = query.eq("seguimientos_solvi_id_ticket", filter.seguimientos_solvi_id_ticket);
      }

      if (filter?.tipo_accion) {
        query = query.eq("seguimientos_solvi_descripcion", filter.seguimientos_solvi_id_ticket);
      }

      console.log(query)

      const { data, error, } = await query;

      if (error) {
        return {
          data: [],
          message: error.message,
          status: false,
        };
      }

      return {
        data: data.map((l) => this.toModel(l)),
        message: null,
        status: true,
      };
    } catch (error: any) {
      return {
        data: [],
        status: false,
        message: error?.message ?? "Error cargando los tickets registrados",
      };
    }
  }

  async createLog(payload: LogDTO): Promise<{ data: Log | null; status: boolean; message: string | null; }> {
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
        message: e?.message ?? "Error creando el attachment",
        status: false,
      };
    }
  }

  toModel(payload: LogDTO): Log {
    const toReturn:Log = {
      Actor: payload.seguimientos_solvi_actor,
      CorreoActor: payload.seguimientos_solvi_correo_actor,
      Descripcion: payload.seguimientos_solvi_descripcion,
      Tipo_de_accion: payload.seguimientos_solvi_tipo_de_accion,
      Id_caso: payload.seguimientos_solvi_id_ticket,
      Created: payload.seguimientos_solvi_action_date,
      Id: payload.seguimientos_solvi_id
    }

    return toReturn
  }
}
