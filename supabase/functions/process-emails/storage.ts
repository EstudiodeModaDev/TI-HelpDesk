import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type {
  InlineAttachmentUpload,
  ProcessEmailsConfig,
  RegularAttachmentUpload,
  StoredFileRecord,
} from "./types.ts";

function sanitizePathPart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "file";
}

function contentTypeToExtension(contentType: string): string {
  const map: Record<string, string> = {
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
  };

  return map[contentType.toLowerCase()] ?? "";
}

export function createAdminClient(
  config: ProcessEmailsConfig,
): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function uploadAttachmentToBucket(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed for ${path}: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadInlineAttachment(
  supabase: SupabaseClient,
  config: ProcessEmailsConfig,
  ticketFolder: string,
  attachment: InlineAttachmentUpload,
): Promise<StoredFileRecord> {
  const safeFileName = sanitizePathPart(attachment.filename);
  const extension = safeFileName.includes(".")
    ? ""
    : contentTypeToExtension(attachment.contentType);
  const path = `${ticketFolder}/inline/${attachment.attachmentId}-${safeFileName}${extension}`;
  const url = await uploadAttachmentToBucket(
    supabase,
    config.inlineBucket,
    path,
    attachment.bytes,
    attachment.contentType,
  );

  return {
    bucket: config.inlineBucket,
    path,
    url,
    filename: attachment.filename,
    contentType: attachment.contentType,
    isInline: true,
  };
}

export async function uploadRegularAttachment(
  supabase: SupabaseClient,
  config: ProcessEmailsConfig,
  ticketFolder: string,
  attachment: RegularAttachmentUpload,
): Promise<StoredFileRecord> {
  const safeFileName = sanitizePathPart(attachment.filename);
  const extension = safeFileName.includes(".")
    ? ""
    : contentTypeToExtension(attachment.contentType);
  const path =
    `${ticketFolder}/attachments/${attachment.attachmentId}-${safeFileName}${extension}`;
  const url = await uploadAttachmentToBucket(
    supabase,
    config.attachmentsBucket,
    path,
    attachment.bytes,
    attachment.contentType,
  );

  return {
    bucket: config.attachmentsBucket,
    path,
    url,
    filename: attachment.filename,
    contentType: attachment.contentType,
    isInline: false,
  };
}
