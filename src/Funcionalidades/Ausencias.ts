import * as React from "react";
import { useState, } from "react";
import type { AusenciaService } from "../Services/Ausencia.service";
import type { ausencia, AusenciaErrors } from "../Models/Ausencia";
import { useAuth } from "../auth/authContext";


type Svc = {Ausencias: AusenciaService;}; 

export function useAusencias(services: Svc) {

    const { Ausencias } = services;
    const {account} = useAuth()
    const todayISO = new Date().toISOString();
    const [state, setState] = useState<ausencia>({
        Descripcion: "",
        Fechadeinicio: todayISO,
        Fechayhora: todayISO,
        Title: account?.username ?? "",
        NombreSolicitante: account?.name ?? ""
    });
    const [errors, setErrors] = useState<AusenciaErrors>({});
    const [submitting, setSubmitting] = useState(false);

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
        if(state.Fechadeinicio > state.Fechayhora) {
                                                    e.Fechadeinicio = "La fecha de inicio debe ser menor a la fecha final"; 
                                                    e.Fechayhora= "La fecha de inicio debe ser menor a la fecha final"
                                                }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {return};

        setSubmitting(true);
        try {
            const payload: ausencia = {
                Descripcion: state.Descripcion,
                Fechadeinicio: state.Fechadeinicio, 
                Fechayhora: state.Fechayhora,
                Title: state.Title,
                NombreSolicitante: state.NombreSolicitante
            }
            const ausenciaCreada = await Ausencias.create(payload)
            alert("Se ha solicitado la aprobación de su ausencia, se le notificara la decisión con ID " + ausenciaCreada.Id)
        } catch (error){
                console.error("Error creando la ausencia", error);
                alert("Ocurrió un error solicitando la ausencia. Intenta de nuevo.");
            
        } finally {
            setSubmitting(false)
        }
    };

  return {
    state, errors, submitting, handleSubmit, setField
  };
}



