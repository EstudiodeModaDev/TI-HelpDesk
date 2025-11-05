import React from "react";
import { useAuth } from "../auth/authContext";
import type { TicketsService } from "../Services/Tickets.service";
import type { GetAllOpts } from "../Models/Commons";
import type { DateRange } from "../Models/Filtros";
import { toGraphDateTime, toISODateFlex } from "../utils/Date";

export function useDashboard(TicketsSvc: TicketsService) {
   // const [resolutures, setResolutores] = React.useState<Usuario[]>([])
    const [totalCasos, setTotalCasos] = React.useState<number>(0)
    const [totalEnCurso, setTotalencurso] = React.useState<number>(0)
    const [totalFueraTiempo, setTotalFueraTiempo] = React.useState<number>(0)
    const [totalFinalizados, setTotalFinalizados] = React.useState<number>(0)
    const [porcentajeCumplimiento, setPorcentajeCumplimiento] = React.useState<number>(0)
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const today = React.useMemo(() => toISODateFlex(new Date()), []);
    const [range, setRange] = React.useState<DateRange>({ from: today, to: today });
   // const [filterMode, setFilterMode] = React.useState<FilterMode>("En curso");
   
   
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
        const casosVencidos = (await TicketsSvc.getAll({filter: filter.filter + " or (fields/Estadodesolicitud eq 'Fuera de tiempo' or fields/Estadodesolicitud eq 'Cerrado fuera de tiempo')", top: 12000 })).items;
        const totalVencidos = Array.isArray(casosVencidos) ? casosVencidos.length : Array.isArray((casosVencidos as any)?.value) ? (casosVencidos as any).value.length : 0;
        
        //Casos en curso
        const casosEnCurso = (await TicketsSvc.getAll({filter: filter.filter + " and fields/Estadodesolicitud eq 'En curso'", top: 12000})).items;
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

  return {
    obtenerTotal, setRange,
    totalCasos, error, loading, totalEnCurso, totalFinalizados, totalFueraTiempo, porcentajeCumplimiento
  };
}

