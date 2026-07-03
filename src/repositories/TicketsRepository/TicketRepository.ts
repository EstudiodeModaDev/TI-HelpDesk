import type { GetAllOpts } from "../../Models/Commons";
import type { DateRange } from "../../Models/Filtros";
import type { SortDir, SortField, Ticket } from "../../Models/Tickets";


export type filterTickets = {
  ticketStatus?: string[]
  range?: DateRange
  currentUser?: string
  fuente?: string
  pageSize?: number;
  pageIndex?: number
  paginated?: boolean
  search?: string
  sortField?: SortField
  sortDir?: SortDir
  padreId?: number
  resolutor: string
}

export type TicketsLoadResult = {
  data: Ticket[]
  status: boolean
  message: string | null
  total?: number
  pageSize?: number
  pageIndex?: number
  hasNext?: boolean
}

export interface TicketsRepository {
  loadTickets(filter?: filterTickets | GetAllOpts): Promise<TicketsLoadResult>;
  createTicket(payload: Ticket): Promise<{data: Ticket | null, status: boolean, message: string | null}>;
  updateTicket(id: string, payload: any): Promise<{data: Ticket | null, status: boolean, message: string | null}>;
  getTicketById(id: string): Promise<{data: Ticket | null, status: boolean, message: null | string}>
  countTickets(resolutorMail: string, status: "En atención" | "Fuera de tiempo"): Promise<number>;
}
