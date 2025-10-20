// TicketsAsociados.tsx
import * as React from "react";
import { useTicketsRelacionados } from "../../../Funcionalidades/Tickets";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { Ticket } from "../../../Models/Tickets";
import "./TicketsAsociados.css";
import type { TicketLite } from "./RelacionarTickets/Relacionador";
import RelacionadorInline from "./RelacionarTickets/Relacionador";

type Props = {
  title?: string;
  ticket: Ticket;                         // ticket actualmente seleccionado
  emptyChildrenText?: string;
  onSelect?: (t: Ticket) => void;         // callback al seleccionar
  buildHref?: (id: number | string) => string; // opcional: si también quieres navegar
  onRelateConfirm?: (payload: { mode: "padre" | "hijo" | "masiva"; selected: TicketLite[] }) => Promise<void> | void;
};

export default function TicketsAsociados({title = "Tickets Asociados", ticket, emptyChildrenText = "No es hijo de ningun caso", onSelect, buildHref,}: Props) {
  const { Tickets } = useGraphServices();

  // Hook de relacionados
  const { padre, hijos, loading, error, loadRelateds } = useTicketsRelacionados(Tickets, ticket);

  // ====== Relacionador (UI) ======
  const [showRel, setShowRel] = React.useState(false);
  const [loadingOpts, setLoadingOpts] = React.useState(false);

  async function openRelacionador() {
    try {
      setShowRel(true);
      setLoadingOpts(true);
    } finally {
      setLoadingOpts(false);
    }
  }

  function closeRelacionador() {
    setShowRel(false);
  }

  // ====== Navegación por click en padre/hijo ======
  function handleClick(e: React.MouseEvent, t: Ticket) {
    if (onSelect) {
      e.preventDefault();
      onSelect(t);
    }
  }

  const href = (id: number | string) => (buildHref ? buildHref(id) : "#");

  return (
    <section className="ta-panel" aria-label={title}>
      {/* Header SIEMPRE visible */}
      <header className="ta-header">
        <div className="ta-header__left">
          <h2 className="ta-title">{title}</h2>
          <button type="button" className="ta-iconbtn" aria-label={showRel ? "cancelar" : "nuevo"} title={showRel ? "Cancelar" : "Relacionar"} onClick={showRel ? closeRelacionador : openRelacionador}>
            {showRel ? "Cancelar" : "Nuevo"}
          </button>
        </div>

        {/* Oculta el link cuando estás relacionando */}
        {!showRel && (
          <a className="ta-seeall" href="#" aria-label="Ver todos los tickets asociados">
            Ver todos
          </a>
        )}
      </header>

      {/* ===== Contenido ===== */}
      {showRel ? (
        <div className="ta-relacionador-wrap">
          {loadingOpts ? (
            <div className="ta-skeleton" style={{ height: 40 }} aria-hidden />
          ) : (
            <RelacionadorInline
                currentId={Number(ticket.ID)}
                onCancel={closeRelacionador}
                userMail={""} isAdmin={true}  
                reload={loadRelateds}        
            />
          )}
        </div>
      ) : (
        <>
          {loading && <div className="ta-skeleton" aria-hidden />}
          {error && <p className="ta-error">Error cargando tickets</p>}

          <div className="ta-body">
            {/* Padre */}
            <section className="ta-column">
              <p className="ta-label">Ticket padre:</p>
              <ul className="ta-list">
                {!padre ? (
                  <li className="ta-empty">No tiene ticket padre</li>
                ) : (
                  <li className="ta-list__item">
                    <span className="ta-list__dash" aria-hidden>-</span>
                    {onSelect ? (
                      <button
                        type="button"
                        className="ta-link ta-link--button"
                        onClick={(e) => handleClick(e, padre)}
                      >
                        {padre.Title} <span className="ta-link__muted">- ID: {padre.ID}</span>
                      </button>
                    ) : (
                      <a className="ta-link" href={href(padre.ID ?? "")}>
                        {padre.Title} <span className="ta-link__muted">- ID: {padre.ID}</span>
                      </a>
                    )}
                  </li>
                )}
              </ul>
            </section>

            {/* Hijos */}
            <section className="ta-column">
              <p className="ta-label">Padre de {hijos.length}:</p>
              {hijos.length === 0 ? (
                <p className="ta-empty">{emptyChildrenText}</p>
              ) : (
                <ul className="ta-list">
                  {hijos.map((t) => (
                    <li key={t.ID} className="ta-list__item">
                      <span className="ta-list__dash" aria-hidden>-</span>
                      {onSelect ? (
                        <button
                          type="button"
                          className="ta-link ta-link--button"
                          onClick={(e) => handleClick(e, t)}
                        >
                          {t.Title} <span className="ta-link__muted">- ID: {t.ID}</span>
                        </button>
                      ) : (
                        <a className="ta-link" href={href(t.ID ?? "")}>
                          {t.Title} <span className="ta-link__muted">- ID: {t.ID}</span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );

}
