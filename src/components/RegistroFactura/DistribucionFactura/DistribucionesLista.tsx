import React, { useState } from "react";
import { useDistribucionFactura } from "../../../Funcionalidades/DistribucionFactura";
import type { DistribucionFacturaData } from "../../../Models/DistribucionFactura";
// import DistribucionFacturaEditar from "../DistribucionFacturaEditar/DistribucionFacturaEditar";
import "./DistribucionesLista.css";
import DistribucionFacturaEditar from "./DistribucionFacturaEditar";

interface DistribucionesListaProps {
  onVolver: () => void;
}

const DistribucionesLista: React.FC<DistribucionesListaProps> = ({ onVolver }) => {
  const { distribuciones, loading, error, recargarDistribuciones } = useDistribucionFactura();

  // 🔹 Estado para controlar el modal de edición
  const [editando, setEditando] = useState<DistribucionFacturaData | null>(null);

  const handleCerrarModal = () => setEditando(null);

  const handleGuardado = () => {
    recargarDistribuciones?.(); // si tu hook tiene esta función
    setEditando(null);
  };

  const handleEliminar = (id: string) => {
    console.log(`Distribución ${id} eliminada.`);
    recargarDistribuciones?.();
  };

   const formatearFecha = (fecha?: string) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="distribuciones-lista-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">📋 Distribuciones registradas</h4>
        <button className="btn btn-secondary btn-personalized" onClick={onVolver}>
          🔙 Volver al formulario
        </button>
      </div>

      {loading && <p>Cargando distribuciones...</p>}
      {error && <p style={{ color: "red" }}>⚠️ {error}</p>}

      {!loading && !error && distribuciones.length === 0 && (
        <p>No hay distribuciones registradas todavía.</p>
      )}

      {!loading && !error && distribuciones.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Proveedor</th>
                <th>Título</th>
                <th>N° Factura</th>
                <th>Fecha Emisión</th>
                <th>Costo Total Imp.</th>
                <th>Marcas Nacionales</th>
                <th>Marcas Importadas</th>
                <th>CEDI</th>
                <th>Serv. Admin.</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {distribuciones.map((item) => (
                <tr key={item.Id ?? item.NoFactura}>
                  <td >{item.Proveedor}</td>
                  <td>{item.Title}</td>
                  <td>{item.NoFactura}</td>
                  <td>{formatearFecha(item.FechaEmision)}</td>
                  <td>{item.CosToImp?.toLocaleString("es-CO", { style: "currency", currency: "COP" })}</td>
                  <td>{item.CosTotMarNacionales?.toLocaleString("es-CO", { style: "currency", currency: "COP" })}</td>
                  <td>{item.CosTotMarImpor?.toLocaleString("es-CO", { style: "currency", currency: "COP" })}</td>
                  <td>{item.CosTotCEDI?.toLocaleString("es-CO", { style: "currency", currency: "COP" })}</td>
                  <td>{item.CosTotServAdmin?.toLocaleString("es-CO", { style: "currency", currency: "COP" })}</td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => setEditando(item)}
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔹 Modal de edición */}
      {editando && (
        <DistribucionFacturaEditar
          distribucion={editando}
          onClose={handleCerrarModal}
          onGuardar={handleGuardado}
          onEliminar={handleEliminar}
        />
      )}
    </div>
  );
};

export default DistribucionesLista;
