import { useTicketActions } from "./useTicketActions";
import { useTicketForm } from "./useTicketForm";
import { useTicketsLists,  } from "./useTicketsLists";
import type { UseTicketsParams } from "./ticketHooks.types";

export function useTickets({ graph, TicketsSvc, userMail, role }: UseTicketsParams) {
  const {
    loading: listLoading,
    error: listError,
    ...lists
  } = useTicketsLists({ graph, TicketsSvc, userMail, role });

  const form = useTicketForm({ TicketsSvc });

  const {
    loading: actionsLoading,
    error: actionsError,
    ...actions
  } = useTicketActions({
    TicketsSvc,
    onTicketsChanged: lists.loadAll,
    onFileSent: form.clearFile,
  });

  return {
    ...lists,
    ...form,
    ...actions,
    loading: listLoading || actionsLoading,
    error: actionsError ?? listError,
  };
}

//export { useTicketsRelacionados };
export type { UseTicketsParams } from "./ticketHooks.types";
