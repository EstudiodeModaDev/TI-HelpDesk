import React from "react";
import { useAuth } from "../auth/authContext";
import type { TicketsService } from "../Services/Tickets.service";

export function useDashboard(TicketsSvc: TicketsService) {
   // const [resolutures, setResolutores] = React.useState<Usuario[]>([])
    const [totalCasos, setTotalCasos] = React.useState<number>(0)
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
   // const [filterMode, setFilterMode] = React.useState<FilterMode>("En curso");
   // const today = React.useMemo(() => toISODateFlex(new Date()), []);
   // const [range, setRange] = React.useState<DateRange>({ from: today, to: today });
   // const [pageSize, setPageSize] = React.useState<number>(15); // = $top
   // const [pageIndex, setPageIndex] = React.useState<number>(1); // 1-based
   // const [nextLink, setNextLink] = React.useState<string | null>(null);
   // const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
   // const [state, setState] = React.useState<RelacionadorState>({TicketRelacionar: null});
    const { account } = useAuth();

    const obtenerTotal = React.useCallback(async (mode: string) => {
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
    );

  return {
    obtenerTotal, 
    totalCasos, loading, error
  };
}

