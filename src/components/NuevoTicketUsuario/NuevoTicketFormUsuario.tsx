import "./NuevoTicketForm.css";
import type { FranquiciasService } from "../../Services/Franquicias.service";
import type { UserOption } from "../../Models/Commons";
import { useGraphServices } from "../../graph/GrapServicesContext";
import {  useNuevoUsuarioTicketForm } from "../../Funcionalidades/NuevoTicket";
import { UsuariosSPService } from "../../Services/Usuarios.Service";
import type { TicketsService } from "../../Services/Tickets.service";
import RichTextBase64 from "../RichTextBase64/RichTextBase64";
import type { LogService } from "../../Services/Log.service";

export type UserOptionEx = UserOption & { source?: "Empleado" | "Franquicia" };

export default function NuevoTicketUsuarioForm() {
  const {Categorias, SubCategorias, Articulos, Usuarios: UsuariosSPServiceSvc, Tickets: TicketsSvc, Logs: LogsSvc} = useGraphServices() as ReturnType<typeof useGraphServices> & {
    Franquicias: FranquiciasService;
    Usuarios: UsuariosSPService;
    Tickets: TicketsService;
    Logs: LogService
  };

  const {state, errors, submitting, setField, handleSubmit,} = useNuevoUsuarioTicketForm({ Categorias, SubCategorias, Articulos, Tickets: TicketsSvc, Usuarios: UsuariosSPServiceSvc, Logs: LogsSvc});

  return (
    <div className="ticket-form" data-force-light>
      <h2 className="tf-title">Nuevo Ticket</h2>

      <form onSubmit={(e) => {e.preventDefault(); handleSubmit()}} noValidate className="tf-grid">

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
              {state.archivo.map((f, i) => (
                <li key={i}>
                  {f.name} ({Math.round(f.size / 1024)} KB)
                </li>
              ))}
            </ul>)}
        </div>

        {/* Submit */}
        <div className="tf-actions tf-col-2">
          <button type="submit" disabled={submitting} className="tf-submit">
            {submitting ? "Enviando..." : "Enviar Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
