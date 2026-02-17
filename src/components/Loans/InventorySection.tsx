import React from "react";
import type { dispositivos, prestamos } from "../../Models/prestamos";
import { Badge } from "./Badge";
import { DataTable } from "./DateTable";
import { deviceStatusTone } from "./PretamosPage";
import { DeviceHistoryModal } from "./DeviceHistory";

export type InventorySectionProps = {
  inventory: dispositivos[];
  inventoryQuery: string;
  onInventoryQueryChange: (value: string) => void;

  state: dispositivos;
  setFieldState: (field: keyof dispositivos, value: string) => void;
  onAddSubmit: (mode: string) => void;
  setState: (state: dispositivos) => void;
  load: () => void;
  selectedDevice: dispositivos | null
  setSelectedDevice: (e: dispositivos) => void
  rows: prestamos[]
};

export function InventorySection({rows, inventory, inventoryQuery, onInventoryQueryChange, state, setFieldState, onAddSubmit, setState, setSelectedDevice, selectedDevice}: InventorySectionProps) {
  const [mode, setMode] = React.useState<"new" | "edit">("new");
  const [history, setHistory] = React.useState<boolean>(false)
  
  return (
    <div className="pl-invLayout">
      {/* LEFT: Form pequeño */}
      <section className="pl-invLeft">
        <div className="pl-invTitle">{mode === "new" ? "Nuevo Dispositivo" : "Editar Dispositivo"}</div>

        <div className="pl-invForm">
          <label className="pl-label">Marca</label>
          <input className="pl-input" type="text" value={state.Title ?? ""} placeholder="Marca (Ej: Lenovo)" onChange={(e) => setFieldState("Title", e.target.value)}/>

          <label className="pl-label">Referencia</label>
          <input className="pl-input" type="text" value={state.Referencia ?? ""} placeholder="Referencia (Ej: T14 Gen 2)" onChange={(e) => setFieldState("Referencia", e.target.value)}/>
          
          <label className="pl-label">Serial</label>
          <input className="pl-input" type="text" value={state.Serial ?? ""} placeholder="Serial (Ej: LNV-T14-XYZ)" onChange={(e) => setFieldState("Serial", e.target.value)}/>
          
          { mode === "edit" ? (
          <>
            <label className="pl-label">Estado</label>
            <select className="pl-input" value={state.Estado ?? ""} onChange={(e) => setFieldState("Estado", e.target.value)}>
              <option value="">Seleccionar estado</option>
              <option value="Disponible">Disponible</option>
              <option value="Prestado">Prestado</option>
              <option value="Malo">Malo</option>
            </select>
          </>) : null }

          <button className="pl-btn primary pl-invAddBtn" onClick={() => onAddSubmit(mode)}>
            {mode === "new" ? "Añadir" : "Guardar cambios"}
          </button>
        </div>
      </section>

      {/* RIGHT: Tabla + buscador */}
      <section className="pl-invRight">
        <div className="pl-invTopbar">
          <input className="pl-input pl-invSearch" type="text" value={inventoryQuery ?? ""} placeholder="Buscar…" onChange={(e) => onInventoryQueryChange(e.target.value)}/>
        </div>

        <div className="pl-invTable">
          <DataTable
            columns={["Equipo", "Marca", "Serial", "Estado", "Acciones"]}
            rows={
              <>
                {inventory.map((d) => (
                  <tr key={d.Id} onClick={() => {setState(d); setMode("edit")}} className="pl-rowClickable">
                    <td className="pl-cellMain">{d.Referencia}</td>
                    <td>{d.Title}</td>
                    <td className="pl-mono">{d.Serial}</td>
                    <td>
                      <Badge tone={deviceStatusTone(d.Estado)}>{d.Estado}</Badge>
                    </td>
                    <td className="pl-actionsCell">
                      <button type="button" className="pl-actionBtn" onClick={() => {setSelectedDevice(d); setHistory(true)}}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </>
            }
          />
        </div>
      </section>
      
      <DeviceHistoryModal open={history} onClose={() => setHistory(false)} selectedDispositivo={selectedDevice!} rows={rows} devices={inventory}></DeviceHistoryModal>

    </div>
  );
}
