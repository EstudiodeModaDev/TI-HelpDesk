import type { GraphRest } from "../../graph/GraphRest";
import type { GetAllOpts, PageResult } from "../../Models/Commons";
import type { Ticket } from "../../Models/Tickets";
import type { TicketsRepository } from "./TicketRepository";

export class TicketsService implements TicketsRepository {
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
    listName = 'Tickets'
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
    this.listName = listName;
  }
  countTickets(resolutorMail: string, status: "En atención" | "Fuera de tiempo"): Promise<number> {
    console.log(resolutorMail, " ", status)
    throw new Error("Method not implemented.");
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
  
  private toModel(item: any): Ticket {
    const f = item?.fields ?? {};
    return {
      // Identificadores / asunto
      ID: String(f.ID ?? f.Id ?? f.id ?? item?.id ?? ''),
      IdCasoPadre: f.IdCasoPadre ?? null,
      AsuntoTicket: f.Title ?? '',

      // Fechas (tu UI usa "dd/mm/yyyy hh:mm")
      FechaApertura: f.FechaApertura ?? '',
      FechaMaxima: f.TiempoSolucion ?? '',

      // Estado / categorización
      Fuente: f.Fuente ?? '',
      Descripcion: f.Descripcion ?? '',
      Categoria: f.Categoria ?? '',
      SubCategoria: f.Subcategoria ?? f.SubCategoria ?? '',
      Articulo: f.Articulo ?? f.SubSubCategoria ?? '',
      Estadodesolicitud: f.Estadodesolicitud ?? '',
      ANS: f.ANS ?? '',

      // Resolutor
      Nombreresolutor: f.Nombreresolutor ?? '',
      Correoresolutor: f.Correoresolutor ?? '',

      // Solicitante
      Solicitante: f.Solicitante ?? '',
      CorreoSolicitante: f.CorreoSolicitante ?? '',

      // Observador
      Observador: f.Observador ?? '',
      CorreoObservador: f.CorreoObservador ?? '',
    };
  }

  // ---------- CRUD ----------
  async create(record: Omit<Ticket, 'ID'>) {
    await this.ensureIds();
    console.log(record)
    const res = await this.graph.post<any>(
    `/sites/${this.siteId}/lists/${this.listId}/items`,
    { fields: record }
    );
    console.log(res)
    return this.toModel(res);
}

  async update(id: string, changed: Partial<Omit<Ticket, 'ID'>>) {
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

  async get(id: string) {
      await this.ensureIds();
      const res = await this.graph.get<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}?$expand=fields`
      );
      return this.toModel(res);
  }

  async getAll(opts?: GetAllOpts): Promise<PageResult<Ticket>> {
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
  async getByNextLink(nextLink: string): Promise<PageResult<Ticket>> {
    return this.fetchPage(nextLink, /*isAbsolute*/ true);
  }

  private async fetchPage(url: string, isAbsolute = false): Promise<PageResult<Ticket>> {
    const res = isAbsolute
      ? await this.graph.getAbsolute<any>(url)  // 👈 URL absoluta (nextLink)
      : await this.graph.get<any>(url);         // 👈 path relativo

    const raw = Array.isArray(res?.value) ? res.value : [];
    const items = raw.map((x: any) => this.toModel(x));
    const nextLink = res?.['@odata.nextLink'] ? String(res['@odata.nextLink']) : null;
    return { items, nextLink };
  }

  async loadTickets(filter: GetAllOpts): Promise<{ data: Ticket[]; status: boolean; message: string | null; }> {
    try{
      const res = await this.getAll(filter)
      return {
        data: res.items,
        message: "",
        status: true
      }
    } catch {
      return{
        data: [],
        message: "Ha ocurrido un error obteniendo los tickets",
        status: false
      }
    }
    
  } 

  async createTicket(payload: Ticket): Promise<{ data: Ticket | null; status: boolean; message: string | null; }> {
    try{
      const created = await this.create(payload)
      return{
        data: created,
        message: "",
        status: true
      }
    } catch(e: any){
      return {
        data: null,
        message: "Ha ocurrido un error creando el ticket",
        status: false
      }
    }
  }

  async updateTicket(id: string, payload: Partial<Ticket>): Promise<{ data: Ticket | null; status: boolean; message: string | null; }> {
    try{
      const updated = await this.update(id, payload)
      return{
        data: updated,
        message: "",
        status: true
      }
    } catch (e: any) {
      return{
        data: null,
        message: "Ha ocurrido un error editando el ticket " + e,
        status: false
      }
    }
  }

  async getTicketById(id: string): Promise<{ data: Ticket | null; status: boolean; message: null | string; }> {
    try{
      const ticket = await this.get(id)
      return{
        data: ticket,
        message: "",
        status: true
      }
    } catch (e: any){
      return{
        data: null,
        message: "Ha ocurrido un error obteniendo el ticket " + e,
        status: false
      }
    }
  }

}



