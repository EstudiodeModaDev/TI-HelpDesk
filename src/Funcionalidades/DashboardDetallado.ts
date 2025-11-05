import React from "react"
import type { DailyPoint, Fuente, ResolutorAgg, TopCategoria } from "../Models/Dashboard"
import type { TicketsService } from "../Services/Tickets.service"
import type { DateRange } from "../Models/Filtros"
import { useAuth } from "../auth/authContext"
import type { GetAllOpts } from "../Models/Commons"
import type { Ticket } from "../Models/Tickets"
import { norm } from "../utils/Commons"

export function useDetallado(TicketsSvc: TicketsService) {
    const [resolutores, setResolutores] = React.useState<ResolutorAgg[]>([])
    const [tickets, setTickets] = React.useState<Ticket[]>([])
    const [totalCasos, setTotalCasos] = React.useState<number>(0)
    const [totalEnCurso, setTotalencurso] = React.useState<number>(0)
    const [totalFueraTiempo, setTotalFueraTiempo] = React.useState<number>(0)
    const [totalFinalizados, setTotalFinalizados] = React.useState<number>(0)
    const [porcentajeCumplimiento, setPorcentajeCumplimiento] = React.useState<number>(0)
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });
    const [topCategorias, setTopCategorias] = React.useState<TopCategoria[]>([]);
    const [totalCategorias, setTotalCateogria] = React.useState<TopCategoria[]>([]);
    const [casosPorDia, setCasosPorDia] = React.useState<DailyPoint[]>([]);
    const [Fuentes, setFuentes] = React.useState<Fuente[]>([]);
   
    const { account } = useAuth();

    const buildFilterTickets = React.useCallback((): GetAllOpts => {
      const filters: string[] = [];
      // Helper: construye límites día en Z
      const dayStartIso = (d: string) => `${d}T00:00:00Z`;
      const dayEndIso   = (d: string) => `${d}T23:59:59Z`;

      if (range.from && range.to && range.from <= range.to) {
          filters.push(`fields/FechaApertura ge '${dayStartIso(range.from)}'`);
          filters.push(`fields/FechaApertura le '${dayEndIso(range.to)}'`);
      }

      return {
        filter: filters.join(" and "),
      };
      // deps: usa lo que lees adentro
    }, [account?.username, range.from, range.to]);

    const obtenerTotal = React.useCallback(async () => {
      setLoading(true); setError(null);
      try {
        const { filter } = buildFilterTickets();
        const res = await TicketsSvc.getAll({ filter, top: 12000 });

        const tickets: Ticket[] = Array.isArray(res?.items)
          ? res.items
          : Array.isArray((res as any)?.value) ? (res as any).value : [];

        setTickets(tickets)
        const total = tickets.length;

        // Mapea todos los estados a buckets
        const norm = (s: string) => (s || "").trim().toLowerCase();
        const buckets = { at: 0, late: 0, inprog: 0, otros: 0 };
        for (const t of tickets) {
          const st = norm((t as any)?.Estadodesolicitud || (t as any)?.fields?.Estadodesolicitud);
          if (st === "cerrado") buckets.at++;
          else if (st === "fuera de tiempo" || st === "cerrado fuera de tiempo") buckets.late++;
          else if (st === "en atención" || st === "en atencion") buckets.inprog++;
          else buckets.otros++;
        }

        // 2) % cumplimiento (cerrados a tiempo / total)
        const pct = total ? buckets.at / total : 0;

        // 3) Top 5 categorías y todas las categorías
        const countBy = (key: (t: Ticket)=>string) => {
          const m = new Map<string, number>();
          for (const t of tickets) {
            const k = key(t) || "(En blanco)";
            m.set(k, (m.get(k) ?? 0) + 1);
          }
          return Array.from(m, ([nombre, total]) => ({ nombre, total }))
            .sort((a,b)=>b.total-a.total);
        };
        const allCats = countBy(t => String((t as any).SubCategoria).trim());
        const top5 = allCats.slice(0,5);

        const resolutores = buildResolutores(tickets);
        console.table(resolutores)

        // 6) Casos por día
        const dayKey = (d: any) => {
          const dd = new Date((d?.FechaApertura ?? d?.fields?.FechaApertura) as string);
          const y = dd.getUTCFullYear(), m = String(dd.getUTCMonth()+1).padStart(2,"0"), da = String(dd.getUTCDate()).padStart(2,"0");
          return `${y}-${m}-${da}`; // normalizado a UTC; ajusta si usas local
        };
        const mapDay = new Map<string, number>();
        for (const t of tickets) mapDay.set(dayKey(t), (mapDay.get(dayKey(t)) ?? 0)+1);
        const series = Array.from(mapDay, ([fecha,total])=>({fecha,total})).sort((a,b)=>a.fecha.localeCompare(b.fecha));
        setTotalCasos(total);
        setTotalencurso(buckets.inprog);
        setTotalFinalizados(buckets.at);
        setTotalFueraTiempo(buckets.late);
        setPorcentajeCumplimiento(pct);
        setTopCategorias(top5);
        setTotalCateogria(allCats);
        setCasosPorDia(series);
        setResolutores(resolutores)
      } catch (e:any) {
        setError(e?.message ?? "Error al cargar dashboard");
      } finally {
        setLoading(false);
      }
    }, [TicketsSvc, buildFilterTickets, tickets]);

    const obtenerFuentes = React.useCallback( async (): Promise<Fuente[]> => {
      setLoading(true);
      setError(null);
      try {
        const { filter } = buildFilterTickets();
        const res = await TicketsSvc.getAll({ filter, top: 12000 });

        const tickets: any[] = Array.isArray(res?.items)
          ? res.items
          : Array.isArray((res as any)?.value)
          ? (res as any).value
          : [];

        if (!tickets.length) {
          setFuentes([]);
          return [];
        }

        // Contar por campo Fuente
        const counts = new Map<string, number>();
        for (const t of tickets) {
          const key = String(t?.Fuente || "(En blanco)").trim();
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }

        // A arreglo + ordenar DESC
        const data: Fuente[] = Array.from(counts, ([label, total]) => ({ label, total }))
          .sort((a, b) => b.total - a.total);

        setFuentes(data);
        return data;
      } catch (e: any) {
        setError(e?.message ?? "Error al obtener fuentes");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [TicketsSvc, buildFilterTickets]);

    const buildResolutores = (tickets: Ticket[]): ResolutorAgg[] => {
      const isClosedOnTime = (st?: string) => ["cerrado", "cerrado a tiempo"].includes(norm(st));
      
      const getResolvers = (t: Ticket): Array<{ email: string; name: string }> => {
        const out: Array<{ email: string; name: string }> = [];

        const direct = t?.CorreoResolutor; // <- ; importante
        if (direct) {
          const parts = String(direct)
            .split(/[;,]/)
            .map((s) => s.trim())
            .filter(Boolean);

          for (const p of parts) {
            // soporta "Nombre <mail@dom.com>" o "mail@dom.com"
            const m = p.match(/<?([\w.+-]+@[\w.-]+\.\w+)>?/);
            const email = (m ? m[1] : "").toLowerCase();
            const name =
              t?.Nombreresolutor ||
              p.replace(/<.*?>/, "").trim() ||
              (email ? email.split("@")[0] : "") ||
              "(En blanco)";
            out.push({ email, name });
          }
        }

        // fallback: solo nombre
        if (!out.length) {
          const name = t?.Nombreresolutor || "(En blanco)";
          out.push({ email: "", name });
        }

        // dedup dentro del ticket
        const seen = new Set<string>();
        return out.filter((r) => {
          const k = r.email || r.name.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      };

      // --- agregación por resolutor ---
      const byRes = new Map<string, { nombre: string; email: string; total: number; at: number }>();

      for (const t of tickets) {
        const st = t?.Estadodesolicitud;

        for (const r of getResolvers(t)) {
          const key = r.email || r.name.toLowerCase();
          const rec = byRes.get(key) ?? { nombre: r.name, email: r.email, total: 0, at: 0 };
          rec.total++;
          if (isClosedOnTime(st)) rec.at++;
          byRes.set(key, rec);
        }
      }

      return Array.from(byRes.values())
        .map((v) => ({
          correo: v.email,
          nombre: v.nombre,
          total: v.total,
          at: v.at,
          porcentaje: v.total ? v.at / v.total : 0,
        }))
        .sort((a, b) => b.total - a.total);
    };

  return {
    obtenerTotal, setRange, obtenerFuentes, buildResolutores,
    totalCasos, error, loading, totalEnCurso, totalFinalizados, totalFueraTiempo, porcentajeCumplimiento, topCategorias, range, totalCategorias, resolutores, Fuentes, casosPorDia
  };
}