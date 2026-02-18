import * as React from "react";
import type { dispositivos, pruebasDefinidas, pruebasDispositos } from "../../Models/prestamos";
import { DataTable } from "./DateTable";
import { Badge } from "./Badge";

type Props = {
  open: boolean;
  onClose: () => void;

  device: dispositivos;

  catalog: pruebasDefinidas[];
  assigned: pruebasDispositos[];
  loading: boolean;

  onAssign: (deviceId: string, testId: string) => Promise<void>;
  onUnassign: (bridgeId: string, selectedDevice: dispositivos) => Promise<void>;
};

const canon = (s: any) => String(s ?? "").trim();

export function DeviceTestsModal({open, onClose, device, catalog, assigned, loading, onAssign, onUnassign,}: Props) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [pick, setPick] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  // ✅ Bloquear scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ✅ Cerrar con ESC
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // ✅ Reset al cerrar/abrir
  React.useEffect(() => {
    if (!open) {
      setPick("");
      setSaving(false);
      return;
    }
    // foco al abrir
    setTimeout(() => panelRef.current?.focus(), 0);
  }, [open]);

  const assignedSet = React.useMemo(
    () => new Set(assigned.map((a) => String(a.IdPrueba))),
    [assigned]
  );

  const available = React.useMemo(() => {
    return (catalog ?? [])
      .filter((t) => !assignedSet.has(String(t.Id)))
      .filter((t) => canon((t as any).Estado).toLowerCase() !== "inactiva");
  }, [catalog, assignedSet]);

  const nameById = React.useMemo(() => {
    const m = new Map<string, pruebasDefinidas>();
    (catalog ?? []).forEach((t) => m.set(String(t.Id), t));
    return m;
  }, [catalog]);

  const handleAssign = async () => {
    if (!pick) return;
    if (!device?.Id) return;

    setSaving(true);
    try {
      await onAssign(String(device.Id), pick);
      setPick("");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="pl-modalOverlay" role="presentation" onMouseDown={onClose} >
      <div className="pl-modal" role="dialog" aria-modal="true" aria-label="Pruebas asignadas" tabIndex={-1} ref={panelRef} onMouseDown={(e) => e.stopPropagation()}>

        <header className="pl-modalHead">
          <div className="vdm-headLeft">
            <h3 className="vdm-title">Pruebas asignadas</h3>
            <p className="vdm-subtitle">{device?.Referencia} · {device?.Title} · {device?.Serial}</p>
          </div>

          <button className="pl-btn" type="button" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <section className="pl-modalBody">
          <div className="pl-toolbar" style={{ gap: 12 }}>
            <select className="pl-input" value={pick} onChange={(e) => setPick(e.target.value)} disabled={loading || saving}>
              <option value="">Selecciona una prueba…</option>
              {available.map((t) => (
                <option key={String(t.Id)} value={String(t.Id)}>
                  {(t as any).NombrePrueba ?? (t as any).Title ?? String(t.Id)}
                </option>
              ))}
            </select>

            <button className="pl-btn primary" type="button" disabled={!pick || loading || saving} onClick={handleAssign}>
              {saving ? "Asignando…" : "Asignar"}
            </button>

            <div className="pl-muted" style={{ marginLeft: "auto" }}>
              Asignadas: {assigned.length}
            </div>
          </div>

          <div className="pl-invTable" style={{ marginTop: 12 }}>
            <DataTable
              columns={["Prueba", "Acciones"]}
              rows={
                <>
                  {assigned.map((a) => {
                    const p = nameById.get(String(a.IdPrueba));
                    const nombre =
                      (p as any)?.NombrePrueba ?? (p as any)?.Title ?? String(a.IdPrueba);

                    const estado = canon((p as any)?.Estado);

                    return (
                      <tr key={String(a.Id)}>
                        <td className="pl-cellMain" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span>{nombre}</span>
                          {estado ? <Badge tone={"neutral"}>{estado}</Badge> : null}
                        </td>
                        <td className="pl-actionsCell">
                          <button type="button" className="pl-btn" disabled={loading || saving} onClick={() => onUnassign(String(a.Id), device)}>
                            Quitar
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {!assigned.length && (
                    <tr>
                      <td colSpan={2} className="pl-muted" style={{ padding: 16 }}>
                        Sin pruebas asignadas.
                      </td>
                    </tr>
                  )}
                </>
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}
