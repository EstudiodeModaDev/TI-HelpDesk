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
    
        if(mode === "resumen"){
             filters.push(`fields/CorreoResolutor eq '${account!.username}'`)
                filters.push(`fields/CorreoResolutor eq '${account!.username}'`);

                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                const fromIso = toGraphDateTime(monthStart); // -> "YYYY-MM-DDTHH:mm:ssZ"
                const toIso   = toGraphDateTime(monthEnd);
                filters.push(`fields/FechaApertura ge ${fromIso}`);
                filters.push(`fields/FechaApertura le ${toIso}`);
        }
                    
        if(range.from && range.to && range.from <= range.to && range.to !== today && range.from !== today){
            filters.push(`fields/FechaApertura ge ${range.from}`);
            filters.push(`fields/FechaApertura le ${range.to}`);
        }
    
        return {
          filter: filters.join(" and "),
        };
      }, [range.from, range.to,]); 

    const obtenerTotal = React.useCallback(async (mode: string, ) => {
        setLoading(true);
        setError(null);
        try {
        const filter = buildFilterTickets(mode)
        //Todos los casos
        const casos = await TicketsSvc.getAllPlane(filter);
         const total = Array.isArray(casos) ? casos.length : Array.isArray((casos as any)?.value) ? (casos as any).value.length : 0;

        //Casos finalizados
        const casosFinalizados = await TicketsSvc.getAllPlane({filter: filter.filter + " and fields/Estado eq 'Cerrado'" });
        const totalFinalizados = Array.isArray(casosFinalizados) ? casosFinalizados.length : Array.isArray((casosFinalizados as any)?.value) ? (casosFinalizados as any).value.length : 0;

        //Casos fuera de tiempo
        const casosVencidos = await TicketsSvc.getAllPlane({filter: filter.filter + "or (fields/Estado eq 'Fuera de tiempo' or fields/Estado 'Cerrado fuera de tiempo')" });
        const totalVencidos = Array.isArray(casosVencidos) ? casos.length : Array.isArray((casosVencidos as any)?.value) ? (casosVencidos as any).value.length : 0;
        
        //Casos en curso
        const casosEnCurso = await TicketsSvc.getAllPlane({filter: filter.filter + " and fields/Estado eq 'En curso'" });
        const totalEnCurso = Array.isArray(casosEnCurso) ? casosEnCurso.length : Array.isArray((casosEnCurso as any)?.value) ? (casosEnCurso as any).value.length : 0;
            
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

   /* const obtenerTotalSegmentado = React.useCallback(async (mode: string) => {
        setLoading(true);
        setError(null);
        try {
        // construye el filtro solo cuando aplique
        const filter =
            mode === "resumen" && account?.username
            ? `fields/CorreoResolutor eq '${account.username}'`
            : undefined;

        // pasa el filtro al servicio (ajusta la firma si tu svc usa otra shape)
        const casos = await TicketsSvc.getAllPlane({ filter });

        const total = Array.isArray(casos)
            ? casos.length
            : Array.isArray((casos as any)?.value)
            ? (casos as any).value.length
            : 0;

        setTotalCasos(total);
        } catch (e: any) {
        setError(e?.message ?? "Error al inicializar escalamiento");
        } finally {
        setLoading(false);
        }
    },
    [TicketsSvc, account?.username]
    );*/



  return {
    obtenerTotal, setRange,
    totalCasos, error, loading, totalEnCurso, totalFinalizados, totalFueraTiempo,
  };
}

