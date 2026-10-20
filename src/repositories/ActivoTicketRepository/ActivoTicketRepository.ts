import type {
  ActivoTicket,
  CrearActivoTicketDTO,
} from "../../Models/ActivoTicket";

export type FilterActivoTicket = {
  ticket_id?: number;
  activo_id?: string;
  search?: string;
  pageSize?: number;
  pageIndex?: number;
  sortField?: string;
  sortDir?: "asc" | "desc";
  paginated?: number;
};
export type ActivoTicketLoadResult = {
  data: ActivoTicket[];
  status: boolean;
  message: string | null;
  total?: number;
  pageSize?: number;
  pageIndex?: number;
  hasNext?: boolean;
};

export interface ActivoTicketRepository {
  loadActivoTicket(
    filter?: FilterActivoTicket,
  ): Promise<ActivoTicketLoadResult>;
  createActivoTicket(payload: CrearActivoTicketDTO): Promise<{
    data: ActivoTicket | null;
    status: boolean;
    message: string | null;
  }>;
}
