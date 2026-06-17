import * as React from "react";
import type { Ticket } from "../../../Models/Tickets";
import { GraphRest } from "../../../graph/GraphRest";
import { getXMonthsBackRange } from "../../../utils/Date";
import type { TicketFilterMode, TicketSort, UseTicketsParams } from "./ticketHooks.types";
import type { filterTickets } from "../../../repositories/TicketsRepository/TicketRepository";
import type { DateRange } from "../../../Models/Filtros";

const TIENDAS_GROUP = "e06961ff-6886-450d-a97f-48c3c3a55233";
const DEFAULT_SORTS: TicketSort[] = [{ field: "id", dir: "desc" }];

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

async function collectZoneEmails(graph: GraphRest): Promise<string[]> {
  const collected = new Set<string>();

  const collect = (members: any[]) => {
    for (const member of members ?? []) {
      const mail = String(member?.mail ?? "").trim().toLowerCase();
      const upn = String(member?.userPrincipalName ?? "").trim().toLowerCase();
      const email = mail || upn;
      if (email) collected.add(email);
    }
  };

  let page = await graph.get<any>(`/groups/${TIENDAS_GROUP}/members?$select=mail,userPrincipalName&$top=999`);
  collect(page?.value);

  while (page?.["@odata.nextLink"]) {
    page = await graph.getAbsolute<any>(page["@odata.nextLink"]);
    collect(page?.value);
  }

  return Array.from(collected).sort();
}

function buildTicketsFilter(params: {
  filterMode: string;
  range: DateRange;
  me: boolean;
  userMail: string;
  role: string;
}): filterTickets | undefined {
  let filter: filterTickets = {};

  if (params.filterMode === "En curso") {
    filter.ticketStatus = ["En Atención", "Fuera de tiempo"];
  } else if (params.filterMode === "Cerrados") {
    filter.ticketStatus = ["Cerrado"];
  }

  if (params.range.from || params.range.to) {
    filter = {...filter, range: params.range}
  }

  if (params.me || params.role !== "Administrador") {
    filter.currentUser = params.userMail;
  }
  return filter;
}

export function useTicketsLists({ graph, TicketsSvc, userMail, role }: UseTicketsParams) {
  const [rows, setRows] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [me, setMe] = React.useState(false);
  const [filterMode, setFilterMode] = React.useState<TicketFilterMode>("En curso");
  const [range, setRange] = React.useState(getXMonthsBackRange({MonthQuantity:2}));
  const [pageSize, setPageSize] = React.useState(10);
  const [pageIndex, setPageIndex] = React.useState(1);
  const [sorts, setSorts] = React.useState<TicketSort[]>(DEFAULT_SORTS);
  const [search, setSearch] = React.useState("");
  const [zoneEmails, setZoneEmails] = React.useState<string[]>([]);
  const [totalFiltered, setTotalFiltered] = React.useState(0);
  const [hasNext, setHasNext] = React.useState(false);
  const [inProgressTickets, setInProgressTickets] = React.useState(0);
  const [outOfTimeTickets, setOutOfTimeTickets] = React.useState(0);

  const debouncedSearch = useDebouncedValue(search, 250);
  const primarySort = sorts[0] ?? DEFAULT_SORTS[0];
  const criteriaKey = React.useMemo(
    () =>
      JSON.stringify({
        filterMode,
        me,
        pageSize,
        rangeFrom: range.from,
        rangeTo: range.to,
        role,
        search: debouncedSearch.trim(),
        sortDir: primarySort.dir,
        sortField: primarySort.field,
        userMail,
      }),
    [debouncedSearch, filterMode, me, pageSize, primarySort.dir, primarySort.field, range.from, range.to, role, userMail]
  );
  const previousCriteriaRef = React.useRef(criteriaKey);

  const loadGroupEmails = React.useCallback(async () => {
    if (role !== "Jefe de zona") {
      setZoneEmails([]);
      return;
    }

    try {
      const emails = await collectZoneEmails(graph);
      setZoneEmails(emails);
    } catch (loadError: any) {
      setZoneEmails([]);
      console.warn("[Tickets] No se pudo cargar miembros del grupo:", loadError?.message ?? loadError);
    }
  }, [graph, role]);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await loadGroupEmails();
    })();

    return () => {
      cancelled = true;
    };
  }, [loadGroupEmails]);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filter = buildTicketsFilter({
        filterMode,
        range,
        me,
        userMail,
        role,
      });

      const result = await TicketsSvc.loadTickets({
        ...filter,
        pageIndex,
        pageSize,
        paginated: true,
        search: debouncedSearch.trim(),
        sortDir: primarySort.dir,
        sortField: primarySort.field,
      });

    const [inProgressCount, outOfTimeCount] = await Promise.all([
      TicketsSvc.countTickets(userMail, "En atención"),
      TicketsSvc.countTickets(userMail, "Fuera de tiempo"),
    ]);

    setInProgressTickets(inProgressCount);
    setOutOfTimeTickets(outOfTimeCount);

      if (!result.status) {
        throw new Error(result.message ?? "Error cargando tickets");
      }

      setRows(result.data);
      setTotalFiltered(result.total ?? result.data.length);
      setHasNext(result.hasNext ?? result.data.length >= pageSize);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setRows([]);
      setTotalFiltered(0);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [TicketsSvc, debouncedSearch, filterMode, me, pageIndex, pageSize, primarySort.dir, primarySort.field, range, role, userMail]);

  React.useEffect(() => {
    const criteriaChanged = previousCriteriaRef.current !== criteriaKey;
    previousCriteriaRef.current = criteriaKey;

    if (criteriaChanged && pageIndex !== 1) {
      setPageIndex(1);
      return;
    }

    loadAll();
  }, [criteriaKey, loadAll, pageIndex]);

  const nextPage = React.useCallback(() => {
    if (!hasNext) return;
    setPageIndex((currentPage) => currentPage + 1);
  }, [hasNext]);

  const prevPage = React.useCallback(() => {
    setPageIndex((currentPage) => Math.max(1, currentPage - 1));
  }, []);

  const applyRange = React.useCallback(() => {
    loadAll();
  }, [loadAll]);

  const toggleSort = React.useCallback((field: TicketSort["field"], additive = false) => {
    setSorts((previousSorts) => {
      const index = previousSorts.findIndex((sort) => sort.field === field);

      if (!additive) {
        if (index >= 0) {
          const dir = previousSorts[index].dir === "desc" ? "asc" : "desc";
          return [{ field, dir }];
        }

        return [{ field, dir: "asc" }];
      }

      if (index >= 0) {
        const nextSorts = [...previousSorts];
        nextSorts[index] = {
          field,
          dir: nextSorts[index].dir === "desc" ? "asc" : "desc",
        };
        return nextSorts;
      }

      return [...previousSorts, { field, dir: "asc" }];
    });
  }, []);

  return {
    rows,
    baseRows: rows,
    loading,
    error,
    me,
    setMe,
    filterMode,
    setFilterMode,
    range,
    setRange,
    applyRange,
    pageSize,
    setPageSize,
    pageIndex,
    hasNext,
    nextPage,
    prevPage,
    totalFiltered,
    sorts,
    toggleSort,
    search,
    setSearch,
    zoneEmails,
    loadAll,
    inProgressTickets,
    outOfTimeTickets
  };
}
