import * as React from "react";
import { useState } from "react";
//import { FlowClient } from "./FlowClient";
import type { Anuncio, AnuncioErrors } from "../Models/Anuncio";
import type { AnunciosService } from "../Services/Anuncios.service";

type Svc = {
  AnunciosSvc: AnunciosService
}; 

export const first = (...vals: any[]) => vals.find((v) => v !== undefined && v !== null && v !== "");

export function useAnuncio(services: Svc) {
    const [state, setState] = useState<Anuncio>({Cuerpo: "", Fechadeinicio: "", Fechafinal: "", Title: "", TituloAnuncio: "",});
    const [errors, setErrors] = useState<AnuncioErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [confirm, setConfirm] = useState<boolean>(false)

    // ---- Instancia del servicio de Flow (useRef para no depender de React.*)
    //const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a21d66d127ff43d7a940369623f0b27d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0ptZLGTXbYtVNKdmIvLdYPhw1Wcqb869N3AOZUf2OH4")

  /* ============================
     Helpers de formulario
     ============================ */
    const setField = <K extends keyof Anuncio>(k: K, v: Anuncio[K]) => setState((s) => ({ ...s, [k]: v }));

    const validate = () => {
        const e: AnuncioErrors = {};
        if (!state.Cuerpo) e.Cuerpo = "Requerido";
        if (!state.Fechadeinicio) e.Fechadeinicio = "Seleccione la fecha";
        if (!state.Fechafinal) e.Fechafinal = "Seleccione la fecha";
        if (!state.TituloAnuncio) e.TituloAnuncio = "El anuncio debe tener un título";
        if (state.Fechadeinicio > state.Fechafinal) e.Fechadeinicio = "La fecha de inicio debe ser menor a la fecha de finalización";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const showConfirm = async (e: React.FormEvent) => {
        e.preventDefault()
        if(!validate()) return
        setConfirm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try{
            const Payload: Anuncio = {
                Cuerpo: state.Cuerpo,
                Fechadeinicio: state.Fechadeinicio,
                Fechafinal: state.Fechafinal,
                Title: "Anuncio",
                TituloAnuncio: state.TituloAnuncio
            }
            const created = services.AnunciosSvc.create(Payload)   
            alert("Se ha agendado el anuncio con éxito")
            console.log("Anuncio creado: ", created)
        } catch {

        } finally {
            setSubmitting(false)
        }
    }

    return {
        state, errors, submitting, confirm,
        handleSubmit, setField, showConfirm
    };
}





