import type { LogDTO } from "../../Models/DTO/Log";
import type { Log } from "../../Models/Log";

export type filterLogRepository = {
  seguimientos_solvi_id_ticket?: number
  tipo_accion?: string
}

export type logLoadResult = {
  data: Log[]
  status: boolean
  message: string | null
}

export interface LogRepository {
  loadLogs(filter?: filterLogRepository): Promise<logLoadResult>;
  createLog(payload: LogDTO): Promise<{data: Log | null, status: boolean, message: string | null}>;
}
