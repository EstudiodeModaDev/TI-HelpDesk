import * as React from "react";
import type { Ticket } from "../../Models/Tickets";
import "./DetalleTicket.css";
import TicketHistorial from "../Seguimiento/Seguimiento";
import HtmlContent from "../Renderizador/Renderizador";
import Recategorizar from "./ModalRecategorizar/Recategorizar";
import Reasignar from "./Reasignar/Reasignar";
import AsignarObservador from "./Observador/Observador";
import TicketsAsociados from "./TicketsRelacionados/Relacionados";
import { ParseDateShow } from "../../utils/Date";
import Trunc from "../Trunc/trunc";
import { useTicketsAttachments } from "../../Funcionalidades/AttachmentsTickets";


/* ================== Helpers y tipos ================== */
const hasRecatRole = (r?: string) => {
  const v = (r ?? "").trim().toLowerCase();
  return v === "administrador" || v === "tecnico" || v === "técnico";
};

type Props = {
  ticket: Ticket;          
  onVolver: () => void;
  role: string;
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
export function CaseDetail({ ticket, onVolver, role }: Props) {
  const {loadAttachments, rows} = useTicketsAttachments(ticket.ID ?? "");
  // === Estado local del ticket seleccionado
  const [selected, setSelected] = React.useState<Ticket>(ticket);
  React.useEffect(() => {
    if (!selected || selected.ID !== ticket.ID) {
      setSelected(ticket);
    }
    // al cambiar de ticket, oculta paneles
    setShowSeg(false);
    setShowRecat(false);
    setShowReasig(false);
    setShowObservador(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.ID]);

  React.useEffect(() => {
    loadAttachments()
  }, [ticket?.ID]);

  const [showSeg, setShowSeg] = React.useState(false);
  const [showRecat, setShowRecat] = React.useState(false);
  const [showReasig, setShowReasig] = React.useState(false);
  const [showObservador, setShowObservador] = React.useState(false);

  const canRecategorizar = hasRecatRole?.(role) ?? false;

  // === Derivados (memoizados)
  const categoria = React.useMemo(
    () =>
      [selected?.Categoria, selected?.SubCategoria, selected?.SubSubCategoria]
        .filter(Boolean)
        .join(" > "),
    [selected?.Categoria, selected?.SubCategoria, selected?.SubSubCategoria]
  );

  if (!selected) return <div>Ticket no encontrado</div>;

  return (
    <section className="case-detail">
      {/* ===== Header ===== */}
      <header className="cd-header">
        <h2 className="cd-title">Caso – ID {selected.ID}</h2>
        <button type="button" className="btn-volver" onClick={onVolver}>
          ← Volver
        </button>
      </header>

      {/* ===== GRID ===== */}
      <div className="cd-grid">
        {/* Fila 1 */}
        <Row className="pos-apertura" label="Fecha de Apertura">
          <Trunc text={ParseDateShow(selected.FechaApertura ?? "") ?? "—"} />
        </Row>

        <Row className="pos-solucion" label="Fecha de solución">
          <Trunc text={ParseDateShow(selected.TiempoSolucion ?? "") ?? "—"} />
        </Row>

        <Row className="pos-fuente" label="Fuente solicitante">
          <Trunc text={selected.Fuente} lines={1} />
        </Row>

        {/* Fila 2 */}
        <Row className="pos-categoria" label="Categoría">
          {canRecategorizar ? (
            <button type="button" className="as-text" onClick={() => setShowRecat(true)}>
              <Trunc text={categoria || "–"} lines={1} />
            </button>
          ) : (
            <Trunc text={categoria || "–"} lines={1} />
          )}
        </Row>

        <Row className="pos-ans" label="ANS">
          <Trunc text={selected.ANS ?? "—"} lines={1} />
        </Row>

        <Row className="pos-estado" label="Estado">
          <div className="cd-inline">
            <span className={`cd-badge ${selected.Estadodesolicitud === "Cerrado" ? "is-closed" : "is-open"}`} title={selected.Estadodesolicitud ?? ""}>
              {selected.Estadodesolicitud}
            </span>
          </div>
        </Row>

        {/* Fila 3: personas */}
        <div className="cd-people pos-people">
          <div className="cd-people-item">
            <div className="cd-people-label">Actor</div>
            <div className="cd-people-value">—</div>
          </div>

          <div className="cd-people-item">
            <div className="cd-people-label">Solicitante</div>
            <div className="cd-people-value">
              <Trunc text={selected.Solicitante} lines={1} />
            </div>
          </div>

          <div className="cd-people-item">
            <div className="cd-people-label">Observador</div>
            <div className="cd-people-value">
              {canRecategorizar ? (
                <button
                  type="button"
                  className="as-text"
                  onClick={() => setShowObservador(true)}
                >
                  <Trunc text={selected.Observador || "–"} lines={1} />
                </button>
              ) : (
                <Trunc text={selected.Observador || "—"} lines={1} />
              )}
            </div>
          </div>

          <div className="cd-people-item">
            <div className="cd-people-label">Resolutor</div>
            <div className="cd-people-value">
              {canRecategorizar ? (
                <button
                  type="button"
                  className="as-text"
                  onClick={() => setShowReasig(true)}
                >
                  <Trunc text={selected.Nombreresolutor || "–"} lines={1} />
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
          <Trunc text={selected.Title} lines={2} />
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
                if (!href) return null;
                return (
                  <li key={`${href}-${i}`} className="cd-file">
                    <a href={href} target="_blank" rel="noopener noreferrer" className="cd-file-link"
                      title={name}
                    >
                      <span className={`cd-file-ico ext-${name}`} aria-hidden />
                      <Trunc text={name} lines={1} />
                    </a>
                  </li>
                );
              })}
            </ul>
          ))}
        </section>
      )}


      {/* ===== Tickets relacionados ===== */}
      <div className="seccion">
        <TicketsAsociados key={String(selected.ID)} ticket={selected} onSelect={(t: Ticket) => {setShowSeg(false); setSelected(t)}}/>
      </div>

      {/* ===== Botón de Seguimiento ===== */}
      <div>
        <button type="button" className="btn-volver" onClick={() => setShowSeg((v) => !v)} >
          {showSeg ? "Ocultar seguimiento" : "Seguimiento ticket"}
        </button>
      </div>

      {/* ===== Historial (toggle) ===== */}
      {showSeg && (
        <div className="seccion">
          <TicketHistorial role={role ?? "Usuario"} onVolver={() => setShowSeg(false)} ticketId={selected.ID!} ticket={selected}/>
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
              <Recategorizar ticket={selected} />
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: Reasignación ===== */}
      {showReasig && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Reasignar ticket">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Reasignar ticket #{selected.ID}</h3>
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
              <AsignarObservador ticket={selected} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


