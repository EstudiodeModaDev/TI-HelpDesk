import * as React from "react";
import "./CatalogosActivos.css";
import type { ActivoTI } from "../../../Models/ActivoTI";
import { useRepositories } from "../../../repositories/repositoriesContext";
import { ESTADOS_ACTIVO } from "../../../Models/ActivosTIMovimientos";
import { useActivosTI } from "../../../Funcionalidades/inventario/useActivosTI";
import { ModalAsignarActivo } from "../ModalAsignarActivo";
import FichaActivo from "../FichaActivo";
import { ModalDetalleActivo } from "./ModalDetalleActivo";
import type { EstadoActivo } from "../../../Models/ActivosTIMovimientos";
import { colorEstadoActivo } from "../../../Funcionalidades/inventario/utils/ActivosColors";

const PAGE_SIZE = [10, 20, 50, 100];

interface CatalogoActivosProps {}

export default function CatalogosActivos({}: CatalogoActivosProps) {
  const { activosTI } = useRepositories();
  const {
    activos,
    loading,
    error,
    search,
    setSearch,
    estadoFiltro,
    setEstadoFiltro,

    pageIndex,
    pageSize,
    setPageSize,
    total,
    hasNext,
    nextPage,
    prevPage,
    loadAll,
  } = useActivosTI({ ActivosSvc: activosTI! });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (pageIndex - 1) * pageSize + 1;
  const rangeEnd = Math.min(pageIndex * pageSize, total);
  const [activoAsignar, setActivoAsignar] = React.useState<ActivoTI | null>(
    null,
  );
  const [activoFicha, setActivoFicha] = React.useState<ActivoTI | null>(null);
  const [activoDetalle, setActivoDetalle] = React.useState<ActivoTI | null>(
    null,
  );

  const handleCerrarAsignar = () => setActivoAsignar(null);
  const handleAsignado = () => {
    setActivoAsignar(null);
    loadAll();
  };

  if (activoAsignar) {
    return (
      <ModalAsignarActivo
        activo={activoAsignar}
        onSaved={handleAsignado}
        onClose={handleCerrarAsignar}
      />
    );
  }
  if (activoFicha) {
    return (
      <FichaActivo
        activo={activoFicha}
        onClose={() => {
          setActivoFicha(null);
          loadAll();
        }}
      />
    );
  }

  return (
    <section className="activos-page" aria-label="Catálogo de activos TI">
      <header className="activos-header">
        <h2>Catálogo de Activos TI</h2>
      </header>

      <div className="activos-filtros">
        <input
          type="text"
          placeholder="Buscar por código, serie, tipo, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value as EstadoActivo | "")}
        >
          <option value="">todos los estados</option>
          {Object.entries(ESTADOS_ACTIVO).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Estados de carga / error / vacíos */}
      {loading && <p>Cargando activos…</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loading && !error && activos.length === 0 && (
        <p>No hay activos para los filtros seleccionados.</p>
      )}

      {/* Tabla y Paginación */}
      {!loading && !error && activos.length > 0 && (
        <div className="table-wrap">
          <table className="activos-table">
            <thead>
              <tr>
                <th className="col-codigo">Código</th>
                <th className="col-tipo">Tipo</th>
                <th className="col-marca">Marca</th>
                <th className="col-modelo">Modelo</th>
                <th className="col-estado">Estado</th>
                <th className="col-acciones"></th>
              </tr>
            </thead>
            <tbody>
              {activos.map((activo) => (
                <tr key={activo.id}>
                  <td title={activo.codigo_inventario}>
                    <span className="celda-codigo">
                      {activo.codigo_inventario}
                    </span>
                  </td>

                  <td title={activo.tipo}>{activo.tipo}</td>

                  <td title={activo.marca ?? ""}>{activo.marca || "—"}</td>

                  <td className="celda-muted" title={activo.modelo ?? ""}>
                    {activo.modelo || "—"}
                  </td>

                  <td>
                    <span
                      className="estado-badge"
                      style={
                        {
                          "--c": colorEstadoActivo(activo.estado),
                        } as React.CSSProperties
                      }
                    >
                      {ESTADOS_ACTIVO[activo.estado] ?? activo.estado}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="link-detalle"
                      onClick={() => setActivoDetalle(activo)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="paginacion">
            <button onClick={prevPage} disabled={loading || pageIndex <= 1}>
              Anterior
            </button>
            <span>
              Página {pageIndex} de {totalPages}
            </span>
            <button onClick={nextPage} disabled={loading || !hasNext}>
              Siguiente
            </button>

            <label
              htmlFor="page-size"
              style={{ marginLeft: 12, marginRight: 8 }}
            >
              Activos por página:
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPageSize(parseInt(e.target.value, 10))
              }
              disabled={loading}
            >
              {PAGE_SIZE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <span className="paginacion-total">
              Mostrando {rangeStart}-{rangeEnd} de {total} activos
            </span>
          </div>
        </div>
      )}
      {activoDetalle && (
        <ModalDetalleActivo
          activo={activoDetalle}
          onClose={() => setActivoDetalle(null)}
          onAsignar={() => {
            setActivoAsignar(activoDetalle);
            setActivoDetalle(null);
          }}
          onVerSeguimiento={() => {
            setActivoFicha(activoDetalle);
            setActivoDetalle(null);
          }}
        />
      )}
    </section>
  );
}
