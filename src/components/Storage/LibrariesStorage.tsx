import * as React from "react";
import "./LibrariesStorage.css";
import { SharePointStorageService } from "../../Services/sharepointStorage.service";
import type { DriveSizeResult } from "../../Models/Files";

type Props = {
  graph: { get: (path: string) => Promise<any> }; // tu GraphRest
  hostname: string; // "contoso.sharepoint.com"
  sitePath: string; // "/sites/...."
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

export default function LibrariesStorage({ graph, hostname, sitePath }: Props) {
  const svc = React.useMemo(() => new SharePointStorageService(graph), [graph]);

  const [rows, setRows] = React.useState<DriveSizeResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [progress, setProgress] = React.useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  const totalBytes = React.useMemo(
    () => rows.reduce((acc, r) => acc + (r.totalBytes ?? 0), 0),
    [rows]
  );

  const totalFiles = React.useMemo(
    () => rows.reduce((acc, r) => acc + (r.filesCount ?? 0), 0),
    [rows]
  );

  const load = React.useCallback(async () => {
    setError("");
    setLoading(true);
    setRows([]);
    setProgress({ done: 0, total: 0 });

    try {
      // 1) resolver site
      const site = await svc.getSiteByPath(hostname, sitePath);
      const siteId = site?.id as string;
      if (!siteId) throw new Error("No se pudo resolver siteId");

      // 2) listar bibliotecas
      const drives = await svc.listDrives(siteId);
      setProgress({ done: 0, total: drives.length });

      // 3) calcular tamaño por drive (actualizando UI incremental)
      const out: DriveSizeResult[] = [];

      for (let i = 0; i < drives.length; i++) {
        const d = drives[i];

        const { totalBytes, filesCount } = await svc.computeDriveSize(d.id);

        out.push({
          driveId: d.id,
          name: d.name,
          webUrl: d.webUrl,
          totalBytes,
          filesCount,
          lastCalculatedAt: new Date().toISOString(),
        });

        setRows([...out].sort((a, b) => b.totalBytes - a.totalBytes));
        setProgress({ done: i + 1, total: drives.length });
      }
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tamaños");
    } finally {
      setLoading(false);
    }
  }, [svc, hostname, sitePath]);

  React.useEffect(() => {
    load();
  }, [load]);

  const progressPct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <section className="ls-card">
      <header className="ls-head">
        <div className="ls-title">
          <h2>Almacenamiento por bibliotecas</h2>
          <p className="ls-sub">
            Site: <b>{hostname}</b><b>{sitePath}</b>
          </p>
        </div>

        <div className="ls-actions">
          <button className="ls-btn" onClick={load} disabled={loading}>
            {loading ? "Calculando..." : "Recalcular"}
          </button>
        </div>
      </header>

      <div className="ls-summary">
        <div className="ls-chip">
          <span>Total bibliotecas</span>
          <b>{rows.length}</b>
        </div>

        <div className="ls-chip">
          <span>Total archivos</span>
          <b>{totalFiles}</b>
        </div>

        <div className="ls-chip">
          <span>Total usado</span>
          <b>{formatBytes(totalBytes)}</b>
        </div>

        {progress.total > 0 && (
          <div className="ls-progress" title={`${progressPct}%`}>
            <div className="ls-progress__bar" style={{ width: `${progressPct}%` }} />
            <span className="ls-progress__txt">
              {progress.done}/{progress.total}
            </span>
          </div>
        )}
      </div>

      {error && <div className="ls-error">{error}</div>}

      <div className="ls-tableWrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th>Biblioteca</th>
              <th>Archivos</th>
              <th>Tamaño</th>
              <th>% del total</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const pct = totalBytes > 0 ? (r.totalBytes / totalBytes) * 100 : 0;

              return (
                <tr key={r.driveId}>
                  <td className="ls-name">{r.name}</td>
                  <td>{r.filesCount}</td>
                  <td className="ls-bytes">{formatBytes(r.totalBytes)}</td>
                  <td className="ls-pct">{pct.toFixed(1)}%</td>
                </tr>
              );
            })}

            {!loading && rows.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="ls-empty">
                  No hay bibliotecas o no se pudo calcular.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="ls-foot">
        <small>Esto suma tamaños de archivos (peso real). No incluye metadata interna de SharePoint.</small>
      </footer>
    </section>
  );
}
