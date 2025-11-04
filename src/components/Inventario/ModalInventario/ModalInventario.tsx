import * as React from "react";
import "./ModalInventario.css"
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { InventarioService } from "../../../Services/Inventario.service";
import { useInventario } from "../../../Funcionalidades/Inventario";

type Props = {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  IdTicket: string
};

export default function CrearInventarioModal({open, submitting = false, onClose, IdTicket}: Props) {

    const { Inventario} = useGraphServices() as ReturnType<typeof useGraphServices> & {Inventario: InventarioService; };
    const {state, entradaPorPrimeraVez, setField} = useInventario({Inventario})

  // Cerrar con Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" aria-modal="true" role="dialog" aria-labelledby="activo-modal-title">
      <div className="modal">
        <div className="modal-header">
          <h2 id="activo-modal-title">Nuevo activo</h2>
          <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form className="form-grid" onSubmit={async (e) => { e.preventDefault(); e.stopPropagation(); await entradaPorPrimeraVez(IdTicket);}}>
          {/* Columna 1 */}
          <div className="field">
            <label className="label" htmlFor="Title">Dispositivo</label>
            <input id="Title" className="control" value={state.Title} onChange={(e) => setField("Title", e.target.value)} required />
          </div>

          <div className="field">
            <label className="label" htmlFor="Marca">Marca</label>
            <input id="Marca" className="control" value={state.Marca} onChange={(e) => setField("Marca", e.target.value)} />
          </div>

          <div className="field">
            <label className="label" htmlFor="Serial">Serial</label>
            <input id="Serial" className="control" value={state.Serial} onChange={(e) => setField("Serial", e.target.value)} />
          </div>

          <div className="field">
            <label className="label" htmlFor="Referencia">Referencia</label>
            <input id="Referencia" className="control" value={state.Referencia} onChange={(e) => setField("Referencia", e.target.value)} />
          </div>

          <div className="field">
            <label className="label" htmlFor="ResponsableEntrada">Responsable Entrada</label>
            <input id="ResponsableEntrada" className="control" value={state.ResponsableEntrada}/>
          </div>

          <div className="field">
            <label className="label" htmlFor="DiscoCap">Disco (Capacidad)</label>
            <input id="DiscoCap" className="control" value={state.DiscoCap} onChange={(e) => setField("DiscoCap", e.target.value)} placeholder="Ej. 512 GB" />
          </div>

          <div className="field">
            <label className="label" htmlFor="DiscoTec">Disco (Tecnología)</label>
            <input id="DiscoTec" className="control" value={state.DiscoTec} onChange={(e) => setField("DiscoTec", e.target.value)} placeholder="Ej. SSD NVMe" />
          </div>

          {/* Columna 2 */}
          <div className="field">
            <label className="label" htmlFor="MemoriaCap">Memoria (Capacidad)</label>
            <input id="MemoriaCap" className="control" value={state.MemoriaCap} onChange={(e) => setField("MemoriaCap", e.target.value)} placeholder="Ej. 16 GB" />
          </div>

          <div className="field">
            <label className="label" htmlFor="MemoriaTec">Memoria (Tecnología)</label>
            <input id="MemoriaTec" className="control" value={state.MemoriaTec} onChange={(e) => setField("MemoriaTec", e.target.value)} placeholder="Ej. DDR4" />
          </div>

          <div className="field">
            <label className="label" htmlFor="FechaEntrada">Fecha de entrada</label>
            <input id="FechaEntrada" type="date" className="control" value={state.FechaEntrada}/>
          </div>

          <div className="field">
            <label className="label" htmlFor="CasoEntrada">Caso entrada</label>
            <input id="CasoEntrada" className="control" value={state.CasoEntrada} />
          </div>

          {/* Columna 3 */}
          <div className="field">
            <label className="label" htmlFor="Estado">Estado</label>
            <input id="Estado" className="control" value={state.Estado} onChange={(e) => setField("Estado", e.target.value)} placeholder="Ej. Operativo / En mantenimiento" />
          </div>

          <div className="field">
            <label className="label" htmlFor="Categoria">Propiedad</label>
            <input id="Categoria" className="control" value={state.Categoria} onChange={(e) => setField("Categoria", e.target.value)} placeholder="Ej. Propio / Alquiler / Tercero" />
          </div>

          {/* Columna 4 */}
          <div className="field">
            <label className="label" htmlFor="ControlActivos">Control de activos</label>
            <input id="ControlActivos" className="control" value={state.ControlActivos} onChange={(e) => setField("ControlActivos", e.target.value)} placeholder="Ej. Placa, código, etc." />
          </div>

          <div className="field">
            <label className="label" htmlFor="Proveedor">Proveedor</label>
            <input id="Proveedor" className="control" value={state.Proveedor} onChange={(e) => setField("Proveedor", e.target.value)} />
          </div>

          {/* Acciones */}
          <div className="col-span-full modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
