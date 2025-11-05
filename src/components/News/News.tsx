import "./News.css";
import { useGraphServices } from "../../graph/GrapServicesContext";
import RichTextBase64 from "../RichTextBase64/RichTextBase64";
import type { AnunciosService } from "../../Services/Anuncios.service";
import { useAnuncio } from "../../Funcionalidades/News";
import EdmNewsModal from "./Confirmar/Confirmar";

export default function CrearAnuncio() {
  const { Anuncios } = useGraphServices() as { Anuncios: AnunciosService };
  const { state, errors, confirm, showConfirm, setField, submitting, handleSubmit, setConfirm} = useAnuncio({AnunciosSvc: Anuncios})

  return (
    <section className="an-page an-scope" data-theme="light" aria-label="Crear un Anuncio">
      <form className="an-form" onSubmit={(e) => showConfirm(e)}>
        <h1 className="an-title">Crear un Anuncio</h1>

        {/* Título */}
        <div className="an-field">
          <label htmlFor="titulo" className="an-label">Título del anuncio</label>
          <input id="titulo" className="an-input" placeholder="Ingresa el título del anuncio" value={state.TituloAnuncio} onChange={(e) => setField("TituloAnuncio", e.target.value)}/>
          {errors.TituloAnuncio && <small className="an-error">{errors.TituloAnuncio}</small>}
        </div>

        {/* Cuerpo (editor) */}
        <div className="an-field">
          <label className="an-label">Cuerpo</label>
          <div className={`an-editorWrapper ${errors.Cuerpo ? "is-invalid" : ""}`}>
            <RichTextBase64 value={state.Cuerpo} onChange={(html) => setField("Cuerpo", html)} placeholder="Escribe tu anuncio..."/>
          </div>
          {errors.Cuerpo && <small className="an-error">{errors.Cuerpo}</small>}
        </div>

        {/* Fechas */}
        <div className="an-row an-row--2">
          <div className="an-field">
            <label htmlFor="inicio" className="an-label">Fecha de inicio</label>
            <input id="inicio" type="date" className="an-input" value={state.Fechadeinicio} onChange={(e) => setField("Fechadeinicio", e.target.value)}/>
            {errors.Fechadeinicio && <small className="an-error">{errors.Fechadeinicio}</small>}
          </div>

          <div className="an-field">
            <label htmlFor="fin" className="an-label">Fecha final</label>
            <input id="fin" type="date" className="an-input" value={state.Fechafinal} onChange={(e) => setField("Fechafinal", e.target.value)}/>
            {errors.Fechafinal && <small className="an-error">{errors.Fechafinal}</small>}
          </div>
        </div>

        {/* Acciones */}
        <footer className="an-actions">
          <button type="submit" className="an-primary" disabled={submitting}>
            {submitting ? "Agendando…" : "Agendar Anuncio"}
          </button>
        </footer>
      </form>

      {confirm && <EdmNewsModal title={state.TituloAnuncio} html={state.Cuerpo} open={confirm} onConfirm={handleSubmit} onCancel={()  => setConfirm(false)} />}
    </section>
  );
}
