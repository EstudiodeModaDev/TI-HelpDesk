import { useRepositories } from "../../../repositories/repositoriesContext";
import { useDashboardDisponibilidad } from "../../../Funcionalidades/dashboard/useDashboardDisponibilidad";
import "../DashboardGeneral/DashboardResumen.css";
import "./DashboardDisponibilidadDemo.css";

function formatMinutes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 min";
  if (value < 60) return `${Math.round(value)} min`;

  const hours = value / 60;
  return `${hours.toLocaleString("es-CO", {
    minimumFractionDigits: hours < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  })} h`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function shorten(value: string, max = 20): string {
  if (!value) return "";
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function formatDateValue(value?: string | Date | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CO");
}

export default function DashboardDisponibilidad() {
  const { tickets } = useRepositories();
  const {
    loading,
    range,
    setRange,
    resetFilters,
    selectedResolutor,
    setSelectedResolutor,
    totalTickets,
    totalMinutos,
    promedioMinutos,
    minutosNocturnos,
    minutosDominicales,
    minutosFestivos,
    resolutores,
    resolutorOptions,
    ticketsDisponibilidad
  } = useDashboardDisponibilidad(tickets!);

  if (loading) {
    return (
      <section className="dash">
        <div className="dash-loading" role="status" aria-live="polite">
          Cargando tablero de disponibilidad…
        </div>
      </section>
    );
  }

  return (
    <section className="dash dispo-board">
      <aside className="dash-left">
        <div className="kpi-total dispo-kpi">
          <div className="kpi-total__text dispo-kpi__text">
            <div className="big">{totalTickets.toLocaleString("es-CO")}</div>
            <div className="sub">Tickets medidos</div>
          </div>
          <div className="dispo-kpi__halo" aria-hidden="true" />
        </div>

        <div className="panel dispo-panel">
          <h4>Tiempo medio de solución</h4>
          <div className="dispo-mainMetric">{formatMinutes(promedioMinutos)}</div>
        </div>

        <div className="panel dispo-panel">
          <h4>Tiempo especial acumulado</h4>
          <ul className="dispo-bullets">
            <li>
              <span>Nocturno</span>
              <strong>{formatMinutes(minutosNocturnos)}</strong>
            </li>
            <li>
              <span>Dominical</span>
              <strong>{formatMinutes(minutosDominicales)}</strong>
            </li>
            <li>
              <span>Festivo</span>
              <strong>{formatMinutes(minutosFestivos)}</strong>
            </li>
            <li>
              <span>Total</span>
              <strong>{formatMinutes(totalMinutos)}</strong>
            </li>
          </ul>
        </div>
      </aside>

      <main className="dash-center">
        <header className="center-head dispo-head">
          <div className="dash-filters dispo-filters">
            <input
              className="date"
              type="date"
              value={range.from}
              onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
            />
            <input
              className="date"
              type="date"
              value={range.to}
              onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
            />
            <select value={selectedResolutor} onChange={(e) => setSelectedResolutor(e.target.value)}>
              <option value="all">Todos los resolutores</option>
              {resolutorOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-transparent-final btn-m dispo-reset" onClick={resetFilters}>
              Limpiar
            </button>
          </div>
        </header>

        <section className="panel dispo-panel">
          <div className="dispo-panel__head">
            <h4>Distribución por resolutor</h4>
            <span>{ticketsDisponibilidad.length} tickets filtrados</span>
          </div>
          {!resolutores.length ? (
            <div className="hint">No hay tickets cerrados de disponibilidad con los filtros actuales.</div>
          ) : (
            <div className="dispo-resList">
              {resolutores.map((item) => (
                <article key={item.correo || item.nombre} className="dispo-resCard">
                  <div className="dispo-resCard__top">
                    <div>
                      <h5 title={item.nombre}>{item.nombre}</h5>
                      <p>{item.correo || "Sin correo asociado"}</p>
                    </div>
                    <div className="dispo-pill">{formatPercent(item.porcentajeDelTotal)}</div>
                  </div>
                  <div className="dispo-resGrid">
                    <div>
                      <span>Tickets</span>
                      <strong>{item.totalTickets}</strong>
                    </div>
                    <div>
                      <span>Promedio</span>
                      <strong>{formatMinutes(item.minutosPromedio)}</strong>
                    </div>
                    <div>
                      <span>Nocturno</span>
                      <strong>{formatMinutes(item.minutosNocturnos)}</strong>
                    </div>
                    <div>
                      <span>Dominical</span>
                      <strong>{formatMinutes(item.minutosDominicales)}</strong>
                    </div>
                    <div>
                      <span>Festivo</span>
                      <strong>{formatMinutes(item.minutosFestivos)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel dispo-panel">
          <div className="dispo-panel__head">
            <h4>Tickets considerados</h4>
            <span>Demo conectada a datos reales del repositorio</span>
          </div>
          {!ticketsDisponibilidad.length ? (
            <div className="hint">Sin tickets para mostrar.</div>
          ) : (
            <div className="dispo-tableWrap">
              <table className="dispo-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Asunto</th>
                    <th>Resolutor</th>
                    <th>Fuente</th>
                    <th>Semana</th>
                    <th>Total</th>
                    <th>Nocturno</th>
                    <th>Dominical</th>
                    <th>Festivo</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsDisponibilidad.slice(0, 12).map((ticket) => (
                    <tr key={ticket.ID}>
                      <td>{ticket.ID}</td>
                      <td title={ticket.AsuntoTicket}>{shorten(String(ticket.AsuntoTicket ?? ""), 36)}</td>
                      <td title={ticket.Nombreresolutor}>{shorten(String(ticket.Nombreresolutor ?? "Sin resolutor"), 22)}</td>
                      <td>{ticket.Fuente || "—"}</td>
                      <td>{formatDateValue(ticket.FechaCierreReal)}</td>
                      <td>{formatMinutes(Number(ticket.MinutosTotales ?? 0))}</td>
                      <td>{formatMinutes(Number(ticket.MinutosNocturnos ?? 0))}</td>
                      <td>{formatMinutes(Number(ticket.MinutosDominicales ?? 0))}</td>
                      <td>{formatMinutes(Number(ticket.MinutosFestivos ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </section>
  );
}
