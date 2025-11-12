import type { ReactNode } from "react";
import "./InfoTienda.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { InternetService } from "../../../Services/Internet.service";
import { useInfoInternetTiendas } from "../../../Funcionalidades/InfoTienda";
import type { InfoInternetTienda } from "../../../Models/Internet";
import type { SociedadesService } from "../../../Services/Sociedades.service";

/* 1) render con segundo parámetro OPCIONAL */
type Column<K extends keyof InfoInternetTienda = keyof InfoInternetTienda> = {
  key: K;
  label: string;
  render?: (v: InfoInternetTienda[K], row?: InfoInternetTienda) => ReactNode;
};

/* 2) COLS: usa (v, _row) o solo (v) gracias al row opcional */
const COLS = [
  { key: "Tienda", label: "Tienda" },
  { key: "Correo", label: "Correo"},
  { key: "Sociedad", label: "Empresa" },
  { key: "Nit", label: "NIT" },
  { key: "Ciudad", label: "Ciudad" },
  { key: "CentroComercial", label: "Centro Comercial" },
  { key: "Direccion", label: "Dirección" },
  { key: "Local", label: "Local" },
  { key: "Proveedor", label: "Proveedor de servicio" },
  { key: "Identificador", label: "Identificador" },
  { key: "ComparteCon", label: "¿Comparte servicio?" }, // verifica que esta key sea la correcta
  { key: "Nota", label: "Comparte con" },
] satisfies readonly Column[];

/* 3) destructuring con nombre correcto en el tipo */
export default function StoreInfoPanel() {
  const { InternetTiendas: InternetSvc, Sociedades: CompaniasSvc } =
    useGraphServices() as ReturnType<typeof useGraphServices> & {
      InternetTiendas: InternetService;
      Sociedades: SociedadesService; // <- corregido
    };

  const { setQuery, rows, loading, error, loadQuery, query } =
    useInfoInternetTiendas(InternetSvc, CompaniasSvc);

  return (
    <section className="store-info">
      <h3 className="store-title">Información de la tienda</h3>

      <form onSubmit={(e) => { e.preventDefault(); loadQuery(); }} className="store-actions">
        <div className="store-actions__left">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre de la tienda o identificador de servicio..." className="info-select" aria-label="Buscar tienda"/>          
          <button type="submit" disabled={loading} className="btn btn-primary-final btn-xs">
            <span className="i-lucide-check mr-1" aria-hidden />
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </form>

      {error && <div className="alert-error mt-4">{error}</div>}

      <div className="store-card">
        <div className="store-scroll">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th key={c.key} scope="col">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-sm" colSpan={COLS.length}>
                    {loading ? "Cargando…" : "Sin resultados"}
                  </td>
                </tr>
              )}

              {rows.map((r) => (
                <tr key={r.ID}>
                  {COLS.map((c) => {
                    const v = r[c.key];
                    return (
                      <td key={c.key} className="px-4 py-3 text-sm">
                        {String(v ?? "N/A")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
