export interface DistribucionFacturaData {
  Id?: string;
  Proveedor: string; // nombre del proveedor
  Title: string; // NIT
  CargoFijo: number;
  CosToImp: number ;
  ValorAnIVA: number;
  ImpBnCedi: number;
  ImpBnPalms: number;
  ImpColorPalms: number;
  ImpBnCalle: number;
  ImpColorCalle: number;
  CosTotMarNacionales: number;
  CosTotMarImpor: number;
  CosTotCEDI: number;
  CosTotServAdmin: number;
  FechaEmision: string;
  NoFactura: string;
  Items: string;
  DescripItems?: string;
  CCmn: string;   
  CCmi: string;
  CCcedi: string;
  CCsa: string;
  CO: string;  
  un: string;  
  DetalleFac?: string ;
  IdDistribuida?: string
}