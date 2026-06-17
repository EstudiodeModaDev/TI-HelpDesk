import * as React from "react";
import type { ticketOption } from "../../../Models/Tickets";
import type { RelacionadorState } from "../../../Models/nuevoTicket";
import type { TicketsRepository } from "../../../repositories/TicketsRepository/TicketRepository";

type UseTicketFormParams = {
  TicketsSvc: TicketsRepository;
};

export function useTicketForm({ TicketsSvc }: UseTicketFormParams) {
  const [state, setState] = React.useState<RelacionadorState>({ TicketRelacionar: null });

  const setField = React.useCallback(
    <K extends keyof RelacionadorState>(key: K, value: RelacionadorState[K]) => {
      setState((currentState) => ({ ...currentState, [key]: value }));
    },
    []
  );

  const resetRelacionador = React.useCallback(() => {
    setState({ TicketRelacionar: null, archivo: null });
  }, []);

  const clearFile = React.useCallback(() => {
    setField("archivo", null);
  }, [setField]);

  const toTicketOptions = React.useCallback(
    async (opts?: {
      includeIdInLabel?: boolean;
      fallbackIfEmptyTitle?: string;
      idPrefix?: string;
      top?: number;
      orderby?: string;
    }): Promise<ticketOption[]> => {
      const {
        includeIdInLabel = true,
        fallbackIfEmptyTitle = "(Sin título)",
        idPrefix = "#",
        top = 999,
        orderby = "Id desc",
      } = opts ?? {};

      const seen = new Set<string>();
      const res = await TicketsSvc.loadTickets({ orderby, top });

      return (res.data ?? [])
        .filter((ticket) => ticket && ticket.ID != null)
        .map((ticket): ticketOption => {
          const id = String(ticket.ID);
          const title = (ticket.AsuntoTicket ?? "").trim() || fallbackIfEmptyTitle;
          const label = includeIdInLabel ? `${title} - ID: ${idPrefix}${id}` : title;
          return { value: id, label };
        })
        .filter((option) => {
          if (seen.has(option.value)) return false;
          seen.add(option.value);
          return true;
        });
    },
    [TicketsSvc]
  );

  return {
    state,
    setState,
    setField,
    resetRelacionador,
    clearFile,
    toTicketOptions,
  };
}
