import { GraphRest } from '../graph/GraphRest';
import type { GetAllOpts } from '../Models/Commons';
import type { Inventario } from '../Models/Inventario';
import { esc } from '../utils/Commons';

export class InventarioService {
  private graph!: GraphRest;
  private hostname!: string;
  private sitePath!: string;
  private listName!: string;

  private siteId?: string;
  private listId?: string;

  constructor(graph: GraphRest, hostname = 'estudiodemoda.sharepoint.com', sitePath = '/sites/TransformacionDigital/IN/HD', listName = 'Inventario') {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
    this.listName = listName;
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
      if (!this.siteId) throw new Error('No se pudo resolver siteId');
      this.saveCache();
      }

      if (!this.listId) {
      const lists = await this.graph.get<any>(
          `/sites/${this.siteId}/lists?$filter=displayName eq '${esc(this.listName)}'`
      );
      const list = lists?.value?.[0];
      if (!list?.id) throw new Error(`Lista no encontrada: ${this.listName}`);
      this.listId = list.id;
      this.saveCache();
      }
  }

  // ---------- mapping ----------
  private toModel(item: any): Inventario {
    const f = item?.fields ?? {};
    return {
        Id: String(f?.id ?? f?.ID ?? f?.Id ?? item.Id ?? item.id ?? item.ID ?? ''),
        Title: f.Title,
        AsignadoA: f.AsignadoA,
        CasoEntrada: f.CasoEntrada,
        CasoSalida: f.CasoSalida,
        Categoria: f.Categoria,
        Compania: f.Compania,
        Comprometido: f.Comprometido,
        ControlActivos: f.ControlActivos,
        DiscoCap: f.DiscoCap,
        DiscoTec: f.DiscoTec,
        Estado: f.Estado,
        FechaEntrada: f.FechaEntrada,
        Marca: f.Marca,
        MemoriaCap: f.MemoriaCap,
        MemoriaTec: f.MemoriaTec,
        PrestadoA: f.PrestadoA,
        Proveedor: f.Proveedor,
        Referencia: f.Referencia,
        ResponsableEntrada: f.ResponsableEntrada,
        ResponsableSalida: f.ResponsableSalida,
        Serial: f.Serial,
        UbicacionActual: f.UbicacionActual,
        UbicacionAnterior: f.UbicacionAnterior
    };
  }

  // ---------- CRUD ----------
  async create(record: Omit<Inventario, 'ID'>) {
    await this.ensureIds()
    const res = await this.graph.post<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items`,
      { fields: record }
    );
    return this.toModel(res);
  }

  async update(id: string, changed: Partial<Omit<Inventario, 'ID'>>) {
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

  async getAll(opts?: GetAllOpts) {
    await this.ensureIds()
    // ID -> id, Title -> fields/Title (cuando NO está prefijado con '/')
    const normalizeFieldTokens = (s: string) =>
      s
        .replace(/\bID\b/g, 'id')
        .replace(/(^|[^/])\bTitle\b/g, '$1fields/Title');

    const escapeODataLiteral = (v: string) => v.replace(/'/g, "''");

    // Normaliza expresiones del $filter (minimiza 404 por sintaxis)
    const normalizeFilter = (raw: string) => {
      let out = normalizeFieldTokens(raw.trim());
      // escapa todo literal '...'
      out = out.replace(/'(.*?)'/g, (_m, p1) => `'${escapeODataLiteral(p1)}'`);
      return out;
    };

    const normalizeOrderby = (raw: string) => normalizeFieldTokens(raw.trim());

    const qs = new URLSearchParams();
    qs.set('$expand', 'fields');        // necesario si filtras por fields/*
    qs.set('$select', 'id,webUrl');     // opcional; añade fields(...) si quieres
    if (opts?.orderby) qs.set('$orderby', normalizeOrderby(opts.orderby));
    if (opts?.top != null) qs.set('$top', String(opts.top));
    if (opts?.filter) qs.set('$filter', normalizeFilter(String(opts.filter)));

    // Evita '+' por espacios (algunos proxies se quejan)
    const query = qs.toString().replace(/\+/g, '%20');

    const url = `/sites/${encodeURIComponent(this.siteId!)}/lists/${encodeURIComponent(this.listId!)}/items?${query}`;

    try {
      const res = await this.graph.get<any>(url);
      console.log(res)
      const mapped = (res.value ?? []).map((x: any) => this.toModel(x));
      console.log(mapped)
      return mapped
    } catch (e: any) {
      // Si la ruta es válida pero el $filter rompe, reintenta sin $filter para diagnóstico
      const code = e?.error?.code ?? e?.code;
      if (code === 'itemNotFound' && opts?.filter) {
        const qs2 = new URLSearchParams(qs);
        qs2.delete('$filter');
        const url2 = `/sites/${encodeURIComponent(this.siteId!)}/lists/${encodeURIComponent(this.listId!)}/items?${qs2.toString()}`;
        const res2 = await this.graph.get<any>(url2);
        return (res2.value ?? []).map((x: any) => this.toModel(x));
      }
      throw e;
    }
  }

}

