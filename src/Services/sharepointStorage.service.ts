type GraphClient = { get: (path: string) => Promise<any> };

export type DriveSizeResult = {
  driveId: string;
  name: string;
  webUrl?: string;
  totalBytes: number;
  filesCount: number;
  lastCalculatedAt: string;
};

function toRelativePath(nextLink: string): string {
  const u = new URL(nextLink);
  return u.pathname + u.search;
}

function normalizeGraphPath(path: string): string {
  // Si nextLink viene como "/v1.0/...", lo convertimos a "/..."
  return path.startsWith("/v1.0/") ? path.replace("/v1.0", "") : path;
}

export class SharePointStorageService {
  private graph: GraphClient;

  constructor(graph: GraphClient) {
    this.graph = graph;
  }

  async getSiteByPath(hostname: string, sitePath: string) {
    return this.graph.get(`/sites/${hostname}:${sitePath}`);
  }

  async listDrives(siteId: string) {
    const res = await this.graph.get(`/sites/${siteId}/drives?$top=200`);
    return (res?.value ?? []) as Array<{ id: string; name: string; webUrl?: string }>;
  }

  async computeDriveSize(driveId: string): Promise<{ totalBytes: number; filesCount: number }> {
    let totalBytes = 0;
    let filesCount = 0;

    // DELTA trae todo el drive en el primer recorrido (sin usar "*")
    let path = normalizeGraphPath(
        `/drives/${driveId}/root/delta?$top=200&$select=id,name,size,file,folder,deleted`
    );

    while (path) {
        const res = await this.graph.get(path);
        const items = (res?.value ?? []) as any[];

        for (const it of items) {
        // ignorar eliminados
        if (it?.deleted) continue;

        // sumar solo archivos
        if (it?.file) {
            const sz = Number(it?.size ?? 0);
            totalBytes += Number.isFinite(sz) ? sz : 0;
            filesCount += 1;
        }
        }

        const next = res?.["@odata.nextLink"];
        // deltaLink lo puedes guardar para incremental luego (opcional)
        // const deltaLink = res?.["@odata.deltaLink"];

        path = next ? normalizeGraphPath(toRelativePath(next)) : "";
    }

    return { totalBytes, filesCount };
  }


  /**
   * Calcula almacenamiento por bibliotecas (drives) de un site
   */
  async getLibrariesSizes(hostname: string, sitePath: string): Promise<DriveSizeResult[]> {
    const site = await this.getSiteByPath(hostname, sitePath);
    const siteId = site?.id as string;
    if (!siteId) throw new Error("No se pudo resolver siteId");

    const drives = await this.listDrives(siteId);

    const out: DriveSizeResult[] = [];
    for (const d of drives) {
      const { totalBytes, filesCount } = await this.computeDriveSize(d.id);
      out.push({
        driveId: d.id,
        name: d.name,
        webUrl: d.webUrl,
        totalBytes,
        filesCount,
        lastCalculatedAt: new Date().toISOString(),
      });
    }

    return out.sort((a, b) => b.totalBytes - a.totalBytes);
  }
}
