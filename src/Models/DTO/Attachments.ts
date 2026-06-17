export type attachment = {
  created_at: string | null,
  attachment_path: string,
  attachment_type: string,
  id_ticket: number,
  seguimiento_id?:number,
  storage_bucket: string,
  file_name: string,
}