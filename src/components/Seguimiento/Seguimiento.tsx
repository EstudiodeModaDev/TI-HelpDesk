import * as React from "react";
import "./Seguimiento.css";
import HtmlContent from "../Renderizador/Renderizador";
import type { Log } from "../../Models/Log";
import type { Ticket } from "../../Models/Tickets";
import Documentar from "../Documentar/Documentar";
import { toISODateFlex } from "../../utils/Date";
import { useRepositories } from "../../repositories/repositoriesContext";
import { supabase } from "../../Services/Supabase.service";

type Tab = "seguimiento" | "solucion";
type Mode = "detalle" | "documentar";

type AttachmentItem = {
  name: string;
  link: string;
};

type Props = {
  role: string;
  ticketId: string | number;
  onVolver: () => void;
  onAdd: () => void;
  defaultTab?: Tab;
  className?: string;
  ticket: Ticket;
  onAddClick: () => void;
};

export default function TicketHistorial({
  role,
  ticketId,
  onVolver,
  defaultTab = "solucion",
  className,
  ticket,
  onAdd,
  onAddClick,
}: Props) {
  const [tab, setTab] = React.useState<Tab>(defaultTab);
  const [mode, setMode] = React.useState<Mode>("detalle");
  const isPrivileged = role === "Administrador" || role === "Tecnico" || role === "TÃ©cnico";

  const { logs, attachments } = useRepositories();

  const [mensajes, setMensajes] = React.useState<Log[]>([]);
  const [attachmentsByLog, setAttachmentsByLog] = React.useState<Record<string, AttachmentItem[]>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (mode !== "detalle") return;

    let cancel = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [items, attachmentItems] = await Promise.all([
          logs?.loadLogs({ seguimientos_solvi_id_ticket: Number(ticketId) }),
          attachments?.loadAttachments({
            attachment_type: "Documentacion",
            id_ticket: Number(ticketId),
          }),
        ]);

        if (cancel) return;

        setMensajes(mapItemsToMensajes(items?.data ?? []));
        setAttachmentsByLog(groupAttachmentsByLog(attachmentItems?.data ?? []));
      } catch (e: any) {
        if (cancel) return;
        setError(e?.message ?? "No se pudo cargar el historial");
        setMensajes([]);
        setAttachmentsByLog({});
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    load();
    return () => {
      cancel = true;
    };
  }, [ticketId, logs, attachments, mode]);

  if (mode === "documentar") {
    return (
      <div className={className ?? ""} style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <button type="button" className="btn btn-xs btn-terciary" onClick={() => setMode("detalle")}>
            <span className="th-back-icon" aria-hidden>â†</span> Volver al detalle
          </button>
        </div>

        {!ticket && <p style={{ opacity: 0.7, padding: 16 }}>Cargando ticketâ€¦</p>}
        {ticket && (
          <Documentar key={`doc-${tab}-${ticketId}`} ticket={ticket} tipo={tab} onDone={() => { onAdd(); onAddClick(); }} />
        )}
      </div>
    );
  }

  const estado = (ticket?.Estadodesolicitud ?? "").toLowerCase().trim();
  const isClosed = estado.includes("cerrado");

  return (
    <div className={className ?? ""} style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 22, fontWeight: 700, marginRight: 12 }}>Agregar :</span>

        {isPrivileged && !isClosed && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => { setTab("seguimiento"); setMode("documentar"); }}
              className={`th-tab ${tab === "seguimiento" ? "th-tab--active" : ""}`}
            >
              Seguimiento
            </button>
            <button
              type="button"
              onClick={() => { setTab("solucion"); setMode("documentar"); onAdd(); }}
              className={`th-tab ${tab === "solucion" ? "th-tab--active" : ""}`}
            >
              SoluciÃ³n
            </button>
          </div>
        )}

        <div style={{ marginLeft: "auto" }}>
          <button type="button" className="btn btn-terciary btn-xs" onClick={() => { onVolver(); }}>
            <span className="th-back-icon" aria-hidden>â†</span> Volver
          </button>
        </div>
      </div>

      <div className="th-box">
        {loading && mensajes.length === 0 && (
          <p style={{ opacity: 0.7, padding: 16 }}>Cargando mensajesâ€¦</p>
        )}
        {error && <p style={{ color: "#b91c1c", padding: 16 }}>{error}</p>}
        {!loading && !error && mensajes.length === 0 && (
          <p style={{ opacity: 0.7, padding: 16 }}>No hay mensajes.</p>
        )}

        {mensajes.map((m) => (
          <HistRow key={m.Id} m={m} attachments={attachmentsByLog[String(m.Id ?? "")] ?? []} />
        ))}
      </div>
    </div>
  );
}

function HistRow({ m, attachments }: { m: Log; attachments: AttachmentItem[] }) {
  const [showAttachments, setShowAttachments] = React.useState(false);

  return (
    <div className="th-row">
      <div className="th-left th-left--stack">
        <div className="th-avatar">
          <div className="th-avatar-fallback" aria-hidden>{m.Actor.charAt(0)}</div>
        </div>
        <div className="th-nombre">{m.Actor}</div>
        <div className="th-fecha">{formatDateTime(m.Created?.toString() ?? "")}</div>
      </div>

      <div className="th-right">
        <div className={`th-bubble th-${tipoToClass(m.Tipo_de_accion)}`}>
          <HtmlContent className="th-text" html={m.Descripcion} />
        </div>

        {attachments.length > 0 && (
          <div className="th-attachments">
            <button
              type="button"
              className="th-history-link"
              onClick={() => setShowAttachments((value) => !value)}
            >
              {showAttachments ? "Ocultar adjuntos" : `Ver adjuntos (${attachments.length})`}
            </button>

            {showAttachments && (
              <div className="th-attachments-list">
                {attachments.map((attachment, index) => (
                  <a
                    key={`${attachment.link}-${index}`}
                    href={attachment.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="th-attachment-link"
                  >
                    {attachment.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function mapItemsToMensajes(items: any[]): Log[] {
  return (Array.isArray(items) ? items : []).map((it: any) => ({
    Id: String(it.Id),
    Actor: it.Actor ?? "Sistema",
    Created: toISODateFlex(it.Created),
    Id_caso: it.Id_caso ?? undefined,
    Descripcion: it.Descripcion ?? "",
    Tipo_de_accion: it.Tipo_de_accion,
    CorreoActor: it.CorreoActor,
  }));
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function tipoToClass(tipo?: string) {
  const t = (tipo ?? "").toLowerCase();
  if (t.includes("soluciÃ³n") || t.includes("solucion")) return "solucion";
  if (t.includes("seguimiento")) return "seguimiento";
  if (t.includes("creacion")) return "creacion";
  if (t.includes("cierre") || t.includes("cerrado")) return "cierre";
  if (t.includes("sistema")) return "sistema";
  return "default";
}

function groupAttachmentsByLog(items: any[]): Record<string, AttachmentItem[]> {
  return (Array.isArray(items) ? items : []).reduce<Record<string, AttachmentItem[]>>((acc, item, index) => {
    const seguimientoId = item?.seguimiento_id;
    if (seguimientoId === undefined || seguimientoId === null) {
      return acc;
    }

    const link = getAttachmentUrl(item?.attachment_path, item?.storage_bucket);
    if (!link) {
      return acc;
    }

    const key = String(seguimientoId);
    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push({
      name: item?.file_name ?? `Adjunto ${index + 1}`,
      link,
    });

    return acc;
  }, {});
}

function getAttachmentUrl(path?: string, bucket?: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!bucket) return path;

  const normalizedPath = path.replace(/^\/+/, "");
  const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
  return data?.publicUrl ?? path;
}
