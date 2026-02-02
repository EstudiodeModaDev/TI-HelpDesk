import React from "react";
import type { DailyPoint, Fuente, ResolutorAgg, TopCategoria } from "../Models/Dashboard";
import type { TicketsService } from "../Services/Tickets.service";
import type { DateRange } from "../Models/Filtros";
import type { GetAllOpts } from "../Models/Commons";
import type { Ticket } from "../Models/Tickets";
import { norm } from "../utils/Commons";
import { toGraphDateTime } from "../utils/Date";

type ConteoMes = { mes: string; total: number }; // 'YYYY-MM'

export function useDetallado(TicketsSvc: TicketsService) {
  const [resolutores, setResolutores] = React.useState<ResolutorAgg[]>([]);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [totalCasos, setTotalCasos] = React.useState<number>(0);
  const [totalEnCurso, setTotalencurso] = React.useState<number>(0);
  const [totalFueraTiempo, setTotalFueraTiempo] = React.useState<number>(0);
  const [totalFinalizados, setTotalFinalizados] = React.useState<number>(0);
  const [porcentajeCumplimiento, setPorcentajeCumplimiento] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Range controlado por UI
  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });

  const [topCategorias, setTopCategorias] = React.useState<TopCategoria[]>([]);
  const [topSolicitante, setopSolicitante] = React.useState<TopCategoria[]>([]);
  const [totalCategorias, setTotalCateogria] = React.useState<TopCategoria[]>([]);
  const [casosPorDia, setCasosPorDia] = React.useState<DailyPoint[]>([]);
  const [Fuentes, setFuentes] = React.useState<Fuente[]>([]);
  const [conteoPorMes, setConteoPorMes] = React.useState<ConteoMes[]>([]);

  const buildFilterTickets = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];
    const fromD = range?.from;
    const toD = range?.to;

    const toIsoUTC = (d: Date) => d.toISOString(); // incluye .000Z

    // Si hay rango completo, úsalo
    if (fromD && toD) {
      const start = new Date(`${fromD}T00:00:00.000Z`);

      // fin exclusivo: día siguiente de toD
      const end = new Date(`${toD}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);

      filters.push(`fields/FechaApertura ge '${toIsoUTC(start)}'`);
      filters.push(`fields/FechaApertura lt '${toIsoUTC(end)}'`);
      return { filter: filters.join(" and ") };
    }

    // Si NO hay rango completo, NO forces mes actual aquí.
    // Deja vacío y que el TSX decida cuándo consultar.
    return { filter: "" };
  }, [range?.from, range?.to]);

  const getEstado = React.useCallback((t: any): string => {
    return (
      t?.Estadodesolicitud ??
      t?.EstadoSolicitud ??
      t?.EstadoDeSolicitud ??
      t?.Estado ??
      t?.fields?.Estadodesolicitud ??
      t?.fields?.EstadoSolicitud ??
      t?.fields?.EstadoDeSolicitud ??
      t?.fields?.Estado ??
      ""
    );
  }, []);

  const classifyEstado = React.useCallback((raw: string) => {
    const st = norm(raw).toLowerCase();

    const isAt = st === "cerrado" || st === "cerrado a tiempo";
    const isLate = st === "fuera de tiempo" || st === "cerrado fuera de tiempo";
    const isProg = st === "en atención" || st === "en atencion";

    return { st, isAt, isLate, isProg };
  }, []);

  const buildResolutores = React.useCallback(
    (ticketsIn: Ticket[]): ResolutorAgg[] => {
      const getResolvers = (t: any): Array<{ email: string; name: string }> => {
        const out: Array<{ email: string; name: string }> = [];
        const direct = t?.CorreoResolutor ?? "";
        const nombreResolutor = t?.Nombreresolutor ?? "";

        if (direct) {
          const parts = String(direct)
            .split(/[;,]/)
            .map((s) => s.trim())
            .filter(Boolean);

          for (const p of parts) {
            const m = p.match(/<?([\w.+-]+@[\w.-]+\.\w+)>?/);
            const email = (m ? m[1] : "").toLowerCase();
            const name =
              nombreResolutor ||
              p.replace(/<.*?>/, "").trim() ||
              (email ? email.split("@")[0] : "") ||
              "(En blanco)";
            out.push({ email, name });
          }
        }

        if (!out.length) {
          out.push({ email: "", name: nombreResolutor || "(En blanco)" });
        }

        const seen = new Set<string>();
        return out.filter((r) => {
          const k = r.email || r.name.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      };

      const byRes = new Map<
        string,
        { nombre: string; email: string; total: number; at: number; vencidos: number; enCurso: number }
      >();

      for (const t of ticketsIn) {
        const estado = getEstado(t as any);
        const cls = classifyEstado(estado);

        for (const r of getResolvers(t as any)) {
          const key = r.email || r.name.toLowerCase();

          const rec =
            byRes.get(key) ?? {
              nombre: r.name,
              email: r.email,
              total: 0,
              at: 0,
              vencidos: 0,
              enCurso: 0,
            };

          rec.total++;
          if (cls.isAt) rec.at++;
          if (cls.isLate) rec.vencidos++;
          if (cls.isProg) rec.enCurso++;

          byRes.set(key, rec);
        }
      }

      return Array.from(byRes.values())
        .map((v) => ({
          correo: v.email,
          nombre: v.nombre,
          total: v.total,
          at: v.at,
          vencidos: v.vencidos,
          enCurso: v.enCurso,
          porcentaje: v.total ? v.at / v.total : 0,
        }))
        .sort((a, b) => b.total - a.total);
    },
    [getEstado, classifyEstado]
  );

  // =========================
  // Conteo mensual rolling (últimos N meses)
  // =========================
  const obtenerConteoUltimosMeses = React.useCallback(
    async (months: number): Promise<ConteoMes[]> => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1, 0, 0, 0, 0));
        const endExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

        const filter = [
          `fields/FechaApertura ge '${toGraphDateTime(start)}'`,
          `fields/FechaApertura lt '${toGraphDateTime(endExclusive)}'`,
        ].join(" and ");

        const res = await TicketsSvc.getAll({ filter, top: 12000 });
        const list: Ticket[] = Array.isArray(res?.items)
          ? res.items
          : Array.isArray((res as any)?.value)
          ? (res as any).value
          : [];

        const toMonthKey = (v: string | Date) => {
          const d = typeof v === "string" ? new Date(v) : v;
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, "0");
          return `${y}-${m}`;
        };

        const map = new Map<string, number>();
        for (const t of list) {
          const key = toMonthKey((t as any)?.FechaApertura ?? (t as any)?.fields?.FechaApertura ?? now);
          map.set(key, (map.get(key) ?? 0) + 1);
        }

        const out: ConteoMes[] = [];
        const cur = new Date(start);
        while (cur < endExclusive) {
          const key = toMonthKey(cur);
          out.push({ mes: key, total: map.get(key) ?? 0 });
          cur.setUTCMonth(cur.getUTCMonth() + 1, 1);
          cur.setUTCHours(0, 0, 0, 0);
        }

        setConteoPorMes(out);
        return out;
      } catch (e: any) {
        setError(e?.message ?? "Error al obtener conteo por mes");
        setConteoPorMes([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [TicketsSvc]
  );

  // =========================
  // Total / métricas (usa el rango del usuario)
  // =========================
  const obtenerTotal = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { filter } = buildFilterTickets();

      // si no hay filtro (rango incompleto), no consultes
      if (!filter) {
        setTickets([]);
        setTotalCasos(0);
        setTotalencurso(0);
        setTotalFinalizados(0);
        setTotalFueraTiempo(0);
        setPorcentajeCumplimiento(0);
        setTopCategorias([]);
        setTotalCateogria([]);
        setCasosPorDia([]);
        setResolutores([]);
        setopSolicitante([]);
        return;
      }

      // Debug útil: mira qué está yendo al endpoint
      // console.log("RANGE:", range.from, range.to);
      // console.log("FILTER:", filter);

      const res = await TicketsSvc.getAll({ filter, top: 12000 });

      const list: Ticket[] = Array.isArray(res?.items)
        ? res.items
        : Array.isArray((res as any)?.value)
        ? (res as any).value
        : [];

      setTickets(list);
      const total = list.length;

      const buckets = { at: 0, late: 0, inprog: 0, otros: 0 };

      for (const t of list as any[]) {
        const cls = classifyEstado(getEstado(t));
        if (cls.isAt) buckets.at++;
        else if (cls.isLate) buckets.late++;
        else if (cls.isProg) buckets.inprog++;
        else buckets.otros++;
      }

      const pct = total ? buckets.at / total : 0;

      const countBy = (key: (t: Ticket) => string) => {
        const m = new Map<string, number>();
        for (const t of list) {
          const k = key(t) || "(En blanco)";
          m.set(k, (m.get(k) ?? 0) + 1);
        }
        return Array.from(m, ([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
      };

      const allSolicitantes = countBy((t) => String((t as any)?.Solicitante ?? (t as any)?.fields?.Solicitante ?? "").trim());
      setopSolicitante(allSolicitantes.slice(0, 5));

      const allCats = countBy((t) => String((t as any)?.SubCategoria ?? (t as any)?.fields?.SubCategoria ?? "").trim());
      setTopCategorias(allCats.slice(0, 5));
      setTotalCateogria(allCats);

      const resols = buildResolutores(list);
      setResolutores(resols);

      const dayKey = (d: any) => {
        const dd = new Date((d?.FechaApertura ?? d?.fields?.FechaApertura) as string);
        const y = dd.getUTCFullYear();
        const m = String(dd.getUTCMonth() + 1).padStart(2, "0");
        const da = String(dd.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
      };

      const mapDay = new Map<string, number>();
      for (const t of list as any[]) mapDay.set(dayKey(t), (mapDay.get(dayKey(t)) ?? 0) + 1);
      const series = Array.from(mapDay, ([fecha, total]) => ({ fecha, total })).sort((a, b) => a.fecha.localeCompare(b.fecha));
      setCasosPorDia(series);

      setTotalCasos(total);
      setTotalencurso(buckets.inprog);
      setTotalFinalizados(buckets.at);
      setTotalFueraTiempo(buckets.late);
      setPorcentajeCumplimiento(pct);

      // rolling chart (no depende del rango del usuario)
      obtenerConteoUltimosMeses(5);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar dashboard");
    } finally {
      setLoading(false);
    }
  }, [TicketsSvc, buildFilterTickets, buildResolutores, classifyEstado, getEstado, obtenerConteoUltimosMeses, range.from, range.to]);

  // =========================
  // Fuentes (derivado de tickets)
  // =========================
  const obtenerFuentes = React.useCallback(async (): Promise<Fuente[]> => {
    setError(null);
    try {
      if (!tickets.length) {
        setFuentes([]);
        return [];
      }

      const counts = new Map<string, number>();
      for (const t of tickets as any[]) {
        const key = String(t?.Fuente ?? t?.fields?.Fuente ?? "(En blanco)").trim();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }

      const data: Fuente[] = Array.from(counts, ([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total);
      setFuentes(data);
      return data;
    } catch (e: any) {
      setError(e?.message ?? "Error al obtener fuentes");
      return [];
    }
  }, [tickets]);

  return {
    // acciones
    obtenerTotal,
    setRange,
    obtenerFuentes,

    // estados
    totalCasos,
    error,
    loading,
    totalEnCurso,
    totalFinalizados,
    totalFueraTiempo,
    porcentajeCumplimiento,
    topCategorias,
    range,
    totalCategorias,
    resolutores,
    Fuentes,
    casosPorDia,
    topSolicitante,

    // chart mensual
    conteoPorMes,
    obtenerConteoUltimosMeses,
  };
}
