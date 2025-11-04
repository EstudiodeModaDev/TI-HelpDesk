import { GraphRest } from '../graph/GraphRest';
import type { GetAllOpts, PageResult } from '../Models/Commons';
import type { ReFactura } from '../Models/RegistroFacturaInterface';


export class FacturasService {
  private graph!: GraphRest;
  private hostname!: string;
  private sitePath!: string;
  private listName!: string;

  private siteId?: string;
  private listId?: string;

  constructor(
    graph: GraphRest,
    hostname = 'estudiodemoda.sharepoint.com',
    sitePath = '/sites/TransformacionDigital/IN/HD',
    listName = 'Facturas'     
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
    this.listName = listName;
  }

  private esc(s: string) { return String(s).replace(/'/g, "''"); }

  // cache (mem + localStorage opcional)
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
      if (!this.siteId) throw new Error('No se pudo resolver siteId');
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

  // ---------- mapping ----------
  private toModel(item: any): ReFactura {
    const f = item?.fields ?? {};
    return {
      id0: Number(item?.id ?? 0),
      FechaEmision: f.FechaEmision ?? "",
      NoFactura: f.NoFactura ?? "",
      Proveedor: f.Proveedor ?? "",
      Title: f.Title ?? "",
      Items: f.Items ?? "",
      DescripItems: f.DescripItems ?? "",
      ValorAnIVA: Number(f.ValorAnIVA) || 0,
      CC: f.CC ?? "",
      CO: f.CO ?? "",
      un: f.un ?? "",
      DetalleFac: f.DetalleFac ?? "",
      FecEntregaCont: f.FecEntregaCont ?? "",
      DocERP: f.DocERP ?? "",
      Observaciones: f.Observaciones ?? "",
      RegistradoPor: f.RegistradoPor ?? "",
      Created: f.Created ?? f.created ?? item.created ?? item.Created,
      IdDistrubuida: f.IdDistrubuida ?? "",
    };
  }

  // ---------- CRUD ----------
  async create(record: Omit<ReFactura, 'ID'>) {
    await this.ensureIds()
    const res = await this.graph.post<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items`,
      { fields: record }
    );
    return this.toModel(res);
  }

  async update(id: string, changed: Partial<Omit<ReFactura, 'ID'>>) {
    await this.ensureIds()
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
    await this.ensureIds()
    await this.graph.delete(`/sites/${this.siteId}/lists/${this.listId}/items/${id}`);
  }

  async get(id: string) {
    await this.ensureIds()
    const res = await this.graph.get<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}?$expand=fields`
    );
    return this.toModel(res);
  }

  async getAll(opts?: GetAllOpts): Promise<PageResult<ReFactura>> {
    await this.ensureIds();
    const qs = new URLSearchParams({ $expand: 'fields' });
    if (opts?.filter)  qs.set('$filter', opts.filter);
    if (opts?.orderby) qs.set('$orderby', opts.orderby);
    if (opts?.top != null) qs.set('$top', String(opts.top));
    const url = `/sites/${this.siteId}/lists/${this.listId}/items?${qs.toString()}`;
    const res = await this.fetchPage(url);
    return res
  }

  // Seguir el @odata.nextLink tal cual lo entrega Graph
  async getByNextLink(nextLink: string): Promise<PageResult<ReFactura>> {
    return this.fetchPage(nextLink, /*isAbsolute*/ true);
  }

  private async fetchPage(url: string, isAbsolute = false): Promise<PageResult<ReFactura>> {
    const res = isAbsolute
      ? await this.graph.getAbsolute<any>(url)  // 👈 URL absoluta (nextLink)
      : await this.graph.get<any>(url);         // 👈 path relativo

    const raw = Array.isArray(res?.value) ? res.value : [];
    const items = raw.map((x: any) => this.toModel(x));
    const nextLink = res?.['@odata.nextLink'] ? String(res['@odata.nextLink']) : null;
    return { items, nextLink };
  }

}

