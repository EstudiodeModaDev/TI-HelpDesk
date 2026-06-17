import type { TicketsRepository } from "../../../repositories/TicketsRepository/TicketRepository";


export async function relateTickets(TicketsSvc: TicketsRepository, actualId: string | number, relatedId: string | number, type: "padre" | "hijo"): Promise<{ ok: boolean; message?: string }> {
  const aId = String(actualId ?? "").trim();
  const rId = String(relatedId ?? "").trim();

  if (!aId || !rId) {
    return { ok: false, message: "Ids inválidos para relacionar el ticket" };
  }

  if (type === "padre") {
    await TicketsSvc.updateTicket(aId, { IdCasoPadre: rId });
    return { ok: true };
  }

  await TicketsSvc.updateTicket(rId, { IdCasoPadre: aId });
  return { ok: true };
}