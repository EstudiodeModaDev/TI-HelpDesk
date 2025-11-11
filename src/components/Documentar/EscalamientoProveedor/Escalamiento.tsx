// EscalamientoInternet.tsx
import * as React from "react";
import "./EscalamientoInternet.css";
import type { Ticket } from "../../../Models/Tickets";
import { useEscalamiento } from "../../../Funcionalidades/Escalamiento";

type Props = {
  ticket?: Ticket;
};

const DESCRIPCIONES = ["Equipo de fibra no enciende", "Intermitencia del servicio (perdida de paquetes)", "Mikrotik no enciende", "Problemas con puertos LAN", "Sin servicio (led LOS apagado)", "Sin servicio desde la entrega (garantía)", "Caída total del servicio (Sin navegación)", "Sin servicio (led LOS encendido directo en color rojo)", "Cambio de contraseña red inalámbrica", "Red inalámbrica sin servicio"]

export default function EscalamientoInternet({ticket,}: Props) {
  // ===== UI state
    const [search, setSearch] = React.useState("");
    const {loading, error, state, onSearch, setField, handleFiles, handleSubmit, errors} = useEscalamiento(ticket?.CorreoSolicitante ?? "", ticket?.ID ?? "");
    const onSubmit = React.useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      await handleSubmit();
    },
    [handleSubmit]
  );

  return (
    <div className="esc-form">

      {loading && <p style={{ opacity: 0.7, marginBottom: 8 }}>Cargando datos…</p>}
      {error && <p style={{ color: "#b91c1c", marginBottom: 8 }}>{error}</p>}

      {/* Buscador */}
      <div className="esc-search">
        <input className="esc-input" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-primary" type="button" onClick={() => onSearch(search)}>
          Buscar
        </button>
      </div>

      {/* Formulario */}
      <form className="esc-card" onSubmit={onSubmit} noValidate>
        <div className="esc-grid">
          <div className="esc-field">
            <label>Proveedor</label>
            <input className="esc-input" value={state.proveedor} onChange={(e) => setField("proveedor", e.target.value)}/>
            {errors.proveedor && <small className="error">{errors.proveedor}</small>}
          </div>

          <div className="esc-field">
            <label>* Identificador del servicio</label>
            <input className="esc-input" value={state.identificador} onChange={(e) => setField("identificador", e.target.value)} required/>
            {errors.identificador && <small className="error">{errors.identificador}</small>}
          </div>

          <div className="esc-field">
            <label>* Tienda</label>
            <input className="esc-input" value={state.tienda} onChange={(e) => setField("tienda", e.target.value)} required/>
            {errors.tienda && <small className="error">{errors.tienda}</small>}
          </div>

          <div className="esc-field">
            <label>* Ciudad</label>
            <input className="esc-input" value={state.ciudad} onChange={(e) => setField("ciudad", e.target.value)} required/>
            {errors.ciudad && <small className="error">{errors.ciudad}</small>}
          </div>

          <div className="esc-field">
            <label>* Empresa</label>
            <input className="esc-input" value={state.empresa} onChange={(e) => setField("empresa", e.target.value)} required/>
            {errors.empresa && <small className="error">{errors.empresa}</small>}
          </div>

          <div className="esc-field">
            <label>* NIT</label>
            <input className="esc-input" value={state.nit} onChange={(e) => setField("nit", e.target.value)} required/>
            {errors.nit && <small className="error">{errors.nit}</small>}
          </div>

          <div className="esc-field">
            <label>* Centro comercial</label>
            <input className="esc-input" value={state.centroComercial} onChange={(e) => setField("centroComercial", e.target.value)} required/>
            {errors.centroComercial && <small className="error">{errors.centroComercial}</small>}
          </div>

          <div className="esc-field">
            <label>* Local</label>
            <input className="esc-input" value={state.local} onChange={(e) => setField("local", e.target.value)} required />
            {errors.local && <small className="error">{errors.local}</small>}
          </div>

          <div className="esc-field">
            <label>* Cédula</label>
            <input className="esc-input" placeholder="Cédula del resolutor" value={state.cedula} onChange={(e) => setField("cedula", e.target.value)} required/>
            {errors.cedula && <small className="error">{errors.cedula}</small>}
          </div>

          <div className="esc-field">
            <label>* Nombre</label>
            <input className="esc-input" value={state.nombre} onChange={(e) => setField("nombre", e.target.value)} required />
            {errors.nombre && <small className="error">{errors.nombre}</small>}
          </div>

          <div className="esc-field">
            <label>* Apellidos</label>
            <input className="esc-input" value={state.apellidos} onChange={(e) => setField("apellidos", e.target.value)} required/>
            {errors.apellidos && <small className="error">{errors.apellidos}</small>}
          </div>

          <div className="esc-field">
            <label>* Teléfono</label>
            <input className="esc-input" value={state.telefono} onChange={(e) => setField("telefono", e.target.value)} required/>
            {errors.telefono && <small className="error">{errors.telefono}</small>}
          </div>

          <div className="esc-field esc-col-2">
            <label>* Descripción</label>
            <select className="esc-input" value={state.descripcion} onChange={(e) => setField("descripcion", e.target.value)} required>
              <option value="">Seleccione…</option>
              {DESCRIPCIONES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.descripcion && <small className="error">{errors.descripcion}</small>}
          </div>
        </div>

        {/* Adjuntos */}
        <div className="esc-attachments">
          <div className="esc-attachments-title">
            <span className="esc-asterisk">*</span> Datos adjuntos
          </div>
          <div className="esc-attachments-box">
            {state.adjuntos.length === 0 ? (
              <p className="esc-muted">No hay nada adjunto.</p>
            ) : (
              <ul className="esc-files">
                {state.adjuntos.map((f, i) => (
                  <li key={i}>{f.name}</li>
                ))}
              </ul>
            )}

            <label className="esc-upload">
              <span>📎 Adjuntar un archivo</span>
              <input
                type="file"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                style={{ display: "none" }}
              />
            </label>
            {errors.adjuntos && <small className="error">{errors.adjuntos}</small>}
          </div>
        </div>

        {/* Submit */}
        <div className="esc-actions">
          <button className="esc-primary" type="submit" disabled={loading}>
            {loading ? "Generando..." : "Generar Reporte"}
          </button>
        </div>
      </form>
    </div>
  );
}
