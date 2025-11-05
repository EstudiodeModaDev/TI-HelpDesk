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

    const handleSubmit = async () => {
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

    const theresAdToday = async () => {
        try {
            // Ventana del día de hoy en UTC (cubre columnas date-only y DateTime)
            const t = new Date();
            const y = t.getUTCFullYear();
            const m = String(t.getUTCMonth() + 1).padStart(2, "0");
            const d = String(t.getUTCDate()).padStart(2, "0");
            const startIso = `${y}-${m}-${d}T00:00:00Z`;
            const endIso   = `${y}-${m}-${d}T23:59:59Z`;

            // Hoy ∈ [fechaInicio, fechaFinal]
            const filter = `(fields/fechaInicio le ${endIso}) and (fields/fechaFinal ge ${startIso})`;

            // 1) Intento eficiente: que el servidor ya envíe el más antiguo
            const res = await services.AnunciosSvc.getAll({
            filter,
            orderby: "fields/fechaInicio asc",
            top: 1,
            });

            let items: any[] = Array.isArray(res) ? res : (res?.items ?? []);

            // 2) Fallback: si por alguna razón no vino nada (o el orderby no se aplicó),
            // traemos varios y ordenamos en cliente.
            if (!items.length) {
            const res2 = await services.AnunciosSvc.getAll({
                filter,
                top: 50,
            });
            items = Array.isArray(res2) ? res2 : (res2?.items ?? []);

            const getStart = (row: any) => {
                const f = row?.fields ?? row ?? {};
                // si no hay fechaInicio válida, empuja al final
                const t = Date.parse(f.fechaInicio ?? "");
                return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
            };
            const getCreated = (row: any) => Date.parse((row?.Created ?? row?.fields?.Created) ?? "") || Number.POSITIVE_INFINITY;

            // Orden final: más antiguo por fechaInicio; desempate por Created
            items.sort((a, b) => {
                const da = getStart(a), db = getStart(b);
                if (da !== db) return da - db;
                return getCreated(a) - getCreated(b);
            });
            }

            const winner = items[0] ?? null;
            return { hasToday: !!winner, item: winner };
        } catch (e) {
            console.error(e);
            return { hasToday: false, item: null };
        }
    };

    return {
        state, errors, submitting, confirm,
        handleSubmit, setField, showConfirm, setConfirm, theresAdToday
    };
}





