import type { ActivoTI } from "../../../Models/ActivoTI";
import "./ModalDetalleActivo.css";
import { UBICACIONES_ACTIVO } from "../../../Models/ActivoTI";
import { ESTADOS_ACTIVO } from "../../../Models/ActivosTIMovimientos";
import { colorEstadoActivo } from "../../../Funcionalidades/inventario/utils/ActivosColors";
import { toISODateFlex } from "../../../utils/Date";

import React from "react";

interface ModalDetalleActivoProps {
  activo: ActivoTI;
  onClose: () => void;
  onAsignar: () => void;
  onVerSeguimiento: () => void;
}

export function ModalDetalleActivo({
  activo,
  onClose,
  onAsignar,
  onVerSeguimiento,
}: ModalDetalleActivoProps) {
  const titulo =
    [activo.marca, activo.modelo].filter(Boolean).join(" ") || activo.tipo;

  return (
    <div className="detalle-overlay" onClick={onClose}>
      <div className="detalle-card" onClick={(e) => e.stopPropagation()}>
        <header className="detalle-header">
          <div>
            <span className="detalle-codigo">{activo.codigo_inventario} </span>
            <h2>{titulo}</h2>
            <span
              className="detalle-badge"
              style={
                {
                  "--c": colorEstadoActivo(activo.estado),
                } as React.CSSProperties
              }
            >
              {ESTADOS_ACTIVO[activo.estado] ?? activo.estado}
            </span>
          </div>
          <button
            type="button"
            className="detalle-cerrar"
            aria-label="Cerrar"
            onClick={onClose}
          >
            X
          </button>
        </header>

        <div className="detalle-grid">
          <div className="detalle-campo">
            <span className="detalle-label">Número de serie</span>
            <span className="detalle-valor">{activo.numero_serie}</span>
          </div>
          <div className="detalle-campo">
            <span className="detalle-label">Tipo</span>
            <span className="detalle-valor">{activo.tipo}</span>
          </div>
          <div className="detalle-campo">
            <span className="detalle-label">Fecha de Ingreso</span>
            <span className="detalle-valor">
              {toISODateFlex(activo.fecha_ingreso) || "—"}
            </span>
          </div>

          <div className="detalle-campo">
            <span className="detalle-label">Ubicacion</span>
            <span className="detalle-valor">
              {UBICACIONES_ACTIVO[activo.ubicacion_tipo] ??
                activo.ubicacion_tipo}
            </span>
          </div>
        </div>

        <div className="detalle-campo">
          <span className="detalle-label">Usuario asignado</span>
          {activo.nombre_usuario ? (
            <div className="detalle-usuario">
              <span className="detalle-avatar">
                {activo.nombre_usuario.charAt(0).toUpperCase()}
              </span>
              <span>{activo.nombre_usuario}</span>
            </div>
          ) : (
            <span className="detalle-valor">—</span>
          )}
        </div>
        <footer className="detalle-acciones">
          <button
            type="button"
            className="btn-primario"
            style={
              { "--c": colorEstadoActivo("Asignado") } as React.CSSProperties
            }
            onClick={onAsignar}
          >
            Asignar activo
          </button>
          <button
            type="button"
            className="btn-secundario"
            onClick={onVerSeguimiento}
          >
            {" "}
            Ver Ficha
          </button>
        </footer>
      </div>
    </div>
  );
}
