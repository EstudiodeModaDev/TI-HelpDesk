import React from "react";
import type { dispositivos, prestamos } from "../../Models/prestamos";
import { DataTable } from "./DateTable";
import { toISODateTimeFlex } from "../../utils/Date";
import { ReturnModal } from "./ReturnSection";

export type DeviceHistoryProps = {
  open: boolean;
  onClose: () => void
  selectedDispositivo: dispositivos
  rows: prestamos[];
  devices: dispositivos[]
};


export function DeviceHistoryModal({open, selectedDispositivo, onClose, rows, devices}: DeviceHistoryProps) {
  const [selectedLoan, setSelectedLoan] = React.useState<prestamos | null>(null)
  const [openPruebas, setOpenPruebas] = React.useState<boolean>(false)
  const overlayRef = React.useRef<HTMLDivElement | null>(null);

  if (!open) return null;

  if (openPruebas) return (
    <ReturnModal open={openPruebas} onClose={() => setOpenPruebas(false)} loan={selectedLoan!} dispositivos={devices} onFinalize={() => { return; } } mode={"view"} fase={"Ambas"} />
  )

  return (
    <div ref={overlayRef} className="pl-modalOverlay" role="dialog" aria-modal="true" tabIndex={-1} onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="pl-modal pl-modalWide">
        <div className="pl-modalHead">
          <button className="pl-btn ghost" onClick={() => {onClose();}} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="pl-modalBody">
          <div className="pl-returnTop">
            <div className="pl-returnInfo">
              <div className="pl-returnLine">
                <span className="pl-muted">Marca</span>
                <span className="pl-strong">{selectedDispositivo.Title}</span>
              </div>

              <div className="pl-returnLine">
                <span className="pl-muted">Referencia:</span>
                <span className="pl-strong">{selectedDispositivo.Referencia}</span>
              </div>

              <div className="pl-returnLine">
                <span className="pl-muted">Serial:</span>
                <span className="pl-strong">{selectedDispositivo.Serial}</span>
              </div>
            </div>
          </div>

          <div className="pl-returnBottom">
            <div className="pl-returnTests">
              <div className="pl-returnSectionTitle">Historial de prestamos</div>
                <DataTable
                  columns={["ID", "Solicitante", "Fecha de prestamo", "FechaDevolucion", "Estado"]}
                  rows={
                    <>
                      {rows.map((l) => {
                        const isClosed = l.Estado === "Cerrado" || !!l.FechaDevolucion;

                        return (
                          <tr key={l.Id} className={isClosed ? "pl-rowDisabled" : "pl-rowClickable"} 
                            onClick={() => {
                              setSelectedLoan(l);
                              setOpenPruebas(true);
                            }}
                            title={isClosed ? "Este préstamo ya está cerrado" : "Este préstamo sigue activo"}
                          >
                            <td className="pl-mono">{l.Id}</td>

                            <td>
                              <div className="pl-cellMain">{l.nombreSolicitante}</div>
                            </td>

                            <td className="pl-mono">{toISODateTimeFlex(l.FechaPrestamo)}</td>

                            <td className="pl-mono">{l.FechaDevolucion ? toISODateTimeFlex(l.FechaDevolucion) ?? "—" : "Pendiente"}</td>

                            <td>{l.Estado}</td>
                          </tr>
                        );
                      })}
                    </>
                  }
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
