import "./InfoTienda.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { ProveedoresService } from "../../../Services/Proveedores.service";
import { useProveedores } from "../../../Funcionalidades/ProveedoresInternet";

/* 3) destructuring con nombre correcto en el tipo */
export default function InfoProveedores() {
  const { Proveedores: ProveedoresSvc} = useGraphServices() as ReturnType<typeof useGraphServices> & {Proveedores: ProveedoresService; };
  const {rows, setFilterMode} = useProveedores(ProveedoresSvc)


  return (
    <section className="store-info w-full max-w-[1100px] mx-auto p-6 md:p-10">
      <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Proveedores de internet</h3>

      <form className="store-actions">
        {/* 👉 Desplegable a la derecha */}
        <div className="store-actions__right">
          <label className="sr-only" htmlFor="proveedor">Proveedor</label>
          <select id="proveedor" className="px-4 py-3 text-sm shadow-sm" aria-label="Proveedor" onChange={(e) => setFilterMode(e.target.value)}>
            <option value="tigo">Tigo</option>
            <option value="claro">Claro</option>
          </select>
        </div>
      </form>

      <div className="card mt-6 overflow-hidden">
        <div className="store-scroll">
          <table className="w-full border-collapse">
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
