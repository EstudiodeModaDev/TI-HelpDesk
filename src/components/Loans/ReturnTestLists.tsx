import type { pruebasPrestamo } from "../../Models/prestamos";

export type ReturnTestsListProps = {
  tests: pruebasPrestamo[];
  onChange?: (testId: string, next: string) => void;
  mode: "view" | "edit";
};

export function ReturnTestsList({ tests, onChange, mode }: ReturnTestsListProps) {
  const desactivar = mode === "view";

  return (
    <div className="pl-tests">
      {tests.length === 0 ? <div className="pl-empty">No hay pruebas definidas.</div> : null}

      {tests.map((t) => {
        const id = (t.Id ?? "").trim();
        const current = (t.Aprobado ?? "").trim();

        return (
          <div key={id || t.Id} className="pl-testItem">
            <div className="pl-testMeta">
              <div className="pl-testTitle">{t.Title}</div>
            </div>

            <div className="pl-testControls" role="group">
              <select
                value={current}
                onChange={(e) => onChange?.(id, e.target.value)}
                disabled={desactivar || !id}
                style={{ height: 40 }}
              >
                <option value="" disabled>
                  Selecciona…
                </option>
                <option value="Aprobado">Aprobado</option>
                <option value="N/A">N/A</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}