import { usePermisosERP } from "../../../Funcionalidades/Formatos";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { TicketsService } from "../../../Services/Tickets.service";
import "./SeguridadERP.css";

export default function SolicitudERP() {
  const { Tickets: TicketsSvc} = (useGraphServices() as ReturnType<typeof useGraphServices> & {Tickets: TicketsService;})
  const {filas, sending, error, addFila, removeFila, setCampo, submit,} = usePermisosERP(TicketsSvc)

  return (
    <section className="erp-scope">
      <form className="erp-card" onSubmit={(e) => submit(e)} noValidate>
        <h2 className="erp-title">SOLICITUD ERP</h2>

        <div className="erp-table" role="table" aria-label="Solicitud de perfiles/permiso ERP">
          <div className="erp-header" role="row">
            <div className="erp-cell" role="columnheader">Nombre del perfil</div>
            <div className="erp-cell" role="columnheader">Método general</div>
            <div className="erp-cell" role="columnheader">Método específico</div>
            <div className="erp-cell" role="columnheader">Permiso específico</div>
            <div className="erp-cell" role="columnheader">Usuario (nombre)</div>
            <div className="erp-cell" role="columnheader">Usuario (correo)</div>
            <div className="erp-cell" role="columnheader">Observaciones</div>
            <div className="erp-cell erp-cell--acciones" role="columnheader"> </div>
          </div>

          {filas.map((f) => (
            <div className="erp-row" role="row" key={f.id}>
              <div className="erp-cell" role="cell">
                <input className="erp-input" value={f.nombreperfil} onChange={(e) => setCampo(f.id, "nombreperfil", e.target.value)} placeholder=""/>
              </div>

              <div className="erp-cell" role="cell">
                <input className="erp-input" value={f.metodogeneral} onChange={(e) => setCampo(f.id, "metodogeneral", e.target.value)} placeholder="" />
              </div>

              <div className="erp-cell" role="cell">
                <input className="erp-input" value={f.metodoespecifico} onChange={(e) => setCampo(f.id, "metodoespecifico", e.target.value)} placeholder=""/>
              </div>

              <div className="erp-cell" role="cell">
                <input className="erp-input" value={f.permisoespecifico} onChange={(e) => setCampo(f.id, "permisoespecifico", e.target.value)} placeholder=""/>
              </div>

              <div className="erp-cell" role="cell">
                <input className="erp-input" value={f.usuarioNombre} onChange={(e) => setCampo(f.id, "usuarioNombre", e.target.value)} placeholder="Nombre del solicitante"/>
              </div>

              <div className="erp-cell" role="cell">
                <input className="erp-input" type="email" value={f.usuarioMail} onChange={(e) => setCampo(f.id, "usuarioMail", e.target.value)} placeholder="correo@empresa.com"/>
              </div>

              <div className="erp-cell" role="cell">
                <input className="erp-input" value={f.observaciones} onChange={(e) => setCampo(f.id, "observaciones", e.target.value)} placeholder=""/>
              </div>

              <div className="erp-cell erp-cell--acciones" role="cell">
                <button type="button" className="erp-btn erp-btn--ghost" onClick={() => removeFila(f.id)} disabled={filas.length === 1} title={filas.length === 1 ? "Debe quedar al menos una fila" : "Eliminar fila"}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="erp-error">{error}</div>}

        <div className="erp-actions">
          <button type="button" className="erp-btn" onClick={() => addFila()}>Agregar fila</button>
          <button type="submit" className="erp-btn erp-btn--primary" disabled={sending}>
            {sending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </section>
  );
}
