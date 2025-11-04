import React from "react";
import { FlowClient } from "./FlowClient";

export function useTicketsAttachments(id: string) {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
   const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/ceb573986da649129d18d563480129eb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FSUJmCm8sGHZGVlNA6xD1bRyn2gFiIVXmsW53CbDAHM")

  const loadAttachments = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notifyFlow.invoke<any, any>({ itemId: Number(id) });

      if (!res?.ok) throw new Error(res?.message ?? "No fue posible obtener los adjuntos");

      // soporta items.body o items directo o body directo
      const raw =
        (res?.items?.body ?? res?.body ?? res?.items ?? []) as any[];

      const normalized = (Array.isArray(raw) ? raw : [])
        .map((r, i) => ({
          name: r?.name ?? r?.DisplayName ?? `Archivo ${i + 1}`,
          link: r?.url ?? r?.AbsoluteUri ?? r?.link ?? "",
        }))
        .filter(a => a.link);

      // opcional: dedup y orden
      const unique = Array.from(new Map(normalized.map(a => [a.link, a])).values())
        .sort((a, b) => a.name.localeCompare(b.name));

      setRows(unique);
    } catch (e: any) {
      setRows([]);
      setError(e?.message ?? "Error cargando adjuntos");
    } finally {
      setLoading(false);
    }
  }, [id, notifyFlow]);


  return {
    rows, loading, error,
    loadAttachments
  };
}

