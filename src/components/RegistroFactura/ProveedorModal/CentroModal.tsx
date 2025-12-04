import React, { useState } from "react";
import "./ProveedorModal.css"; // puedes reutilizar el mismo estilo

import type { TipoCentroSoportado } from "../../../Funcionalidades/CentrosFactura";

interface CentroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    tipo: TipoCentroSoportado;
    Title: string;  // Nombre
    Codigo: string; // Código
  }) => Promise<void>;
}

const CentroModal: React.FC<CentroModalProps> = ({ isOpen, onClose, onSave }) => {
  const [tipo, setTipo] = useState<TipoCentroSoportado>("CentroCostos");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !codigo.trim()) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      setLoading(true);
      await onSave({
        tipo,
        Title: nombre,
        Codigo: codigo,
      });
      setNombre("");
      setCodigo("");
      setTipo("CentroCostos");
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error al guardar el centro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3>Agregar centro</h3>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Tipo de centro */}
          <label>
            Tipo:
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoCentroSoportado)}
            >
              <option value="CentroCostos">Centro de Costos</option>
              <option value="CentrosOperativos">Centro Operativo</option>
              {/* Cuando tengas la lista de UN:
                <option value="UnidadNegocio">Unidad de Negocio</option>
              */}
            </select>
          </label>

          {/* Nombre (Title en SP) */}
          <label>
            Nombre:
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del centro"
            />
          </label>

          {/* Código (campo Codigo en SP) */}
          <label>
            Código:
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código del centro"
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-buttons">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary-final"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CentroModal;
