// ============================================================
// src/Services/CentrosFactura.service.ts
// Servicio genérico para:
//   - CentroCostos
//   - CentrosOperativos
//   - (futuro) UnidadNegocio
// Solo cambia el nombre de la lista de SP.
// ============================================================

import type { GetAllOpts } from "../Models/Commons";
import type { CentroFactura, TipoCentro } from "../Models/CentroFactura";
import type { GraphRest } from "../graph/GraphRest";

export class CentrosFacturaService {
  private graph: GraphRest;
  private hostname: string;
  private sitePath: string;
  private listName: string;

  private siteId?: string;
  private listId?: string;

  constructor(
    graph: GraphRest,
    tipo: Exclude<TipoCentro, "UnidadNegocio">, // por ahora solo estos 2
    hostname = "estudiodemoda.sharepoint.com",
    sitePath = "/sites/TransformacionDigital/IN/HD"
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith("/") ? sitePath : `/${sitePath}`;

    // 🔹 El tipo viene igual al nombre de la lista:
    //    "CentroCostos"  -> lista CentroCostos
    //    "CentrosOperativos" -> lista CentrosOperativos
    this.listName = tipo;
  }

  // ---------- helpers internos: cache IDs ----------

  private esc(s: string) {
    return String(s).replace(/'/g, "''");
  }

  private loadCache() {
    try {
      const k = `sp:${this.hostname}${this.sitePath}:${this.listName}`;
      const raw = localStorage.getItem(k);
      if (raw) {
        const { siteId, listId } = JSON.parse(raw);
        this.siteId = siteId || this.siteId;
        this.listId = listId || this.listId;
      }
    } catch {}
  }

  private saveCache() {
    try {
      const k = `sp:${this.hostname}${this.sitePath}:${this.listName}`;
      localStorage.setItem(k, JSON.stringify({ siteId: this.siteId, listId: this.listId }));
    } catch {}
  }

  private async ensureIds() {
    if (!this.siteId || !this.listId) this.loadCache();

    if (!this.siteId) {
      const site = await this.graph.get<any>(`/sites/${this.hostname}:${this.sitePath}`);
      this.siteId = site?.id;
      if (!this.siteId) throw new Error("No se pudo resolver siteId");
      this.saveCache();
    }

    if (!this.listId) {
      const lists = await this.graph.get<any>(
        `/sites/${this.siteId}/lists?$filter=displayName eq '${this.esc(this.listName)}'`
      );
      const list = lists?.value?.[0];
      if (!list?.id) throw new Error(`Lista no encontrada: ${this.listName}`);
      this.listId = list.id;
      this.saveCache();
    }
  }

  // ---------- mapping SP -> modelo ----------

  private toModel(item: any): CentroFactura {
    const f = item?.fields ?? {};
    return {
      Id: String(f?.id ?? f?.ID ?? f?.Id ?? ""),
      Title: f.Title,     // Nombre
      Codigo: f.Codigo ?? "" // campo 'Codigo' en la lista
    };
  }

  // ---------- CRUD genérico ----------

  async create(record: Omit<CentroFactura, "Id">) {
    await this.ensureIds();
    const res = await this.graph.post<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items`,
      { fields: record }
    );
    return this.toModel(res);
  }

  async add(centro: { Title: string; Codigo: string }) {
    await this.ensureIds();
    const res = await this.graph.post<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items`,
      { fields: centro }
    );
    return this.toModel(res);
  }

  async update(id: string, changed: Partial<Omit<CentroFactura, "Id">>) {
    await this.ensureIds();
    await this.graph.patch<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}/fields`,
      changed
    );
    const res = await this.graph.get<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}?$expand=fields`
    );
    return this.toModel(res);
  }

  async delete(id: string) {
    await this.ensureIds();
    await this.graph.delete(`/sites/${this.siteId}/lists/${this.listId}/items/${id}`);
  }

  async get(id: string) {
    await this.ensureIds();
    const res = await this.graph.get<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}?$expand=fields`
    );
    return this.toModel(res);
  }

  async getAll(opts?: GetAllOpts) {
    await this.ensureIds();

    const normalizeFieldTokens = (s: string) =>
      s
        .replace(/\bID\b/g, "id")
        .replace(/(^|[^/])\bTitle\b/g, "$1fields/Title");

    const escapeODataLiteral = (v: string) => v.replace(/'/g, "''");

    const normalizeFilter = (raw: string) => {
      let out = normalizeFieldTokens(raw.trim());
      out = out.replace(/'(.*?)'/g, (_m, p1) => `'${escapeODataLiteral(p1)}'`);
      return out;
    };

    const normalizeOrderby = (raw: string) => normalizeFieldTokens(raw.trim());

    const qs = new URLSearchParams();
    qs.set("$expand", "fields");
    qs.set("$select", "id,webUrl");
    if (opts?.orderby) qs.set("$orderby", normalizeOrderby(opts.orderby));
    if (opts?.top != null) qs.set("$top", String(opts.top));
    if (opts?.filter) qs.set("$filter", normalizeFilter(String(opts.filter)));

    const query = qs.toString().replace(/\+/g, "%20");
    const url = `/sites/${encodeURIComponent(this.siteId!)}/lists/${encodeURIComponent(
      this.listId!
    )}/items?${query}`;

    try {
      const res = await this.graph.get<any>(url);
      return (res.value ?? []).map((x: any) => this.toModel(x));
    } catch (e: any) {
      const code = e?.error?.code ?? e?.code;
      if (code === "itemNotFound" && opts?.filter) {
        const qs2 = new URLSearchParams(qs);
        qs2.delete("$filter");
        const url2 = `/sites/${encodeURIComponent(this.siteId!)}/lists/${encodeURIComponent(
          this.listId!
        )}/items?${qs2.toString()}`;
        const res2 = await this.graph.get<any>(url2);
        return (res2.value ?? []).map((x: any) => this.toModel(x));
      }
      throw e;
    }
  }
}
