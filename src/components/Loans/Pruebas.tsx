import React from "react";
import Select from "react-select";
import type {
  dispositivos,
  pruebasDefinidas,
  pruebasDispositos,
} from "../../Models/prestamos";
import { DataTable } from "./DateTable";
import { DeviceTestsModal } from "./DeviceTestModal";

export type PruebasSectionProps = {
  test: pruebasDefinidas[];

  state: pruebasDefinidas;
  setFieldState: (field: keyof pruebasDefinidas, value: string) => void;
  onAddSubmit: (mode: string) => void;
  setState: (state: pruebasDefinidas) => void;

  load: () => void;
  equipos: dispositivos[];
  assigned: pruebasDispositos[];
  loadingAssigned: boolean;
  loadAssignedByDevice: (deviceId: string) => void;
  onAssign: (deviceId: string, testId: string) => Promise<void>;
  onUnassign: (bridgeId: string, selectedDevice: dispositivos) => Promise<void>;
};
export function PruebasSection({
  test,
  state,
  setFieldState,
  onAddSubmit,
  setState,
  equipos,
  assigned,
  loadingAssigned,
  loadAssignedByDevice,
  onAssign,
  onUnassign,
}: PruebasSectionProps) {
  const [mode, setMode] = React.useState<"new" | "edit">("new");
  const [equipo, setEquipo] = React.useState<dispositivos | null>(null);
  const [openTests, setOpenTests] = React.useState(false);

  const equipoOptions = React.useMemo(
    () =>
      equipos.map((e) => ({
        value: String(e.Id),
        label: `${e.Referencia} - ${e.Title}`,
      })),
    [equipos],
  );

  const abrirPruebas = () => {
    if (!equipo?.Id) return;
    loadAssignedByDevice(equipo.Id);
    setOpenTests(true);
  };
  return (
    <div className="pl-invLayout">
      {/* LEFT: Form pequeño */}
      <section className="pl-invLeft">
        <div className="pl-invTitle">
          {mode === "new" ? "Nueva prueba" : "Editar prueba"}
        </div>

        <div className="pl-invForm">
          <label className="pl-label">Prueba</label>
          <input
            className="pl-input"
            type="text"
            value={state.Title ?? ""}
            placeholder="Prueba (Ej: el dispositivo...)"
            onChange={(e) => setFieldState("Title", e.target.value)}
          />

          {mode === "edit" ? (
            <>
              <label className="pl-label">Estado</label>
              <select
                className="pl-input"
                value={state.Estado ?? ""}
                onChange={(e) => setFieldState("Estado", e.target.value)}
              >
                <option value="">Seleccionar estado</option>
                <option value="Activo">Activa</option>
                <option value="Inactiva">Inactiva</option>
              </select>
            </>
          ) : null}

          <button
            className="pl-btn primary pl-invAddBtn"
            onClick={() => onAddSubmit(mode)}
          >
            {mode === "new" ? "Añadir" : "Guardar cambios"}
          </button>
        </div>

        <div className="pl-invTitle" style={{ marginTop: 24 }}>
          Pruebas por activo
        </div>
        <div className="pl-invForm">
          <label className="pl-label">Activo</label>
          <Select
            options={equipoOptions}
            value={equipoOptions.find((o) => o.value === equipo?.Id) ?? null}
            onChange={(opt) =>
              setEquipo(
                equipos.find((e) => String(e.Id) === opt?.value) ?? null,
              )
            }
            placeholder="Buscar por código o tipo..."
            classNamePrefix="rs"
            isClearable
            noOptionsMessage={() => "Sin coincidencias"}
          />
          <button
            className="pl-btn primary pl-invAddBtn"
            disabled={!equipo}
            onClick={abrirPruebas}
          >
            Configurar pruebas
          </button>
        </div>
      </section>

      {/* RIGHT: Tabla + buscador */}
      <section className="pl-invRight">
        <div className="pl-invTable">
          <DataTable
            columns={["Prueba", "Estado"]}
            rows={
              <>
                {test.map((d) => (
                  <tr
                    key={d.Id}
                    onClick={() => {
                      setState(d);
                      setMode("edit");
                    }}
                    className="pl-rowClickable"
                  >
                    <td className="pl-cellMain">{d.Title}</td>
                    <td>{d.Estado}</td>
                  </tr>
                ))}
              </>
            }
          />

          {equipo && (
            <DeviceTestsModal
              open={openTests}
              onClose={() => setOpenTests(false)}
              device={equipo}
              catalog={test}
              assigned={assigned}
              loading={loadingAssigned}
              onAssign={onAssign}
              onUnassign={onUnassign}
            />
          )}
        </div>
      </section>
    </div>
  );
}
