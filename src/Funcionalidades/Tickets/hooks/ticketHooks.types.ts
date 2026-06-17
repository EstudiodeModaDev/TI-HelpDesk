import type * as React from "react";
import type { DateRange } from "../../../Models/Filtros";
import type { RelacionadorState } from "../../../Models/nuevoTicket";
import type { SortDir, SortField,} from "../../../Models/Tickets";
import type { GraphRest } from "../../../graph/GraphRest";
import type { TicketsRepository } from "../../../repositories/TicketsRepository/TicketRepository";


export type UseTicketsParams = {
  graph: GraphRest;
  TicketsSvc: TicketsRepository;
  userMail: string;
  role: string;
};

export type TicketSort = {
  field: SortField;
  dir: SortDir;
};

export type TicketFilterMode = "En curso" | "Cerrados" | "Todos";

export type TicketListState = {
  me: boolean;
  filterMode: TicketFilterMode;
  range: DateRange;
  pageSize: number;
  pageIndex: number;
  search: string;
  sorts: TicketSort[];
};

export type TicketFormStateApi = {
  state: RelacionadorState;
  setState: React.Dispatch<React.SetStateAction<RelacionadorState>>;
  setField: <K extends keyof RelacionadorState>(key: K, value: RelacionadorState[K]) => void;
};
