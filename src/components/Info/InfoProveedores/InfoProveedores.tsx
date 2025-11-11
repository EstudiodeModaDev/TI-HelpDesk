import "./InfoTienda.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { ProveedoresService } from "../../../Services/Proveedores.service";
import { useProveedores } from "../../../Funcionalidades/ProveedoresInternet";

/* 3) destructuring con nombre correcto en el tipo */
export default function InfoProveedores() {
  const { Proveedores: ProveedoresSvc} = useGraphServices() as ReturnType<typeof useGraphServices> & {Proveedores: ProveedoresService; };
  const {rows, setFilterMode} = useProveedores(ProveedoresSvc)


  return (
    <section className="proveedor-info">
      <h3 className="pi-title">Proveedores de internet</h3>

      <form className="pi-actions">
        {/* 👉 Desplegable a la derecha */}
        <div className="pi-actions__right">
          <label className="pi-only" htmlFor="proveedor">Proveedor</label>
          <select id="proveedor" className="pi-select" aria-label="Proveedor" onChange={(e) => setFilterMode(e.target.value)}>
            <option value="tigo">Tigo</option>
            <option value="claro">Claro</option>
          </select>
        </div>
      </form>

      <div className="pi-card">
        <div className="pi-scroll">
          <table className="pi-table">
            <thead>
              <tr>
                <th>Nivel</th>
                <th>Nombre</th>
                <th>Correo Electronico</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((Proveedor) => (
                <tr key={Proveedor.Id}>
                  <td>{Proveedor.Nivel}</td>
                  <td>{Proveedor.Title}</td>
                  <td>{Proveedor.Correoelectronico}</td>
                  <td>{Proveedor.Telefono}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
