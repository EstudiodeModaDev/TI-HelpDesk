// src/components/Tickets/Tickets.tsx
import * as React from "react";
import "./TablaCompras.css"
import { useGraphServices } from "../../../graph/GrapServicesContext";
import { useCompras } from "../../../Funcionalidades/Compras";
import { toISODateTimeFlex } from "../../../utils/Date";
import CrearInventarioModal from "../../Inventario/ModalInventario/ModalInventario";
type Props = { onClick: (valor: boolean) => void, mostrar: boolean };

export default function TablaCompras({onClick, mostrar}:Props) {
    const { Compras, Tickets, Logs, Usuarios} = useGraphServices();
    const {rows, range, loading, error, applyRange, setRange, reloadAll, pageIndex, nextPage, hasNext, pageSize, setPageSize, handleNext, openModal, setOpenModal} = useCompras(Compras, Tickets, Logs, Usuarios)

  const [search, setSearch] = React.useState("");
  const [ticketCompra, setTicketCompra] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) => {
      const texto = `${t.CO ?? ""} ${t.Dispositivo ?? ""} ${t.Title ?? ""} ${t.UN}`.toLowerCase();
      return texto.includes(q);
    });
  }, [rows, search]);

  const resetFiltrosLocal = () => setSearch("");

 return (
<div className="tabla-tickets">
<h2>{"Compras Registradas"}</h2>
 
    {/* Filtros */}
<div
      className="filtros"
      style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto auto auto auto auto auto" }}
>
<input
        type="text"
        placeholder="Buscar (resolutor, solicitante, asunto)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
 
      <input
        type="date"
        value={range.from}
        onChange={(e) => setRange({ ...range, from: e.target.value })}
        title="Desde"
      />
<span>→</span>
<input
        type="date"
        value={range.to}
        onChange={(e) => setRange({ ...range, to: e.target.value })}
        title="Hasta"
      />
 
      <button type="button" onClick={applyRange} title="Aplicar rango">
        Aplicar
</button>
 
      <button type="button" onClick={resetFiltrosLocal} title="Limpiar búsqueda">
        Limpiar
</button>
</div>
 
    {/* Estados */}
    {loading && <p>Cargando solicitudes de compra...</p>}
    {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
    {!loading && !error && filtered.length === 0 && (
<p>No hay solicitudes de compra para los filtros seleccionados.</p>
    )}
 
    {/* Tabla */}
<div className="table-wrap">
<table>
<thead>
<tr>
<th>ID</th>
<th>Solicitada por</th>
<th>Fecha de solicitud</th>
<th>Dispositivo</th>
<th>CO</th>
<th>UN</th>
<th>Centro de costos</th>
<th>Cargar A</th>
<th>Estado</th>
<th>Acciones</th>
</tr>
</thead>
<tbody>
          {filtered.map((compra) => (
<tr key={compra.Id}>
<td>{compra.Id}</td>
<td>{compra.SolicitadoPor}</td>
<td>{toISODateTimeFlex(compra.FechaSolicitud)}</td>
<td>{compra.Dispositivo}</td>
<td>{compra.CO}</td>
<td>{compra.UN}</td>
<td>{compra.CCosto}</td>
<td>{compra.CargarA}</td>
<td>{compra.Estado}</td>
<td>
                {["completado", "completada"].includes((compra?.Estado ?? "").toLowerCase()) &&
                !((compra?.Title ?? "").toLowerCase().includes("contrato")) ? (
<span className="badge badge-success" aria-label="Compra completada">
                    La compra ya ha sido completada
</span>
                ) : (
<div>
<button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext(compra?.Id ?? "");
                        setTicketCompra(compra.IdCreado);
                      }}
                      aria-label={`Siguiente paso para compra ${compra?.Id ?? ""}`}
                      className="btn"
>
                      Siguiente paso
</button>
                    {["producto", "alquiler"].includes((compra?.Title ?? "").trim().toLowerCase()) && (
<button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenModal(true);
                        }}
                        className="btn"
>
                        Agregar al inventario
</button>
                    )}
</div>
                )}
</td>
</tr>
          ))}
</tbody>
</table>
 
      {/* Footer: izquierda = botón persistente, derecha = paginación si hay datos */}
<div className="pager">
        {/* Izquierda: SIEMPRE visible */}
<button type="button" className="btn-ver" onClick={() => onClick(false)}>
          {mostrar ? "📄 Ver compras registradas" : "➕ Registrar factura"}
</button>
 
        <span className="flex-spacer" />
 
        {/* Derecha: SOLO si hay registros */}
        {filtered.length > 0 && (
<div className="pager-right">
<button onClick={reloadAll} disabled={loading || pageIndex <= 1}>
              Anterior
</button>
<span>Página {pageIndex}</span>
<button onClick={nextPage} disabled={loading || !hasNext}>
              Siguiente
</button>
 
            <span style={{ marginLeft: 12 }}>Registros por página:</span>
<select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              disabled={loading}
>
              {[10, 20, 50, 100].map((n) => (
<option key={n} value={n}>
                  {n}
</option>
              ))}
</select>
</div>
        )}
</div>
</div>
 
    <CrearInventarioModal
      open={openModal}
      onClose={() => setOpenModal(false)}
      submitting={loading}
      IdTicket={ticketCompra}
    />
</div>
);
}