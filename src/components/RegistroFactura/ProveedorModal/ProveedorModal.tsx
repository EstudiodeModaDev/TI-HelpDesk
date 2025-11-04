import React, { useState } from "react";
import "./ProveedorModal.css";

interface ProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proveedor: { Title: string; Nombre: string }) => Promise<void>;
}

const ProveedorModal: React.FC<ProveedorModalProps> = ({ isOpen, onClose, onSave }) => {
  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !nit.trim()) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      setLoading(true);
      await onSave({ Title: nit, Nombre: nombre });
      setNombre("");
      setNit("");
      onClose();
    } catch (err) {
      setError("Error al guardar el proveedor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3>Agregar nuevo proveedor</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Nombre:
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del proveedor"
            />
          </label>

          <label>
            NIT:
            <input
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="NIT del proveedor"
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-buttons">
            <button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={onClose} className="btn-cancelar">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProveedorModal;
