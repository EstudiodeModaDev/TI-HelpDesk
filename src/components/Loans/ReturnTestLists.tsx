import type { pruebasPrestamo } from "../../Models/prestamos";
import { Pill } from "./Pill";
import type { Tone } from "./PretamosPage";

export type ReturnTestsListProps = {
  tests: pruebasPrestamo[];
  onChange?: (testId: string, next: string) => void;
  mode: "view" | "edit"
};

type TestPillProps = {
  label: string;
  tone: Tone;
  active: boolean;
  onClick?: () => void;
  disabled: boolean
};

function TestPill({ label, tone, active, onClick, disabled}: TestPillProps) {
  return (
    <button type="button" className={`pl-testPill ${active ? "is-active" : ""}`} onClick={onClick} aria-pressed={active} disabled={disabled}>
      <Pill tone={tone}>{label}</Pill>
    </button>
  );
}

export function ReturnTestsList({ tests, onChange, mode }: ReturnTestsListProps) {
  const desactivar = mode === "view"
  return (
    <div className="pl-tests">
      {tests.length === 0 ? <div className="pl-empty">No hay pruebas definidas.</div> : null}

      {tests.map((t) => (
        <div key={t.Id} className="pl-testItem">
          <div className="pl-testMeta">
            <div className="pl-testTitle">{t.Title}</div>
          </div>

          <div className="pl-testControls" role="group">
            <TestPill label="Exitosa" tone="neutral" active={t.Aprobado === "Aprobado"} onClick={() => onChange?.(t.Id ?? "", "Aprobado")} disabled={desactivar}/>
            <TestPill label="No aplica" tone="neutral" active={t.Aprobado === "N/A"} onClick={() => onChange?.(t.Id ?? "", "N/A")} disabled={desactivar}/>
            <TestPill label="No exitosa" tone="bad" active={t.Aprobado === "Rechazado"} onClick={() => onChange?.(t.Id ?? "", "Rechazado")} disabled={desactivar}/>
          </div>
        </div>
      ))}
    </div>
  );
}
