import * as React from "react";
import "./Lista.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { UsuariosSPService } from "../../../Services/Usuarios.Service";
import type { TicketsService } from "../../../Services/Tickets.service";
import type { LogService } from "../../../Services/Log.service";
import type { PazSalvosService } from "../../../Services/PazSalvos.service";
import { usePazSalvos } from "../../../Funcionalidades/PazSalvos";

export default function PazYSalvos() {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [desde, setDesde] = React.useState(todayISO);
  const [hasta, setHasta] = React.useState(todayISO);
  const [estado, setEstado] = React.useState<string>("")
  const [q, setQ] = React.useState("");
  const { Usuarios, Tickets, Logs, PazYSalvos } = useGraphServices() as ReturnType<typeof useGraphServices> & {
    Usuarios: UsuariosSPService;
    Tickets: TicketsService;
    Log: LogService;
    PazYSalvos: PazSalvosService;
  };
  const { rows, loadFirstPage } = usePazSalvos({LogSvc: Logs, PazYSalvos: PazYSalvos, TicketSvc: Tickets, Usuarios: Usuarios,});

  React.useEffect(() => {                             
    loadFirstPage()
  }, [Logs, ]);    

  return (
    <section className="pz-page">
    
      {/* Filtros */}
      <form className="pz-filters" onSubmit={(e) => e.preventDefault()}>
        <label className="pz-field">
          <span>Desde</span>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>

        <label className="pz-field">
          <span>Hasta</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>

        <label className="pz-field pz-field--sm">
          <span>Estado</span>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
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
