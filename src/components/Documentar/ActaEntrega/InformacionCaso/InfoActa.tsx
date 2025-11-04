
import type { FormStateActa, TipoUsuario } from "../../../../Models/ActasEntrega";
import { useActaEntrega } from "../../../../Funcionalidades/ActaEntrega";
import type { Ticket } from "../../../../Models/Tickets";
import { Toggle } from "../../../Toggle/Toggle";
import "./InfoActa.css";

type Props = {
  onSubmit?: (payload: any) => void;
  defaultValues?: Partial<FormStateActa>;
  ticket: Ticket;
};

const TIPO_COMPUTADOR_OPTIONS: Record<TipoUsuario, Array<string>> = {
  "Usuario administrativo": ["Portátil Apple", "Escritorio Apple", "Portátil Windows", "Escritorio Windows"],
  "Usuario de diseño": ["Portátil Apple", "Escritorio Apple"],
  "Tienda": ["Portátil Windows", "Escritorio Windows"],
};

export default function InfoActaEntrega({ ticket }: Props) {
  const {state, items, ITEMS_CON_TIPO_COMPUTADOR, errors,  selectedKeys,
    setField, toggleEntrega, handleSubmit, updateDetalle} = useActaEntrega(ticket?.ID ?? "");

  const tipoActual = state.tipoUsuario || "Usuario administrativo";
  const opcionesTipoPC = TIPO_COMPUTADOR_OPTIONS[tipoActual as TipoUsuario] ?? ["Portátil", "Escritorio"];
  const mostrarTipoPC = items.some((i) => ITEMS_CON_TIPO_COMPUTADOR.has(i) && state.entregas[i]) &&!!state.tipoUsuario;

  return (
    <form className="acta-form" data-force-light onSubmit={handleSubmit}>
      <h1 className="acta-title">Nueva acta de entrega</h1>

      {/* Grid de cabecera */}
      <div className="acta-grid">
        <div className="acta-field">
          <label>Número de ticket</label>
          <input className="acta-input" value={state.numeroTicket} type="number" onChange={(e) => setField("numeroTicket", e.target.value)} placeholder=""/>
        </div>

        <div className="acta-field">
          <label>*Sede de destino</label>
          <input className="acta-input" value={state.sedeDestino} onChange={(e) => setField("sedeDestino", e.target.value)}/>
          {errors.sedeDestino && <small className="error">{errors.sedeDestino}</small>}
        </div>

        <div className="acta-field">
          <label>*Persona (Quien recibe)</label>
          <input className="acta-input" value={state.persona} onChange={(e) => setField("persona", e.target.value)}/>
          {errors.persona && <small className="error">{errors.persona}</small>}
        </div>

        <div className="acta-field">
          <label>*Correo (Quien Recibe)</label>
          <input className="acta-input" type="email" value={state.correo} onChange={(e) => setField("correo", e.target.value)}/>
          {errors.correo && <small className="error">{errors.correo}</small>}
        </div>

        <div className="acta-field">
          <label>*Número de cédula (Quien recibe)</label>
          <input className="acta-input" value={state.cedula} onChange={(e) => setField("cedula", e.target.value)} type="number"/>
          {errors.cedula && <small className="error">{errors.cedula}</small>}
        </div>

        <div className="acta-field">
          <label>*Tipo de usuario</label>
          <select className="acta-input" value={state.tipoUsuario} onChange={(e) => setField("tipoUsuario", e.target.value as TipoUsuario)}>
            <option value="">Seleccione…</option>
            <option>Usuario administrativo</option>
            <option>Usuario de diseño</option>
            <option>Tienda</option>
          </select>
          {errors.tipoUsuario && <small className="error">{errors.tipoUsuario}</small>}
        </div>

        <div className="acta-field">
          <label>*¿Estos equipos se enviarán?</label>
          <select className="acta-input" value={state.enviarEquipos} onChange={(e) => setField("enviarEquipos", e.target.value as string)}
          >
            <option value="">Seleccione…</option>
            <option value="No">No</option>
            <option value="Sí">Sí</option>
          </select>
          {errors.enviarEquipos && <small className="error">{errors.enviarEquipos}</small>}
        </div>
      </div>

      {/* Sección dinámica */}
      <h2 className="acta-subtitle">¿Qué se le entrega?</h2>

      <div className="entregas-grid">
        {items.map((it) => (
          <div key={it} className="entrega-item">
            <Toggle checked={!!state.entregas[it]} onChange={(v) => toggleEntrega(it, v)} label={it}/>
          </div>
        ))}
        {errors.entregas && <small className="error">{errors.entregas}</small>}

        {/* Campo dependiente: Tipo de computador */}
        {mostrarTipoPC && (
          <div className="entrega-item entrega-item--span2">
            <label className="acta-label-strong">Tipo de computador</label>
            <select className="acta-input" value={state.tipoComputador ?? ""} onChange={(e) => setField("tipoComputador", e.target.value as "Portátil" | "Escritorio" | "")}>
              <option value="">Seleccione…</option>
              {opcionesTipoPC.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.tipoComputador && <small className="error">{errors.tipoComputador}</small>}
          </div>
        )}
      </div>

      {/* ===== Galería (tarjetas) de equipos seleccionados ===== */}
      {selectedKeys.length > 0 && (
        <>
          <h2 className="acta-subtitle" style={{ marginTop: 24 }}>
            Detalles de los equipos seleccionados
          </h2>

          <div className="galeria-grid">
            {selectedKeys.map((key) => {
              const det = state.detalles[key];
              const proveedorDisabled = det?.Propiedad !== "Alquilado";
              return (
                <div key={key} className="galeria-card">
                  <div className="galeria-header">{det?.Elemento ?? key}</div>

                  <div className="galeria-row">
                    <label>Marca</label>
                    <input className="acta-input" value={det?.Marca ?? ""} onChange={(e) => updateDetalle(key, { Marca: e.target.value })} />
                  </div>

                  <div className="galeria-row">
                    <label>Referencia</label>
                    <input className="acta-input" value={det?.Referencia ?? ""} onChange={(e) => updateDetalle(key, { Referencia: e.target.value })}/>
                  </div>

                  <div className="galeria-row">
                    <label>Serial</label>
                    <input className="acta-input" value={det?.Serial ?? ""} onChange={(e) => updateDetalle(key, { Serial: e.target.value })}/>
                  </div>

                  <div className="galeria-row">
                    <label>Propiedad</label>
                    <select className="acta-input" value={det?.Propiedad ?? ""} onChange={(e) => updateDetalle(key, { Propiedad: e.target.value as any })}>
                      <option value="">Seleccione…</option>
                      <option value="Alquilado">Alquilado</option>
                      <option value="Propio">Propio</option>
                      <option value="Donación">Donación</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="galeria-row">
                    <label>Proveedor</label>
                    <input className="acta-input" value={proveedorDisabled ? "-" : (det?.Proveedor ?? "")} disabled={proveedorDisabled} onChange={(e) => updateDetalle(key, { Proveedor: e.target.value })}/>
                  </div>

                  <div className="galeria-row">
                    <label>Descripción</label>
                    <input className="acta-input" value={det?.Detalle ?? ""} onChange={(e) => updateDetalle(key, { Detalle: e.target.value })}/>
                  </div>

                  <div className="galeria-row">
                    <label>Prueba de funcionamiento</label>
                    <input className="acta-input" value={det?.Prueba ?? ""} onChange={(e) => updateDetalle(key, { Prueba: e.target.value })}/>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="acta-actions">
        <button type="submit" className="acta-primary">
          Siguiente
        </button>
      </div>
    </form>
  );
}
