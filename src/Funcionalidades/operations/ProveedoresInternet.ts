import React from "react";
import type { ProveedoresService } from "../../Services/Proveedores.service";
import type { Proveedores } from "../../Models/Proveedores";
import type { GetAllOpts } from "../../Models/Commons";

export function useProveedores(ProveedoresSvc: ProveedoresService,) {
  // UI state
  const [rows, setRows] = React.useState<Proveedores[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filterMode, setFilterMode] = React.useState<string>("tigo");

  // construir filtro OData
  const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if (filterMode === "tigo") {
      filters.push(`fields/Proveedor eq 'Tigo'`);
    } else {
      filters.push(`fields/Proveedor eq 'Claro'`);
    }

    return {
      filter: filters.join(" and "),
      top: 100,
    };
  }, [filterMode,]); 

  const loadProveedores = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const items  = await ProveedoresSvc.getAll(buildFilter()); // debe devolver {items,nextLink}
      setRows(items);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [ProveedoresSvc, buildFilter]);

  React.useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);


  return {rows, loading, error, loadProveedores, filterMode, setFilterMode,
  };
}

