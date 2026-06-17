import React from "react";
import { useAuth } from "../../auth/authContext";
import type { DateRange } from "../../Models/Filtros";
import { getXMonthsBackRange, toGraphDateTime, } from "../../utils/Date";
import type { DailyPoint, Fuente, ResolutorAgg, TopCategoria } from "../../Models/Dashboard";
import type { Ticket } from "../../Models/Tickets";
import type { filterTickets, TicketsRepository } from "../../repositories/TicketsRepository/TicketRepository";
import { esc } from "../../utils/Commons";

export function useDashboard(TicketsSvc: TicketsRepository) {
    const [resolutores, setResolutores] = React.useState<ResolutorAgg[]>([])
    const [totalCasos, setTotalCasos] = React.useState<number>(0)
    const [totalEnCurso, setTotalencurso] = React.useState<number>(0)
    const [totalFueraTiempo, setTotalFueraTiempo] = React.useState<number>(0)
    const [totalFinalizados, setTotalFinalizados] = React.useState<number>(0)
    const [porcentajeCumplimiento, setPorcentajeCumplimiento] = React.useState<number>(0)
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [range, setRange] = React.useState<DateRange>(getXMonthsBackRange({MonthQuantity:1}));
    const [topCategorias, setTopCategorias] = React.useState<TopCategoria[]>([]);
    const [totalCategorias, setTotalCateogria] = React.useState<TopCategoria[]>([]);
    const [topSolicitante, setTop5Solicitante] = React.useState<TopCategoria[]>([]);
    const [casosPorDia, setCasosPorDia] = React.useState<DailyPoint[]>([]);
    const [Fuentes, setFuentes] = React.useState<Fuente[]>([]);
   
    const { account } = useAuth();

    const buildFilterTickets = React.useCallback((mode: string): filterTickets => {
      let filters: filterTickets = {};

      if (mode === "resumen") {
        filters.currentUser = esc(account!.username);  
        filters = {...filters, range:{from: toGraphDateTime(range.from)!, to: toGraphDateTime(range.to)!}};
      }
      return filters
      // deps: usa lo que lees adentro
    }, [account?.username, range.from, range.to]);

    const obtenerTotal = React.useCallback(async (mode: string, ) => {
        setLoading(true);
        setError(null);
        try {
        const filter = buildFilterTickets(mode)
        //Todos los casos
        const casos = (await TicketsSvc.loadTickets(filter)).data;
        const total = Array.isArray(casos) ? casos.length : Array.isArray((casos as any)?.value) ? (casos as any).value.length : 0;

        //Casos finalizados
        const casosFinalizados = casos.filter((t) => t.Estadodesolicitud?.toLocaleLowerCase() === "cerrado")
        const totalFinalizados = Array.isArray(casosFinalizados) ? casosFinalizados.length : Array.isArray((casosFinalizados as any)?.value) ? (casosFinalizados as any).value.length : 0;
        console.log(casosFinalizados)
        
        //Casos fuera de tiempo
        const casosVencidos = casos.filter((t) => t.Estadodesolicitud?.toLocaleLowerCase().includes("fuera de tiempo"))
        const totalVencidos = Array.isArray(casosVencidos) ? casosVencidos.length : Array.isArray((casosVencidos as any)?.value) ? (casosVencidos as any).value.length : 0;
        
        //Casos en curso
        const casosEnCurso = casos.filter((t) => t.Estadodesolicitud?.toLocaleLowerCase() === "en atención")
        const totalEnCurso = Array.isArray(casosEnCurso) ? casosEnCurso.length : Array.isArray((casosEnCurso as any)?.value) ? (casosEnCurso as any).value.length : 0;
        
        //Porcentaje de cumplimiento
        const porcentajeCumplimiento = total > 0 ? ((totalFinalizados) / total) : 0;

        const countBySolicitante = (key: (t: Ticket)=>string) => {
          const m = new Map<string, number>()
          for (const t of casos) {
            const k = key(t) || "(En blanco)"
            m.set(k, (m.get(k) ?? 0) + 1)
          }
          return Array.from(m, ([nombre, total]) => ({ nombre, total }))
            .sort((a,b)=>b.total-a.total)
        }
        const allSolicitantes = countBySolicitante(t => String((t as any).Solicitante).trim())
        const top5Solicitante = allSolicitantes.slice(0,5)
        
        setTop5Solicitante(top5Solicitante)
        setPorcentajeCumplimiento(porcentajeCumplimiento);
        setTotalCasos(total);
        setTotalFinalizados(totalFinalizados);
        setTotalFueraTiempo(totalVencidos);
        setTotalencurso(totalEnCurso);
        } catch (e: any) {
        setError(e?.message ?? "Error al inicializar escalamiento");
        } finally {
        setLoading(false);
        }
    },
    [TicketsSvc, account?.username]
    );

    const obtenerTop5 = React.useCallback(async (mode: string) => {
      setLoading(true);
      setError(null);
      try {
        const filter = buildFilterTickets(mode);
        const res = await TicketsSvc.loadTickets(filter);
        const tickets: Ticket[] =
          Array.isArray(res?.data) ? res.data :
          Array.isArray((res as any)?.value) ? (res as any).value : [];

        if (!tickets.length) {
          setTopCategorias([]);
          return;
        }
      
        console.table(tickets)
        const counts = new Map<string, number>();
        for (const t of tickets) {
          const cat = String(t?.SubCategoria || "(En blanco)").trim();
          counts.set(cat, (counts.get(cat) ?? 0) + 1);
        }


        // Calcular top 5
        const top = Array.from(counts.entries())
          .map(([nombre, totalCat]) => ({
            nombre,
            total: totalCat,
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        setTopCategorias(top);
      } catch (e: any) {
        setError(e?.message ?? "Error al obtener top 5 de categorías");
      } finally {
        setLoading(false);
      }
    }, [TicketsSvc, buildFilterTickets]);

    const obtenerTotalCategoria = React.useCallback(async (mode: string) => {
      setLoading(true);
      setError(null);
      try {
        const filter  = buildFilterTickets(mode);
        const res = await TicketsSvc.loadTickets(filter);

        const tickets: Ticket[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray((res as any)?.value)
          ? (res as any).value
          : [];

        // nada que contar
        if (!tickets.length) {
          setTotalCateogria([]);            
          return;
        }

        // contar por SubCategoria (ajusta el campo si quieres otra agrupación)
        const counts = new Map<string, number>();
        for (const t of tickets) {
          const key = String(t?.SubCategoria || "(En blanco)").trim();
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }

        // convertir a array y ordenar DESC
        const allCats: TopCategoria[] = Array.from(counts, ([nombre, total]) => ({ nombre, total }))
          .sort((a, b) => b.total - a.total);

        setTotalCateogria(allCats);         
      } catch (e: any) {
        setError(e?.message ?? "Error al obtener categorías");
      } finally {
        setLoading(false);
      }
    }, [TicketsSvc, buildFilterTickets]);

    const obtenerTotalResolutor = React.useCallback(
      async (mode: string): Promise<ResolutorAgg[]> => {
        setLoading(true);
        setError(null);
        try {
          const filter  = buildFilterTickets(mode);
          console.log(filter)
          const res = await TicketsSvc.loadTickets(filter);

          const tickets: any[] = Array.isArray(res?.data)
            ? res.data
            : Array.isArray((res as any)?.value)
            ? (res as any).value
            : [];

          if (!tickets.length) {
            setResolutores([]);
            return [];
          }

          const totalTickets = tickets.length;

          // agregamos por correo; guardamos mejor display name
          const counts = new Map<string, number>();
          const nombrePorCorreo = new Map<string, string>();

          for (const t of tickets) {
            const correo = (t?.Correoresolutor ?? "").trim().toLowerCase() || "(en blanco)";
            const nombre = (t?.Nombreresolutor ?? "").trim();

            counts.set(correo, (counts.get(correo) ?? 0) + 1);
            if (nombre && !nombrePorCorreo.get(correo)) {
              nombrePorCorreo.set(correo, nombre);
            }
          }

          const data: ResolutorAgg[] = Array.from(counts.entries())
            .map(([correo, total]) => {
              const displayNombre =
                nombrePorCorreo.get(correo) ||
                (correo && correo.includes("@") ? correo.split("@")[0] : "(En blanco)");
              const porcentaje = totalTickets > 0 ? totalFinalizados / totalTickets : 0; // 0..1
              return {
                correo: correo === "(en blanco)" ? "" : correo,
                nombre: displayNombre,
                total,
                porcentaje,
              };
            })
            .sort((a, b) => b.total - a.total);

          setResolutores(data);
          return data;
        } catch (e: any) {
          setError(e?.message ?? "Error al obtener resolutores");
          return [];
        } finally {
          setLoading(false);
        }
      },
      [TicketsSvc, buildFilterTickets, totalCasos, totalFinalizados]
    );

    const obtenerFuentes = React.useCallback( async (mode: string): Promise<Fuente[]> => {
      setLoading(true);
      setError(null);
      try {
        const filter = buildFilterTickets(mode);
        const res = await TicketsSvc.loadTickets(filter);

        const tickets: any[] = Array.isArray(res?.data)
          ? res.data
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
    [TicketsSvc, buildFilterTickets]
    );

    const obtenerCasosPorDia = React.useCallback(async (mode: string, fillGaps: boolean = true): Promise<DailyPoint[]> => {
        setLoading(true);
        setError(null);
        try {
          const filter = buildFilterTickets(mode);
          const res = await TicketsSvc.loadTickets(filter);

          const tickets: any[] = Array.isArray(res?.data)
            ? res.data
            : Array.isArray((res as any)?.value)
            ? (res as any).value
            : [];

          if (!tickets.length) {
            // setCasosPorDia?.([]);
            return [];
          }

          // Helper: toma YYYY-MM-DD en UTC (sin hora)
          const toDay = (v: string | Date) => {
            const d = typeof v === "string" ? new Date(v) : v;
            // normaliza a UTC -> YYYY-MM-DD
            const y = d.getUTCFullYear();
            const m = String(d.getUTCMonth() + 1).padStart(2, "0");
            const day = String(d.getUTCDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
          };

          // Conteo por día usando el campo FechaApertura
          const counts = new Map<string, number>();
          for (const t of tickets) {
            const key = toDay(t?.FechaApertura ?? t?.fields?.FechaApertura ?? new Date());
            counts.set(key, (counts.get(key) ?? 0) + 1);
          }

          let series: DailyPoint[] = Array.from(counts, ([fecha, total]) => ({ fecha, total }))
            .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));

          if (fillGaps && range?.from && range?.to && range.from <= range.to) {
            const start = new Date(`${range.from}T00:00:00Z`);
            const end = new Date(`${range.to}T00:00:00Z`);
            const full: DailyPoint[] = [];
            for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
              const key = toDay(d);
              full.push({ fecha: key, total: counts.get(key) ?? 0 });
            }
            series = full;
          }

          setCasosPorDia(series);
          return series;
        } catch (e: any) {
          setError(e?.message ?? "Error al obtener casos por día");
          setCasosPorDia([]);
          return [];
        } finally {
          setLoading(false);
        }
      },
      [TicketsSvc, buildFilterTickets, range.from, range.to]
    );


  return {
    obtenerTotal, setRange, obtenerTop5, obtenerTotalCategoria, obtenerTotalResolutor, obtenerFuentes, obtenerCasosPorDia,
    totalCasos, error, loading, totalEnCurso, totalFinalizados, totalFueraTiempo, porcentajeCumplimiento, topCategorias, range, totalCategorias, resolutores, Fuentes, casosPorDia, topSolicitante
  };
}


