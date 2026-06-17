import * as React from "react";
import type { Ticket } from "../../Models/Tickets";
import "./DetalleTicket.css";
import TicketHistorial from "../Seguimiento/Seguimiento";
import HtmlContent from "../Renderizador/Renderizador";
import Recategorizar from "./Modals/Recategorizar";
import Reasignar from "./Modals/Reasignar";
import AsignarObservador from "./Modals/Observador";
import { ParseDateShow } from "../../utils/Date";
import Trunc from "../Trunc/trunc";
import { useTicketsAttachments } from "../../Funcionalidades/Tickets/AttachmentsTickets";
import TicketsAsociados from "./TicketsRelacionados/Relacionados";


/* ================== Helpers y tipos ================== */
const hasRecatRole = (r?: string) => {
  const v = (r ?? "").trim().toLowerCase();
  return v === "administrador" || v === "tecnico" || v === "técnico";
};

type Props = {
  ticket: Ticket;          
  onVolver: () => void;
  onDocumentar: () => void;
  role: string;
};

type AttachmentRow = {
  name: string;
  link: string;
  attachment_type?: string;
  id_ticket?: number | null;
  id_seguimiento?: number | null;
};

type PreviewKind = "image" | "pdf" | "text" | "video" | "audio" | "unsupported";

const getFileExtension = (value?: string) => {
  if (!value) return "";
  const cleanValue = value.split("?")[0].split("#")[0];
  const parts = cleanValue.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() ?? "" : "";
};

const getPreviewKind = (file?: AttachmentRow): PreviewKind => {
  const ext = getFileExtension(file?.name) || getFileExtension(file?.link);

  if (["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["txt", "csv", "log", "json", "xml"].includes(ext)) return "text";
  if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";

  return "unsupported";
};

const openAttachmentDownload = (file: AttachmentRow) => {
  window.open(file.link, "_blank", "noopener,noreferrer");
};

/* ================== Componente ================== */
export type Opcion = { value: string; label: string };

function Row({label, children, className = "",}: {label: string; children: React.ReactNode; className?: string;}) {
  return (
    <div className={`cd-row ${className}`}>
      <label className="cd-label">{label}</label>
      <div className="cd-value">{children}</div>
    </div>
  );
}

export function CaseDetail({ ticket, onVolver, role, onDocumentar }: Props) {
  const {loadAttachments, rows} = useTicketsAttachments();
  // === Estado local del ticket seleccionado
  const [selected, setSelected] = React.useState<Ticket>(ticket);
  const [selectedAttachment, setSelectedAttachment] = React.useState<AttachmentRow | null>(null);
  React.useEffect(() => {
    // al cambiar de ticket, oculta paneles
    setShowSeg(false);
    setShowRecat(false);
    setShowReasig(false);
    setShowObservador(false);
    setSelectedAttachment(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.ID]);

  React.useEffect(() => {
    loadAttachments({
      attachment_type: "Creacion",
      id_ticket: Number(ticket.ID),
    });
    
  }, [ticket?.ID, loadAttachments]);

  const [showSeg, setShowSeg] = React.useState(false);
  const [showRecat, setShowRecat] = React.useState(false);
  const [showReasig, setShowReasig] = React.useState(false);
  const [showObservador, setShowObservador] = React.useState(false);
  const [showBotton, setShowBotton] = React.useState(true)

  const canRecategorizar = hasRecatRole?.(role) ?? false;

  React.useEffect(() => {
    setSelected(ticket);
  }, [ticket]);

  React.useEffect(() => {
    if (!Array.isArray(rows) || rows.length === 0) {
      setSelectedAttachment(null);
      return;
    }

    setSelectedAttachment((current) => {
      if (current && rows.some((row) => row.link === current.link)) {
        return current;
      }

      const firstPreviewable = rows.find((row) => getPreviewKind(row) !== "unsupported");
      return firstPreviewable ?? null;
    });
  }, [rows]);

  // === Derivados (memoizados)
  const categoria = React.useMemo(
    () =>
      [selected?.Categoria, selected?.SubCategoria, selected?.Articulo]
        .filter(Boolean)
        .join(" > "),
    [selected?.Categoria, selected?.SubCategoria, selected?.Articulo]
  );
  const previewKind = React.useMemo(
    () => getPreviewKind(selectedAttachment ?? undefined),
    [selectedAttachment]
  );

  if (!selected) return <div>Ticket no encontrado</div>;

  return (
    <section className="case-detail">
      {/* ===== Header ===== */}
      <header className="cd-header">
        <h2 className="cd-title">Caso – ID {selected.ID} </h2>
        <span className={`cd-badge ${selected.Estadodesolicitud === "Cerrado" ? "is-closed" : selected.Estadodesolicitud === "En Atención" ? "is-open" : "is-out"}`} title={selected.Estadodesolicitud ?? ""}>
          {selected.Estadodesolicitud}
        </span>
        <button type="button" className="btn-primary" onClick={onVolver}>← Volver</button>
      </header>

      {/* ===== GRID ===== */}
      <div className="cd-grid">
        {/* Fila 1 */}
        <Row className="pos-apertura" label="Fecha de Apertura">
          <Trunc text={ParseDateShow(selected.FechaApertura ?? "") ?? "—"} />
        </Row>

        <Row className="pos-solucion" label="Fecha de Solución">
          <Trunc text={ParseDateShow(selected.FechaMaxima ?? "") ?? "—"} />
        </Row>

        <Row className="pos-fuente" label="Fuente solicitante">
          <Trunc text={selected.Fuente} lines={1} />
        </Row>

        {/* Fila 2 */}
        <Row className="pos-categoria" label="Categoría">
          {canRecategorizar ? (
            <button type="button" className="as-text" onClick={() => setShowRecat(true)}>
              <Trunc text={categoria || "-----------"} lines={1}/>
            </button>
          ) : (
            <Trunc text={categoria || "-----------"} lines={1} />
          )}
        </Row>

        <Row className="pos-ans" label="ANS">
          <Trunc text={selected.ANS ?? "N/A"} lines={1} />
        </Row>

        {/* Fila 3: personas */}
        <div className="cd-people pos-people">
          <div className="cd-people-item">
            <div className="cd-people-label">Solicitante</div>
            <div className="cd-people-value">
              <Trunc text={selected.Solicitante} lines={1} maxLenght={30}/>
            </div>
          </div>

          <div className="cd-people-item">
            <div className="cd-people-label">Observador</div>
            <div className="cd-people-value">
              {canRecategorizar ? (
                <button type="button" className="as-text" onClick={() => setShowObservador(true)}>
                  <Trunc text={selected.Observador || "–-----------"} lines={1} maxLenght={30}/>
                </button>
              ) : (
                selected.Observador || "-----------"
              )}
            </div>
          </div>

          <div className="cd-people-item">
            <div className="cd-people-label">Resolutor</div>
            <div className="cd-people-value">
              {canRecategorizar ? (
                <button type="button" className="as-text" onClick={() => setShowReasig(true)}>
                  <Trunc text={selected.Nombreresolutor || "-----------"} lines={1} maxLenght={30}/>
                </button>
              ) : (
                <Trunc text={selected.Nombreresolutor || "–"} lines={1} />
              )}
            </div>
          </div>
        </div>

        {/* Fila 4: Título */}
        <Row className="pos-titulo" label="Título">
          {/* 2 líneas en móvil para mejor legibilidad */}
          {selected.AsuntoTicket}
        </Row>

        {/* Fila 5: Descripción (HTML truncada en móvil vía .html-trunc) */}
        <Row className="pos-descr" label="Descripción">
          <div className="html-trunc">
            <HtmlContent html={selected.Descripcion ?? ""} />
          </div>
        </Row>
      </div>

      {/* ===== Adjuntos ===== */}
      {Array.isArray(rows) && (
        <section className="cd-attachments">
          <h3 className="cd-subtitle">Adjuntos ({rows.length})</h3>


          {(rows.length === 0 ? (
            <p className="cd-empty">Sin adjuntos.</p>
          ) : (
            <ul className="cd-files" role="list">
              {rows.map((r: any, i: number) => {
                const name = r?.DisplayName ?? r?.name ?? `Archivo ${i + 1}`;
                const href = r?.AbsoluteUri ?? r?.link ?? r?.Url ?? r?.url ?? "";
                const attachment = {
                  ...r,
                  name,
                  link: href,
                } as AttachmentRow;
                const canPreview = getPreviewKind(attachment) !== "unsupported";
                if (!href) return null;
                return (
                  <li key={`${href}-${i}`} className="cd-file">
                    <button
                      type="button"
                      className={`cd-file-link ${selectedAttachment?.link === href ? "is-active" : ""}`}
                      onClick={() => {
                        if (canPreview) {
                          setSelectedAttachment(attachment);
                          return;
                        }

                        openAttachmentDownload(attachment);
                      }}
                      title={name}
                    >
                      <span className={`cd-file-ico ext-${name}`} aria-hidden />
                      <Trunc text={name} lines={1} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}

          {selectedAttachment && previewKind !== "unsupported" && (
            <div className="cd-attachment-viewer">
              <div className="cd-attachment-viewer-head">
                <strong>{selectedAttachment.name}</strong>
                <a
                  href={selectedAttachment.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary cd-attachment-download"
                >
                  Descargar
                </a>
              </div>

              <div className="cd-attachment-frame">
                {previewKind === "image" && (
                  <img
                    src={selectedAttachment.link}
                    alt={selectedAttachment.name}
                    className="cd-attachment-image"
                  />
                )}

                {previewKind === "pdf" && (
                  <iframe
                    src={selectedAttachment.link}
                    title={selectedAttachment.name}
                    className="cd-attachment-iframe"
                  />
                )}

                {previewKind === "text" && (
                  <iframe
                    src={selectedAttachment.link}
                    title={selectedAttachment.name}
                    className="cd-attachment-iframe"
                  />
                )}

                {previewKind === "video" && (
                  <video controls className="cd-attachment-media">
                    <source src={selectedAttachment.link} />
                    Tu navegador no pudo reproducir este video.
                  </video>
                )}

                {previewKind === "audio" && (
                  <audio controls className="cd-attachment-audio">
                    <source src={selectedAttachment.link} />
                    Tu navegador no pudo reproducir este audio.
                  </audio>
                )}
              </div>
            </div>
          )}

          {selectedAttachment && previewKind === "unsupported" && (
            <div className="cd-attachment-fallback">
              <p>Este archivo no se puede visualizar dentro de la página.</p>
              <a
                href={selectedAttachment.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary cd-attachment-download"
              >
                Descargar archivo
              </a>
            </div>
          )}
        </section>
      )}


      {/* ===== Tickets relacionados ===== */
      <div className="seccion">
        <TicketsAsociados key={String(selected.ID)} ticket={selected} onSelect={(t: Ticket) => {setShowSeg(false); setSelected(t)}}/>
      </div>
      }

      {/* ===== Botón de Seguimiento ===== */}
      {showBotton ?
        <div>
          <button type="button" className="btn btn-secondary-final" onClick={() => {setShowSeg((v) => !v); setShowBotton(false)}} >
            {showSeg ? "Ocultar seguimiento" : "Seguimiento ticket"}
          </button>
        </div> : null
      }
      

      {/* ===== Historial (toggle) ===== */}
      {showSeg && (
        <div className="seccion">
          <TicketHistorial role={role ?? "Usuario"} onVolver={() => setShowSeg(false)} ticketId={selected.ID!} ticket={selected} onAdd={() => setShowBotton(true)} onAddClick={onDocumentar}/>
        </div>
      )}

      {/* ===== Modal: Recategorización ===== */}
      {showRecat && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Recategorizar ticket">
          <div className="modal-card">
              <button type="button" className="modal-close" onClick={() => setShowRecat(false)} aria-label="Cerrar">
                ✕
              </button>
            <div className="modal-body">
              <Recategorizar ticket={selected} onDone={onDocumentar} />
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: Reasignación ===== */}
      {showReasig && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Reasignar ticket">
          <div className="modal-card">
            <div className="modal-head">
              <button type="button" className="modal-close" onClick={() => setShowReasig(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <Reasignar ticket={selected} />
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: Observador ===== */}
      {showObservador && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Asignar observador">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Asignar observador a ticket #{selected.ID}</h3>
              <button type="button" className="modal-close" onClick={() => setShowObservador(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <AsignarObservador ticket={selected} onDone={onDocumentar}/>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


