import React from "react";
import type { InternetTiendasService } from "../Services/InternetTiendas.service";
import type { InfoInternetTienda, InternetTiendas } from "../Models/Internet";
import type { SociedadesService } from "../Services/Sociedades.service";



/** Carga un diccionario nombreEmpresa -> NIT, consultando por lotes */
  async function getCompaniesMapByIds(CompaniesSvc: SociedadesService, ids: Array<string | number>,concurrency = 8): Promise<Record<string, string>> {
    const map: Record<string, string> = {};
    if (!CompaniesSvc) return map;

    const unique = Array.from(new Set(ids.map(String).map(s => s.trim()).filter(Boolean)));
    if (unique.length === 0) return map;

    for (let i = 0; i < unique.length; i += concurrency) {
      const slice = unique.slice(i, i + concurrency);

      const results = await Promise.allSettled(
        slice.map(async (rawId) => {
          const idForGet = rawId ? Number(rawId) : rawId;
          const item = await CompaniesSvc.get(String(idForGet));
          return { rawId, item };
        })
      );

      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { rawId, item } = r.value as { rawId: string; item: any };

        const nit = item?.Nit
        const nitStr = String(nit ?? "N/A");

        map[rawId] = nitStr;

        const spId = item?.fields?.ID;
        if (spId != null) {
          map[String(spId)] = nitStr;
        }

        const graphId = item?.id;
        if (graphId) {
          map[String(graphId)] = nitStr;
        }
      }
    }

    return map;
  }

  async function getNamesCompaniesMapByIds(CompaniesSvc: SociedadesService, ids: Array<string | number>,
    concurrency = 8
  ): Promise<Record<string, string>> {
    const map: Record<string, string> = {};
    if (!CompaniesSvc) return map;

    const unique = Array.from(new Set(ids.map(String).map(s => s.trim()).filter(Boolean)));
    if (unique.length === 0) return map;

    for (let i = 0; i < unique.length; i += concurrency) {
      const slice = unique.slice(i, i + concurrency);

      const results = await Promise.allSettled(
        slice.map(async (rawId) => {
          const idForGet = rawId ? Number(rawId) : rawId;
          const item = await CompaniesSvc.get(String(idForGet));
          return { rawId, item };
        })
      );

      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { rawId, item } = r.value as { rawId: string; item: any };

        const nit = item?.Title
        const nitStr = String(nit ?? "N/A");

        map[rawId] = nitStr;

        const spId = item?.fields?.ID;
        if (spId != null) {
          map[String(spId)] = nitStr;
        }

        const graphId = item?.id;
        if (graphId) {
          map[String(graphId)] = nitStr;
        }
      }
    }

    return map;
  }

export function useInfoInternetTiendas(InfoInternetSvc: InternetTiendasService, CompaniesSvc: SociedadesService) {
  const [allRows, setAllRows] = React.useState<InfoInternetTienda[]>([]);
  const [rows, setRows] = React.useState<InfoInternetTienda[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  const norm = React.useCallback((s: unknown) => {return String(s ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");}, []);

  const applyClientFilter = React.useCallback((qRaw: string, base: InfoInternetTienda[]) => {
      const q = norm(qRaw);

      if (q.length < 2) return base;

      return base.filter((r) => {
        return (
          norm(r.Tienda).includes(q) ||
          norm(r.Correo).includes(q) ||
          norm(r.Identificador).includes(q)
        );
      });
    },
    [norm]
  );

  const buildFilter = React.useCallback(() => {
    return { top: 5000 };
  }, []);

  const loadQuery = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items: InternetTiendas[] = await InfoInternetSvc.getAll(buildFilter());
      const companyNames = items.map((r) => r.Compa_x00f1__x00ed_a ?? "");
      const companiesMap = await getCompaniesMapByIds(CompaniesSvc, companyNames);
      const companiesName = await getNamesCompaniesMapByIds(CompaniesSvc, companyNames);

      const view: InfoInternetTienda[] = items.map((r) => ({
        ID: r.ID,
        Ciudad: r.Title ?? "N/A",
        CentroComercial: r.Centro_x0020_Comercial ?? "N/A",
        Tienda: r.Tienda ?? "N/A",
        Correo: r.CORREO ?? "N/A",
        Proveedor: r.PROVEEDOR ?? "N/A",
        Identificador: r.IDENTIFICADOR ?? "N/A",
        Comparte: r.SERVICIO_x0020_COMPARTIDO ?? "N/A",
        Direccion: r.DIRECCI_x00d3_N ?? "N/A",
        Local: r.Local ?? "N/A",
        Nota: r.Nota ?? "N/A",
        ComparteCon: r.Nota ?? "N/A",
        Nit: companiesMap[(r.Compa_x00f1__x00ed_a ?? "").trim()] ?? "N/A",
        Sociedad: companiesName[(r.Compa_x00f1__x00ed_a ?? "").trim()] ?? "N/A",
      }));

      setAllRows(view);
      setRows(applyClientFilter(query, view));
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tiendas");
      setAllRows([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [InfoInternetSvc, CompaniesSvc, buildFilter, applyClientFilter, query]);

  // Re-filtra cuando cambie el query (sin llamar al servidor)
  React.useEffect(() => {
    setRows(applyClientFilter(query, allRows));
  }, [query, allRows, applyClientFilter]);

  return {
    // datos visibles
    rows,
    loading,
    error,
    query,

    // acciones
    setQuery,
    loadQuery,

    // opcional: por si quieres acceder al dataset completo
    allRows,
  };
}
