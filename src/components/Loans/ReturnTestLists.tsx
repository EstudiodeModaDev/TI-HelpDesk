import type { pruebasPrestamo } from "../../Models/prestamos";
import { Pill } from "./Pill";
import type { Tone } from "./PretamosPage";

export type ReturnTestsListProps = {
  tests: pruebasPrestamo[];
  onChange?: (testId: string, next: string) => void;
};

type TestPillProps = {
  label: string;
  tone: Tone;
  active: boolean;
  onClick?: () => void;
};

function TestPill({ label, tone, active, onClick }: TestPillProps) {
  return (
    <button type="button" className={`pl-testPill ${active ? "is-active" : ""}`} onClick={onClick} aria-pressed={active}>
      <Pill tone={tone}>{label}</Pill>
    </button>
  );
}

export function ReturnTestsList({ tests, onChange }: ReturnTestsListProps) {
  return (
    <div className="pl-tests">
      {tests.length === 0 ? <div className="pl-empty">No hay pruebas definidas.</div> : null}

      {tests.map((t) => (
        <div key={t.Id} className="pl-testItem">
          <div className="pl-testMeta">
            <div className="pl-testTitle">{t.Title}</div>
          </div>

          <div className="pl-testControls" role="group">
            <TestPill label="Exitosa" tone="neutral" active={t.Aprobado === "Aprobado"} onClick={() => onChange?.(t.Id ?? "", "Aprobado")}/>
            <TestPill label="No aplica" tone="neutral" active={t.Aprobado === "N/A"} onClick={() => onChange?.(t.Id ?? "", "N/A")}/>
            <TestPill label="No exitosa" tone="bad" active={t.Aprobado === "Rechazado"} onClick={() => onChange?.(t.Id ?? "", "Rechazado")}/>
          </div>
        </div>
      ))}
    </div>
  );
}
