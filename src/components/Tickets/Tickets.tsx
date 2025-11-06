// src/components/Tickets/Tickets.tsx
import * as React from "react";
import { CaseDetail } from "../DetallesTickets/DetallesTickets";
import "./Tickets.css";

import { useAuth } from "../../auth/authContext";
import { useGraphServices } from "../../graph/GrapServicesContext";
import { calcularColorEstado, useTickets } from "../../Funcionalidades/Tickets";
import type { SortDir, SortField, Ticket } from "../../Models/Tickets";
import { toISODateTimeFlex } from "../../utils/Date";
import { useIsAdmin, useUserRole } from "../../Funcionalidades/Usuarios";

function renderSortIndicator(field: SortField, sorts: Array<{field: SortField; dir: SortDir}>) {
  const idx = sorts.findIndex(s => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === 'asc' ? '▲' : '▼';
  return <span style={{ marginLeft: 6, opacity: 0.85 }}>{dir}{sorts.length > 1 ? ` ${idx+1}` : ''}</span>;
}

export default function TablaTickets() {
  const { account } = useAuth();
  const userMail = account?.username ?? "";
  const isAdmin = useIsAdmin(userMail);
  const userRole = useUserRole(userMail)

  const { Tickets } = useGraphServices();

  const {rows, loading, error, filterMode, range, pageSize, pageIndex, hasNext, sorts,
    setFilterMode, setRange, applyRange, setPageSize, nextPage, reloadAll,  toggleSort} = useTickets(Tickets, userMail, isAdmin.isAdmin);

  // Búsqueda local SOLO sobre la página visible (si quieres global, hay que mover a OData)
  const [search, setSearch] = React.useState("");
  const [ticketSeleccionado, setTicketSeleccionado] = React.useState<Ticket | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) => {
      const texto = `${t.Nombreresolutor ?? ""} ${t.Solicitante ?? ""} ${t.Title ?? ""} ${t.ID}`.toLowerCase();
      return texto.includes(q);
    });
  }, [rows, search]);

  return (
    <div className="tabla-tickets" data-force-light>

      {!ticketSeleccionado && (
        <div className="filtros">

          <input type="text" placeholder="Buscar (resolutor, solicitante, asunto)..." value={search} onChange={(e) => setSearch(e.target.value)}/>

          <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as any)} title="Estado">
            <option value="En curso">En curso</option>
            <option value="Cerrados">Cerrados</option>
            <option value="Todos">Todos</option>
          </select>

          <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} title="Desde"/>
          <span>→</span>
          <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} title="Hasta"/>

          <button type="button" onClick={applyRange} title="Aplicar rango">
            Aplicar
          </button>

          <button type="button" onClick={reloadAll} title="Recargar">
            ⟳
          </button>
        </div>
      )}

      {/* Estados */}
      {loading && <p>Cargando tickets…</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loading && !error && filtered.length === 0 && <p>No hay tickets para los filtros seleccionados.</p>}

      {/* Tabla o Detalle */}
      {ticketSeleccionado ? (
        <CaseDetail onVolver={() => setTicketSeleccionado(null)} ticket={ticketSeleccionado} role={userRole.role} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th role="button" tabIndex={0} onClick={(e) => toggleSort('id', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('id', e.shiftKey); }} aria-label="Ordenar por ID" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  ID {renderSortIndicator('id', sorts)}
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('resolutor', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('resolutor', e.shiftKey); }} aria-label="Ordenar por Resolutor" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Resolutor {renderSortIndicator('resolutor', sorts)}
                </th>

                <th>Solicitante</th> 

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('Title', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Title', e.shiftKey); }} aria-label="Ordenar por Asunto" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Asunto {renderSortIndicator('Title', sorts)}
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('FechaApertura', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('FechaApertura', e.shiftKey); }} aria-label="Ordenar por Fecha de apertura" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Fecha de apertura {renderSortIndicator('FechaApertura', sorts)}
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('TiempoSolucion', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('TiempoSolucion', e.shiftKey); }}
                  aria-label="Ordenar por Fecha máxima" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Fecha máxima {renderSortIndicator('TiempoSolucion', sorts)}
                </th>

                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr key={ticket.ID} onClick={() => setTicketSeleccionado(ticket)} tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setTicketSeleccionado(ticket)}>
                  <td>{ticket.ID}</td>
                  <td>{ticket.Nombreresolutor}</td>
                  <td>{ticket.Solicitante}</td>
                  <td>{ticket.Title!.slice(0, 75)}</td>
                  <td>{toISODateTimeFlex(ticket.FechaApertura) || "–"}</td>
                  <td>{toISODateTimeFlex(ticket.TiempoSolucion) || "N/A"}</td>
                  <td>
                    <span className="estado-circulo" style={{ backgroundColor: calcularColorEstado(ticket) }} title={ticket.Estadodesolicitud || "Sin estado"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación servidor: Anterior = volver a primera página (loadFirstPage), Siguiente = nextLink */}
          {filtered.length > 0 && (
            <div className="paginacion">
              <button onClick={reloadAll} disabled={loading || pageIndex <= 1}>
                Anterior
              </button>
              <span>Página {pageIndex}</span>
              <button onClick={nextPage} disabled={loading || !hasNext}>
                Siguiente
              </button>

              <span style={{ marginLeft: 12 }}>Tickets por pagina:</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} disabled={loading}>
                {[10, 15, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}