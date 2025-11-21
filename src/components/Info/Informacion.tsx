import * as React from "react";
import StoreInfoPanel from "./InfoTienda/InfoTienda";
import "./Info.css";
import InfoProveedores from "./InfoProveedores/InfoProveedores";

export default function InfoPage() {
  const [orden, setOrden] = React.useState("tiendas");

  return (
    <div className="Info-page">

      <div className="info-toolbar">
        <div className="info-toolbar__right">
          <select  id="orden" className="info-select" value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar resultados">
            <option value="tiendas">Información de Tiendas</option>
            <option value="proveedores">Proveedores de internet</option>
          </select>
        </div>
      </div>

      {orden === "tiendas" ? <StoreInfoPanel /> : <InfoProveedores/>}

    </div>
  );
}
