import * as React from "react";
import { useState } from "react";
import type { TicketsService } from "../Services/Tickets.service";
import type { LogService } from "../Services/Log.service";
import type { Ticket } from "../Models/Tickets";
import type { Log } from "../Models/Log";
import type { AccountInfo } from "@azure/msal-browser";
import { FlowClient } from "./FlowClient";
import type { FlowToUser } from "../Models/FlujosPA";
import type { ComprasService } from "../Services/Compras.service";
import { norm } from "../utils/Commons";

type Svc = { Tickets?: TicketsService; Logs: LogService; ComprasSvc: ComprasService };

export type FormDocumentarState = {
  resolutor: string;
  correoresolutor: string;
  documentacion: string;
  archivo: File | null;
};

export type FormDocErrors = Partial<Record<keyof FormDocumentarState, string>>;

export function useDocumentarTicket(services: Svc) {
  const { Tickets, Logs, ComprasSvc } = services;
  const [state, setState] = useState<FormDocumentarState>({
    resolutor: "",
    correoresolutor: "",
    documentacion: "",
    archivo: null,
  });
  const [errors, setErrors] = useState<FormDocErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof FormDocumentarState>(k: K, v: FormDocumentarState[K]) => setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: FormDocErrors = {};
    const texto = (state.documentacion ?? "").trim();
    if (!texto) e.documentacion = "Por favor escriba la documentación.";
    else if (texto.length < 50) e.documentacion = "Mínimo 50 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a21d66d127ff43d7a940369623f0b27d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0ptZLGTXbYtVNKdmIvLdYPhw1Wcqb869N3AOZUf2OH4")

  const handleSubmit = async (e: React.FormEvent, tipo: "solucion" | "seguimiento", ticket: Ticket, account: AccountInfo) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const soluciones = await Logs.getAll({filter: `fields/Title eq ${ticket.ID} and fields/Tipo_de_accion eq 'Solucion'`})
      if(soluciones.length > 0 && tipo === "solucion"){
        alert("Este ticket ya tiene una solucion no puedes escribir mas de una por ticket")
      } else {
        const logPayload: Log = {
          Actor: account.name ?? account.username ?? "",
          CorreoActor: account.username ?? "",
          Descripcion: state.documentacion,
          Tipo_de_accion: tipo,
          Title: String(ticket.ID ?? ""),
        };

        await Logs.create(logPayload);
        // (Opcional) subir archivo si aplica
        // if (state.archivo) { await Logs.attach(logId, state.archivo) }
        setState({archivo: null, correoresolutor: "", documentacion: "", resolutor: ""})
        setSubmitting(false);
      

      // 2) Si es solución, cerrar ticket con estado correcto
      if (tipo === "solucion") {
        if (!Tickets) throw new Error("Servicio Tickets no disponible.");
          const estadoActual = norm(ticket.Estadodesolicitud ?? "");
          const nuevoEstado = estadoActual === "en atencion" ? "Cerrado" : "Cerrado fuera de tiempo";
          alert("Caso cerrado. Enviando notificación al solicitante")
          await Tickets.update(ticket.ID!, { Estadodesolicitud: nuevoEstado });
          const casodecompra = await ComprasSvc.getAll({filter:  `fields/IdCreado eq '${ticket.ID}'`})
          const casodeentrega = await ComprasSvc.getAll({filter:  `fields/IdEntrega eq '${ticket.ID}'`})
          await Promise.allSettled( casodecompra.items.map((it) => { const id = String(it.Id);    return ComprasSvc.update(id, { Estado: "Pendiente por registro de factura" });}));
          await Promise.allSettled( casodeentrega.items.map((it) => { const id = String(it.Id);    return ComprasSvc.update(id, { Estado: "Pendiente por registro de factura" });}));

          if (ticket.CorreoSolicitante) {
            const title = `Cierre de Ticket - ${ticket.ID}`;
            const message = `
              <p>Este es un mensaje automático.<br>
              <br>
              Estimado/a ${ticket.Solicitante},<br>
              <br>
              Nos complace informarle que su caso con <em><strong>"</strong></em><em><strong>${ticket.Title}</strong></em><em><strong>"</strong></em> ID: ${ticket.ID} ha sido cerrado. Esperamos que su problema haya sido resuelto satisfactoriamente.<br>
              <br>
              Gracias por su colaboración y confianza.</p>
              </p>`.trim();

            try {
              console.log("Enviando notificación")
              await notifyFlow.invoke<FlowToUser, any>({
                recipient: ticket.CorreoSolicitante,
                title,
                message,
                mail: true, 
              });
            } catch (err) {
              console.error("[Flow] Error enviando a solicitante:", err);
            }
        }
      }
    }
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      // setError(String(err));
    } finally {
      
    }
  };

  return { state, setField, errors, submitting, handleSubmit };
}
