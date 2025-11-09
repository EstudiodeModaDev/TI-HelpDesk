import React from "react";
import { FlowClient } from "./FlowClient";
import type { Tip, TipFlowResponse, TipUI } from "../Models/Tips";
import type { TipsService } from "../Services/Tips.service";
const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6db966918acc45a7b8a7c8ae259489b3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dsj7F5pI5MbbAdygFRWyao5lBwn2LiKIn6xFXu4dP6w")

export function useTips(TipsSvc?: TipsService) {
    const [tips, setTips] = React.useState<Tip[]>([]);
    const [tipsUI, settipsUI] = React.useState<TipUI[]>([]);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [loading, setLoading] = React.useState(false);
    const [state, setState] = React.useState<Tip>({Activa: false, Subtitulo: "", Title: "", TipoAnuncio: ""});

    const fromSp = (a: Tip): TipUI => ({title: a.Title, subtitle: a.Subtitulo ?? "",  TipoAnuncio: a.TipoAnuncio});

    function setField<K extends keyof Tip>(k: K, v: Tip[K]) {setState((s) => ({ ...s, [k]: v }));}


    function validate(): boolean {
        const e: Record<string, string> = {};
        if (!state.Subtitulo) e.Subtitulo = "Requerido.";
        if (!state.Title)   e.Title   = "Requerido.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            if(TipsSvc){
                const payload: Tip = {
                    Activa: true,
                    Subtitulo: state.Subtitulo,
                    TipoAnuncio: state.TipoAnuncio,
                    Title: state.Title
                }
                const created = await TipsSvc.create(payload);
                console.log("Tip creado ", created)
                setState({Activa: false, Subtitulo: "", TipoAnuncio: "", Title: ""})
            }
        } catch (e: any) {

        } finally {
            setLoading(false);
        }

    }, [state,]); 
  
    const obtenerTipsLogOut = async () => {
        try {
            const resp = await notifyFlow.invoke<any, any>({});
            const items = (resp as TipFlowResponse)?.announcements?.value ?? [];
            const announcements: TipUI[] = items .filter(a => a.Activa).map(fromSp);
            settipsUI(announcements)
        } catch (err) {
        console.error("Error en obtener tips:", err);
        }
    };

    const loadTips = React.useCallback(async () => {
        setLoading(true); 
        try {
            if(TipsSvc){
                const items = await TipsSvc.getAll();
                setTips(items);
            }
        } catch (e: any) {
            setTips([]);
        } finally {
            setLoading(false);
        }
    }, [TipsSvc,]);

    const onToggle = React.useCallback(async (id: string) => {
        setLoading(true); 
        try {
            if(TipsSvc){
                const func = await TipsSvc.get(id)
                await TipsSvc.update(id, {Activa: !func.Activa});
                alert("Se han ajustado los tips")
            }
        } catch (e: any) {
            setTips([]);
        } finally {
            setLoading(false);
        }
    }, [TipsSvc,]);

  return {
    tipsUI, tips, loading, errors, state, loadTips, onToggle, handleSubmit, setField, obtenerTipsLogOut
  };
}


