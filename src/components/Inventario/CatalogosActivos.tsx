import * as React from "react";
import "./CatalogosActivos.css";
import type {
  ActivoTI,
  CategoriaActivo,
  EstadoActivo,
  Ubicacion_Tipo,
} from "../../Models/ActivoTI";
import {
  CATEGORIAS_ACTIVO,
  ESTADOS_ACTIVO,
  UBICACIONES_ACTIVO,
} from "../../Models/ActivoTI";
import { useRepositories } from "../../repositories/repositoriesContext";
import { useActivosTI } from "../../Funcionalidades/inventario/useActivosTI";
import { ModalAltaActivos } from "./ModalAltaActivo";
import { ModalAsignarActivo } from "./ModalAsignarActivo";

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
    categoriaFiltro,
    setCategoriaFiltro,
    estadoFiltro,
    setEstadoFiltro,
    ubicacionFiltro,
    setUbicacionFiltro,
    pageIndex,
    pageSize,
    setPageSize,
    total,
    hasNext,
    nextPage,
    prevPage,
  } = useActivosTI({ ActivosSvc: activosTI! });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (pageIndex - 1) * pageSize + 1;
  const rangeEnd = Math.min(pageIndex * pageSize, total);
  const [activoEditar, setActivoEditar] = React.useState<
    ActivoTI | null | undefined
  >(undefined);
  const [activoAsignar, setActivoAsignar] = React.useState<ActivoTI | null>(
    null,
  );

  const handleNuevo = () => setActivoEditar(null);
  const handleEditar = (activo: ActivoTI) => setActivoEditar(activo);
  const handleCerrarModal = () => setActivoEditar(undefined);
  const handleAsignar = (activo: ActivoTI) => setActivoAsignar(activo);
  const handleCerrarAsignar = () => setActivoAsignar(null);

  if (activoEditar !== undefined) {
    return (
      <ModalAltaActivos
        activoToEdit={activoEditar}
        onSaved={handleCerrarModal}
        onClose={handleCerrarModal}
      />
    );
  }

  if (activoAsignar) {
    return (
      <ModalAsignarActivo
        activo={activoAsignar}
        onSaved={handleCerrarAsignar}
        onClose={handleCerrarAsignar}
      />
    );
  }

  return (
    <section className="activos-page" aria-label="Catálogo de activos TI">
      <header className="activos-header">
        <h2>Catálogo de Activos TI</h2>
        <button
          type="button"
          className="btn-nuevo-activo"
          onClick={handleNuevo}
        >
          + Nuevo Activo
        </button>
      </header>

      <div className="activos-filtros">
        <input
          type="text"
          placeholder="Buscar por código, serie, tipo, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={categoriaFiltro}
          onChange={(e) =>
            setCategoriaFiltro(e.target.value as CategoriaActivo | "")
          }
          title="Categoría"
        >
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORIAS_ACTIVO).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value as EstadoActivo | "")}
          title="Estado"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_ACTIVO).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={ubicacionFiltro}
          onChange={(e) =>
            setUbicacionFiltro(e.target.value as Ubicacion_Tipo | "")
          }
          title="Ubicación"
        >
          <option value="">Todas las ubicaciones</option>
          {Object.entries(UBICACIONES_ACTIVO).map(([value, label]) => (
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
                <th>Código</th>
                <th>Categoría</th>
                <th>Tipo / Subtipo</th>
                <th>Marca / Modelo</th>
                <th>N° Serie</th>
                <th>Estado</th>
                <th>Ubicación</th>

                <th aria-label="Acciones"> </th>
              </tr>
            </thead>
            <tbody>
              {activos.map((activo) => (
                <tr
                  key={activo.id}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleEditar(activo);
                    }
                  }}
                >
                  <td>{activo.codigo_inventario}</td>
                  <td>
                    {CATEGORIAS_ACTIVO[activo.categoria] ?? activo.categoria}
                  </td>
                  <td>
                    {activo.tipo}
                    {activo.subtipo ? ` / ${activo.subtipo}` : ""}
                  </td>
                  <td>
                    {activo.marca || "—"}
                    {activo.modelo ? ` / ${activo.modelo}` : ""}
                  </td>
                  <td>{activo.numero_serie}</td>
                  <td>{ESTADOS_ACTIVO[activo.estado] ?? activo.estado}</td>
                  <td>
                    {UBICACIONES_ACTIVO[activo.ubicacion_tipo] ??
                      activo.ubicacion_tipo}
                  </td>

                  <td className="cell-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Editar"
                      aria-label={`Editar ${activo.codigo_inventario}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditar(activo);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Asignar usuario"
                      aria-label={`Asignar ${activo.codigo_inventario}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAsignar(activo);
                      }}
                    >
                      ⇄
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
    </section>
  );
}
