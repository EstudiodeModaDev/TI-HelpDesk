import type { UserOption } from "../../Models/Commons";
import { useGraphServices } from "../../graph/GrapServicesContext";
import {  useNuevoUsuarioTicketForm } from "../../Funcionalidades/Tickets/NuevoTicket";
import RichTextBase64 from "../RichTextBase64/RichTextBase64";
import "../NuevoTicket/NuevoTicketForm.css"
import { useRepositories } from "../../repositories/repositoriesContext";

export type UserOptionEx = UserOption & { source?: "Empleado" | "Franquicia" };

export default function NuevoTicketUsuarioForm() {
  const {Categorias, SubCategorias, Articulos, Usuarios: UsuariosSPServiceSvc} = useGraphServices()
  const {tickets, logs} = useRepositories()

  const {state, errors, submitting, setField, handleSubmit,} = useNuevoUsuarioTicketForm({ Categorias, SubCategorias, Articulos, Tickets: tickets!, Usuarios: UsuariosSPServiceSvc, Logs: logs!});

  return (
    <div className="ticket-form">
      <h2 className="tf-title">Nuevo Ticket</h2>

      <form noValidate className="tf-grid">

        {/* Motivo */}
        <div className="tf-field tf-col-2 tf-narrow">
          <label className="tf-label" id="asunto" htmlFor="motivo">Asunto:</label>
          <input id="motivo" type="text" placeholder="Ingrese el asunto (Maximo 45 caracteres)" value={state.motivo} onChange={(e) => setField("motivo", e.target.value)} disabled={submitting} className="tf-input" maxLength={40}/>
          {errors.motivo && <small className="error">{errors.motivo}</small>}
        </div>

        {/* Descripción */}
        <div className="tf-field tf-col-2">
          <label className="tf-label">Descripción:</label>
          <div className="rtb-box">
            <RichTextBase64 value={state.descripcion} onChange={(html) => setField("descripcion", html)} placeholder="Describe el problema y pega capturas (Ctrl+V)..."/>
          </div>
          {errors.descripcion && <small className="error">{errors.descripcion}</small>}
        </div>

        {/* Archivo */}
        <div className="tf-field tf-col-2">
          <label className="tf-label" htmlFor="archivo">Adjuntar archivo</label>
          <input id="archivo" type="file" multiple onChange={(e) =>  setField("archivo", Array.from(e.target.files ?? []))} disabled={submitting} className="tf-input"/>

          {Array.isArray(state.archivo) && state.archivo.length > 0 && (
            <ul className="tf-files">
              {state.archivo.map((f: File, i: number) => (
                <li key={i}>
                  {f.name} ({Math.round(f.size / 1024)} KB)
                </li>
              ))}
            </ul>)}
        </div>
      </form>
      <br />
      <div className="tf-actions tf-col-2">
        <button type="submit" disabled={submitting} className="btn-primary" onClick={(e) => {e.preventDefault(); handleSubmit()}}>
          {submitting ? "Enviando..." : "Enviar Ticket"}
        </button>
      </div>
    </div>
  );
}
