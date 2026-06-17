 import * as React from "react";
import type { TicketsRepository } from "../../repositories/TicketsRepository/TicketRepository";
import type { Ticket } from "../../Models/Tickets";
import toast from "react-hot-toast";

/* =========================
   Tickets relacionados
========================= */

export function useTicketsRelacionados(TicketsSvc: TicketsRepository, ticket: Ticket) {
  const [padre, setPadre] = React.useState<Ticket | null>(null);
  const [hijos, setHijos] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadRelateds = React.useCallback(async () => {
    if (!ticket?.ID) {
      setPadre(null);
      setHijos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idPadre = ticket.IdCasoPadre;
      if (idPadre != null && idPadre !== "") {
        const padreRes = await TicketsSvc.getTicketById(String(ticket.IdCasoPadre));

        if(!padreRes.status){
          toast.error(padreRes.message)
          throw new Error(padreRes.message ?? "Algo ha salido mal obteniendo los tickets relacionados")
        }

        setPadre(padreRes.data ?? null);
      } else {
        setPadre(null);
      }

      const hijosRes = await TicketsSvc.loadTickets({padreId: Number(ticket.ID)});

      setHijos(hijosRes?.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets relacionados");
      setPadre(null);
      setHijos([]);
    } finally {
      setLoading(false);
    }
  }, [TicketsSvc, ticket?.ID, ticket?.IdCasoPadre]);

  React.useEffect(() => {
    loadRelateds();
  }, [loadRelateds]);

  return {
    padre,
    hijos,
    loading,
    error,
    loadRelateds,
  };
}


