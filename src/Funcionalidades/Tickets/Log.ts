// src/hooks/useTicketLogs.ts
import * as React from "react";
import type { Log } from "../../Models/Log";
import type { filterLogRepository, LogRepository } from "../../repositories/LogRepository/LogRespository";
import toast from "react-hot-toast";


export function useTicketLogs(LogSvc: LogRepository) {
  const [rows, setRows] = React.useState<Log[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentTicketId, setCurrentTicketId] = React.useState<string | null>(null);

  const buildFilter = React.useCallback((idTicket: string): filterLogRepository => {

    return {
      seguimientos_solvi_id_ticket: Number(idTicket)
    };
  }, []);

  const loadFor = React.useCallback(async (idTicket: string) => {
    setLoading(true); setError(null);
    try {
      const  items  = await LogSvc.loadLogs(buildFilter(idTicket));

      if(!items.status){
        toast.error("Algo ha salido mal cargando los logs " + items.message)
        throw new Error("Algo ha salido mal cargando los logs " + items.message)
      }

      setRows(items.data);
      setCurrentTicketId(idTicket);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando logs");
      setRows([]);
      setCurrentTicketId(idTicket);
    } finally {
      setLoading(false);
    }
  }, [LogSvc, buildFilter]);


  const reload = React.useCallback(() => {
    if (currentTicketId) void loadFor(currentTicketId);
  }, [currentTicketId, loadFor]);

  return {
    rows, loading, error,
    loadFor,   // ← llámalo al pulsar “Seguimiento ticket”
    reload,
    currentTicketId,
  };
}

