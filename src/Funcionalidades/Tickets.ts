 import * as React from "react";
import type { SortDir, SortField, Ticket, ticketOption } from "../Models/Tickets";
import type { DateRange } from "../Models/Filtros";
import type { GetAllOpts } from "../Models/Commons";
import type { RelacionadorState } from "../Models/nuevoTicket";
import type { MasiveFlow } from "../Models/FlujosPA";
import type { GraphRest } from "../graph/GraphRest";

import { FlowClient } from "./FlowClient";
import { fileToBasePA64, norm } from "../utils/Commons";
import { TicketsService } from "../Services/Tickets.service";

const Tiendas_group = "e06961ff-6886-450d-a97f-48c3c3a55233";

/* =========================
   Utils de fechas
========================= */

export function parseDDMMYYYYHHMM(fecha?: string | null): Date {
  if (!fecha) return new Date(NaN);
  const [dmy, hm] = fecha.trim().split(/\s+/);
  if (!dmy || !hm) return new Date(NaN);
  const [d, m, y] = dmy.split("/");
  const [H, M] = hm.split(":");
  if (!d || !m || !y || !H || !M) return new Date(NaN);
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${H.padStart(2, "0")}:${M.padStart(2, "0")}`;
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? new Date(NaN) : dt;
}

export function parseFechaFlex(fecha?: string): Date {
  if (!fecha) return new Date(NaN);
  const t = fecha.trim();

  // ISO: 2025-01-31 o 2025-01-31 10:30
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    return new Date(t.replace(" ", "T"));
  }

  // dd/MM/yyyy HH:mm
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (m) {
    const [, dd, mm, yyyy, HH, MM] = m;
    return new Date(`${yyyy}-${mm}-${dd}T${HH}:${MM}`);
  }

  return new Date(NaN);
}

export function calcularColorEstado(ticket: Ticket): string {
  const estado = (ticket.Estadodesolicitud ?? "").toLowerCase();

  if (estado === "cerrado" || estado === "cerrado fuera de tiempo") {
    return "rgba(0,0,0,1)";
  }

  if (!ticket.FechaApertura || !ticket.TiempoSolucion) {
    return "rgba(255,0,0,1)";
  }

  const inicio = parseFechaFlex(ticket.FechaApertura).getTime();
  const fin = parseFechaFlex(ticket.TiempoSolucion).getTime();
  const ahora = Date.now();

  if (isNaN(inicio) || isNaN(fin)) {
    return "rgba(255,0,0,1)";
  }

  const horasTotales = (fin - inicio) / 3_600_000;
  const horasRestantes = (fin - ahora) / 3_600_000;

  if (horasTotales <= 0 || horasRestantes <= 0) {
    return "rgba(255,0,0,1)";
  }

  const p = Math.max(0, Math.min(1, horasRestantes / horasTotales));

  const r = p > 0.5 ? 34 : p > 0.1 ? 255 : 255;
  const g = p > 0.5 ? 139 : p > 0.1 ? 165 : 0;
  const b = p > 0.5 ? 34 : p > 0.1 ? 0 : 0;

  const alpha = Math.max(0.3, 1 - p);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* =========================
   Debounce + Search local
========================= */

export function useDebouncedValue<T>(value: T, delay = 250) {
  const [deb, setDeb] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

function includesSearch(row: Ticket, q: string) {
  const qq = norm(q).toLocaleLowerCase();
  if (!qq) return true;

  return (
    norm(row.Title).toLocaleLowerCase().includes(qq) ||
    norm(row.ID).toLocaleLowerCase().includes(qq) ||
    norm(row.Solicitante).toLocaleLowerCase().includes(qq) ||
    norm(row.Nombreresolutor).toLocaleLowerCase().includes(qq)
  );
}

/* =========================
   Hook principal (CORREGIDO)
   Estrategia:
   - Carga TODA la data que cumple filtros (con paginación del server)
   - Luego paginación + search son 100% locales (sin mezclar con nextLink)
========================= */

export function useTickets(graph: GraphRest, TicketsSvc: TicketsService, userMail: string, role: string) {
  const [rows, setRows] = React.useState<Ticket[]>([]);
  const [baseRows, setBaseRows] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [me, setMe] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [filterMode, setFilterMode] = React.useState<string>("En curso");

  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });

  const [pageSize, setPageSize] = React.useState<number>(10);
  const [pageIndex, setPageIndex] = React.useState<number>(1);

  const [sorts, setSorts] = React.useState<Array<{ field: SortField; dir: SortDir }>>([
    { field: "id", dir: "desc" },
  ]);

  const [state, setState] = React.useState<RelacionadorState>({ TicketRelacionar: null });
  const setField = <K extends keyof RelacionadorState>(k: K, v: RelacionadorState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const [ticketsAbiertos, setTicketsAbiertos] = React.useState<number>(0);
  const [ticketsFueraTiempo, setTicketsFueraTiempo] = React.useState<number>(0);

  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const notifyFlow = React.useMemo(
    () =>
      new FlowClient(
        "https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c6d30061fb55449798cbdb76da3172e5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=n-NqCPMlsQaZ9PDJyG6f9hLmkTtHvRjybLqc9Ilk8eM"
      ),
    []
  );

  const getSortValue = React.useCallback((ticket: Ticket, field: SortField): number | string => {
    switch (field) {
      case "id":
        return Number(ticket.ID ?? 0);
      case "FechaApertura": {
        const time = parseFechaFlex(ticket.FechaApertura).getTime();
        return Number.isNaN(time) ? 0 : time;
      }
      case "TiempoSolucion": {
        const time = parseFechaFlex(ticket.TiempoSolucion).getTime();
        return Number.isNaN(time) ? 0 : time;
      }
      case "Title":
        return String(ticket.Title ?? "").toLocaleLowerCase();
      case "resolutor":
        return String(ticket.Nombreresolutor ?? "").toLocaleLowerCase();
      default:
        return "";
    }
  }, []);

  const sortTicketsLocal = React.useCallback((items: Ticket[]): Ticket[] => {
    const activeSorts: Array<{ field: SortField; dir: SortDir }> = sorts.some((s) => s.field === "id")
      ? sorts
      : [...sorts, { field: "id", dir: "desc" as const }];

    return [...items].sort((a, b) => {
      for (const sort of activeSorts) {
        const av = getSortValue(a, sort.field);
        const bv = getSortValue(b, sort.field);

        if (av === bv) continue;

        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
        else cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });

        if (cmp !== 0) return sort.dir === "asc" ? cmp : -cmp;
      }

      return 0;
    });
  }, [getSortValue, sorts]);

  const [zoneEmails, setZoneEmails] = React.useState<string[]>([]);

  const loadGroupEmails = React.useCallback(async () => {
    const isJefeZona = role === "Jefe de zona";
    if (!isJefeZona) {
      setZoneEmails([]);
      return;
    }

    try {
      const out = new Set<string>();

      const collect = (value: any[]) => {
        for (const member of value ?? []) {
          const mail = String(member?.mail ?? "").trim().toLowerCase();
          const upn = String(member?.userPrincipalName ?? "").trim().toLowerCase();
          const picked = mail || upn;
          if (picked) out.add(picked);
        }
      };

      let page = await graph.get<any>(`/groups/${Tiendas_group}/members?$select=mail,userPrincipalName&$top=999`);
      collect(page?.value);

      while (page?.["@odata.nextLink"]) {
        page = await graph.getAbsolute<any>(page["@odata.nextLink"]);
        collect(page?.value);
      }

      setZoneEmails(Array.from(out).sort());
    } catch (e: any) {
      setZoneEmails([]);
      console.warn("[Tickets] No se pudo cargar miembros del grupo:", e?.message ?? e);
    }
  }, [graph, role]);

  React.useEffect(() => {
    let cancel = false;

    (async () => {
      if (cancel) return;
      await loadGroupEmails();
    })();

    return () => {
      cancel = true;
    };
  }, [loadGroupEmails]);


  const buildQueryPlans = React.useCallback((): Array<Pick<GetAllOpts, "filter">> => {
    const isAdmin = role === "Administrador" || userMail === "listo@estudiodemoda.com.co";
    const isJefeZona = role === "Jefe de zona";
    const sharedFilters: string[] = [];

    if (filterMode === "En curso") {
      sharedFilters.push(
        `(fields/Estadodesolicitud eq 'En atención' or fields/Estadodesolicitud eq 'Fuera de tiempo')`
      );
    } else if (filterMode !== "Todos") {
      sharedFilters.push(`startswith(fields/Estadodesolicitud,'Cerrado')`);
    }

    if (range.from && range.to && range.from <= range.to) {
      sharedFilters.push(`fields/FechaApertura ge '${range.from}T00:00:00Z'`);
      sharedFilters.push(`fields/FechaApertura le '${range.to}T23:59:59Z'`);
    }

    if (isAdmin && !me) {
      return [{ filter: sharedFilters.join(" and ") }];
    }

    const currentUser = String(userMail ?? "").trim().toLowerCase();
    const emailSafe = currentUser.replace(/'/g, "''");
    const visibilityFilters = [
      `fields/CorreoSolicitante eq '${emailSafe}'`,
      `fields/CorreoObservador eq '${emailSafe}'`,
      `fields/Correoresolutor eq '${emailSafe}'`,
    ];

    if (isJefeZona) {
      const MAX_ZONE_EMAILS = 25;
      const safeGroupEmails = (zoneEmails ?? [])
        .map((e) => String(e ?? "").trim().toLowerCase())
        .filter(Boolean)
        .filter((e) => e !== currentUser)
        .slice(0, MAX_ZONE_EMAILS)
        .map((e) => e.replace(/'/g, "''"));

      for (const email of safeGroupEmails) {
        visibilityFilters.push(`fields/CorreoSolicitante eq '${email}'`);
      }
    }

    return Array.from(new Set(visibilityFilters)).map((visibilityFilter) => ({
      filter: [visibilityFilter, ...sharedFilters].filter(Boolean).join(" and "),
    }));
  }, [filterMode, me, range.from, range.to, role, userMail, zoneEmails]);

  const loadAllPages = React.useCallback(async (opts?: GetAllOpts): Promise<Ticket[]> => {
    const SERVER_PAGE = 999;
    const MAX_ITEMS_PER_QUERY = 5000;

    let { items, nextLink } = await TicketsSvc.getAll({
      ...opts,
      top: opts?.top ?? SERVER_PAGE,
    });

    const all: Ticket[] = [...(items ?? [])];

    while (nextLink && all.length < MAX_ITEMS_PER_QUERY) {
      const res = await TicketsSvc.getByNextLink(nextLink);
      all.push(...(res.items ?? []));
      nextLink = res.nextLink ?? null;
    }

    return all;
  }, [TicketsSvc]);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryPlans = buildQueryPlans();
      const merged = new Map<string, Ticket>();
      for (const plan of queryPlans) {
        const items = await loadAllPages(plan);
        for (const ticket of items) {
          merged.set(String(ticket.ID), ticket);
        }
      }
      setBaseRows(sortTicketsLocal(Array.from(merged.values())));
      setPageIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setBaseRows([]);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [buildQueryPlans, loadAllPages, sortTicketsLocal]);

  /* =========================
     Cantidades (Abiertos / Fuera de tiempo)
  ========================= */

  const loadCantidadResolutor = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const emailSafe = String(userMail ?? "").trim().toLowerCase().replace(/'/g, "''");
    try {
      const buildCountFilters = (status: string) => ([
        `fields/CorreoSolicitante eq '${emailSafe}' and fields/Estadodesolicitud eq '${status}'`,
        `fields/CorreoObservador eq '${emailSafe}' and fields/Estadodesolicitud eq '${status}'`,
        `fields/Correoresolutor eq '${emailSafe}' and fields/Estadodesolicitud eq '${status}'`,
      ]);
      const countUniqueTickets = async (filters: string[]) => {
        const merged = new Set<string>();
        for (const filter of filters) {
          const items = await loadAllPages({ filter });
          for (const ticket of items) merged.add(String(ticket.ID));
        }
        return merged.size;
      };
      const [abiertos, fueraTiempo] = await Promise.all([
        countUniqueTickets(buildCountFilters("En atención")),
        countUniqueTickets(buildCountFilters("Fuera de tiempo")),
      ]);
      setTicketsAbiertos(abiertos);
      setTicketsFueraTiempo(fueraTiempo);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando conteos");
      setTicketsAbiertos(0);
      setTicketsFueraTiempo(0);
    } finally {
      setLoading(false);
    }
  }, [loadAllPages, userMail]);

  /* =========================
     Efecto único de carga (sin duplicar)
  ========================= */

  React.useEffect(() => {
    loadAll();
    loadCantidadResolutor();
  }, [loadAll, loadCantidadResolutor]);

  /* =========================
     Reset de página al buscar / cambiar pageSize
  ========================= */

  React.useEffect(() => {
    setPageIndex(1);
  }, [debouncedSearch, pageSize]);

  /* =========================
     Derivar rows (search + paginación local)
  ========================= */

  React.useEffect(() => {
    const data =
      debouncedSearch?.trim()
        ? baseRows.filter((r) => includesSearch(r, debouncedSearch))
        : baseRows;

    const start = (pageIndex - 1) * pageSize;
    const page = data.slice(start, start + pageSize);

    setRows(page);
  }, [baseRows, debouncedSearch, pageIndex, pageSize]);

  const totalFiltered = React.useMemo(() => {
    const data =
      debouncedSearch?.trim()
        ? baseRows.filter((r) => includesSearch(r, debouncedSearch))
        : baseRows;
    return data.length;
  }, [baseRows, debouncedSearch]);

  const hasNext = pageIndex * pageSize < totalFiltered;

  const nextPage = React.useCallback(() => {
    if (!hasNext) return;
    setPageIndex((i) => i + 1);
  }, [hasNext]);

  const prevPage = React.useCallback(() => {
    setPageIndex((i) => Math.max(1, i - 1));
  }, []);

  const applyRange = React.useCallback(() => {
    loadAll();
  }, [loadAll]);

  /* =========================
     Sort toggle (re-carga)
  ========================= */

  const toggleSort = React.useCallback((field: SortField, additive = false) => {
    setSorts((prev) => {
      const idx = prev.findIndex((s) => s.field === field);

      if (!additive) {
        if (idx >= 0) {
          const dir: SortDir = prev[idx].dir === "desc" ? "asc" : "desc";
          return [{ field, dir }];
        }
        return [{ field, dir: "asc" }];
      }

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { field, dir: copy[idx].dir === "desc" ? "asc" : "desc" };
        return copy;
      }

      return [...prev, { field, dir: "asc" }];
    });
  }, []);

  /* =========================
     TicketOptions
  ========================= */

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

      // OJO: si quieres “todos”, podrías paginar aquí también.
      const { items } = await TicketsSvc.getAll({ orderby, top });

      return (items ?? [])
        .filter((t: any) => t && t.ID != null)
        .map((t: any): ticketOption => {
          const id = String(t.ID);
          const title = (t.Title ?? "").trim() || fallbackIfEmptyTitle;
          const label = includeIdInLabel ? `${title} — ID: ${idPrefix}${id}` : title;
          return { value: id, label };
        })
        .filter((opt: ticketOption) => {
          if (seen.has(opt.value)) return false;
          seen.add(opt.value);
          return true;
        });
    },
    [TicketsSvc]
  );

  /* =========================
     Confirm relación
  ========================= */

  const handleConfirm = React.useCallback(
    async (actualId: string | number, relatedId: string | number, type: string) => {
      setLoading(true);
      setError(null);
      try {
        if (type === "padre") {
          await TicketsSvc.update(String(actualId), { IdCasoPadre: String(relatedId) });
        } else if (type === "hijo") {
          await TicketsSvc.update(String(relatedId), { IdCasoPadre: String(actualId) });
        } else {
          throw new Error("Relación 'masiva' aún no implementada");
        }

        // refrescar lista (opcional, pero recomendable)
        await loadAll();
        return true;
      } catch (e: any) {
        setError(e?.message ?? "Error actualizando relación del ticket");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [TicketsSvc, loadAll]
  );

  /* =========================
     Update selected ticket
  ========================= */

  const updateSelectedTicket = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const ticket = await TicketsSvc.get(id);
        return ticket;
      } catch (e: any) {
        setError(e?.message ?? "Error cargando ticket");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [TicketsSvc]
  );

  /* =========================
     Enviar archivo a Flow
  ========================= */

  async function sendFileToFlow(file: File, uploader?: string) {
    const contentBase64 = await fileToBasePA64(file);

    const payload = {
      uploader: uploader ?? "",
      file: {
        name: file.name,
        contentType: file.type || "application/octet-stream",
        contentBase64,
      },
    };

    try {
      await notifyFlow.invoke<MasiveFlow, any>({ file: payload.file });
      setState((s) => ({ ...s, archivo: null }));
    } catch (err) {
      console.error("[Flow] Error enviando a solicitante:", err);
    }
  }

  return {
    // data
    rows, baseRows, loading, error, 
    // filtros
    search, setSearch, filterMode, setFilterMode, range, setRange, applyRange, me, setMe, 
    // paginación local
    pageSize, setPageSize, pageIndex, hasNext, nextPage, prevPage, totalFiltered, 
    // sorts
    sorts, toggleSort,

    // estado relacionador
    state, setState, setField, handleConfirm,

    // helpers
    toTicketOptions, loadAll, loadCantidadResolutor, 
    ticketsAbiertos, ticketsFueraTiempo,

    // acciones
    sendFileToFlow, updateSelectedTicket, 
  };
}

/* =========================
   Tickets relacionados
========================= */

export function useTicketsRelacionados(TicketsSvc: TicketsService, ticket: Ticket) {
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
        const padreRes = await TicketsSvc.get(String(ticket.IdCasoPadre));
        setPadre(padreRes ?? null);
      } else {
        setPadre(null);
      }

      const hijosRes = await TicketsSvc.getAll({
        filter: `fields/IdCasoPadre eq ${Number(ticket.ID)}`,
        top: 999,
      });

      setHijos(hijosRes?.items ?? []);
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



