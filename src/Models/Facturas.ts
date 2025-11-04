export type Facturas = {
  Id?: string;
  Title: string;
  FechaEmision: string;
  NoFactura: string;
  IdProveedor: string;
  CO: string;
  Total: number | string;
  un: string;
}

export type Proveedor = {
  Id?: string;
  Title: string; // nit proveedor
  Nombre: string;
}

export type ItemFactura = {
  Id?: string;
  Title: string; // IdItem
  IdFactura: string;
  Cantidad: number | string;
}

export type ItemUx = {
  Id?: string;
  tempId: string;
  Title: string //Codigo Item
  NombreItem: string;
  Valor: number; 
  cantidad: number,
  subtotal: number,
}

export type ItemBd = {
  Id?: string;
  Title: string //Codigo Item
  NombreItem: string;
  Valor: number | string; 
}

export type FacturasUx = {
  Id?: string;
  Title: string;
  FechaEmision: string;
  NoFactura: string;
  IdProveedor: string;
  CO: string;
  Total: number;
  un: string;
  lineas: ItemUx[],
  nit: string
}

export type FormErrors = Partial<Record<keyof FacturasUx, string>>;
export type ItemsErrors = Partial<Record<keyof ItemBd, string>>;
export type ProveedorError = Partial<Record<keyof Proveedor, string>>;
