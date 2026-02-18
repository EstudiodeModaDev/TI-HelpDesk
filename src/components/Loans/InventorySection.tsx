import React from "react";
import type { dispositivos, prestamos, pruebasDefinidas, pruebasDispositos } from "../../Models/prestamos";
import { Badge } from "./Badge";
import { DataTable } from "./DateTable";
import { deviceStatusTone } from "./PretamosPage";
import { DeviceHistoryModal } from "./DeviceHistory";
import { DeviceTestsModal } from "./DeviceTestModal";

export type InventorySectionProps = {
  //Invetario
  inventory: dispositivos[];
  inventoryQuery: string;
  onInventoryQueryChange: (value: string) => void;
  state: dispositivos;
  setFieldState: (field: keyof dispositivos, value: string) => void;
  onAddSubmit: (mode: string) => void;
  setState: (state: dispositivos) => void;
  load: () => void;

  //Historial de prestamos
  selectedDevice: dispositivos | null
  setSelectedDevice: (e: dispositivos) => void
  rows: prestamos[]

  //Pruebas vinculadas al dispositivo
  testCatalogo: pruebasDefinidas[]
  loadAssignedByDevice: (deviceId: string) => void; 
  assigned: pruebasDispositos[]
  loading: boolean; 
  onAssign: (deviceId: string, testId: string) => Promise<void>; 
  onUnassign: (bridgeId: string, selectedDevice: dispositivos) => Promise<void>;
};

export function InventorySection({onAssign, onUnassign, loading, assigned, loadAssignedByDevice, testCatalogo, rows, inventory, inventoryQuery, onInventoryQueryChange, state, setFieldState, onAddSubmit, setState, setSelectedDevice, selectedDevice}: InventorySectionProps) {
  const [mode, setMode] = React.useState<"new" | "edit">("new");
  const [history, setHistory] = React.useState<boolean>(false)
  const [testOpen, setTestOpen] = React.useState<boolean>(false)

  React.useEffect(() => {
    if(selectedDevice) loadAssignedByDevice(selectedDevice.Id ?? "")
  }, [selectedDevice]);

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
                      <button type="button" className="pl-btn" onClick={() => {setSelectedDevice(d); setHistory(true)}}>
                        Ver Historial
                      </button>
                      <button type="button" className="pl-btn" onClick={() => {setSelectedDevice(d); setTestOpen(true);}}>
                        Pruebas
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
      <DeviceTestsModal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        device={selectedDevice!}
        catalog={testCatalogo}
        assigned={assigned}
        loading={loading}
        onAssign={onAssign}
        onUnassign={onUnassign}
      />

    </div>
  );
}
