import type { ReFactura } from "../Models/RegistroFacturaInterface";
import { GraphRest } from "../graph/GraphRest";
import type { GetAllOpts } from "../Models/Commons";
import { ensureIds } from "../utils/Commons";

export class ReFacturasService {
  private graph: GraphRest;
  private hostname: string;
  private sitePath: string;
  private listName: string;
  private siteId?: string;
  private listId?: string;

  constructor(
    graph: GraphRest,
    hostname = "estudiodemoda.sharepoint.com",
    sitePath = "/sites/TransformacionDigital/IN/Test",
    listName = "Facturas"
  ) {
    this.graph = graph;
    this.hostname = hostname;
    this.sitePath = sitePath.startsWith("/") ? sitePath : `/${sitePath}`;
    this.listName = listName;
  }

  // 🔁 Convertir un item de SharePoint a modelo local
  private toModel(item: any): ReFactura {
    const f = item?.fields ?? {};
    return {
      id0: Number(item?.id ?? 0),
      FechaEmision: f.FechadeEmision ?? "",
      NoFactura: f.Numerofactura ?? "",
      Proveedor: f.Proveedor ?? "",
      Title: f.Title ?? "", // NIT
      Items: f.Item ?? "",
      DescripItems: f.Descripcion ?? "",
      ValorAnIVA: Number(f.Valor) || 0,
      CC: f.Cc ?? "",
      CO: f.Co ?? "",
      un: f.Un ?? "",
      DetalleFac: f.Detalle ?? "",
      FecEntregaCont: f.FecEntregaCont ?? "",
      DocERP: f.DocERP ?? "",
      Observaciones: f.Observaciones ?? "",
      RegistradoPor: f.RegistradoPor ?? "",
    };
  }

  // 🟢 Crear factura
  async create(record: Omit<ReFactura, "id0">) {
    const ids = await ensureIds(
      this.siteId,
      this.listId,
      this.graph,
      this.hostname,
      this.sitePath,
      this.listName
    );
    this.siteId = ids.siteId;
    this.listId = ids.listId;

    // 🔁 Mapeo de nombres locales → campos SharePoint
    const fields = {
      FechadeEmision: record.FechaEmision,
      Numerofactura: record.NoFactura,
      Proveedor: record.Proveedor,
      Title: record.Title,
      Item: record.Items,
      Descripcion: record.DescripItems,
      Valor: record.ValorAnIVA,
      Cc: record.CC,
      Co: record.CO,
      Un: record.un,
      Detalle: record.DetalleFac,
      FecEntregaCont: record.FecEntregaCont,
      DocERP: record.DocERP,
      Observaciones: record.Observaciones,
    };

    console.log("📤 Enviando a SharePoint:", fields);

    const res = await this.graph.post<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items`,
      { fields }
    );

    return this.toModel(res);
  }

  // 🔍 Obtener todas las facturas
  async getAll(opts?: GetAllOpts) {
    const ids = await ensureIds(
      this.siteId,
      this.listId,
      this.graph,
      this.hostname,
      this.sitePath,
      this.listName
    );
    this.siteId = ids.siteId;
    this.listId = ids.listId;

    const qs = new URLSearchParams();
    qs.set("$expand", "fields");
    qs.set("$select", "id,webUrl");
    if (opts?.orderby) qs.set("$orderby", opts.orderby);
    if (opts?.top != null) qs.set("$top", String(opts.top));
    if (opts?.filter) qs.set("$filter", opts.filter);

    const url = `/sites/${this.siteId}/lists/${this.listId}/items?${qs.toString()}`;
    const res = await this.graph.get<any>(url);

    return (res.value ?? []).map((x: any) => this.toModel(x));
  }

  // ✏️ Actualizar factura (solo los campos modificados)
  async update(id: string, changed: Partial<ReFactura>) {
    if (!id) throw new Error("ID de factura requerido");

    const ids = await ensureIds(
      this.siteId,
      this.listId,
      this.graph,
      this.hostname,
      this.sitePath,
      this.listName
    );
    this.siteId = ids.siteId;
    this.listId = ids.listId;

    // 🔁 Mapeo solo de los campos modificados
    const fields: any = {
      ...(changed.FechaEmision && { FechadeEmision: changed.FechaEmision }),
      ...(changed.NoFactura && { Numerofactura: changed.NoFactura }),
      ...(changed.Proveedor && { Proveedor: changed.Proveedor }),
      ...(changed.Title && { Title: changed.Title }),
      ...(changed.Items && { Item: changed.Items }),
      ...(changed.DescripItems && { Descripcion: changed.DescripItems }),
      ...(changed.ValorAnIVA != null && { Valor: changed.ValorAnIVA }),
      ...(changed.CC && { Cc: changed.CC }),
      ...(changed.CO && { Co: changed.CO }),
      ...(changed.un && { Un: changed.un }),
      ...(changed.DetalleFac && { Detalle: changed.DetalleFac }),
      ...(changed.FecEntregaCont && { FecEntregaCont: changed.FecEntregaCont }),
      ...(changed.DocERP && { DocERP: changed.DocERP }),
      ...(changed.Observaciones && { Observaciones: changed.Observaciones }),
    };

    console.log("✏️ Actualizando en SharePoint:", fields);

    const res = await this.graph.patch<any>(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}/fields`,
      fields
    );

    return this.toModel({ id, fields: res });
  }

  // 🗑️ Eliminar factura
  async delete(id: string) {
    if (!id) throw new Error("ID de factura requerido");

    const ids = await ensureIds(
      this.siteId,
      this.listId,
      this.graph,
      this.hostname,
      this.sitePath,
      this.listName
    );
    this.siteId = ids.siteId;
    this.listId = ids.listId;

    await this.graph.delete(
      `/sites/${this.siteId}/lists/${this.listId}/items/${id}`
    );
  }
}
