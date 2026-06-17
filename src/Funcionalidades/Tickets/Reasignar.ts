import * as React from "react";
import { useState } from "react";
import type { FormErrors, FormReasignarErrors } from "../../Models/nuevoTicket";
import type { FormReasignarState, Ticket } from "../../Models/Tickets";
import type { UsuariosSPService } from "../../Services/Usuarios.Service";
import type { GetAllOpts, Reasignar } from "../../Models/Commons";
import { FlowClient } from "../shared/FlowClient";
import type { FlowToReasign } from "../../Models/FlujosPA";
import type { TicketsRepository } from "../../repositories/TicketsRepository/TicketRepository";
import type { LogDTO } from "../../Models/DTO/Log";
import type { LogRepository } from "../../repositories/LogRepository/LogRespository";

type Svc = {
  Tickets?: TicketsRepository;
  Usuarios: UsuariosSPService;
  Logs: LogRepository;
};

const escapeOData = (s: string) => String(s ?? "").replace(/'/g, "''");

export function useReasignarTicket(services: Svc, ticket: Ticket) {
  const { Usuarios, Logs } = services;

  const [state, setState] = useState<FormReasignarState>({ resolutor: null, Nota: "" });
  const [errors, setErrors] = useState<FormReasignarErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof FormReasignarState>(k: K, v: FormReasignarState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: FormErrors = {};
    if (!state.resolutor) e.resolutor = "Seleccione un resolutor para reasignar";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d17c9915a48f4b0d8e8a1fa90f007ba8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=5uBiLoVQS7tiJ0i5xL13qMlBmzDSoee9kmAqcHTPIh0")

  const handleReasignar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const candidatoMail = state.resolutor?.email?.trim();
      const solicitanteMail = ticket?.Correoresolutor;

      if (!candidatoMail) throw new Error("No se proporcionó correo del candidato (resolutor).");
      if (!solicitanteMail) throw new Error("No se encontró correo del resolutor previo en el ticket.");

      // Filtros OData
      const filterCandidato: GetAllOpts = {
        filter: `fields/Correo eq '${escapeOData(candidatoMail)}'`,
        top: 1,
      };
      const filterSolicitante: GetAllOpts = {
        filter: `fields/Correo eq '${escapeOData(solicitanteMail)}'`,
        top: 1,
      };

      const [candidatos, solicitantes] = await Promise.all([
        Usuarios.getAll(filterCandidato),
        Usuarios.getAll(filterSolicitante),
      ]);
      
      const candidato = candidatos?.[0];
      const solicitante = solicitantes?.[0];

      if (!candidato?.Id) throw new Error(`No se encontró candidato con correo ${candidatoMail}`);
      if (!solicitante?.Id) throw new Error(`No se encontró solicitante con correo ${solicitanteMail}`);

      const payloadFlow: Reasignar = {
        IDCandidato: Number(candidato.Id),
        IDSolicitante: Number(solicitante.Id),
        IDCaso: Number(ticket.ID),
        Nota: state.Nota ?? "",
      };

      // 1) Enviar la reasignación por Flow
      const resp =  await notifyFlow.invoke<FlowToReasign, any>({
                    IDCandidato: payloadFlow.IDCandidato,
                    IDCaso: payloadFlow.IDCaso,
                    IDSolicitante: payloadFlow.IDSolicitante,
                    Nota: payloadFlow.Nota, 
                  });
      console.log("[Flow] Reasignación enviada:", resp);

      // 2) Registrar Log (si falla, que no bloquee la UI)
      const payloadLog: LogDTO = {
        seguimientos_solvi_id_ticket: Number(ticket.ID),
        seguimientos_solvi_actor: solicitante.Title,
        seguimientos_solvi_correo_actor: solicitante.Correo ?? solicitanteMail,
        seguimientos_solvi_descripcion: `${solicitante.Title} ha reasignado el caso ID ${ticket.ID} a ${candidato.Title}`,
        seguimientos_solvi_tipo_de_accion: "Reasignación de caso",
        seguimientos_solvi_action_date: new Date()
      };
      try {
        const created = await Logs.createLog(payloadLog);
        console.log(created)
        if (!created) console.warn("[Logs.create] respuesta vacía/inesperada", { payloadLog });
      } catch (logErr) {
        console.error("[Logs.create] error:", logErr, { payloadLog });
      }

      setState({ resolutor: null, Nota: "" });
      setErrors({});
    } catch (err) {
      console.error("Error en reasignación:", err);
      setErrors((prev) => ({ ...prev, general: (err as Error).message }));
    } finally {
      setSubmitting(false);
    }
  };

  return { state, setField, errors, submitting, handleReasignar };
}
