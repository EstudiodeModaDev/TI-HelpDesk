import type { GetAllOpts } from "../../Models/Commons";
import type { attachment } from "../../Models/DTO/Attachments";

export type filterAttachments = {
  attachment_type?: string
  id_ticket?: number
  id_seguimiento?: number
}

export type attachmentLoadResult = {
  data: attachment[]
  status: boolean
  message: string | null
}

export interface AttachmentRepository {
  loadAttachments(filter?: filterAttachments | GetAllOpts): Promise<attachmentLoadResult>;
  createAttachment(payload: attachment): Promise<{data: attachment | null, status: boolean, message: string | null}>;
}
