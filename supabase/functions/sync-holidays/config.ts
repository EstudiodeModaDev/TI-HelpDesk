export type SyncHolidaysConfig = {
  apiKey: string;
  apiUrl: string;
  supabaseServiceRoleKey: string;
  supabaseUrl: string;
  tableName: string;
};

const DEFAULT_API_URL = "https://www.festivos.com.co/api/v1/festivos";
const DEFAULT_TABLE_NAME = "TBL_Festivos_Solvi";

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string, defaultValue: string): string {
  const value = Deno.env.get(name)?.trim();
  return value || defaultValue;
}

export function loadConfig(): SyncHolidaysConfig {
  return {
    apiKey: getRequiredEnv("FESTIVOS_API_KEY"),
    apiUrl: getOptionalEnv("FESTIVOS_API_URL", DEFAULT_API_URL),
    supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseUrl: getRequiredEnv("SUPABASE_URL"),
    tableName: getOptionalEnv("HOLIDAYS_TABLE", DEFAULT_TABLE_NAME),
  };
}
 