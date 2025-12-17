import * as React from "react";
import { useState } from "react";
import type {FormObservadorErrors } from "../Models/nuevoTicket";
import type { FormObservadorState, Ticket } from "../Models/Tickets";
import type { LogService } from "../Services/Log.service";
import type { Log } from "../Models/Log";
import type { TicketsService } from "../Services/Tickets.service";

type Svc = {
  Logs: LogService;
  Tickets: TicketsService
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
      const res =  await Tickets.update(ticket.ID ?? "", {Observador: state.observador?.label, CorreoObservador: state.observador?.email})
      console.log("[Flow] Observador asignado:", res);

      // 2) Registrar Log (si falla, que no bloquee la UI)
      const payloadLog: Log = {
        Title: ticket.ID ?? "",
        Actor: ticket.Nombreresolutor ?? "",
        CorreoActor: ticket.Correoresolutor ?? "",
        Descripcion: `${ticket.Nombreresolutor} ha asignado como observador del ticket con ID #${ticket.ID} a ${state.observador?.label}`,
        Tipo_de_accion: "Asignacion observador",
      };
      try {
        const created = await Logs.create(payloadLog);
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
