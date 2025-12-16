import React from "react";
import type { SortDir, SortField, Ticket, ticketOption } from "../Models/Tickets";
import { TicketsService } from "../Services/Tickets.service";
import type { DateRange } from "../Models/Filtros";
import { toISODateFlex } from "../utils/Date";
import type { GetAllOpts } from "../Models/Commons";
import type { RelacionadorState } from "../Models/nuevoTicket";
import { FlowClient } from "./FlowClient";
import { fileToBasePA64 } from "../utils/Commons";
import type { MasiveFlow } from "../Models/FlujosPA";
import type { GraphRest } from "../graph/GraphRest";



const Tiendas_group = "e06961ff-6886-450d-a97f-48c3c3a55233";

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

  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    return new Date(t.replace(" ", "T"));
  }

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

export function useTickets(graph: GraphRest, TicketsSvc: TicketsService, userMail: string, role: string) {
  const [rows, setRows] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filterMode, setFilterMode] = React.useState<string>("En curso");
  const today = React.useMemo(() => toISODateFlex(new Date()), []);
  const [range, setRange] = React.useState<DateRange>({ from: today, to: today });
  const [pageSize, setPageSize] = React.useState<number>(10);
  const [pageIndex, setPageIndex] = React.useState<number>(1);
  const [nextLink, setNextLink] = React.useState<string | null>(null);
  const [sorts, setSorts] = React.useState<Array<{ field: SortField; dir: SortDir }>>([{ field: "id", dir: "desc" }]);
  const [state, setState] = React.useState<RelacionadorState>({ TicketRelacionar: null });
  const [ticketsAbiertos, setTicketsAbiertos] = React.useState<number>(0);
  const [ticketsFueraTiempo, setTicketsFueraTiempo] = React.useState<number>(0);
  const setField = <K extends keyof RelacionadorState>(k: K, v: RelacionadorState[K]) => setState((s) => ({ ...s, [k]: v }));
  const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c6d30061fb55449798cbdb76da3172e5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=n-NqCPMlsQaZ9PDJyG6f9hLmkTtHvRjybLqc9Ilk8eM");
  const sortFieldToOData: Record<SortField, string> = {
    id: "Id",
    FechaApertura: "fields/FechaApertura",
    TiempoSolucion: "fields/TiempoSolucion",
    Title: "fields/Title",
    resolutor: "fields/Nombreresolutor",
  };

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
        for (const m of value ?? []) {
          const mail = String(m?.mail ?? "").trim().toLowerCase();
          const upn = String(m?.userPrincipalName ?? "").trim().toLowerCase();
          const picked = mail || upn;
          if (picked) out.add(picked);
        }
      };

      // 1) primera página
      let page = await graph.get<any>(
        `/groups/${Tiendas_group}/members?$select=mail,userPrincipalName&$top=999`
      );
      collect(page?.value);

      // 2) paginación por nextLink (absoluto)
      while (page?.["@odata.nextLink"]) {
        page = await graph.getAbsolute<any>(page["@odata.nextLink"]);
        collect(page?.value);
      }

      setZoneEmails(Array.from(out).sort());
    } catch (e: any) {
      // si falla, no rompas la vista; solo no aplica el extra
      setZoneEmails([]);
      console.warn("[Tickets] No se pudo cargar miembros del grupo:", e?.message ?? e);
    } finally {
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

  const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];
    const isAdmin = role === "Administrador" || (userMail !== "listo@estudiodemoda.com.co");
    const isJefeZona = role === "Jefe de zona";

    if (!isAdmin) {
      const emailSafe = String(userMail ?? "").replace(/'/g, "''");

      // Siempre: mis tickets (incluye Jefe de zona)
      const myVisibility =
        `(fields/CorreoSolicitante eq '${emailSafe}' or ` +
        `fields/CorreoObservador eq '${emailSafe}' or ` +
        `fields/Correoresolutor eq '${emailSafe}')`;

      // Extra: solicitantes del grupo (solo Jefe de zona)
      let zoneVisibility = "";
      if (isJefeZona) {
        const MAX_OR = 25;

        const safeGroupEmails = (zoneEmails ?? [])
          .map((e) => String(e ?? "").trim().toLowerCase())
          .filter(Boolean)
          .filter((e) => e !== String(userMail ?? "").trim().toLowerCase())
          .slice(0, MAX_OR)
          .map((e) => e.replace(/'/g, "''"));

        if (safeGroupEmails.length > 0) {
          zoneVisibility = `(${safeGroupEmails
            .map((e) => `fields/CorreoSolicitante eq '${e}'`)
            .join(" or ")})`;
        }
      }

      // OR: mis tickets + tickets zona
      if (zoneVisibility) filters.push(`(${myVisibility} or ${zoneVisibility})`);
      else filters.push(myVisibility);
    }

    // estado (igual)
    if (filterMode === "En curso") {
      filters.push(`(fields/Estadodesolicitud eq 'En atención' or fields/Estadodesolicitud eq 'Fuera de tiempo')`);
    } else if (filterMode === "Todos") {
      // nada
    } else {
      filters.push(`startswith(fields/Estadodesolicitud,'Cerrado')`);
    }

    // rango (igual)
    if (range.from && range.to && range.from < range.to) {
      if (range.from) filters.push(`fields/FechaApertura ge '${range.from}T00:00:00Z'`);
      if (range.to) filters.push(`fields/FechaApertura le '${range.to}T23:59:59Z'`);
    }

    // orderby (igual)
    const orderParts: string[] = sorts
      .map((s) => {
        const col = sortFieldToOData[s.field];
        return col ? `${col} ${s.dir}` : "";
      })
      .filter(Boolean);

    if (!sorts.some((s) => s.field === "id")) orderParts.push("ID desc");

    return {
      filter: filters.join(" and "),
      orderby: orderParts.join(","),
      top: pageSize,
    };
  }, [role, userMail, filterMode, range.from, range.to, pageSize, sorts, zoneEmails]);

  const toTicketOptions = React.useCallback(
    async (opts?: { includeIdInLabel?: boolean; fallbackIfEmptyTitle?: string; idPrefix?: string; top?: number; orderby?: string }): Promise<ticketOption[]> => {
      const { includeIdInLabel = true, fallbackIfEmptyTitle = "(Sin título)", idPrefix = "#" } = opts ?? {};

      const seen = new Set<string>();
      const { items, nextLink } = await TicketsSvc.getAll({ orderby: "id desc" });
      console.log(nextLink);

      const result = items
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

      return result;
    },
    [TicketsSvc]
  );

  const loadFirstPage = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items, nextLink } = await TicketsSvc.getAll(buildFilter());
      setRows(items);
      setNextLink(nextLink ?? null);
      setPageIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setRows([]);
      setNextLink(null);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [TicketsSvc, buildFilter, sorts]);

  const loadCantidadResolutor = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items: itemsAbiertos } = await TicketsSvc.getAll({
        filter: `(fields/CorreoSolicitante eq '${userMail}' or fields/CorreoObservador eq '${userMail}' or fields/Correoresolutor eq '${userMail}') and fields/Estadodesolicitud eq 'En Atención'`,
      });
      const { items: itemsFueraTiempo } = await TicketsSvc.getAll({
        filter: `(fields/CorreoSolicitante eq '${userMail}' or fields/CorreoObservador eq '${userMail}' or fields/Correoresolutor eq '${userMail}') and fields/Estadodesolicitud eq 'Fuera de tiempo'`,
      });
      setTicketsAbiertos(itemsAbiertos.length);
      setTicketsFueraTiempo(itemsFueraTiempo.length);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setRows([]);
      setNextLink(null);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [TicketsSvc, buildFilter, sorts]);

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
        return true;
      } catch (e: any) {
        setError(e?.message ?? "Error actualizando relación del ticket");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [TicketsSvc]
  );

  React.useEffect(() => {
    loadFirstPage();
    loadCantidadResolutor();
  }, [loadFirstPage, loadCantidadResolutor]);

  const updateSelectedTicket = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const ticket = await TicketsSvc.get(id);
        return ticket;
      } catch (e: any) {
        setError(e?.message ?? "Error cargando tickets");
        setRows([]);
        setNextLink(null);
        setPageIndex(1);
      } finally {
        setLoading(false);
      }
    },
    [TicketsSvc, buildFilter, sorts]
  );

  const hasNext = !!nextLink;

  const nextPage = React.useCallback(async () => {
    if (!nextLink) return;
    setLoading(true);
    setError(null);
    try {
      const { items, nextLink: n2 } = await TicketsSvc.getByNextLink(nextLink);
      setRows(items);
      setNextLink(n2 ?? null);
      setPageIndex((i) => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, TicketsSvc]);

  const applyRange = React.useCallback(() => {
    loadFirstPage();
  }, [loadFirstPage]);

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
    rows, ticketsAbiertos, loading, ticketsFueraTiempo, error, pageSize, pageIndex, hasNext, filterMode, sorts, range, state,
    nextPage, setPageSize, setFilterMode, setRange, applyRange, loadFirstPage, toggleSort, setField, toTicketOptions, setState, handleConfirm, sendFileToFlow, updateSelectedTicket,
  };
}

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
      });
      setHijos(hijosRes?.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
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
    padre, hijos, loading, error, loadRelateds,
  };
}
