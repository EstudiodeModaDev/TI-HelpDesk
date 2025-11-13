// src/components/Facturas/FacturasLista/FacturasLista.tsx
import { useEffect, useState } from "react";
import FacturaFiltros from "../FacturaFiltros/FacturaFiltros";
import FacturaEditar from "../FacturaEditar/FacturaEditar";
import { useFacturas } from "../../../Funcionalidades/RegistrarFactura";
import type { ReFactura } from "../../../Models/RegistroFacturaInterface";
import "./FacturasLista.css";
import { truncateNoCutGraphemes } from "../../../utils/Commons";

// NUEVAS IMPORTACIONES
import { useGraphServices } from "../../../graph/GrapServicesContext";
import { DistribucionFacturaService } from "../../../Services/DistribucionFactura.service";
// import FacturaDistribuidaModal from "../FacturaDistribuidaModal/FacturaDistribuidaModal"; // ajusta ruta si la colocas en otra carpeta
import type { DistribucionFacturaData } from "../../../Models/DistribucionFactura";
import FacturaDistribuidaModal from "../DistribucionFactura/FacturaDistribuidaModal";

export default function FacturasLista({ onVolver }: { onVolver: () => void }) {
  const { obtenerFacturas } = useFacturas();
  const { graph } = useGraphServices();

  const distService = new DistribucionFacturaService(graph);

  const [facturas, setFacturas] = useState<ReFactura[]>([]);
  const [facturasFiltradas, setFacturasFiltradas] = useState<ReFactura[]>([]);
  const [facturaEdit, setFacturaEdit] = useState<ReFactura | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Estado para modal de distribución
  const [distribucionSel, setDistribucionSel] = useState<DistribucionFacturaData | null>(null);
  const [loadingDistribucion, setLoadingDistribucion] = useState(false);

  useEffect(() => {
    const cargarFacturas = async () => {
      try {
        const lista = await obtenerFacturas();
        setFacturas(lista);
        setFacturasFiltradas(lista);
      } catch (err) {
        console.error("Error al cargar facturas:", err);
      }
    };
    cargarFacturas();
  }, [obtenerFacturas]);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const aplicarFiltros = (filtros: Partial<ReFactura>) => {
    const filtradas = facturas.filter((f) => {
      const coincideFecha = filtros.FechaEmision
        ? f.FechaEmision?.slice(0, 10) === filtros.FechaEmision
        : true;
      const coincideFechaEnt = filtros.FecEntregaCont
        ? f.FecEntregaCont?.slice(0, 10) === filtros.FecEntregaCont
        : true;
      const coincideNumero = filtros.NoFactura
        ? f.NoFactura?.toLowerCase().includes(filtros.NoFactura.toLowerCase())
        : true;
      const coincideProveedor = filtros.Proveedor
        ? f.Proveedor?.toLowerCase().includes(filtros.Proveedor.toLowerCase())
        : true;
      const coincideNIT = filtros.Title
        ? f.Title?.toLowerCase().includes(filtros.Title.toLowerCase())
        : true;
      const coincideItem = filtros.Items ? f.Items === filtros.Items : true;
      const coincidecc = filtros.CC ? f.CC === filtros.CC : true;
      const coincideco = filtros.CO ? f.CO === filtros.CO : true;
      const coincideun = filtros.un ? f.un === filtros.un : true;
      const coincideERP = filtros.DocERP
        ? f.DocERP?.toLowerCase().includes(filtros.DocERP.toLowerCase())
        : true;

      return (
        coincideFecha &&
        coincideNumero &&
        coincideProveedor &&
        coincideNIT &&
        coincideItem &&
        coincideFechaEnt &&
        coincidecc &&
        coincideco &&
        coincideun &&
        coincideERP
      );
    });

    setFacturasFiltradas(filtradas);
  };

  // NUEVO: abrir modal de distribución asociada
  const abrirModalDistribucion = async (idDistrubuida?: string) => {
    if (!idDistrubuida) return;
    try {
      setLoadingDistribucion(true);
      const dist = await distService.get(String(idDistrubuida));
      setDistribucionSel(dist);
    } catch (err) {
      console.error("Error al obtener distribución:", err);
      alert("No se pudo cargar la distribución asociada. Revisa la consola.");
    } finally {
      setLoadingDistribucion(false);
    }
  };

  return (
    <div className="facturas-lista">
      {mensaje && <div className="notificacion">{mensaje}</div>}

      <FacturaFiltros onFiltrar={aplicarFiltros} />

      <div className="tabla-scroll">
        <table className="tabla-facturas">
          <thead>
            <tr>
              <th>ID</th>
              <th>FechaEmi</th>
              <th>N°Fac</th>
              <th>Proveedor</th>
              <th>NIT</th>
              <th>Valor</th>
              <th>Items</th>
              <th>CC</th>
              <th>CO</th>
              <th>UN</th>
              <th>FechaCont</th>
              <th>DocERP</th>
              <th>Detalle</th>
              <th>Obser</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturasFiltradas.length > 0 ? (
              facturasFiltradas.map((factura, index) => (
                <tr key={factura.id0 || index}>
                  <td>{index + 1}</td>
                  <td>{formatearFecha(factura.FechaEmision)}</td>
                  <td>{factura.NoFactura}</td>
                  <td>
                    <span className="one-line-ellipsis" title={factura.Proveedor}>   
                      {truncateNoCutGraphemes(factura.Proveedor ?? "", 20)}
                    </span></td>
                  <td>{factura.Title}</td>
                  <td>
                    {factura.ValorAnIVA.toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    })}
                  </td>
                  <td>{factura.Items}</td>
                  <td>{factura.CC}</td>
                  <td>{factura.CO}</td>
                  <td>{factura.un}</td>
                  <td>{formatearFecha(factura.FecEntregaCont ?? "")}</td>
                  <td>{factura.DocERP}</td>
                  <td>
                    <span className="one-line-ellipsis" title={factura.DetalleFac}>   
                      {truncateNoCutGraphemes(factura.DetalleFac ?? "", 20)}
                    </span>
                  </td>
                  <td>
                    <span className="one-line-ellipsis" title={factura.Observaciones}>
                      {truncateNoCutGraphemes(factura.Observaciones ?? "", 20)}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-primary btn-xs" title="Editar factura" onClick={() => setFacturaEdit(factura)}>
                      ✏️
                    </button>

                    {/* NUEVO: mostrar botón para ver distribución solo si existe IdDistrubuida */}
                    {factura.IdDistrubuida ? (
                      <button className="btn btn-secondary-final btn-xs" title="Ver distribución" onClick={() => abrirModalDistribucion(factura.IdDistrubuida)} style={{ marginLeft: 8 }}>
                        📊
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={15} style={{ textAlign: "center", padding: "1rem" }}>
                  No hay facturas que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button className="btn btn-secondary-final btn-large" onClick={onVolver}>
        🔽 Registrar factura
      </button>

      {facturaEdit && (
        <FacturaEditar
          factura={facturaEdit}
          onClose={() => setFacturaEdit(null)}
          onEliminar={(idEliminado) => {
            setFacturas((prev) => prev.filter((f) => f.id0 !== idEliminado));
            setFacturasFiltradas((prev) => prev.filter((f) => f.id0 !== idEliminado));
            setMensaje("🗑️ Factura eliminada correctamente");
            setTimeout(() => setFacturaEdit(null), 100);
          }}
          onGuardar={async () => {
            try {
              const lista = await obtenerFacturas();
              setFacturas(lista);
              setFacturasFiltradas(lista);
              setMensaje("✅ Factura actualizada correctamente");
              setTimeout(() => setFacturaEdit(null), 100);
            } catch (err) {
              console.error("Error al refrescar lista tras editar:", err);
            }
          }}
        />
      )}

      {/* Modal de distribución */}
      {distribucionSel && (
        <FacturaDistribuidaModal
          distribucion={distribucionSel}
          onClose={() => setDistribucionSel(null)}
        />
      )}

      {loadingDistribucion && (
        <div className="loading-overlay">
          Cargando distribución...
        </div>
      )}
    </div>
  );
}
