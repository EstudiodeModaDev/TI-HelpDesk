import * as React from "react";
import "./ListsStorageEstimate.css";
import { SharePointListsStorageService } from "../../Services/sharepointListsStorage.service";
import type { ListSizeEstimate } from "../../Models/Files";

type Props = {
  graph: { get: (path: string) => Promise<any> };
  hostname: string;
  sitePath: string;

  sampleSize?: number; // default 200
};

function formatBytes(bytes: number): string {
  const n = Number(bytes ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export default function ListsStorageEstimate({ graph, hostname, sitePath, sampleSize = 200 }: Props) {
  const svc = React.useMemo(() => new SharePointListsStorageService(graph), [graph]);

  const [rows, setRows] = React.useState<ListSizeEstimate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const totalEstimated = React.useMemo(
    () => rows.reduce((acc, r) => acc + (r.estimatedFieldsTotalBytes ?? 0), 0),
    [rows]
  );

  const load = React.useCallback(async () => {
    setError("");
    setLoading(true);
    setRows([]);

    try {
      const data = await svc.estimateListsUsage(hostname, sitePath, sampleSize);
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? "Error calculando estimados");
    } finally {
      setLoading(false);
    }
  }, [svc, hostname, sitePath, sampleSize]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="lst-card">
      <header className="lst-head">
        <div>
          <h2>Almacenamiento por listas (estimado)</h2>
          <p className="lst-sub">
            Site: <b>{hostname}</b><b>{sitePath}</b>
          </p>
        </div>

        <button className="lst-btn" onClick={load} disabled={loading}>
          {loading ? "Calculando..." : "Recalcular"}
        </button>
      </header>

      <div className="lst-summary">
        <div className="lst-chip">
          <span>Listas evaluadas</span>
          <b>{rows.length}</b>
        </div>
        <div className="lst-chip">
          <span>Total estimado (fields)</span>
          <b>{formatBytes(totalEstimated)}</b>
        </div>
      </div>

      {error && <div className="lst-error">{error}</div>}

      <div className="lst-tableWrap">
        <table className="lst-table">
          <thead>
            <tr>
              <th>Lista</th>
              <th>Items</th>
              <th>Promedio / item</th>
              <th>Total estimado</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.listId}>
                <td className="lst-name">{r.name}</td>
                <td>{r.itemsCount}</td>
                <td>{formatBytes(r.avgFieldsBytes)}</td>
                <td className="lst-total">{formatBytes(r.estimatedFieldsTotalBytes)}</td>
              </tr>
            ))}

            {!loading && rows.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="lst-empty">No hay listas o no se pudo calcular.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="lst-foot">
        <small>
          Este valor es un <b>estimado</b> basado en el tamaño (UTF-8) del JSON de los fields. No representa el storage real interno de SharePoint.
        </small>
      </footer>
    </section>
  );
}
