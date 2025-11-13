// src/components/Tickets/Tickets.tsx
import * as React from "react";
import "./TablaCompras.css"
import { useGraphServices } from "../../../graph/GrapServicesContext";
import { useCompras } from "../../../Funcionalidades/Compras";
import { toGraphDateOnly } from "../../../utils/Date";
import CrearInventarioModal from "../../Inventario/ModalInventario/ModalInventario";
type Props = { onClick: (valor: boolean) => void, mostrar: boolean };

export default function TablaCompras({onClick}:Props) {
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
    <div className="tabla-compras">
      <h2>{"Compras Registradas"}</h2>
      
      {/* Filtros */}
      <div className="tc-filtros">
        <input type="text" placeholder="Buscar (resolutor, solicitante, asunto)..." value={search} onChange={(e) => setSearch(e.target.value)}/>
        <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} title="Desde"/>
        <span>→</span>
        <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} title="Hasta"/>
        <button type="button" onClick={applyRange} title="Aplicar rango" className="btn btn-primary btn-xs"> Aplicar </button>
        <button type="button" onClick={resetFiltrosLocal} title="Limpiar búsqueda" className="btn btn-secondary-final btn-xs"> Limpiar </button>
      </div>
 
      {/* Estados */}
      {loading && <p>Cargando solicitudes de compra...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loading && !error && filtered.length === 0 && (<p>No hay solicitudes de compra para los filtros seleccionados.</p>)}
 
      {/* Tabla */}
      <div className="tc-wrap">
        <table>
          <thead>
            <tr>
              <th><span title="ID">ID</span></th>
              <th><span title="Solicitada por">Solicitada por</span></th>
              <th><span title="Fecha de solicitud">Fecha de solicitud</span></th>
              <th><span title="Dispositivo">Dispositivo</span></th>
              <th><span title="CO">CO</span></th>
              <th><span title="UN">UN</span></th>
              <th><span title="Centro de costos">Centro de costos</span></th>
              <th><span title="Cargar A">Cargar A</span></th>
              <th><span title="Estado">Estado</span></th>
              <th><span title="Acciones">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((compra) => (
              <tr key={compra.Id}>
                <td>{compra.Id}</td>
                <td><label title={compra.SolicitadoPor}>{compra.SolicitadoPor}</label></td>
                <td><label title={toGraphDateOnly(compra.FechaSolicitud)}>{toGraphDateOnly(compra.FechaSolicitud)}</label></td>
                <td><label title={compra.Dispositivo}>{compra.Dispositivo}</label></td>
                <td><label title={compra.CO}>{compra.CO}</label></td>
                <td><label title={compra.UN}>{compra.UN}</label></td>
                <td><label title={compra.CCosto}>{compra.CCosto}</label></td>
                <td><label title={compra.CargarA}>{compra.CargarA}</label></td>
                <td><label title={compra.Estado}>{compra.Estado}</label></td>
                <td>
                  {["completado", "completada"].includes((compra?.Estado ?? "").toLowerCase()) && !((compra?.Title ?? "").toLowerCase().includes("contrato")) ? (
                    <span className="badge badge-success" aria-label="Compra completada">
                      La compra ya ha sido completada
                    </span>
                  ) : (
                    <div className="tc-actions">
                      <button type="button" aria-label={`Siguiente paso para compra ${compra?.Id ?? ""}`} className="btn btn-secondary-final btn-xs"onClick={(e) => {
                                                                                                                                                                      e.stopPropagation();
                                                                                                                                                                      handleNext(compra?.Id ?? "");
                                                                                                                                                                      setTicketCompra(compra.IdCreado);
                                                                                                                                                                    }}>
                        Siguiente paso
                      </button>

                      {["producto", "alquiler"].includes((compra?.Title ?? "").trim().toLowerCase()) && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setOpenModal(true);}} className="btn btn-terciary btn-xs">
                          Inscribir
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
 
        <div className="pager">
          <button type="button" className="btn btn-secondary-final" onClick={() => onClick(false)}>➕ Registrar compra</button>
          <span className="flex-spacer" />
 
          {/* Derecha: SOLO si hay registros */}
          {filtered.length > 0 && (
            <div className="pager-right">
              <button onClick={reloadAll} disabled={loading || pageIndex <= 1}>Anterior</button>
              <span>Página {pageIndex}</span>
              <button onClick={nextPage} disabled={loading || !hasNext}>Siguiente</button>
              <span style={{ marginLeft: 12 }}>Registros por página:</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} disabled={loading}>
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
 
    <CrearInventarioModal open={openModal} onClose={() => setOpenModal(false)} submitting={loading} IdTicket={ticketCompra}/>
</div>
);
}