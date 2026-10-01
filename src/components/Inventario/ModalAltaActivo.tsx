import React from "react";
import "./ModalAltaActivos.css";
import type {
  // CategoriaActivo,
  Ubicacion_Tipo,
} from "../../Models/ActivoTI";
import { UBICACIONES_ACTIVO } from "../../Models/ActivoTI";
import { useRepositories } from "../../repositories/repositoriesContext";
import { useActivosTI } from "../../Funcionalidades/inventario/useActivosTI";

export const ModalAltaActivos: React.FC = () => {
  const { activosTI } = useRepositories();
  const { form, formErrors, error, loading, setField, saveActivo, resetForm } =
    useActivosTI({ ActivosSvc: activosTI! });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Si guarda bien, el hook ya deja el formulario vacío para el siguiente
    await saveActivo();
  };

  return (
    <div className="activo-form-page alta-activo">
      <div className="activo-form-header">
        <h2>Registrar nuevo activo TI</h2>
        <p>Complete los datos del activo para incorporarlo al inventario</p>
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="activo-form-container">
          <div className="form-section">
            <h3 className="section-title">IDENTIFICACIÓN</h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="codigo_inventario">
                  CÓDIGO DEL ACTIVO <span>*</span>
                </label>
                <input
                  id="codigo_inventario"
                  type="text"
                  required
                  placeholder="Ingrese código del activo"
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
                  NÚMERO DE SERIE<span>*</span>
                </label>
                <input
                  id="numero_serie"
                  type="text"
                  required
                  placeholder="Ingrese número de serie"
                  value={form.numero_serie ?? ""}
                  onChange={(e) => setField("numero_serie", e.target.value)}
                />
                {formErrors.numero_serie && (
                  <small style={{ color: "#dc2626" }}>
                    {formErrors.numero_serie}
                  </small>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">ESPECIFICACIONES</h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="tipo">
                  TIPO <span>*</span>
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
                <label htmlFor="marca">MARCA</label>
                <input
                  id="marca"
                  type="text"
                  placeholder="Ingrese Marca"
                  value={form.marca ?? ""}
                  onChange={(e) => setField("marca", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ubicacion_tipo">
                  UBICACIÓN <span>*</span>
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
              <div className="form-group">
                <label htmlFor="fecha_ingreso">
                  FECHA DE INGRESO <span>*</span>
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

              <div className="form-group form-group--completo">
                <label htmlFor="modelo">MODELO</label>
                <input
                  id="modelo"
                  type="text"
                  placeholder="Ingrese modelo"
                  value={form.modelo ?? ""}
                  onChange={(e) => setField("modelo", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="activo-form-footer">
            <button type="submit" className="btn-guardar" disabled={loading}>
              {loading ? "Guardando..." : "Registrar Activo"}
            </button>
            <button type="button" onClick={resetForm} className="btn-cancelar">
              Limpiar Formulario
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
