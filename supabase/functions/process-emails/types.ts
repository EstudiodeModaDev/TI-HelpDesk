export interface ProcessEmailsConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  msTenantId: string;
  msClientId: string;
  msClientSecret: string;
  graphScope: string;
  mailboxUser: string;
  sourceFolderId?: string;
  processedFolderId?: string;
  sharepointSiteId: string;
  sharepointUsersListId: string;
  inlineBucket: string;
  attachmentsBucket: string;
  sendAutoReply: boolean;
  maxMessages: number;
}

export interface GraphTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
}

export interface GraphMessageBody {
  contentType: "html" | "text";
  content: string;
}

export interface GraphEmailAddress {
  name?: string;
  address?: string;
}

export interface GraphRecipient {
  emailAddress?: GraphEmailAddress;
}

export interface IncomingEmailAddress {
  name?: string | null;
  address?: string | null;
  email?: string | null;
}

export interface IncomingEmailAttachment {
  id?: string;
  name?: string;
  filename?: string;
  contentType?: string;
  isInline?: boolean;
  contentId?: string | null;
  contentBytes?: string;
}

export interface IncomingEmailPayload {
  messageId?: string;
  internetMessageId?: string | null;
  conversationId?: string | null;
  subject?: string;
  body?: string;
  bodyType?: "html" | "text";
  bodyPreview?: string;
  from?: IncomingEmailAddress | null;
  sender?: IncomingEmailAddress | null;
  receivedDateTime?: string;
  attachments?: IncomingEmailAttachment[];
  source?: string;
}

export interface IncomingEmailsRequest {
  source?: string;
  emails?: IncomingEmailPayload[];
  messages?: IncomingEmailPayload[];
  message?: IncomingEmailPayload;
  attachments?: IncomingEmailAttachment[];
}

export interface GraphMessage {
  id: string;
  subject?: string;
  body?: GraphMessageBody;
  bodyPreview?: string;
  from?: GraphRecipient;
  sender?: GraphRecipient;
  internetMessageId?: string;
  conversationId?: string;
  isRead?: boolean;
  receivedDateTime?: string;
}

export interface GraphListResponse<T> {
  value: T[];
}

export interface GraphAttachment {
  id: string;
  name?: string;
  contentType?: string;
  size?: number;
  isInline?: boolean;
  contentId?: string;
  contentBytes?: string;
  "@odata.type"?: string;
}

export interface InlineAttachmentUpload {
  attachmentId: string;
  filename: string;
  contentType: string;
  contentId: string;
  bytes: Uint8Array;
}

export interface RegularAttachmentUpload {
  attachmentId: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}

export interface StoredFileRecord {
  bucket: string;
  path: string;
  url: string;
  filename: string;
  contentType: string;
  isInline: boolean;
}

export interface GraphListItemFields {
  [key: string]: string | number | boolean | null | undefined;
}

export interface SharePointListItem {
  id: string;
  fields?: GraphListItemFields;
}

export interface SharePointTechnician {
  id: string;
  name: string;
  email: string | null;
  role: string;
  availability: string;
  caseCount: number;
}

export interface ResolverAssignment {
  nombre_resolutor: string;
  correo_resolutor: string | null;
  id_resolutor_sharepoint: string;
}

export interface TicketInsertPayload {
  titulo: string;
  descripcion: string;
  correo_solicitante: string | null;
  nombre_solicitante: string | null;
  fuente: string;
  estado: string;
  conversation_id: string | null;
  graph_message_id: string;
  internet_message_id: string | null;
  storage_folder: string;
  nombre_resolutor: string | null;
  correo_resolutor: string | null;
  id_resolutor_sharepoint: string | null;
}

export interface TicketRecord extends TicketInsertPayload {
  id: string;
  created_at?: string;
}

export interface MailTicketMapRecord {
  ticket_id: string;
  graph_message_id: string;
  internet_message_id: string | null;
  conversation_id: string | null;
}

export interface TicketFileInsert {
  id_ticket: string | number;
  attachment_path: string;
  file_name: string;
  attachment_type: string;
  storage_bucket: string;
}

export interface ProcessDetail {
  messageId: string;
  subject?: string;
  status: "processed" | "skipped" | "failed";
  reason?: string;
  ticketId?: string;
  resolver?: string | null;
}

export interface ProcessResult {
  ok: boolean;
  processed: number;
  skipped: number;
  failed: number;
  details: ProcessDetail[];
}
