import * as React from "react";
import toast from "react-hot-toast";
import "./PausarTicket.css";
import RichTextBase64 from "../../RichTextBase64/RichTextBase64";
import type { Ticket } from "../../../Models/Tickets";
import { useAuth } from "../../../auth/authContext";
import { useRepositories } from "../../../repositories/repositoriesContext";
import { useTicketActions } from "../../../Funcionalidades/Tickets/hooks/useTicketActions";

type PausarTicketProps = {
  ticket: Ticket;
  onCancel: () => void;
  onDone: () => void;
};

export default function PausarTicket({ ticket, onCancel, onDone }: PausarTicketProps) {
  const { tickets, logs } = useRepositories();
  const { account } = useAuth();
  const { pauseTicket, resumeTicket } = useTicketActions({ TicketsSvc: tickets! });
  const [motivo, setMotivo] = React.useState("");
  const [motivoError, setMotivoError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const estadoLower = (ticket.Estadodesolicitud ?? "").toLowerCase();
  const isCerrado = estadoLower.includes("cerrado");
  const isPausado = estadoLower.includes("pausado");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (isCerrado) {
      toast.error("No se puede pausar un ticket cerrado.");
      return;
    }

    if (!isPausado && !motivo.trim()) {
      setMotivoError("El motivo de la pausa es obligatorio.");
      toast.error("El motivo de la pausa es obligatorio.");
      return;
    }

    setSubmitting(true);
    try {
      if (isPausado) {
        const result = await resumeTicket(ticket);

        if (!result.ok) {
          toast.error(result.message ?? "No se pudo reanudar el ticket.");
          return;
        }

        await logs?.createLog({
          seguimientos_solvi_actor: account?.name ?? "",
          seguimientos_solvi_correo_actor: account?.username ?? "",
          seguimientos_solvi_descripcion: "Ticket reanudado",
          seguimientos_solvi_tipo_de_accion: "Reanudación",
          seguimientos_solvi_id_ticket: Number(ticket.ID ?? ""),
          seguimientos_solvi_action_date: new Date(),
        });

        toast.success("Ticket reanudado.");
        onDone();
        return;
      }

      const result = await pauseTicket(ticket, motivo);

      if (!result.ok) {
        toast.error(result.message ?? "No se pudo pausar el ticket.");
        return;
      }

      const logCreated = await logs?.createLog({
        seguimientos_solvi_actor: account?.name ?? "",
        seguimientos_solvi_correo_actor: account?.username ?? "",
        seguimientos_solvi_descripcion: motivo,
        seguimientos_solvi_tipo_de_accion: "Pausa",
        seguimientos_solvi_id_ticket: Number(ticket.ID ?? ""),
        seguimientos_solvi_action_date: new Date(),
      });

      if (!logCreated) {
        toast.error("No se pudo crear el registro de auditoría.");
        return;
      }

      console.log("Log de auditoría creado:", logCreated);

      toast.success("Ticket pausado.");
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? "Ocurrió un error inesperado.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-card">
      <div className="pt-head">
        <span className="pt-icon" aria-hidden="true">{isPausado ? "▶" : "⏸"}</span>
        <div>
          <h2 className="pt-title">{isPausado ? "Reanudar" : "Pausar"} ticket #{ticket.ID}</h2>
        </div>
      </div>

      <form className="pt-form" onSubmit={handleSubmit}>
        {!isPausado && (
          <div className="pt-field">
            <label className="pt-label">Motivo de la pausa</label>
            <RichTextBase64
              value={motivo}
              onChange={(html) => {
                setMotivo(html);
                setMotivoError(null);
              }}
              placeholder="Describe por qué se pausa este ticket…"
              className="pt-editor"
            />
            <span className="pt-error">{motivoError}</span>
          </div>
        )}

        <div className="pt-actions">
          <button type="button" className="btn btn-secondary-final" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary-final"
            disabled={submitting}
          >
            <span aria-hidden="true">{isPausado ? "▶" : "⏸"}</span>{" "}
            {submitting
              ? isPausado ? "Reanudando..." : "Pausando..."
              : isPausado ? "Reanudar ticket" : "Pausar ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
