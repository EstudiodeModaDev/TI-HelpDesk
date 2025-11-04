import * as React from "react";
import "./Lista.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { UsuariosSPService } from "../../../Services/Usuarios.Service";
import type { TicketsService } from "../../../Services/Tickets.service";
import type { LogService } from "../../../Services/Log.service";
import type { PazSalvosService } from "../../../Services/PazSalvos.service";
import { usePazSalvos } from "../../../Funcionalidades/PazSalvos";

export default function PazYSalvos() {
  const [q, setQ] = React.useState("");
  const { Usuarios, Tickets, Logs, PazYSalvos } = useGraphServices() as ReturnType<typeof useGraphServices> & {
    Usuarios: UsuariosSPService;
    Tickets: TicketsService;
    Log: LogService;
    PazYSalvos: PazSalvosService;
  };
  const { rows, filterMode, range, loadFirstPage, setFilterMode, setRange } = usePazSalvos({LogSvc: Logs, PazYSalvos: PazYSalvos, TicketSvc: Tickets, Usuarios: Usuarios,});

  React.useEffect(() => {                             
    loadFirstPage()
  }, [Logs, filterMode, range.from, range.to]);    

  return (
    <section className="pz-page">
    
      {/* Filtros */}
      <form className="pz-filters" onSubmit={(e) => e.preventDefault()}>
        <label className="pz-field">
          <span>Desde</span>
          <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        </label>

        <label className="pz-field">
          <span>Hasta</span>
          <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })}  />
        </label>

        <label className="pz-field pz-field--sm">
          <span>Estado</span>
          <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="finalizado">Finalizados</option>
            <option value="espera">En espera</option>
          </select>
        </label>

        <div className="pz-search">
          <input type="search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        </div>
      </form>

      {/* Tabla */}
      <div className="pz-tableWrap">
        <table className="pz-table">
          <thead>
            <tr>
              <th>Consecutivo <span className="pz-sort">↑</span></th>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Fecha Ingreso</th>
              <th>Fecha de retiro</th>
              <th>Cargo</th>
              <th>Empresa</th>
              <th>Jefe directo</th>
              <th>CO</th>
              <th>Finalizada</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="pz-empty">Sin registros</td>
              </tr>
            )}
            {rows.map(r => (
              <tr key={r.Consecutivo}>
                <td>{r.Consecutivo}</td>
                <td>{r.Nombre}</td>
                <td>{r.Cedula}</td>
                <td>{r.Fechadeingreso || "–"}</td>
                <td>{r.Fechadesalida || "–"}</td>
                <td>{r.Cargo}</td>
                <td>{r.Empresa}</td>
                <td>{r.Jefe}</td>
                <td>{r.CO}</td>
                <td>
                  <span className={`pz-dot ${r.Title ? "is-ok" : "is-bad"}`} aria-label={r.Title ? "En curso" : "Finalizado"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
