import type { GraphRest } from "../../graph/GraphRest";
import type { GetAllOpts, PageResult } from "../../Models/Commons";
import type { UsuariosSP } from "../../Models/Usuarios";
import { esc } from "../../utils/Commons";
import type { UsuariosSPRepository } from "./UsuariosSPRepository";

export class UsuariosSPFromSharepoint implements UsuariosSPRepository {
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
    listName = 'Usuarios'
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
  
  private toModel(item: any): UsuariosSP {
    const f = item?.fields ?? {};
    return {
      // Identificadores / asunto
      Id: String(f.ID ?? f.Id ?? f.id ?? item?.id ?? ''),
      Correo: f.Correo ?? null,
      Rol: f.Rol ?? '',
      Title: f.Title ?? '',
      _x0052_ol2: f._x0052_ol2 ?? '',
      Disponible: f.Disponible ?? '',
      Numerodecasos: f.Numerodecasos ?? '',
    };
  }

  // ---------- CRUD ----------
  async create(record: Omit<UsuariosSP, 'ID'>) {
    await this.ensureIds();
    console.log(record)
    const res = await this.graph.post<any>(
    `/sites/${this.siteId}/lists/${this.listId}/items`,
    { fields: record }
    );
    console.log(res)
    return this.toModel(res);
}

  async update(id: string, changed: Partial<Omit<UsuariosSP, 'ID'>>) {
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

  async getAll(opts?: GetAllOpts): Promise<PageResult<UsuariosSP>> {
    await this.ensureIds();
    const qs = new URLSearchParams({ $expand: 'fields' });
    if (opts?.filter)  qs.set('$filter', opts.filter);
    if (opts?.orderby) qs.set('$orderby', opts.orderby);
    if (opts?.top != null) qs.set('$top', String(opts.top));
    const url = `/sites/${this.siteId}/lists/${this.listId}/items?${qs.toString()}`;
    const res = await this.fetchPage(url);

    return res
  }

  private async fetchPage(url: string, isAbsolute = false): Promise<PageResult<UsuariosSP>> {
    const res = isAbsolute
      ? await this.graph.getAbsolute<any>(url)  // 👈 URL absoluta (nextLink)
      : await this.graph.get<any>(url);         // 👈 path relativo

    const raw = Array.isArray(res?.value) ? res.value : [];
    const items = raw.map((x: any) => this.toModel(x));
    const nextLink = res?.['@odata.nextLink'] ? String(res['@odata.nextLink']) : null;
    return { items, nextLink };
  }

  async loadUsuarios(): Promise<{ data: UsuariosSP[]; status: boolean; message: string | null; }> {
    try{
      const res = await this.getAll()
      return {
        data: res.items,
        message: "",
        status: true
      }
    } catch(e: any) {
      return{
        data: [],
        message: "Ha ocurrido un error obteniendo los usuarios " + e,
        status: false
      }
    }
    
  } 

  async createUsuario(payload: UsuariosSP): Promise<{ data: UsuariosSP | null; status: boolean; message: string | null; }> {
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

  async inactivateUsuario(id: string,): Promise<{ data: UsuariosSP | null; status: boolean; message: string | null; }> {
    try{
      const updated = await this.update(id, {Disponible: "Inactivo"})
      return{
        data: updated,
        message: "",
        status: true
      }
    } catch (e: any) {
      return{
        data: null,
        message: "Ha ocurrido un error inactivando el usuario " + e,
        status: false
      }
    }
  }

  async activateUsuario(id: string,): Promise<{ data: UsuariosSP | null; status: boolean; message: string | null; }> {
    try{
      const updated = await this.update(id, {Disponible: "Disponible"})
      return{
        data: updated,
        message: "",
        status: true
      }
    } catch (e: any) {
      return{
        data: null,
        message: "Ha ocurrido un error activando el usuario " + e,
        status: false
      }
    }
  }

  async getByEmail(email: string): Promise<{ data: UsuariosSP | null; status: boolean; message: string; }> {
    const safeEmail = esc(email)
    try{
      const founded = ((await this.getAll({filter: `Correo eq '${safeEmail}'`})).items)[0]
      return{
        data: founded,
        message: "",
        status: true
      }
    } catch(e: any){
      return{
        data: null,
        message: "Algo ha salido mal buscando el usuario, " + e,
        status: false
      }
    }
  }

  async getById(id: string): Promise<{ data: UsuariosSP | null; status: boolean; message: string; }> {
    try{
      const founded = await this.get(id)
      return{
        data: founded,
        message: "",
        status: true
      }
    } catch(e: any){
      return{
        data: null,
        message: "Algo ha salido mal buscando el usuario, " + e,
        status: false
      }
    }
  }

  async updateUsuario(id: string, payload: Partial<UsuariosSP>): Promise<{ data: UsuariosSP | null; status: boolean; message: string; }> {
    try{
      const updated =await this.update(id, payload)
      return{
        data: updated,
        message: "",
        status: true
      } 
    } catch (e: any){
      return{
        data: null, 
        message: "Algo ha salido mal actualizando el usuario " + e,
        status: false
      }
    }
  }

}



