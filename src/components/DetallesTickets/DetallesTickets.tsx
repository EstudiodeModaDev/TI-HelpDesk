import * as React from "react";
import type { Ticket } from "../../Models/Tickets";
import "./DetalleTicket.css";
import TicketHistorial from "../Seguimiento/Seguimiento";
import Recategorizar from "./Modals/Recategorizar";
import Reasignar from "./Modals/Reasignar";
import AsignarObservador from "./Modals/Observador";
import { MensajesModal } from "./Modals/Messages/Mensajes";
import { useTicketsAttachments, type TicketAttachment } from "../../Funcionalidades/Tickets/AttachmentsTickets";
import TicketsAsociados from "./TicketsRelacionados/Relacionados";
import TimeCounter from "../TimeCounter/TimeCounter";
import { hasRecatRole, getPreviewKind } from "./DetallesTickets.helpers";
import CaseHeader from "./CaseHeader";
import CaseInfoGrid from "./CaseInfoGrid";
import CaseAttachments from "./CaseAttachments";
import ModalShell from "./ModalShell";
import CambiarFuente from "./Modals/ChangeFuente";
import PausarTicket from "./Modals/PausarTicket";
import { useRepositories } from "../../repositories/repositoriesContext";
import { useActivoTicket } from "../../Funcionalidades/inventario/useActivoTickets";

type Props = {
  ticket: Ticket;
  onVolver: () => void;
  onDocumentar: () => void;
  role: string;
};

type ActiveModal = "recategorizar" | "reasignar" | "observador" | "fuente" | "pausar" | null;

export function CaseDetail({ ticket, onVolver, role, onDocumentar }: Props) {
  const { loadAttachments, rows } = useTicketsAttachments();
  const { activotickets } = useRepositories();
  const {
    activoticket: activosRelacionados,
    loading: loadingActivos,
    error: errorActivos,
    loadActivoTicket,
  } = useActivoTicket({ ActivosTicketSvc: activotickets! });

  const [selected, setSelected] = React.useState<Ticket>(ticket);
  const [selectedAttachment, setSelectedAttachment] = React.useState<TicketAttachment | null>(null);
  const [showSeg, setShowSeg] = React.useState(false);
  const [showBotton, setShowBotton] = React.useState(true);
  const [showMessages, setShowMessages] = React.useState(false);
  const [activeModal, setActiveModal] = React.useState<ActiveModal>(null);

  const canRecategorizar = hasRecatRole(role);
  const isDisponibilidadTicket = String(selected?.Fuente ?? "").trim().toLowerCase() === "disponibilidad";

  // Al cambiar de ID de ticket (no en cada refetch), oculta los paneles abiertos.
  React.useEffect(() => {
    setShowSeg(false);
    setActiveModal(null);
    setShowMessages(false);
    setSelectedAttachment(null);
  }, [ticket?.ID]);

  // Sincroniza el ticket seleccionado con la prop, incluso si solo cambiaron sus datos.
  React.useEffect(() => {
    setSelected(ticket);
  }, [ticket]);

  React.useEffect(() => {
    loadAttachments({
      attachment_type: "Creacion",
      id_ticket: Number(ticket.ID),
    });
  }, [ticket?.ID, loadAttachments]);

  // Usa selected (no ticket) para recargar también al saltar a un ticket relacionado.
  React.useEffect(() => {
    if (!selected?.ID) return;
    loadActivoTicket({ ticket_id: Number(selected.ID) });
  }, [selected?.ID, loadActivoTicket]);

  // Mantiene la selección de adjunto vigente, o elige el primero previsualizable.
  React.useEffect(() => {
    if (rows.length === 0) {
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

  const handleVolver = React.useCallback(() => {
    onVolver();
    setShowBotton(true);
  }, [onVolver]);

  const closeModal = React.useCallback(() => setActiveModal(null), []);

  const handleFuenteChanged = React.useCallback(() => {
    setActiveModal(null);
    onDocumentar();
  }, [onDocumentar]);

  const handlePausado = React.useCallback(() => {
    setActiveModal(null);
    onDocumentar();
  }, [onDocumentar]);

  const closeSeguimiento = React.useCallback(() => {
    setShowSeg(false);
    setShowBotton(true);
  }, []);

  const toggleSeguimiento = React.useCallback(() => {
    setShowSeg((v) => !v);
    setShowBotton(false);
  }, []);

  const openMessages = React.useCallback(() => {
    setShowMessages(true);
    setShowBotton(false);
  }, []);

  const closeMessages = React.useCallback(() => {
    setShowMessages(false);
    setShowBotton(true);
  }, []);

  const handleSelectRelacionado = React.useCallback((t: Ticket) => {
    setShowSeg(false);
    setSelected(t);
  }, []);

  if (!selected) return <div>Ticket no encontrado</div>;

  return (
    <section className="case-detail">
      <CaseHeader ticket={selected} onVolver={handleVolver} />

      <CaseInfoGrid
        ticket={selected}
        canRecategorizar={canRecategorizar}
        onOpenCategoria={() => setActiveModal("recategorizar")}
        onOpenObservador={() => setActiveModal("observador")}
        onOpenResolutor={() => setActiveModal("reasignar")} 
        onOpenFuente={() => setActiveModal("fuente")}      />

      {isDisponibilidadTicket && (
        <div className="seccion">
          <TimeCounter subtitle={`Tiempo del ticket #${selected.ID ?? ""}`} ticket={selected} />
        </div>
      )}

      <CaseAttachments rows={rows} selected={selectedAttachment} onSelect={setSelectedAttachment} />

      {/* ===== Tickets relacionados ===== */}
      <div className="seccion">
        <TicketsAsociados key={String(selected.ID)} ticket={selected} onSelect={handleSelectRelacionado} />
      </div>

      {/* ===== Activos relacionados ===== */}
      <div className="seccion">
        <h3 className="cd-subtitle">Activos relacionados ({activosRelacionados.length})</h3>
        {loadingActivos && <p>Cargando activos…</p>}
        {errorActivos && <p style={{ color: "#b91c1c" }}>{errorActivos}</p>}
        {!loadingActivos && !errorActivos && activosRelacionados.length === 0 && (
          <p>Este ticket no tiene activos vinculados.</p>
        )}
        {activosRelacionados.length > 0 && (
          <ul className="cd-files">
            {activosRelacionados.map((v) => (
              <li key={v.id}>
                <strong>{v.activo?.codigo_inventario ?? v.activo_id}</strong>
                {v.activo?.tipo && ` — ${v.activo.tipo}`}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== Botón de Seguimiento ===== */}
      {showBotton && (
        <div>
          <button type="button" className="btn btn-terciary" onClick={openMessages} style={{ marginRight: 8 }}>
            Comentarios
          </button>
          <button type="button" className="btn btn-secondary-final" onClick={toggleSeguimiento} style={{ marginRight: 8 }}>
            {showSeg ? "Ocultar seguimiento" : "Seguimiento ticket"}
          </button>
          {canRecategorizar && (
            <button type="button" className="btn btn-secondary-final" onClick={() => setActiveModal("pausar")}>
              {selected.Estadodesolicitud === "Pausado" ? "Reanudar" : "Pausar"} ticket
            </button>
          )}
        </div>
      )}

      {/* ===== Historial (toggle) ===== */}
      {showSeg && (
        <div className="seccion">
          <TicketHistorial
            role={role ?? "Usuario"}
            onVolver={closeSeguimiento}
            ticketId={selected.ID!}
            ticket={selected}
            onAdd={() => setShowBotton(true)}
            onAddClick={onDocumentar}
          />
        </div>
      )}

      {activeModal === "recategorizar" && (
        <ModalShell ariaLabel="Recategorizar ticket" onClose={closeModal}>
          <Recategorizar ticket={selected} onDone={onDocumentar} />
        </ModalShell>
      )}

      {activeModal === "reasignar" && (
        <ModalShell ariaLabel="Reasignar ticket" onClose={closeModal}>
          <Reasignar ticket={selected} />
        </ModalShell>
      )}

      {activeModal === "observador" && (
        <ModalShell
          ariaLabel="Asignar observador"
          title={`Asignar observador a ticket #${selected.ID}`}
          onClose={closeModal}
        >
          <AsignarObservador ticket={selected} onDone={onDocumentar} />
        </ModalShell>
      )}

      {activeModal === "fuente" && (
        <ModalShell
          ariaLabel="Cambiar fuente solicitante"
          title={`Cambiar fuente solicitante a ticket #${selected.ID}`}
          onClose={closeModal}
        >
          <CambiarFuente ticket={selected} onDone={handleFuenteChanged}/>
        </ModalShell>
      )}

      {activeModal === "pausar" && (
        <ModalShell ariaLabel="Pausar ticket" onClose={closeModal}>
          <PausarTicket ticket={selected} onCancel={closeModal} onDone={handlePausado} />
        </ModalShell>
      )}

      <MensajesModal ticket={selected} isOpen={showMessages} onClose={closeMessages} />
    </section>
  );
}
