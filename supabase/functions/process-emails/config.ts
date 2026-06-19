import type { ProcessEmailsConfig } from "./types.ts";

const DEFAULT_MAX_MESSAGES = 40;
const DEFAULT_ATTACHMENTS_BUCKET = "ticket-attachments";
const DEFAULT_INLINE_BUCKET = "ticket-inline";
const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string): string | undefined {
  const value = Deno.env.get(name)?.trim();
  return value || undefined;
}

function getBooleanEnv(name: string, defaultValue = false): boolean {
  const value = Deno.env.get(name)?.trim().toLowerCase();
  if (!value) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value);
}

function getNumberEnv(name: string, defaultValue: number): number {
  const rawValue = Deno.env.get(name)?.trim();
  if (!rawValue) {
    return defaultValue;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric environment variable: ${name}`);
  }

  return Math.min(Math.floor(parsed), DEFAULT_MAX_MESSAGES);
}

export function loadConfig(): ProcessEmailsConfig {
  return {
    supabaseUrl: getRequiredEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    msTenantId: getRequiredEnv("AZURE_TENANT_ID"),
    msClientId: getRequiredEnv("SOLVI_CLIENT_ID"),
    msClientSecret: getRequiredEnv("SOLVI_CLIENT_SECRET"),
    graphScope: GRAPH_SCOPE,
    mailboxUser: getRequiredEnv("SOLVI_MAILBOX_USER"),
    sourceFolderId: getOptionalEnv("SOLVI_SOURCE_FOLDER_ID"),
    processedFolderId: getOptionalEnv("SOLVI_PROCESSED_FOLDER_ID"),
    sharepointSiteId: getRequiredEnv("SHAREPOINT_SITE_ID"),
    sharepointUsersListId: getRequiredEnv("SHAREPOINT_USERS_LIST_ID"),
    attachmentsBucket: getOptionalEnv("TICKET_ATTACHMENTS_BUCKET") ??
      DEFAULT_ATTACHMENTS_BUCKET,
    inlineBucket: getOptionalEnv("TICKET_INLINE_BUCKET") ?? DEFAULT_INLINE_BUCKET,
    sendAutoReply: getBooleanEnv("SEND_AUTO_REPLY", false),
    maxMessages: getNumberEnv("MAX_MESSAGES", DEFAULT_MAX_MESSAGES),
  };
}
