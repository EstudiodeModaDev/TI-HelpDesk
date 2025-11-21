import * as React from "react";
import { useState, } from "react";
import { FlowClient } from "./FlowClient";
import type { AusenciaService } from "../Services/Ausencia.service";
import type { ausencia, AusenciaErrors } from "../Models/Ausencia";


type Svc = {Ausencias?: AusenciaService;}; 

export function useNuevoTicketForm(services: Svc) {

    const { Ausencias } = services;
    const [state, setState] = useState<ausencia>({
        Descripcion: "",
        Fechadeinicio: "",
        Fechayhora: "",
        Title: ""
    });
    const [errors, setErrors] = useState<AusenciaErrors>({});
    const [submitting, setSubmitting] = useState(false);

    // ---- Instancia del servicio de Flow (useRef para no depender de React.*)
    const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a21d66d127ff43d7a940369623f0b27d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0ptZLGTXbYtVNKdmIvLdYPhw1Wcqb869N3AOZUf2OH4")

    /* ============================
        Helpers de formulario
        ============================ */
    const setField = <K extends keyof ausencia>(k: K, v: ausencia[K]) => setState((s) => ({ ...s, [k]: v }));

    const validate = () => {
        const e: AusenciaErrors = {};
        if (!state.Title) e.Title = "Requerido";
        if (!state.Fechadeinicio) e.Fechadeinicio = "Seleccione la fecha";
        if (!state.Fechayhora) e.Fechayhora = "Seleccione la fecha";
        if (!state.Descripcion) e.Descripcion = "Seleccione una descripción";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload: ausencia = {
                Descripcion: state.Descripcion,
                Fechadeinicio: state.Fechadeinicio, 
                Fechayhora: state.Fechayhora,
                Title: state.Title,
            }
            Ausencias?.create(payload)
            alert("Se ha solicitado la aprobación de su ausencia, se le notificara la decisión")
        } catch{

        } finally {
            setSubmitting(false)
        }
        };

  return {
    state, errors, submitting, handleSubmit, setField
  };
}



