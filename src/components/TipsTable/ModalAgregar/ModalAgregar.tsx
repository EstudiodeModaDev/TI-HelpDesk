import * as React from "react";
import "./ModalAgregar.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import { useTips } from "../../../Funcionalidades/Anuncementes";

export type AnnouncementForm = {
  titulo: string;
  subtitulo?: string;
  tipo?: string;
};

export type AnnouncementModalProps = {
  open: boolean;
  onCancel: () => void;
  tipos?: string[]; // opciones para el select de tipo
};

export default function AnnouncementModal({ open, onCancel, tipos = ["Seguridad", "Lanzamiento", "Tip"], }: AnnouncementModalProps){
    const { TipsInicio, } = useGraphServices();
    const { setField, state, handleSubmit, loading, errors} = useTips(TipsInicio);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="amodal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="amodal" role="dialog" aria-modal="true">
        <header className="amodal__header">
          <h3 className="amodal__title">Anuncio</h3>
          <button className="amodal__x" aria-label="Cerrar" onClick={onCancel}>✕</button>
        </header>

        <form className="amodal__form" onSubmit={(e)=> handleSubmit(e)}>
          <label className="afield">
            <span className="afield__label">Título</span>
            <input name="titulo" className="afield__control" value={state.Title} onChange={(e)=> setField("Title", e.target.value)} required maxLength={100}/>
            {errors.Title && <small className="error">{errors.Title}</small>}
          </label>

          <label className="afield">
            <span className="afield__label">Subtítulo</span> 
            <input name="subtitulo" className="afield__control" value={state.Subtitulo} onChange={(e)=> setField("Subtitulo", e.target.value)} required maxLength={100}/>
            {errors.Subtitulo && <small className="error">{errors.Subtitulo}</small>}
          </label>

          <label className="afield">
            <span className="afield__label">Tipo</span>
            <select name="tipo" className="afield__control" value={state.TipoAnuncio} onChange={(e)=> setField("TipoAnuncio", e.target.value)} required>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.TipoAnuncio && <small className="error">{errors.TipoAnuncio}</small>}
          </label>

          <footer className="amodal__footer">
            <button type="button" className="abtn abtn--ghost" onClick={onCancel} disabled={loading}>Cancelar</button>
            <button type="submit" className="abtn abtn--primary" disabled={loading}>
              {loading ? "Enviando…" : "Enviar"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
