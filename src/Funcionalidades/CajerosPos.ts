import * as React from "react";
import { useState } from "react";
import type { FormErrors } from "../Models/nuevoTicket";
import type { TicketsService } from "../Services/Tickets.service";
import { toGraphDateTime } from "../utils/Date";
import type { FlowToSP, FormErrorsCajeros, FormStateCajeros } from "../Models/FlujosPA";
import { FlowClient } from "./FlowClient";
import type { Log } from "../Models/Log";
import type { LogService } from "../Services/Log.service";
import { useAuth } from "../auth/authContext";
import { norm } from "../utils/Commons";

type Svc = {
  Tickets?: TicketsService;
  Logs: LogService
};

// Helpers
export const first = (...vals: any[]) =>
  vals.find((v) => v !== undefined && v !== null && v !== "");

export function useCajerosPOS(services: Svc) {
  const { Tickets, Logs } = services; 
  const { account } = useAuth();

  const [state, setState] = useState<FormStateCajeros>({Cedula: "", CO: "", Compañia: "", CorreoTercero: account?.username!, solicitante: account?.name!, usuario: "",});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Instancia del Flow
  const flowCajerosPos = React.useMemo(
    () =>
      new FlowClient(
        "https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9e646942a74f421db298f1e50639c71f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vX4mq2EHHJKfpdpVcf9JsckTEmGjz8xN9-UrRE5AO5E"
      ),
    []
  );

  const setField = <K extends keyof FormStateCajeros>(k: K, v: FormStateCajeros[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: FormErrorsCajeros = {};
    if (!state.solicitante) e.solicitante = "Requerido";
    if (!state.CO) e.CO = "Por favor digite un CO";
    if (!state.Cedula) e.Cedula = "Por favor una cédula";
    if (!state.Compañia.trim()) e.Compañia = "Por favor seleccione una compañía";

    setErrors(e as unknown as FormErrors);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {

      // 1) Crear ticket en la lista y log
      const payloadTicket = {
        Title: `Creación de usuario POS para ${state.solicitante ?? ""}`,
        Descripcion: `Se ha creado un usuario POS para ${state.solicitante ?? ""}, se enviarán las credenciales de forma interna`,
        FechaApertura: toGraphDateTime(new Date()),
        TiempoSolucion: toGraphDateTime(new Date()),
        Fuente: "Correo",
        Categoria: "Siesa",
        SubCategoria: "POS",
        SubSubCategoria: "Creacion de usuario nuevo",
        Nombreresolutor: "Automatizaciones",
        Solicitante: state.solicitante,
        CorreoSolicitante: state.CorreoTercero,
        Estadodesolicitud: "Cerrado",
        ANS: "ANS 3",
      };

      let createdId: string | number = "";
      if (!Tickets?.create) {
        console.error("Tickets service no disponible. Verifica el GraphServicesProvider.");
      } else {
        const created = await Tickets.create(payloadTicket);
        createdId = created?.ID ?? "";
              
        const payloadLog: Log = {
          Actor: state.solicitante ?? "",
          CorreoActor: state.CorreoTercero ?? "",
          Descripcion: `Se ha creado un usuario POS para ${state.solicitante ?? ""}, se enviarán las credenciales de forma interna`,
          Tipo_de_accion: "Solucion",
          Title: createdId
        }
        
        const createdLog = Logs.create(payloadLog)
        console.log(createdLog)
      }


      // 2) Invocar Flow de Cajeros POS
      try {
        await flowCajerosPos.invoke<FlowToSP, any>({
          Cedula: state.Cedula,
          Compañia: Number(state.Compañia),
          CorreoTercero: state.CorreoTercero,
          Usuario: norm(state.solicitante) ,        
          CO: state.CO,
        });
      } catch (err) {
        console.error("[Flow] Error invocando flujo Cajeros POS:", err);
      }

      // 3) Limpiar formulario
      setState({
        Cedula: "",
        CO: "",
        Compañia: "",
        CorreoTercero: account?.username ?? "",
        solicitante: account?.name ?? "",
        usuario: "",
      });
      setErrors({});
    } finally {
      setSubmitting(false);
      alert("La creación de este usuario se hara de forma automatica. Por favor estar pendiente al correo")
    }
  };

  return {
    state,
    setField,
    errors,
    submitting,
    handleSubmit,
  };
}
