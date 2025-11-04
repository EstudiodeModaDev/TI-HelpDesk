// src/components/Formatos/ServiciosTI/ServiciosTI.tsx
import { useSolicitudServicios } from "../../../Funcionalidades/Formatos";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { Servicios } from "../../../Models/Formatos";
import type { TicketsService } from "../../../Services/Tickets.service";
import "./ServiciosTI.css";

const SERVICIOS_CATALOG: Array<{ key: keyof Servicios; label: string }> = [
  { key: "correo",          label: "Correo" },
  { key: "office",          label: "Office" },
  { key: "erp",             label: "ERP" },
  { key: "pedidos",         label: "Sistema de Pedidos" },
  { key: "adminpos",        label: "Admin POS" },
  { key: "posprincipal",    label: "POS Principal" },
  { key: "impresoras",      label: "Impresoras" },
  { key: "generictransfer", label: "Generic Transfer" },
];

const ciudades = ["Medellín", "Bogotá", "Cali", "Barranquilla", "Otra"]

export default function SolicitudUsuarioForm() {
  const { Tickets: TicketsSvc} = (useGraphServices() as ReturnType<typeof useGraphServices> & {Tickets: TicketsService;})
  const {state, errors,sending, handleSubmit, setField} = useSolicitudServicios(TicketsSvc);

  return (
    <section className="su-scope su-card" role="region" aria-labelledby="su_titulo">
      <form className="su-form" onSubmit={(e) => handleSubmit(e)} noValidate>

        {/* ===== Columna izquierda ===== */}
        <div className="su-left">
          <h2 className="su-title">Información del usuario</h2>
          <div className="su-field">
            <label>* Contratación:</label>
            <select value={state.contratacion} onChange={(e) => setField("contratacion", e.target.value)}>
              <option value="">Seleccione...</option>
              <option value="Directo">Reemplazo</option>
              <option value="Cargo nuevo">Cargo nuevo</option>
              <option value="Temporal">Temporal</option>
            </select>
            {errors.contratacion && <div className="su-error">{errors.contratacion}</div>}
          </div>

          <div className="su-field">
            <label>* Nombre del usuario:</label>
            <input type="text" value={state.nombre} onChange={(e) => setField("nombre", e.target.value)}/>
            {errors.nombre && <div className="su-error">{errors.nombre}</div>}
          </div>

          <div className="su-field">
            <label>* Apellido del usuario:</label>
            <input type="text" value={state.apellidos} onChange={(e) => setField("apellidos", e.target.value)}/>
            {errors.apellidos && <div className="su-error">{errors.apellidos}</div>}
          </div>

          <div className="su-field">
            <label>* No. Cédula del usuario:</label>
            <input type="text" inputMode="numeric" value={state.cedula} onChange={(e) => setField("cedula", e.target.value)}/>
            {errors.cedula && <div className="su-error">{errors.cedula}</div>}
          </div>

          <div className="su-field">
            <label>No. de contacto del usuario:</label>
            <input type="text" inputMode="tel" value={state.contacto} onChange={(e) => setField("contacto", e.target.value)} placeholder="Celular/Teléfono"/>
            {errors.contacto && <div className="su-error">{errors.contacto}</div>}
          </div>

          <div className="su-field">
            <label>* Cargo del usuario:</label>
            <input type="text" value={state.cargo} onChange={(e) => setField("cargo", e.target.value)}/>
            {errors.cargo && <div className="su-error">{errors.cargo}</div>}
          </div>

          <div className="su-field">
            <label>* Dirección del usuario:</label>
            <input type="text" value={state.direccion} onChange={(e) => setField("direccion", e.target.value)}/>
            {errors.direccion && <div className="su-error">{errors.direccion}</div>}
          </div>

          <div className="su-field">
            <label>* Gerencia del usuario:</label>
            <input type="text" value={state.gerencia} onChange={(e) => setField("gerencia", e.target.value)}/>
            {errors.gerencia && <div className="su-error">{errors.gerencia}</div>}
          </div>

          <div className="su-field">
            <label>* Jefatura del usuario:</label>
            <input type="text" value={state.jefatura} onChange={(e) => setField("jefatura", e.target.value)}/>
            {errors.jefatura && <div className="su-error">{errors.jefatura}</div>}
          </div>

          <div className="su-field">
            <label>* Centro de costos del usuario:</label>
            <input type="text" inputMode="numeric" value={state.centroCostos} onChange={(e) => setField("centroCostos", e.target.value)}/>
            {errors.centroCostos && <div className="su-error">{errors.centroCostos}</div>}
          </div>

          <div className="su-field">
            <label>* Centro operativo del usuario:</label>
            <input type="text" inputMode="numeric" value={state.centroOperativo} onChange={(e) => setField("centroOperativo", e.target.value)}/>
            {errors.centroOperativo && <div className="su-error">{errors.centroOperativo}</div>}
          </div>
        </div>

        {/* ===== Columna derecha ===== */}
        <div className="su-right">
          <div className="su-field">
            <label>* Ciudad del usuario:</label>
            <select value={state.ciudad} onChange={(e) => setField("ciudad", e.target.value)}>
              <option value="">Seleccione…</option>
              {ciudades.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.ciudad && <div className="su-error">{errors.ciudad}</div>}
          </div>

          <div className="su-field">
            <label>* Fecha de ingreso:</label>
            <input type="date" value={state.fechaIngreso} onChange={(e) => setField("fechaIngreso", e.target.value)}/> 
            {errors.fechaIngreso && <div className="su-error">{errors.fechaIngreso}</div>}
          </div>

          <h3 className="su-subtitle">Servicios y programas</h3>

          <div className="su-field su-field--tipo-equipo">
            <label>* Tipo de equipo:</label>
            <select value={state.tipoEquipo} onChange={(e) => setField("tipoEquipo", e.target.value)} required>
              <option value="">Seleccione…</option>
              <option value="Escritorio">Escritorio</option>
              <option value="Portátil">Portátil</option>
              <option value="MAC">MAC</option>
              <option value="N/A">N/A</option>
            </select>
            {errors.tipoEquipo && <div className="su-error">{errors.tipoEquipo}</div>}
          </div>

          <div className="su-checks">
            {SERVICIOS_CATALOG.map(({ key, label }) => (
              <label key={key} className="su-check">
                <input type="checkbox" checked={!!state.servicios[key]} onChange={(e) => setField("servicios", {...state.servicios, [key]: e.target.checked,})}/>
                <span>{label}</span>
                {errors.servicios && <div className="su-error">{errors.servicios}</div>}
              </label>
            ))}
          </div>

          <div className="su-field su-field--extension">
            <label>* Extensión telefónica:</label>
            <select value={state.extensionTelefonica} onChange={(e) => setField("extensionTelefonica", e.target.value)}>
              <option value="No aplica">No aplica</option>
              <option value="Extensión fija">Extensión fija</option>
              <option value="Extensión IP">Extensión IP</option>
              <option value="Solicitud nueva">Solicitud nueva</option>
              <option value="Traslado">Traslado</option>
            </select>
            {errors.extensionTelefonica && <div className="su-error">{errors.extensionTelefonica}</div>}
          </div>

          <div className="su-field su-field--obs">
            <label>Observaciones:</label>
            <textarea rows={6} value={state.observaciones} onChange={(e) => setField("observaciones", e.target.value)} placeholder="Detalles adicionales…"/>
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className="su-actions">
          <button className="su-btn su-btn--primary" type="submit" disabled={false}>
            {sending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </section>
  );
}
