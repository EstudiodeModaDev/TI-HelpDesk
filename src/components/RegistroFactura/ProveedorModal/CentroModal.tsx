// ============================================================
// CentroModal.tsx
// ------------------------------------------------------------
// Modal para crear:
//   ✔ Centro de Costos
//   ✔ Centro Operativo
//   ✔ Unidad de Negocio
//
// Usa el hook unificado useCentrosFactura a través de onSave()
// NO guarda nada por su cuenta: solo envía datos al hook.
// ============================================================

import React, { useState } from "react";
import "./ProveedorModal.css"; // Reutilizamos el estilo existente

// Tipo de centro permitido (CC, CO, UN)
import type { TipoCentroSoportado } from "../../../Funcionalidades/CentrosFactura";

interface CentroModalProps {
  isOpen: boolean;
  onClose: () => void;

  // onSave → llama useCentrosFactura().agregarCentro()
  onSave: (payload: {
    tipo: TipoCentroSoportado;
    Title: string;
    Codigo: string;
  }) => Promise<void>;
}

const CentroModal: React.FC<CentroModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  // Estado del formulario
  const [tipo, setTipo] = useState<TipoCentroSoportado>("CentroCostos");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Si el modal está cerrado → no renderizar nada
  if (!isOpen) return null;

  // ============================================================
  // Guardar nueva entrada en la lista correspondiente
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !codigo.trim()) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      setLoading(true);

      // Enviar datos al hook unificado
      await onSave({
        tipo,
        Title: nombre,
        Codigo: codigo,
      });

      // Limpiar formulario
      setNombre("");
      setCodigo("");
      setTipo("CentroCostos");

      // Cerrar modal
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error al guardar el centro");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3>Agregar centro</h3>

        <form onSubmit={handleSubmit} className="modal-form">

          {/* Selección del tipo de centro */}
          <label>
            Tipo:
            <select
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value as TipoCentroSoportado)
              }
            >
              <option value="CentroCostos">Centro de Costos</option>
              <option value="CentrosOperativos">Centro Operativo</option>

              {/* ⭐ Ya podemos activar Unidad de Negocio */}
              <option value="UnidadNegocio">Unidad de Negocio</option>
            </select>
          </label>

          {/* Nombre (Title) */}
          <label>
            Nombre:
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del centro"
            />
          </label>

          {/* Código */}
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
