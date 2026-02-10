import React from "react";
import type { pruebasDefinidas } from "../../Models/prestamos";
import { DataTable } from "./DateTable";

export type PruebasSectionProps = {
  test: pruebasDefinidas[];

  state: pruebasDefinidas;
  setFieldState: (field: keyof pruebasDefinidas, value: string) => void;
  onAddSubmit: (mode: string) => void;
  setState: (state: pruebasDefinidas) => void;
  load: () => void;
};

export function PruebasSection({test, state, setFieldState, onAddSubmit, setState}: PruebasSectionProps) {
  const [mode, setMode] = React.useState<"new" | "edit">("new");
  return (
    <div className="pl-invLayout">
      {/* LEFT: Form pequeño */}
      <section className="pl-invLeft">
        <div className="pl-invTitle">{mode === "new" ? "Nueva prueba" : "Editar prueba"}</div>

        <div className="pl-invForm">
          <label className="pl-label">Prueba</label>
          <input className="pl-input" type="text" value={state.Title ?? ""} placeholder="Prueba (Ej: el dispositivo...)" onChange={(e) => setFieldState("Title", e.target.value)}/>
          
          { mode === "edit" ? (
          <>
            <label className="pl-label">Estado</label>
            <select className="pl-input" value={state.Estado ?? ""} onChange={(e) => setFieldState("Estado", e.target.value)}>
              <option value="">Seleccionar estado</option>
              <option value="Activo">Activa</option>
              <option value="Inactiva">Inactiva</option>
            </select>
          </>) : null }

          <button className="pl-btn primary pl-invAddBtn" onClick={() => onAddSubmit(mode)}>
            {mode === "new" ? "Añadir" : "Guardar cambios"}
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
                  <tr key={d.Id} onClick={() => {setState(d); setMode("edit")}} className="pl-rowClickable">
                    <td className="pl-cellMain">{d.Title}</td>
                    <td>{d.Estado}</td>
                  </tr>
                ))}
              </>
            }
          />
        </div>
      </section>
    </div>
  );
}
