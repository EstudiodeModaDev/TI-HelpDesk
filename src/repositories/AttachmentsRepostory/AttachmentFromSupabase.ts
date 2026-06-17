import type { attachment } from "../../Models/DTO/Attachments";
import { supabase } from "../../Services/Supabase.service";
import type { attachmentLoadResult, AttachmentRepository, filterAttachments, } from "./AttachmentRepository";


export class AttachmentFromSupabase implements AttachmentRepository {
  private readonly tableName = "TBL_Ticket_Attachments_Solvi";

  async loadAttachments(filter?: filterAttachments): Promise<attachmentLoadResult> {
    try {
      
      let query = supabase.from(this.tableName).select("*",);

      if (filter?.attachment_type) {
        query = query.eq("attachment_type", filter.attachment_type);
      }

      if(filter?.id_ticket){
        query = query.eq("id_ticket", filter.id_ticket)
      }

      if (filter?.id_seguimiento) {
        query = query.eq("seguimiento_id", filter.id_seguimiento)
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
        data: data,
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

  async createAttachment(payload: attachment): Promise<{ data: attachment | null; status: boolean; message: string | null; }> {
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
        data: data,
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
}
