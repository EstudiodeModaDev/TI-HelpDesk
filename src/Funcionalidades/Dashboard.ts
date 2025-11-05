import React from "react";
import { useAuth } from "../auth/authContext";
import type { TicketsService } from "../Services/Tickets.service";
import type { GetAllOpts } from "../Models/Commons";
import type { DateRange } from "../Models/Filtros";
import { toGraphDateTime, toISODateFlex } from "../utils/Date";
import type { ResolutorAgg, TopCategoria } from "../Models/Dashboard";
import type { Ticket } from "../Models/Tickets";



export function useDashboard(TicketsSvc: TicketsService) {
    const [resolutores, setResolutores] = React.useState<ResolutorAgg[]>([])
    const [totalCasos, setTotalCasos] = React.useState<number>(0)
    const [totalEnCurso, setTotalencurso] = React.useState<number>(0)
    const [totalFueraTiempo, setTotalFueraTiempo] = React.useState<number>(0)
    const [totalFinalizados, setTotalFinalizados] = React.useState<number>(0)
    const [porcentajeCumplimiento, setPorcentajeCumplimiento] = React.useState<number>(0)
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const today = React.useMemo(() => toISODateFlex(new Date()), []);
    const [range, setRange] = React.useState<DateRange>({ from: today, to: today });
    const [topCategorias, setTopCategorias] = React.useState<TopCategoria[]>([]);
    const [totalCategorias, setTotalCateogria] = React.useState<TopCategoria[]>([]);
   
   
   // const [pageSize, setPageSize] = React.useState<number>(15); // = $top
   // const [pageIndex, setPageIndex] = React.useState<number>(1); // 1-based
   // const [nextLink, setNextLink] = React.useState<string | null>(null);
   // const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
   // const [state, setState] = React.useState<RelacionadorState>({TicketRelacionar: null});
    const { account } = useAuth();

    const buildFilterTickets = React.useCallback((mode: string): GetAllOpts => {
      const filters: string[] = [];

      // Helper: escapa comillas simples por seguridad en OData
      const esc = (s: string) => (s ?? "").replace(/'/g, "''");

      // Helper: construye límites día en Z
      const dayStartIso = (d: string) => `${d}T00:00:00Z`;
      const dayEndIso   = (d: string) => `${d}T23:59:59Z`;

      if (mode === "resumen") {
        const user = esc(account!.username);

        // Solo una condición para el resolutor
        filters.push(`fields/Correoresolutor eq '${user}'`);

        // Mes en curso [1..último día]
       const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
        const monthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        const fromIso = toGraphDateTime(monthStart);
        const toIso   = toGraphDateTime(monthEnd);
        // toGraphDateTime debería devolver ISO con Z (ej. 2025-11-01T00:00:00Z)
        filters.push(`fields/FechaApertura ge '${fromIso}'`);
        filters.push(`fields/FechaApertura le '${toIso}'`);
      }

      // Rango manual (si ambos están y son consistentes)
      if (range.from && range.to && range.from <= range.to) {
        // Evita duplicar el filtro del mes en curso si ya aplicaste "resumen"
        if (mode !== "resumen") {
          filters.push(`fields/FechaApertura ge ${dayStartIso(range.from)}`);
          filters.push(`fields/FechaApertura le ${dayEndIso(range.to)}`);
        }
      }

      return {
        filter: filters.join(" and "),
      };
      // deps: usa lo que lees adentro
    }, [account?.username, range.from, range.to]);

    const obtenerTotal = React.useCallback(async (mode: string, ) => {
        setLoading(true);
        setError(null);
        try {
        const filter = buildFilterTickets(mode)
        //Todos los casos
        const casos = (await TicketsSvc.getAll({filter: filter.filter, top: 12000})).items;
         const total = Array.isArray(casos) ? casos.length : Array.isArray((casos as any)?.value) ? (casos as any).value.length : 0;

        //Casos finalizados
        const casosFinalizados = (await TicketsSvc.getAll({filter: filter.filter + " and fields/Estadodesolicitud eq 'Cerrado'", top:12000})).items;
        const totalFinalizados = Array.isArray(casosFinalizados) ? casosFinalizados.length : Array.isArray((casosFinalizados as any)?.value) ? (casosFinalizados as any).value.length : 0;

        //Casos fuera de tiempo
        const casosVencidos = (await TicketsSvc.getAll({filter: filter.filter + " and (fields/Estadodesolicitud eq 'Fuera de tiempo' or fields/Estadodesolicitud eq 'Cerrado fuera de tiempo')", top: 12000 })).items;
        const totalVencidos = Array.isArray(casosVencidos) ? casosVencidos.length : Array.isArray((casosVencidos as any)?.value) ? (casosVencidos as any).value.length : 0;
        
        //Casos en curso
        const casosEnCurso = (await TicketsSvc.getAll({filter: filter.filter + " and fields/Estadodesolicitud eq 'En Atención'", top: 12000})).items;
        const totalEnCurso = Array.isArray(casosEnCurso) ? casosEnCurso.length : Array.isArray((casosEnCurso as any)?.value) ? (casosEnCurso as any).value.length : 0;
        
        //Porcentaje de cumplimiento
        const porcentajeCumplimiento = total > 0 ? ((totalFinalizados) / total) : 0;

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
        const res = await TicketsSvc.getAll({ filter: filter.filter, top: 12000 });
        const tickets: Ticket[] =
          Array.isArray(res?.items) ? res.items :
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
        const { filter } = buildFilterTickets(mode);
        const res = await TicketsSvc.getAll({ filter, top: 12000 });

        const tickets: Ticket[] = Array.isArray(res?.items)
          ? res.items
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
          const { filter } = buildFilterTickets(mode);
          const res = await TicketsSvc.getAll({ filter, top: 12000 });

          const tickets: any[] = Array.isArray(res?.items)
            ? res.items
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
              const porcentaje = totalTickets > 0 ? total / totalTickets : 0; // 0..1
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
      [TicketsSvc, buildFilterTickets]
    );


  return {
    obtenerTotal, setRange, obtenerTop5, obtenerTotalCategoria, obtenerTotalResolutor,
    totalCasos, error, loading, totalEnCurso, totalFinalizados, totalFueraTiempo, porcentajeCumplimiento, topCategorias, range, totalCategorias, resolutores
  };
}

