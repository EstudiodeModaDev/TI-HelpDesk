// src/hooks/useTicketLogs.ts
import * as React from "react";
import type { GetAllOpts } from "../Models/Commons";
import type { LogService } from "../Services/Log.service";
import type { Log } from "../Models/Log";


export function useTicketLogs(LogSvc: LogService) {
  const [rows, setRows] = React.useState<Log[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentTicketId, setCurrentTicketId] = React.useState<string | null>(null);

  const buildFilter = React.useCallback((idTicket: string): GetAllOpts => {
    const filters: string[] = [`fields/Title eq '${idTicket.replace(/'/g, "''")}'`];

    return {
      filter: filters.join(" and "),
      orderby: "fields/Created asc", 
    };
  }, []);

  const loadFor = React.useCallback(async (idTicket: string) => {
    setLoading(true); setError(null);
    try {
      const  items  = await LogSvc.getAll(buildFilter(idTicket));
      setRows(items);
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

