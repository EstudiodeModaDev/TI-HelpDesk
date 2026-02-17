import React from "react";
import type { dispositivos, prestamos } from "../../Models/prestamos";
import { Card } from "./Card";
import { DataTable } from "./DateTable";
import { Kpi } from "./Kpi";
import { toISODateTimeFlex } from "../../utils/Date";
import Select, { components, type OptionProps, } from "react-select";
import type { UserOptionEx } from "../NuevoTicket/NuevoTicketForm";
import { useWorkers } from "../../Funcionalidades/Workers";
import type { desplegablesOptions } from "../../Models/Commons";
import { ReturnModal } from "./ReturnSection";

export type LoanHistorySectionProps = {
  rows: prestamos[];
  query: string;
  statusFilter?: string;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  dispositivos: dispositivos[];

  onCreateLoan: (dispositivoId: string) => void; 
  onFinalizeLoan: (loan: prestamos, continuar: boolean) => void;
  state: prestamos
  creating?: boolean;
  createError?: string | null;
  setField: <K extends keyof prestamos>(k: K, v: prestamos[K]) => void;
};

const Option = (props: OptionProps<UserOptionEx, false>) => {
  const { data, label } = props;
  return (
    <components.Option {...props}>
      <div className="rs-opt">
        <div className="rs-opt__text">
          <span className="rs-opt__title">{label}</span>
        </div>
        {data.source && <span className="rs-opt__tag">{data.source}</span>}
      </div>
    </components.Option>
  );
};

export function countLoansByStatus(loans: prestamos[], status: string): number {
  return loans.reduce(
    (count, loan) => (loan.Estado.toLocaleLowerCase() === status.toLocaleLowerCase() ? count + 1 : count),
    0
  );
}

export function LoanHistorySection({onFinalizeLoan, setField, state, rows, query, statusFilter = "Todos", onQueryChange, onStatusFilterChange, dispositivos, onCreateLoan, creating = false, createError = null,}: LoanHistorySectionProps) {
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openDevolver, setOpenDevolver] = React.useState(false);
  const [selectedLoan, setSelectedLoan] = React.useState<prestamos | null>(null);
  const { workersOptions, loadingWorkers, error: usersError } = useWorkers({onlyEnabled: true, });

  const closeCreate = () => {
    setOpenCreate(false);
  };

  const canSubmit = state.nombreSolicitante.trim().length > 0 && !creating;

  const submit = () => {
    if (!canSubmit) return;
    onCreateLoan(state.Id_dispositivo);
  };

  const submitFinalize = (continuar: boolean) => {
    onFinalizeLoan(selectedLoan!, continuar);
  };

  React.useEffect(() => {
    if (!openCreate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCreate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCreate]);

  const availableDevices: dispositivos[] = React.useMemo(() =>
    dispositivos.filter((d) => d.Estado === "Disponible"),
  [dispositivos]);

  const deviceOptions: desplegablesOptions[] = React.useMemo(() =>
    availableDevices.map((d) => ({
      value: String(d.Id),
      label: `${d.Referencia} ${d.Title} · ${d.Serial}`,
    })),
  [availableDevices]);

  const selectedSolicitante = workersOptions.find((o) => o.label.toLocaleLowerCase() === state.nombreSolicitante.toLocaleLowerCase()) ?? null;
  const selectedDevice = deviceOptions.find((o) => o.value === state.Id_dispositivo) ?? null;

  return (
    <>
      <div>
        <Card title="Historial de préstamos" subtitle="">
          {/* 1) KPIs arriba */}
          <div className="pl-headTop">
            <div className="pl-kpisRow">
              <Kpi label="Activos" value={countLoansByStatus(rows, "Activo")} />
              <Kpi label="Cerrados" value={countLoansByStatus(rows, "Cerrado")} />
            </div>
          </div>

          {/* 2) Filtros abajo (una sola fila y full width) */}
          <div className="pl-filtersBar">
            <input className="pl-input pl-grow" type="text" value={query ?? ""} placeholder="Buscar persona" onChange={(e) => onQueryChange(e.target.value)}/>

            <select className="pl-input pl-select" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
              <option value="all">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Cerrado">Cerrado</option>
            </select>

            <button className="pl-btn primary" onClick={() => setOpenCreate(true)}>
              Nuevo préstamo
            </button>
          </div>

          {/* 3) Tabla */}
          <DataTable
            columns={["ID", "Solicitante", "Equipo", "Fecha de prestamo", "Estado", "Devuelto"]}
            rows={
              <>
                {rows.map((l) => {
                  const device = dispositivos.find((d) => d.Id === l.Id_dispositivo);
                  const isClosed = l.Estado === "Cerrado" || !!l.FechaDevolucion;

                  return (
                    <tr key={l.Id} className={isClosed ? "pl-rowDisabled" : "pl-rowClickable"} 
                      onClick={() => {
                        if (isClosed) return;
                        setSelectedLoan(l);
                        setOpenDevolver(true);
                      }}
                      title={isClosed ? "Este préstamo ya está cerrado" : "Click para inventariar devolución"}
                    >
                      <td className="pl-mono">{l.Id}</td>

                      <td>
                        <div className="pl-cellMain">{l.nombreSolicitante}</div>
                      </td>

                      <td>
                        <div className="pl-cellMain">{device?.Title} {device?.Referencia}</div>
                        <div className="pl-cellSub pl-mono">{device?.Serial ?? "—"}</div>
                      </td>

                      <td className="pl-mono">{toISODateTimeFlex(l.FechaPrestamo)}</td>

                      <td>{l.Estado}</td>

                      <td className="pl-mono">
                        {l.FechaDevolucion ? toISODateTimeFlex(l.FechaDevolucion) ?? "—" : "Pendiente"}
                      </td>
                    </tr>
                  );
                })}
              </>

            }
          />
        </Card>
      </div>

      {/* MODAL */}
      {openCreate && (
        <div className="pl-modalOverlay" onMouseDown={closeCreate}>
          <div className="pl-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pl-modalHead">
              <div>
                <div className="pl-cardTitle">Crear préstamo</div>
                <div className="pl-cardSub">Selecciona un dispositivo disponible e ingresa el solicitante</div>
              </div>

              <button className="pl-btn ghost" onClick={closeCreate} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="pl-modalBody">
              <div className="pl-formGrid">
                <span className="pl-label">Solicitante</span>
                  <Select<UserOptionEx, false>
                    options={workersOptions}
                    placeholder={loadingWorkers ? "Cargando opciones…" : "Buscar solicitante…"}
                    value={selectedSolicitante}
                    onChange={(opt) => {setField("nombreSolicitante", opt?.label ?? ""); setField("Title", opt?.value ?? "");}}
                    classNamePrefix="rs"
                    isDisabled={loadingWorkers}
                    isLoading={loadingWorkers}
                    components={{ Option }}
                    noOptionsMessage={() => (usersError ? "Error cargando opciones" : "Sin coincidencias")}
                    isClearable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />

                <span className="pl-label">Dispositivo</span>
                <Select<desplegablesOptions, false>
                  options={deviceOptions}
                  placeholder={"Buscar dispositivo"}
                  value={selectedDevice}
                  onChange={(opt) => {setField("Id_dispositivo", opt?.value ?? "");}}
                  classNamePrefix="rs"
                  isDisabled={loadingWorkers}
                  isLoading={loadingWorkers}
                  components={{ Option }}
                  noOptionsMessage={() => (usersError ? "Error cargando opciones" : "Sin coincidencias")}
                  isClearable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </div>

              {createError ? <div className="pl-note">{createError}</div> : null}
            </div>

            <div className="pl-modalActions">
              <button className="pl-btn" onClick={closeCreate} disabled={creating}>
                Cancelar
              </button>
              <button className="pl-btn primary" onClick={submit} disabled={!canSubmit}>
                {creating ? "Creando…" : "Crear préstamo"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ReturnModal open={openDevolver} onClose={() => setOpenDevolver(false)} loan={selectedLoan!} dispositivos={dispositivos} onFinalize={submitFinalize} mode={"edit"} />
    </>
  );
}
