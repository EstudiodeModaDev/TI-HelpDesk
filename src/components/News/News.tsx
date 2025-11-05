import * as React from "react";
import "./News.css";
import { useGraphServices } from "../../graph/GrapServicesContext";
import type { LogService } from "../../Services/Log.service";
import RichTextBase64 from "../RichTextBase64/RichTextBase64";

type AnuncioState = {
  titulo: string;
  cuerpo: string;
  fechaInicio: string; // yyyy-MM-dd
  fechaFin: string;    // yyyy-MM-dd
};

export default function CrearAnuncio() {
  // si necesitas servicios:
  const { Logs } = useGraphServices() as { Logs?: LogService };

  const [state, setState] = React.useState<AnuncioState>({
    titulo: "",
    cuerpo: "",
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaFin: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const setField = <K extends keyof AnuncioState>(k: K, v: AnuncioState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!state.titulo.trim()) e.titulo = "Ingresa un título.";
    if (!state.cuerpo.trim()) e.cuerpo = "Escribe el cuerpo del anuncio.";
    if (!state.fechaInicio) e.fechaInicio = "Selecciona la fecha de inicio.";
    if (state.fechaFin && state.fechaFin < state.fechaInicio)
      e.fechaFin = "La fecha final no puede ser menor que la inicial.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // —— guarda en tu backend/SharePoint/Graph ——
      // await algo(state);
      Logs?.create?.({ Level: "Info", Message: "Anuncio creado", Extra: JSON.stringify(state) } as any);
      alert("Anuncio agendado ✅");
      setState((s) => ({ ...s, titulo: "", cuerpo: "", fechaFin: "" }));
    } catch (e) {
      alert("No fue posible crear el anuncio");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Cambia data-theme a "dark" si lo quieres oscuro en este scope
    <section className="an-page an-scope" data-theme="light" aria-label="Crear un Anuncio">
      <form className="an-form" onSubmit={onSubmit} noValidate>
        <h1 className="an-title">Crear un Anuncio</h1>

        {/* Título */}
        <div className="an-field">
          <label htmlFor="titulo" className="an-label">Título del anuncio</label>
          <input id="titulo" className="an-input" placeholder="Ingresa el título del anuncio" value={state.titulo} onChange={(e) => setField("titulo", e.target.value)}/>
          {errors.titulo && <small className="an-error">{errors.titulo}</small>}
        </div>

        {/* Cuerpo (editor) */}
        <div className="an-field">
          <label className="an-label">Cuerpo</label>
          <div className={`an-editorWrapper ${errors.cuerpo ? "is-invalid" : ""}`}>
            <RichTextBase64 value={state.cuerpo} onChange={(html) => setField("cuerpo", html)} placeholder="Escribe tu anuncio..."/>
          </div>
          {errors.cuerpo && <small className="an-error">{errors.cuerpo}</small>}
        </div>

        {/* Fechas */}
        <div className="an-row an-row--2">
          <div className="an-field">
            <label htmlFor="inicio" className="an-label">Fecha de inicio</label>
            <input id="inicio" type="date" className="an-input" value={state.fechaInicio} onChange={(e) => setField("fechaInicio", e.target.value)}/>
            {errors.fechaInicio && <small className="an-error">{errors.fechaInicio}</small>}
          </div>

          <div className="an-field">
            <label htmlFor="fin" className="an-label">Fecha final</label>
            <input id="fin" type="date" className="an-input" value={state.fechaFin} onChange={(e) => setField("fechaFin", e.target.value)}/>
            {errors.fechaFin && <small className="an-error">{errors.fechaFin}</small>}
          </div>
        </div>

        {/* Acciones */}
        <footer className="an-actions">
          <button type="submit" className="an-primary" disabled={submitting}>
            {submitting ? "Agendando…" : "Agendar Anuncio"}
          </button>
        </footer>
      </form>
    </section>
  );
}
