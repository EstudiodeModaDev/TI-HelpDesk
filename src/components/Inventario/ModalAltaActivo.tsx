import React, { useState } from "react";
import "./ModalAltaActivos.css";

export interface ActivoTI {
  id?: string;
  codigo_inventario: string;
  numero_serie: string;
  categoria: string;
  tipo: string;
  marca: string;
  modelo: string;
  estado: string;
  tienda_id?: string | number;
  usuario_asignado_nombre?: string;
  usuario_asignado_correo?: string;
}

interface ModalAltaActivosProps {
  onSave?: (activo: ActivoTI) => void;
  onCancel?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  activoToEdit?: ActivoTI | null;
}

export const ModalAltaActivos: React.FC<ModalAltaActivosProps> = ({
  onSave,
  onCancel,
  onClose,
  activoToEdit,
}) => {
  const initialFormState: ActivoTI = {
    codigo_inventario: "",
    numero_serie: "",
    categoria: "Cómputo",
    tipo: "Portátil",
    marca: "",
    modelo: "",
    estado: "disponible",
    tienda_id: "",
    usuario_asignado_nombre: "",
    usuario_asignado_correo: "",
  };

  const [formData, setFormData] = useState<ActivoTI>(
    activoToEdit || initialFormState,
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(formData);
  };

  const handleClose = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  return (
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
                name="codigo_inventario"
                required
                value={formData.codigo_inventario}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="numero_serie">
                Número de Serie <span>*</span>
              </label>
              <input
                id="numero_serie"
                type="text"
                name="numero_serie"
                required
                value={formData.numero_serie}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoria">
                Categoría <span>*</span>
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
              >
                <option value="Cómputo">Cómputo</option>
                <option value="Redes">Redes</option>
                <option value="Periféricos">Periféricos</option>
                <option value="Impresoras">Impresoras</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tipo">
                Tipo <span>*</span>
              </label>
              <input
                id="tipo"
                type="text"
                name="tipo"
                required
                placeholder="Ej: Portátil, Monitor"
                value={formData.tipo}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="marca">Marca</label>
              <input
                id="marca"
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="modelo">Modelo</label>
              <input
                id="modelo"
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="estado">
                Estado <span>*</span>
              </label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="disponible">Disponible</option>
                <option value="asignado">Asignado</option>
                <option value="en_mantenimiento">En Mantenimiento</option>
                <option value="de_baja">De Baja</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tienda_id">Tienda / Ubicación</label>
              <select
                id="tienda_id"
                name="tienda_id"
                value={formData.tienda_id || ""}
                onChange={handleChange}
              >
                <option value="">Selecciona una ubicación...</option>
                <option value="Sede Principal">Tienda</option>
                <option value="Bodega Central">Bodega Central</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-title">
            <h3>Asignación de Usuario</h3>
            <span>Información del responsable asignado</span>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="usuario_asignado_nombre">Nombre Usuario</label>
              <input
                id="usuario_asignado_nombre"
                type="text"
                name="usuario_asignado_nombre"
                value={formData.usuario_asignado_nombre || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="usuario_asignado_correo">Correo Usuario</label>
              <input
                id="usuario_asignado_correo"
                type="email"
                name="usuario_asignado_correo"
                value={formData.usuario_asignado_correo || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="activo-form-footer">
          <button type="button" onClick={handleClose} className="btn-cancelar">
            Cancelar
          </button>
          <button type="submit" className="btn-guardar">
            {activoToEdit ? "Guardar Cambios" : "Crear Activo"}
          </button>
        </div>
      </form>
    </div>
  );
};
