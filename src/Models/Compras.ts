import type { CCOption } from "./CentroCostos";
import type { COOption } from "./CO";

export type TipoCompra = "Producto" | "Servicio" | "Alquiler";
export type CargarA = "CO" | "Marca";
export type Opcion = { value: string; label: string };
export type CO = { value: string; code: string };
export type comprasState = {
  tipoCompra: TipoCompra;
  productoServicio: string;     
  solicitadoPor: string;
  solicitadoPorCorreo: string;
  fechaSolicitud: string;       
  dispositivo: string;
  co: COOption | null;                   
  un: string;                 
  ccosto: CCOption | null;                
  cargarA: CargarA;
  noCO: string;         
  marcasPct: Record<string, number>;
  motivo: string,
  estado?: string;
  codigoItem: string;
  DescItem: string,
  CorreoSolicitante: string
};

export type Compra = {
  Title: string;
  SolicitadoPor: string;
  FechaSolicitud: string;
  Dispositivo: string;
  CO: string;
  UN: string;
  CCosto: string;
  CargarA: string;
  PorcentajeMFG: string;
  PorcentajeDiesel: string;
  PorcentajePilatos: string;
  PorcentajeSuperdry: string;
  PorcentajeKipling: string;
  PorcentajeBroken: string;
  Id?: string,
  Estado?: string,
  CodigoItem: string;
  DescItem: string;
  CorreoSolicitante: string;
  IdCreado: string;
}
export const Items = [
    { codigo: "SC11", descripcion: "ARREND. EQ. COMPUTAC Y COMUNICACIÓN" },
    { codigo: "SC40", descripcion: "MMTO. EQ. COMPUTO Y COMU COMPRAS RC" },
    { codigo: "SC41", descripcion: "MMTO. EQ. COMPUTO Y COMU SERVICIOS RC" },
    { codigo: "SC70", descripcion: "UTILES, PAPELERIA Y FOTOCOPIAS RC" },
    { codigo: "SC80", descripcion: "SERVICIO DE TELEFONIA" },
  ];

export const UN = [
  { codigo: "101", descripcion: "RETAIL LINEA CORNER" },
  { codigo: "102", descripcion: "RETAIL LINEA MONOMARCA" },
  { codigo: "201", descripcion: "RETAIL OUTLET MONOMARCA" },
  { codigo: "202", descripcion: "RETAIL OUTLET CORNER" },
  { codigo: "302", descripcion: "FRANQUICIAS" },
  { codigo: "301", descripcion: "SOCIOS COMERCIALES FIRME" },
  { codigo: "401", descripcion: "TIENDAS POR DEPARTAMENTO" },
  { codigo: "602", descripcion: "GASTOS ADMINISTRATIVOS Y VENTAS" },
  { codigo: "501", descripcion: "EXPORTACIONES" },
  { codigo: "601", descripcion: "GENERAL" },
  { codigo: "303", descripcion: "RETAIL ONLINE CORNER" },
  { codigo: "305", descripcion: "SOCIOS COMERCIALES VMI" },
  { codigo: "306", descripcion: "SOCIOS COMERCIALES OUTLET" },
  { codigo: "304", descripcion: "RETAIL ONLINE MONOMARCA" },
  { codigo: "307", descripcion: "MARKETPLACE ONLINE" },
  { codigo: "603", descripcion: "SMART SALE" },
  { codigo: "604", descripcion: "FRANCQUES" },
  { codigo: "308", descripcion: "RETAIL ONLINE OUTLET" },
  { codigo: "309", descripcion: "BROKEN CHAINS" },
]
