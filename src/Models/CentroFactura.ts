// ============================================================
// Modelo genérico para Centros (Costos / Operativos / UN)
// ============================================================

export type TipoCentro = "CentroCostos" | "CentrosOperativos" | "UnidadNegocio";

export interface CentroFactura {
  Id: string;
  Title: string;   // Nombre (campo Title en SP)
  Codigo: string; // Campo 'Codigo' en la lista
}
