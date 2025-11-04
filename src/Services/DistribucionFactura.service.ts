// src/Services/DistribucionFactura.service.ts
import { GraphRest } from '../graph/GraphRest';
import type { GetAllOpts } from '../Models/Commons';
import type { DistribucionFacturaData } from '../Models/DistribucionFactura';

/**
 * Servicio para manejar la lista "DistribucionFactura" en SharePoint.
 * Sigue el mismo patrón que ProveedoresFacturaService.
 */
export class DistribucionFacturaService {
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
    listName = 'DistribucionFactura'
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
    this.listName = listName;
  }

  // ----------------------------------------------------------
  // 🧩 Utilidades internas (cache local, ID de sitio/lista)
  // ----------------------------------------------------------

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

  /**
   * Garantiza que `siteId` y `listId` estén inicializados antes de operar.
   */
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

  // ----------------------------------------------------------
  // 🔄 Mapeo entre SharePoint y el modelo local
  // ----------------------------------------------------------

 private toModel(item: any): DistribucionFacturaData {
  const f = item?.fields ?? {};

  return {
    Id: String(f?.id ?? f?.ID ?? f?.Id ?? ''),
    Proveedor: f?.Proveedor ?? '',
    Title: f?.Title ?? '',
    CargoFijo: Number(f?.CargoFijo ?? 0),
    CosToImp: Number(f?.CosToImp ?? 0),
    ValorAnIVA: Number(f?.ValorAnIVA ?? 0),
    ImpBnCedi: Number(f?.ImpBnCedi ?? 0),
    ImpBnPalms: Number(f?.ImpBnPalms ?? 0),
    ImpColorPalms: Number(f?.ImpColorPalms ?? 0),
    ImpBnCalle: Number(f?.ImpBnCalle ?? 0),
    ImpColorCalle: Number(f?.ImpColorCalle ?? 0),
    CosTotMarNacionales: Number(f?.CosTotMarNacionales ?? 0),
    CosTotMarImpor: Number(f?.CosTotMarImpor ?? 0),
    CosTotCEDI: Number(f?.CosTotCEDI ?? 0),
    CosTotServAdmin: Number(f?.CosTotServAdmin ?? 0),
    FechaEmision: f?.FechaEmision ?? '',
    NoFactura: f?.NoFactura ?? '',
    Items: f?.Items ?? '',
    DescripItems: f?.DescripItems ?? '',
    CCmn: f?.CCmn ?? '',
    CCmi: f?.CCmi ?? '',
    CCcedi: f?.CCcedi ?? '',
    CCsa: f?.CCsa ?? '',
    CO: f?.CO ?? '',
    un: f?.un ?? '',
    DetalleFac: f?.DetalleFac ?? ''
  };
}


  // ----------------------------------------------------------
  // ⚙️ CRUD (Create, Read, Update, Delete)
  // ----------------------------------------------------------

  /** 🟢 Crear nueva distribución de factura */
  async create(record: Omit<DistribucionFacturaData, 'Id'>) {
    await this.ensureIds();
    const res = await this.graph.post<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items`,
      { fields: record }
    );
    return this.toModel(res);
  }

  /** 🟡 Actualizar un registro existente */
  async update(id: string, changed: Partial<Omit<DistribucionFacturaData, 'Id'>>) {
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

  /** 🔴 Eliminar un registro */
  async delete(id: string) {
    await this.ensureIds();
    await this.graph.delete(`/sites/${this.siteId}/lists/${this.listId}/items/${id}`);
  }

  /** 🔍 Obtener un registro específico por ID */
  async get(id: string) {
    await this.ensureIds();
    const res = await this.graph.get<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}?$expand=fields`
    );
    return this.toModel(res);
  }

  /** 📋 Obtener todas las distribuciones (con filtros opcionales) */
  async getAll(opts?: GetAllOpts) {
    await this.ensureIds();

    const normalizeFieldTokens = (s: string) =>
      s
        .replace(/\bID\b/g, 'id')
        .replace(/(^|[^/])\bTitle\b/g, '$1fields/Title');

    const escapeODataLiteral = (v: string) => v.replace(/'/g, "''");

    const normalizeFilter = (raw: string) => {
      let out = normalizeFieldTokens(raw.trim());
      out = out.replace(/'(.*?)'/g, (_m, p1) => `'${escapeODataLiteral(p1)}'`);
      return out;
    };

    const normalizeOrderby = (raw: string) => normalizeFieldTokens(raw.trim());

    const qs = new URLSearchParams();
    qs.set('$expand', 'fields');
    qs.set('$select', 'id,webUrl');
    if (opts?.orderby) qs.set('$orderby', normalizeOrderby(opts.orderby));
    if (opts?.top != null) qs.set('$top', String(opts.top));
    if (opts?.filter) qs.set('$filter', normalizeFilter(String(opts.filter)));

    const query = qs.toString().replace(/\+/g, '%20');
    const url = `/sites/${encodeURIComponent(this.siteId!)}/lists/${encodeURIComponent(this.listId!)}/items?${query}`;

    try {
      const res = await this.graph.get<any>(url);
      return (res.value ?? []).map((x: any) => this.toModel(x));
    } catch (e: any) {
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
