// ============================================================
// Hook unificado para manejar Centros (Costos / Operativos)
// ============================================================

import { useState } from "react";
import { GraphRest } from "../graph/GraphRest";
import { useAuth } from "../auth/authContext";
import type { CentroFactura, TipoCentro } from "../Models/CentroFactura";
import { CentrosFacturaService } from "../Services/CentrosFactura.service";

export type TipoCentroSoportado = Extract<
  TipoCentro,
  "CentroCostos" | "CentrosOperativos"
>;

export const useCentrosFactura = () => {
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centros, setCentros] = useState<CentroFactura[]>([]);

  // ⭐ NUEVO: indicador global de refresco
  const [refreshFlag, setRefreshFlag] = useState(0);

  const crearService = (tipo: TipoCentroSoportado) => {
    const graph = new GraphRest(getToken);
    return new CentrosFacturaService(graph, tipo);
  };

  const cargarCentros = async (tipo: TipoCentroSoportado) => {
    setLoading(true);
    setError(null);
    try {
      const service = crearService(tipo);
      const lista = await service.getAll({ orderby: "Title" });
      setCentros(lista);
    } catch (e: any) {
      console.error("Error cargando centros:", e);
      setError("No se pudo cargar la lista de centros");
    } finally {
      setLoading(false);
    }
  };

  const agregarCentro = async (
    tipo: TipoCentroSoportado,
    centro: { Title: string; Codigo: string }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const service = crearService(tipo);
      await service.add(centro);

      // ✔ REFRESCA la lista del tipo recién creado
      await cargarCentros(tipo);

      // ⭐ NUEVO: avisar globalmente que hay un nuevo centro
      setRefreshFlag(Date.now());

    } catch (e: any) {
      console.error("Error agregando centro:", e);
      setError("No se pudo agregar el centro");
    } finally {
      setLoading(false);
    }
  };

  return {
    centros,
    loading,
    error,
    cargarCentros,
    agregarCentro,

    // ⭐ NUEVO: bandera de refresco para que otros hooks actualicen listas
    refreshFlag,
  };
};
