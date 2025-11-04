import { useSolicitudesRed } from "../../../Funcionalidades/Formatos";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { PermisoRed } from "../../../Models/Formatos";
import type { TicketsService } from "../../../Services/Tickets.service";
import "./SeguridadRed.css";

const PERMISOS: PermisoRed[] = ["Lectura", "Escritura", "Lectura y escritura"];

export default function SeguridadRed() {
  const { Tickets: TicketsSvc} = (useGraphServices() as ReturnType<typeof useGraphServices> & {Tickets: TicketsService;})
  const {filas, sending, error, addFila, removeFila, setCampo, submit,} = useSolicitudesRed(TicketsSvc);

  return (
    <section className="sr-scope">
      <form className="sr-card" onSubmit={(e) => submit(e)} noValidate>
        <h2 className="sr-title">ADMINISTRADOR SEGURIDAD UNIDADES DE RED</h2>

        <div className="sr-table" role="table" aria-label="Solicitudes de acceso a unidades de red">
          <div className="sr-header" role="row">
            <div className="sr-cell" role="columnheader">Carpeta 1</div>
            <div className="sr-cell" role="columnheader">Subcarpeta 1</div>
            <div className="sr-cell" role="columnheader">Subcarpeta 2</div>
            <div className="sr-cell" role="columnheader">Personas</div>
            <div className="sr-cell" role="columnheader">Permiso</div>
            <div className="sr-cell" role="columnheader">Observaciones</div>
            <div className="sr-cell sr-cell--acciones" role="columnheader"> </div>
          </div>

          {filas.map((f) => (
            <div className="sr-row" role="row" key={f.id}>
              <div className="sr-cell" role="cell">
                <input
                  className="sr-input"
                  placeholder=""
                  value={f.carpeta1}
                  onChange={(e) => setCampo(f.id, "carpeta1", e.target.value)}
                />
              </div>

              <div className="sr-cell" role="cell">
                <input
                  className="sr-input"
                  placeholder=""
                  value={f.subcarpeta1}
                  onChange={(e) => setCampo(f.id, "subcarpeta1", e.target.value)}
                />
              </div>

              <div className="sr-cell" role="cell">
                <input
                  className="sr-input"
                  placeholder=""
                  value={f.subcarpeta2}
                  onChange={(e) => setCampo(f.id, "subcarpeta2", e.target.value)}
                />
              </div>

              <div className="sr-cell" role="cell">
                {/* Puedes reemplazar por un selector de gente/people picker más adelante */}
                <input
                  className="sr-input"
                  placeholder="Buscar elementos…"
                  value={f.personas}
                  onChange={(e) => setCampo(f.id, "personas", e.target.value)}
                />
              </div>

              <div className="sr-cell" role="cell">
                <select
                  className="sr-select"
                  value={f.permiso}
                  onChange={(e) => setCampo(f.id, "permiso", e.target.value as PermisoRed)}
                >
                  <option value="">Buscar elemento</option>
                  {PERMISOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="sr-cell" role="cell">
                <input
                  className="sr-input"
                  placeholder=""
                  value={f.observaciones}
                  onChange={(e) => setCampo(f.id, "observaciones", e.target.value)}
                />
              </div>

              <div className="sr-cell sr-cell--acciones" role="cell">
                <button
                  type="button"
                  className="sr-btn sr-btn--ghost"
                  onClick={() => removeFila(f.id)}
                  aria-label="Eliminar fila"
                  disabled={filas.length === 1}
                  title={filas.length === 1 ? "Debe quedar al menos una fila" : "Eliminar fila"}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="sr-error">{error}</div>}

        <div className="sr-actions">
          <button type="button" className="sr-btn" onClick={() => addFila()}>Agregar fila</button>
          <button type="submit" className="sr-btn sr-btn--primary" disabled={sending}>
            {sending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </section>
  );
}
