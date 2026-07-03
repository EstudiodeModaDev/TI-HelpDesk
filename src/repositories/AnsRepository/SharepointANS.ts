import type { GraphRest } from '../../graph/GraphRest';
import type { GetAllOpts } from '../../Models/Commons';
import type { ANS } from '../../Models/Tickets';
import { esc } from '../../utils/Commons';
import type { ANSLoadResult, ANSRepository, propsANS } from './AnsRepository';

export class SharepointANS implements ANSRepository {
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
    listName = 'ANS'     
  ) {
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


  async loadANS(filter: propsANS): Promise<ANSLoadResult> {
    const filterFormated: GetAllOpts = {
      filter: `fields/id_categoria eq ${filter.id_categoria} and fields/id_subcategoria eq ${filter.id_sub_categoria} and fields/id_articulo eq ${filter.id_articulo}`
    }

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

    const qs = new URLSearchParams();
    qs.set('$expand', 'fields');       
    qs.set('$select', 'id,webUrl');    
    if (filterFormated?.filter) qs.set('$filter', normalizeFilter(String(filterFormated.filter)));

    // Evita '+' por espacios (algunos proxies se quejan)
    const query = qs.toString().replace(/\+/g, '%20');

    const url = `/sites/${encodeURIComponent(this.siteId!)}/lists/${encodeURIComponent(this.listId!)}/items?${query}`;

    try {
      const res = await this.graph.get<any>(url);
      console.log(res)
      const toReturn = (res.value ?? []).map((x: any) => this.toModel(x));
      return {
        data: toReturn[0],
        message: null,
        status: true
      }
    } catch (e: any) {
      // Si la ruta es válida pero el $filter rompe, reintenta sin $filter para diagnóstico
      const code = e?.error?.code ?? e?.code;
      if (code === 'itemNotFound' && filterFormated?.filter) {
        const qs2 = new URLSearchParams(qs);
        qs2.delete('$filter');
        const url2 = `/sites/${encodeURIComponent(this.siteId!)}/lists/${encodeURIComponent(this.listId!)}/items?${qs2.toString()}`;
        const res2 = await this.graph.get<any>(url2);
        const toReturn = (res2.value ?? []).map((x: any) => this.toModel(x));
        return {
          data: toReturn[0],
          message: null,
          status: true
        }
      }
      throw e;
    }
  }

  private toModel(item: any): ANS {
    const f = item?.fields ?? {};
    return {
        Id: String(item?.id ?? ''),
        Title: f.Title, //ANS
        id_articulo: f.id_articulo,
        id_categoria: f.id_categoria,
        id_subcategoria: f.id_subcategoria, 
    };
  }

}
