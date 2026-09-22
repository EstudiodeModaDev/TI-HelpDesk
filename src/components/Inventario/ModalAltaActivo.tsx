import React from "react";
import "./ModalAltaActivos.css";
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

interface ModalAltaActivosProps {
  activoToEdit?: ActivoTI | null;
  onSaved?: () => void;
  onClose?: () => void;
}

export const ModalAltaActivos: React.FC<ModalAltaActivosProps> = ({
  activoToEdit,
  onSaved,
  onClose,
}) => {
  const { activosTI } = useRepositories();
  const { form, formErrors, setField, saveActivo, selectActivo, resetForm } =
    useActivosTI({ ActivosSvc: activosTI! });

  React.useEffect(() => {
    if (activoToEdit) selectActivo(activoToEdit);
    else resetForm();
  }, [activoToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveActivo();
    if (ok) {
      onSaved?.();
      onClose?.();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="activo-form-page">
        <div className="activo-form-header">
          <h2>{activoToEdit ? "Editar Activo TI" : "Nuevo Activo TI"}</h2>
          <p>Ingresa la información detallada del activo en el sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="activo-form-container">
          <div className="form-section">
            <div className="section-title">
              <h3>Información General</h3>
              <span>Datos principales de identificación y clasificación</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="codigo_inventario">
                  Código Inventario <span>*</span>
                </label>
                <input
                  id="codigo_inventario"
                  type="text"
                  required
                  value={form.codigo_inventario ?? ""}
                  onChange={(e) =>
                    setField("codigo_inventario", e.target.value)
                  }
                />
                {formErrors.codigo_inventario && (
                  <small style={{ color: "#dc2626" }}>
                    {formErrors.codigo_inventario}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="numero_serie">
                  Número de Serie <span>*</span>
                </label>
                <input
                  id="numero_serie"
                  type="text"
                  required
                  value={form.numero_serie ?? ""}
                  onChange={(e) => setField("numero_serie", e.target.value)}
                />
                {formErrors.numero_serie && (
                  <small style={{ color: "#dc2626" }}>
                    {formErrors.numero_serie}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="categoria">
                  Categoría <span>*</span>
                </label>
                <select
                  id="categoria"
                  value={form.categoria ?? ""}
                  onChange={(e) =>
                    setField("categoria", e.target.value as CategoriaActivo)
                  }
                >
                  <option value="">Selecciona...</option>
                  {Object.entries(CATEGORIAS_ACTIVO).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {formErrors.categoria && (
                  <small style={{ color: "#dc2626" }}>
                    {formErrors.categoria}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tipo">
                  Tipo <span>*</span>
                </label>
                <input
                  id="tipo"
                  type="text"
                  required
                  placeholder="Ej: Portátil, Monitor"
                  value={form.tipo ?? ""}
                  onChange={(e) => setField("tipo", e.target.value)}
                />
                {formErrors.tipo && (
                  <small style={{ color: "#dc2626" }}>{formErrors.tipo}</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="marca">Marca</label>
                <input
                  id="marca"
                  type="text"
                  value={form.marca ?? ""}
                  onChange={(e) => setField("marca", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="modelo">Modelo</label>
                <input
                  id="modelo"
                  type="text"
                  value={form.modelo ?? ""}
                  onChange={(e) => setField("modelo", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fecha_ingreso">
                  Fecha de ingreso <span>*</span>
                </label>
                <input
                  id="fecha_ingreso"
                  type="date"
                  value={form.fecha_ingreso?.slice(0, 10) ?? ""}
                  onChange={(e) => setField("fecha_ingreso", e.target.value)}
                />
                {formErrors.fecha_ingreso && (
                  <small style={{ color: "#dc2626" }}>
                    {formErrors.fecha_ingreso}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="estado">
                  Estado <span>*</span>
                </label>
                <select
                  id="estado"
                  value={form.estado ?? ""}
                  onChange={(e) =>
                    setField("estado", e.target.value as EstadoActivo)
                  }
                >
                  <option value="">Selecciona...</option>
                  {Object.entries(ESTADOS_ACTIVO).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {formErrors.estado && (
                  <small style={{ color: "#dc2626" }}>
                    {formErrors.estado}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="ubicacion_tipo">
                  Ubicación <span>*</span>
                </label>
                <select
                  id="ubicacion_tipo"
                  value={form.ubicacion_tipo ?? ""}
                  onChange={(e) =>
                    setField("ubicacion_tipo", e.target.value as Ubicacion_Tipo)
                  }
                >
                  <option value="">Selecciona...</option>
                  {Object.entries(UBICACIONES_ACTIVO).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {formErrors.ubicacion_tipo && (
                  <small style={{ color: "#dc2626" }}>
                    {formErrors.ubicacion_tipo}
                  </small>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-title">
              <h3>Asignación y notas</h3>
              <span>Responsable y observaciones adicionales</span>
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas</label>
              <input
                id="notas"
                type="text"
                value={form.notas ?? ""}
                onChange={(e) => setField("notas", e.target.value)}
              />
            </div>
          </div>

          <div className="activo-form-footer">
            <button type="button" onClick={onClose} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" className="btn-guardar">
              {activoToEdit ? "Guardar Cambios" : "Crear Activo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
