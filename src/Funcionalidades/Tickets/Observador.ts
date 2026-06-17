import * as React from "react";
import { useState } from "react";
import type {FormObservadorErrors } from "../../Models/nuevoTicket";
import type { FormObservadorState, Ticket } from "../../Models/Tickets";
import type { TicketsRepository } from "../../repositories/TicketsRepository/TicketRepository";
import type { LogRepository } from "../../repositories/LogRepository/LogRespository";
import type { LogDTO } from "../../Models/DTO/Log";

type Svc = {
  Logs: LogRepository;
  Tickets: TicketsRepository
};

export function useAsignarObservador(services: Svc, ticket: Ticket) {
  const { Logs, Tickets } = services;

  const [state, setState] = useState<FormObservadorState>({ observador: null });
  const [errors, setErrors] = useState<FormObservadorErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof FormObservadorState>(k: K, v: FormObservadorState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: FormObservadorErrors = {};
    if (!state.observador) e.observador = "Seleccione un usuario para asignar como observador";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleObservador = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // 1) Asignar observador
      const res =  await Tickets.updateTicket(ticket.ID ?? "", {Observador: state.observador?.label, CorreoObservador: state.observador?.email})
      console.log("[Flow] Observador asignado:", res);

      // 2) Registrar Log (si falla, que no bloquee la UI)
      const payloadLog: LogDTO = {
        seguimientos_solvi_id_ticket: Number(ticket.ID),
        seguimientos_solvi_actor: ticket.Nombreresolutor ?? "",
        seguimientos_solvi_correo_actor: ticket.Correoresolutor ?? "",
        seguimientos_solvi_descripcion: `${ticket.Nombreresolutor} ha asignado como observador del ticket con ID #${ticket.ID} a ${state.observador?.label}`,
        seguimientos_solvi_tipo_de_accion: "Asignacion observador",
        seguimientos_solvi_action_date: new Date()
      };
      try {
        const created = await Logs.createLog(payloadLog);
        console.log(created)
        if (!created) console.warn("[Logs.create] respuesta vacía/inesperada", { payloadLog });
      } catch (logErr) {
        console.error("[Logs.create] error:", logErr, { payloadLog });
      }

      setState({ observador: null });
      setErrors({});
    } catch (err) {
      console.error("Error en reasignación:", err);
      setErrors((prev) => ({ ...prev, general: (err as Error).message }));
    } finally {
      setSubmitting(false);
    }
  };

  return { state, setField, errors, submitting, handleObservador };
}
