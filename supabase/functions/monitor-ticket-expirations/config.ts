import type { MonitorConfig } from "./types.ts";

const DEFAULT_WARNING_THRESHOLD_HOURS = 4;
const DEFAULT_PAGE_SIZE = 200;
const GRAPH_SCOPE = "https://graph.microsoft.com/.default";

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getFirstAvailableEnv(names: string[]): string {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim();
    if (value) {
      return value;
    }
  }

  throw new Error(
    `Missing required environment variable. Expected one of: ${names.join(", ")}`,
  );
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

  return Math.floor(parsed);
}

export function loadConfig(): MonitorConfig {
  return {
    supabaseUrl: getRequiredEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    msTenantId: getRequiredEnv("AZURE_TENANT_ID"),
    msClientId: getRequiredEnv("SOLVI_CLIENT_ID"),
    msClientSecret: getRequiredEnv("SOLVI_CLIENT_SECRET"),
    graphScope: GRAPH_SCOPE,
    mailboxUser: getRequiredEnv("SOLVI_MAILBOX_USER"),
    warningThresholdHours: getNumberEnv(
      "TICKET_WARNING_THRESHOLD_HOURS",
      DEFAULT_WARNING_THRESHOLD_HOURS,
    ),
    pageSize: getNumberEnv("TICKET_MONITOR_PAGE_SIZE", DEFAULT_PAGE_SIZE),
  };
}
