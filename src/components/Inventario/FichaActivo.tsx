// src/components/Inventario/FichaActivo.tsx
import * as React from "react";
import type { ActivoTI, Ubicacion_Tipo } from "../../Models/ActivoTI";
import { Monitor } from "lucide-react";

import "./FichaActivo.css";
import { ESTADOS_ACTIVO } from "../../Models/ActivosTIMovimientos";
import { UBICACIONES_ACTIVO } from "../../Models/ActivoTI";
import type { EstadoActivo } from "../../Models/ActivosTIMovimientos";
import { toISODateTimeFlex } from "../../utils/Date";
import { useRepositories } from "../../repositories/repositoriesContext";
import { useActivoMovimientos } from "../../Funcionalidades/inventario/useActivoMovimientos";
import { useActivoTicket } from "../../Funcionalidades/inventario/useActivoTickets";
import type {
  MovimientoSort,
  MovimientoSortField,
} from "../../Funcionalidades/inventario/useActivoMovimientos";
import { colorEstadoActivo } from "../../Funcionalidades/inventario/utils/ActivosColors";

import { useGraphServices } from "../../graph/GrapServicesContext";
import type { prestamos } from "../../Models/prestamos";
import { BuscadorActivo } from "./BuscadorActivo";
import { useActivoPrestamo } from "../../Funcionalidades/inventario/useActivoPrestamo";

function nombreUbicacion(ubicacion?: string | null) {
  if (!ubicacion) return "–";
  return UBICACIONES_ACTIVO[ubicacion as Ubicacion_Tipo] ?? ubicacion;
}
function renderSortIndicator(
  field: MovimientoSortField,
  sorts: MovimientoSort[],
) {
  const idx = sorts.findIndex((s) => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === "asc" ? "▲" : "▼";
  return (
    <span style={{ marginLeft: 6, opacity: 0.85 }}>
      {dir}
      {sorts.length > 1 ? ` ${idx + 1}` : ""}
    </span>
  );
}

type FichaActivoProps = {
  activo?: ActivoTI;
  onClose?: () => void;
};

// Sin `activo` (p. ej. desde el menú) se pide elegirlo primero.
export default function FichaActivo({ activo, onClose }: FichaActivoProps) {
  const [elegido, setElegido] = React.useState<ActivoTI | null>(null);
  const actual = activo ?? elegido;

  if (!actual) {
    return <FichaActivoSelector onSelect={setElegido} />;
  }

  return (
    <FichaActivoDetalle
      key={actual.id}
      activo={actual}
      onClose={activo ? onClose : () => setElegido(null)}
    />
  );
}

// Pantalla para elegir el activo cuando se entra a la ficha desde el menú
function FichaActivoSelector({
  onSelect,
}: {
  onSelect: (activo: ActivoTI) => void;
}) {
  return (
    <div className="ficha-activo ficha-activo-selector">
      <div className="ficha-activo-selector__header">
        <h2>Ficha de seguimiento</h2>
        <p>
          Historial completo de movimientos y tickets asociados a un activo.
        </p>
      </div>

      <div className="ficha-activo-selector__tarjeta">
        <label
          htmlFor="ficha_buscar_activo"
          className="ficha-activo-selector__label"
        >
          Activo
        </label>
        <BuscadorActivo
          inputId="ficha_buscar_activo"
          onChange={(activo) => activo && onSelect(activo)}
        />
      </div>
    </div>
  );
}

function FichaActivoDetalle({
  activo: activoInicial,
  onClose,
}: FichaActivoProps & { activo: ActivoTI }) {
  // Copia local: se refresca después de una devolución
  const [activo, setActivo] = React.useState<ActivoTI>(activoInicial);
  const activoId = activo?.id;

  const { movimientosTI, activotickets, activosTI } = useRepositories();
  const {
    movimientos,
    loading,
    error,
    search,
    setSearch,
    tipoEventoFiltro,
    setTipoEventoFiltro,
    pageIndex,
    pageSize,
    setPageSize,
    hasNext,
    nextPage,
    prevPage,
    sorts,
    toggleSort,
    loadAll: recargarMovimientos,
  } = useActivoMovimientos({ MovimientosSvc: movimientosTI!, activoId });
  const {
    activoticket: incidencias,
    loading: loadingIncidencias,
    loadActivoTicket,
  } = useActivoTicket({ ActivosTicketSvc: activotickets! });

  React.useEffect(() => {
    if (activoId) loadActivoTicket({ activo_id: activoId });
  }, [activoId, loadActivoTicket]);

  const { prestamos: prestamosSvc } = useGraphServices();
  const [prestamosActivo, setPrestamosActivo] = React.useState<prestamos[]>([]);

  React.useEffect(() => {
    if (!activoId || !prestamosSvc) return;
    prestamosSvc
      .getAll({ filter: `fields/Id_dispositivo eq '${activoId}'` })
      .then((res) => setPrestamosActivo(res.items ?? []))
      .catch((e) =>
        console.error("No se pudo cargar el historial de préstamos:", e),
      );
  }, [activoId, prestamosSvc]);

  const prestamoActual = prestamosActivo.find(
    (p) => String(p.Id) === String(activo.prestamo_activo_id),
  );

  // Devolución: solo aplica si el activo está en préstamo
  const { devolverPrestamoActivo } = useActivoPrestamo();
  const [devolviendo, setDevolviendo] = React.useState(false);
  const [buenEstado, setBuenEstado] = React.useState<boolean | null>(null);
  const [comentarioDevolucion, setComentarioDevolucion] = React.useState("");
  const [guardandoDevolucion, setGuardandoDevolucion] = React.useState(false);
  const [errorDevolucion, setErrorDevolucion] = React.useState<string | null>(
    null,
  );
  const puedeDevolver = activo.estado === "en_prestamo" && !!prestamoActual;

  const cancelarDevolucion = () => {
    setDevolviendo(false);
    setBuenEstado(null);
    setComentarioDevolucion("");
    setErrorDevolucion(null);
  };

  const confirmarDevolucion = async () => {
    if (!prestamoActual || buenEstado === null) return;
    setGuardandoDevolucion(true);
    setErrorDevolucion(null);
    try {
      const ok = await devolverPrestamoActivo(
        prestamoActual,
        buenEstado,
        comentarioDevolucion,
      );
      if (!ok) {
        setErrorDevolucion("No se pudo registrar la devolución");
        return;
      }
      // Refresca la ficha: estado del activo y bitácora
      const res = await activosTI?.getActivoById(activo.id);
      if (res?.status && res.data) setActivo(res.data);
      recargarMovimientos();
      cancelarDevolucion();
    } finally {
      setGuardandoDevolucion(false);
    }
  };

  return (
    <div className="ficha-activo">
      <div className="ficha-activo-pagina">
        <h2>Ficha de seguimiento</h2>
        <p>
          Historial completo de movimientos y tickets asociados a un activo.
        </p>
      </div>

      <div className="ficha-activo-header">
        <div className="ficha-activo-tarjeta__top">
          <div className="ficha-activo-tarjeta__icono">
            <Monitor size={30} />
          </div>

          <div className="ficha-activo-tarjeta__info">
            <span className="ficha-activo-tarjeta__codigo">
              {activo.codigo_inventario}
            </span>
            <h3 className="ficha-activo-tarjeta__nombre">
              {[activo.marca, activo.modelo].filter(Boolean).join(" ") ||
                activo.tipo}
            </h3>
            <span className="ficha-activo-tarjeta__sub">
              S/N: {activo.numero_serie} · {activo.tipo}
            </span>
          </div>

          <div className="ficha-activo-titulo__acciones">
            <span
              className="ficha-activo-estado"
              style={
                {
                  "--c": colorEstadoActivo(activo.estado),
                } as React.CSSProperties
              }
            >
              {ESTADOS_ACTIVO[activo.estado] ?? activo.estado}
            </span>
            {puedeDevolver && !devolviendo && (
              <button
                type="button"
                className="ficha-activo-btn-devolver"
                onClick={() => setDevolviendo(true)}
              >
                Devolver
              </button>
            )}
            <button
              type="button"
              className="ficha-activo-btn-secundario"
              onClick={onClose}
            >
              Volver
            </button>
          </div>
        </div>

        {devolviendo && (
          <div className="ficha-activo-devolucion">
            <span className="ficha-activo-devolucion__label">
              ¿En qué estado llega el equipo?
            </span>
            <div
              className="ficha-activo-devolucion__opciones"
              role="radiogroup"
            >
              {[true, false].map((bueno) => (
                <button
                  key={String(bueno)}
                  type="button"
                  role="radio"
                  aria-checked={buenEstado === bueno}
                  className={
                    "ficha-activo-devolucion__opcion" +
                    (buenEstado === bueno ? " is-activo" : "")
                  }
                  onClick={() => setBuenEstado(bueno)}
                >
                  {bueno ? "Buen estado" : "Mal estado"}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              placeholder="Comentario (opcional)"
              value={comentarioDevolucion}
              onChange={(e) => setComentarioDevolucion(e.target.value)}
            />
            {errorDevolucion && (
              <small className="ficha-activo-devolucion__error">
                {errorDevolucion}
              </small>
            )}
            <div className="ficha-activo-devolucion__acciones">
              <button
                type="button"
                className="ficha-activo-btn-devolver"
                disabled={buenEstado === null || guardandoDevolucion}
                onClick={confirmarDevolucion}
              >
                {guardandoDevolucion ? "Guardando..." : "Confirmar devolución"}
              </button>
              <button
                type="button"
                className="ficha-activo-btn-secundario"
                disabled={guardandoDevolucion}
                onClick={cancelarDevolucion}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        <dl className="ficha-activo-tarjeta__datos">
          <div>
            <dt>Ubicación actual</dt>
            <dd>
              {UBICACIONES_ACTIVO[activo.ubicacion_tipo] ??
                activo.ubicacion_tipo}
            </dd>
          </div>
          <div>
            <dt>Usuario actual</dt>
            <dd>{activo.nombre_usuario || "Sin asignar"}</dd>
          </div>
          <div>
            <dt>Ingresó el</dt>
            <dd>{activo.fecha_ingreso?.slice(0, 10) || "–"}</dd>
          </div>
          {prestamoActual && (
            <div>
              <dt>En préstamo a</dt>
              <dd>
                {prestamoActual.nombreSolicitante} · desde{" "}
                {toISODateTimeFlex(prestamoActual.FechaPrestamo)}
              </dd>
            </div>
          )}
        </dl>
      </div>
      <div className="table-wrap">
        <div className="ficha-activo-filtros">
          <input
            type="text"
            placeholder="Buscar (comentario, usuario destino, responsable)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={tipoEventoFiltro}
            onChange={(e) =>
              setTipoEventoFiltro(e.target.value as EstadoActivo | "")
            }
            title="Estado Nuevo"
          >
            <option value="">Todos</option>
            {Object.entries(ESTADOS_ACTIVO).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading && <p>Cargando movimientos…</p>}
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
        {!loading && !error && movimientos.length === 0 && (
          <p>No hay movimientos para los filtros seleccionados.</p>
        )}

        <table>
          <thead>
            <tr>
              <th
                role="button"
                tabIndex={0}
                onClick={(e) => toggleSort("fecha_evento", e.shiftKey)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    toggleSort("fecha_evento", e.shiftKey);
                }}
                aria-label="Ordenar por fecha"
                style={{ cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Fecha {renderSortIndicator("fecha_evento", sorts)}
              </th>

              <th>Estado anterior</th>

              <th
                role="button"
                tabIndex={0}
                onClick={(e) => toggleSort("estado_nuevo", e.shiftKey)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    toggleSort("estado_nuevo", e.shiftKey);
                }}
                aria-label="Ordenar por estado"
                style={{ cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Estado Nuevo {renderSortIndicator("estado_nuevo", sorts)}
              </th>

              <th>Ubicación origen</th>
              <th>Ubicación destino</th>
              <th>Usuario origen</th>
              <th>Usuario destino</th>
              <th>Ticket</th>

              <th
                role="button"
                tabIndex={0}
                onClick={(e) => toggleSort("responsable_nombre", e.shiftKey)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    toggleSort("responsable_nombre", e.shiftKey);
                }}
                aria-label="Ordenar por responsable"
                style={{ cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Responsable {renderSortIndicator("responsable_nombre", sorts)}
              </th>

              <th>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((movimiento) => (
              <tr key={movimiento.id}>
                <td>{toISODateTimeFlex(movimiento.fecha_evento) || "–"}</td>
                <td>
                  {movimiento.estado_anterior
                    ? (ESTADOS_ACTIVO[
                        movimiento.estado_anterior as EstadoActivo
                      ] ?? movimiento.estado_anterior)
                    : "–"}
                </td>
                <td>
                  {movimiento.estado_nuevo ? (
                    <span
                      className="ficha-activo-estado"
                      style={
                        {
                          "--c": colorEstadoActivo(movimiento.estado_nuevo),
                        } as React.CSSProperties
                      }
                    >
                      {ESTADOS_ACTIVO[movimiento.estado_nuevo] ??
                        movimiento.estado_nuevo}
                    </span>
                  ) : (
                    "–"
                  )}
                </td>
                <td>{nombreUbicacion(movimiento.ubicacion_origen || "–")}</td>
                <td>{nombreUbicacion(movimiento.ubicacion_destino || "–")}</td>
                <td title={movimiento.usuario_origen_correo || ""}>
                  {movimiento.usuario_origen_nombre ||
                    movimiento.usuario_origen_correo ||
                    "–"}
                </td>
                <td title={movimiento.usuario_destino_correo || ""}>
                  {movimiento.usuario_destino_nombre ||
                    movimiento.usuario_destino_correo ||
                    "–"}
                </td>
                <td>{movimiento.ticket_id || "–"}</td>
                <td>{movimiento.responsable_nombre}</td>
                <td>
                  <span title={movimiento.comentario}>
                    {movimiento.comentario || "–"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {movimientos.length > 0 && (
          <div className="paginacion">
            <button onClick={prevPage} disabled={loading || pageIndex <= 1}>
              Anterior
            </button>
            <span>Página {pageIndex}</span>
            <button onClick={nextPage} disabled={loading || !hasNext}>
              Siguiente
            </button>

            <label
              htmlFor="page-size"
              style={{ marginLeft: 12, marginRight: 8 }}
            >
              Movimientos por página:
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPageSize(parseInt(e.target.value, 10))
              }
              disabled={loading}
            >
              {[10, 15, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="ficha-activo-incidencias">
        <h3>Tickets asociados ({incidencias.length})</h3>
        {loadingIncidencias && <p>Cargando tickets asociados..</p>}
        {!loadingIncidencias && incidencias.length === 0 && (
          <p>Este activo no tiene tickets asociados.</p>
        )}
        <ul>
          {incidencias.map((i) => (
            <li key={i.id}>
              Ticket #{i.ticket_id} · {toISODateTimeFlex(i.fecha_vinculacion)} ·{" "}
              {i.vinculado_por_nombre}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
