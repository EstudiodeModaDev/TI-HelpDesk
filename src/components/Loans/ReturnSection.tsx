import * as React from "react";
import { createPortal } from "react-dom";
import type { dispositivos, prestamos } from "../../Models/prestamos";
import { ReturnTestsList } from "./ReturnTestLists";
import { usePruebas } from "../../Funcionalidades/prestamos";

export type ReturnModalProps = {
  open: boolean;
  onClose: () => void;
  loan: prestamos | null; 
  dispositivos: dispositivos[];
  onFinalize: (continuar: boolean) => Promise<void> | void; // mejor tipado
  onChange?: (testId: string, next: string) => void;
  mode: "edit" | "view"
  fase: "Devolucion" | "Entrega" | "Ambas"
};

export function ReturnModal({open, onClose, loan, dispositivos, onFinalize, mode, fase}: ReturnModalProps) {
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const { loadPruebasPrestamo, pruebasPrestamoRows, draft, onDraftChange, handleFinalize, setDraft} = usePruebas();

  const mergedTestsDevolucion = React.useMemo(() => {
    return pruebasPrestamoRows.filter(t => t.Fase === "Devolucion").map(t => {
      const id = t.Id ?? "";
      const next = id && draft[id] ? draft[id] : undefined;
      return next ? { ...t, Aprobado: next } : t;
    });
  }, [pruebasPrestamoRows, draft]);

  const mergedTestEntrega = React.useMemo(() => {
    return pruebasPrestamoRows.filter(t => t.Fase === "Entrega").map(t => {
      const id = t.Id ?? "";
      const next = id && draft[id] ? draft[id] : undefined;
      return next ? { ...t, Aprobado: next } : t;
    });
  }, [pruebasPrestamoRows, draft]);

  const VALID = new Set(["Aprobado", "N/A", "Rechazado"]);

  const canFinalize = React.useMemo(() => {
    if (!loan) return false;

    // si ya está cerrado, no permitir
    if (loan.Estado === "Cerrado") return false;

    // deben existir pruebas
    if (pruebasPrestamoRows.length === 0) return false;

    // TODAS deben tener cambio nuevo (draft)
    return pruebasPrestamoRows.every(t => {
      const id = (t.Id ?? "").trim();
      if (!id) return false;

      const v = (draft[id] ?? "").trim();
      return VALID.has(v); // obliga a que lo haya marcado AHORA
    });
  }, [loan, pruebasPrestamoRows, draft]);


  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        setDraft({});
      }
    };

    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => overlayRef.current?.focus());

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, setDraft]);

  React.useEffect(() => {
    if (!open) return;
    const id = loan?.Id;
    if (!id) return;

    loadPruebasPrestamo(String(id), fase);
  }, [open, loan?.Id, loadPruebasPrestamo]);

  React.useEffect(() => {
    if (!open) return;
    setDraft({});
  }, [open, loan?.Id, setDraft]);

  const submitFinalize = async () => {
    const continuar = await handleFinalize(loan!);
    onFinalize(continuar);
  };

  if (!open || !loan) return null;

  const device = dispositivos.find((d) => d.Id === loan.Id_dispositivo);

  const modal = (
    <div ref={overlayRef} className="pl-modalOverlay" role="dialog" aria-modal="true" tabIndex={-1} onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className="pl-modal pl-modalWide">
        <div className="pl-modalHead">
          <div>
            <div className="pl-cardTitle">Inventariar devolución</div>
          </div>

          <button className="pl-btn ghost" onClick={() => {onClose(); setDraft({})}} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="pl-modalBody">
          <div className="pl-returnTop">
            <div className="pl-returnInfo">
              <div className="pl-returnLine">
                <span className="pl-muted">Persona</span>
                <span className="pl-strong">{loan.Title}</span>
              </div>

              <div className="pl-returnLine">
                <span className="pl-muted">Equipo</span>
                <span className="pl-strong">
                  {device?.Title ?? "Equipo no encontrado"} {device?.Referencia ?? ""}{" "}
                  {device?.Serial ? `- ${device.Serial}` : ""}
                </span>
              </div>
            </div>
          </div>

          <div className={`pl-returnBottom ${fase === "Ambas" ? "is-dual" : ""}`}>
            
            { (fase === "Entrega" || fase=== "Ambas") ?
              <div className="pl-returnTests">
                <div className="pl-returnSectionTitle">Pruebas de entrega</div>
                <ReturnTestsList tests={mergedTestEntrega} onChange={onDraftChange} mode={mode} />
              </div> : null
            }

            { (fase === "Devolucion" || fase=== "Ambas") ?
              <div className="pl-returnTests">
                <div className="pl-returnSectionTitle">Pruebas de devolucion</div>
                <ReturnTestsList tests={mergedTestsDevolucion} onChange={onDraftChange} mode={mode} />
              </div> : null
            }

            <div className="pl-returnSide">
              <button className="pl-btn primary pl-returnBtn" disabled={!canFinalize} onClick={() => {submitFinalize(); onClose()}}>
                Devolver
              </button>
              {!canFinalize && mode==="edit" && (
                <div className="pl-note" style={{ marginTop: 10 }}>
                  Marca las pruebas antes de finalizar.
                </div>)
              }
              {!canFinalize && mode==="view" && (
                <div className="pl-note" style={{ marginTop: 10 }}>
                  Solo disponible para vista.
                </div>)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
