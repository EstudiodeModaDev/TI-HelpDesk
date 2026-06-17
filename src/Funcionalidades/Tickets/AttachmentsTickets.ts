import React from "react";
import { useRepositories } from "../../repositories/repositoriesContext";
import type { filterAttachments } from "../../repositories/AttachmentsRepostory/AttachmentRepository";
import { supabase } from "../../Services/Supabase.service";

const getAttachmentUrl = (path?: string, bucket?: string) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!bucket) return path;

  const normalizedPath = path.replace(/^\/+/, "");
  const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
  return data?.publicUrl ?? path;
};

export function useTicketsAttachments() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { attachments } = useRepositories();

  const loadAttachments = React.useCallback(async (filter?: filterAttachments) => {
    setLoading(true);
    setError(null);
    try {
      if (!attachments) {
        throw new Error("Repositorio de adjuntos no disponible");
      }

      const effectiveFilter = {
        ...filter,
      };

      const hasAnyFilter =
        !!effectiveFilter.attachment_type ||
        effectiveFilter.id_ticket !== undefined ||
        effectiveFilter.id_seguimiento !== undefined;

      if (!hasAnyFilter) {
        throw new Error("Debes indicar el tipo de adjunto y el id del ticket y/o seguimiento");
      }

      const res = await attachments.loadAttachments(effectiveFilter);

      if (!res?.status) {
        throw new Error(res?.message ?? "No fue posible obtener los adjuntos");
      }

      const normalized = (Array.isArray(res.data) ? res.data : [])
        .map((r, i) => ({
          name: r?.file_name ?? `Archivo ${i + 1}`,
          link: getAttachmentUrl(r?.attachment_path, r?.storage_bucket),
          attachment_type: r?.attachment_type ?? "",
          id_ticket: r?.id_ticket ?? null,
          id_seguimiento: r?.seguimiento_id ?? null,
          storage_bucket: r?.storage_bucket ?? "",
        }))
        .filter((a) => a.link);

      const unique = Array.from(new Map(normalized.map((a) => [a.link, a])).values())
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log(unique)

      setRows(unique);
    } catch (e: any) {
      setRows([]);
      setError(e?.message ?? "Error cargando adjuntos");
    } finally {
      setLoading(false);
    }
  }, [attachments,]);


  return {
    rows, loading, error,
    loadAttachments
  };
}
