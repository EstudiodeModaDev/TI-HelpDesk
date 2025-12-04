// ============================================================
// Hook unificado para manejar Centros:
//   ✔ CentroCostos
//   ✔ CentrosOperativos
//   ✔ UnidadNegocio
//
// - Expone agregarCentro()
// - Expone refreshFlag para que otros hooks reactiven sus cargas.
// - Usa GraphRest + CentrosFacturaService.
// ============================================================

import { useState } from "react";
import { GraphRest } from "../graph/GraphRest";
import { useAuth } from "../auth/authContext";
import type { CentroFactura, TipoCentro } from "../Models/CentroFactura";
import { CentrosFacturaService } from "../Services/CentrosFactura.service";

// ⭐ Permitimos TODOS los tipos soportados por el servicio
export type TipoCentroSoportado = Extract<
  TipoCentro,
  "CentroCostos" | "CentrosOperativos" | "UnidadNegocio"
>;

export const useCentrosFactura = () => {
  const { getToken } = useAuth();

  // Estado común para cualquier tipo de centro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centros, setCentros] = useState<CentroFactura[]>([]);

  // ⭐ Esta bandera permite que todos los hooks externos (CC/CO/UN)
  //   actualicen automáticamente sus listas cuando se agrega un nuevo centro.
  const [refreshFlag, setRefreshFlag] = useState(0);

  // ============================================================
  // Crear el servicio según el tipo solicitado
  // ============================================================
  const crearService = (tipo: TipoCentroSoportado) => {
    const graph = new GraphRest(getToken);
    return new CentrosFacturaService(graph, tipo);
  };

  // ============================================================
  // Obtener lista desde SharePoint según el tipo
  // ============================================================
  const cargarCentros = async (tipo: TipoCentroSoportado) => {
    setLoading(true);
    setError(null);

    try {
      const service = crearService(tipo);

      // Obtener lista ordenada por nombre (Title)
      const lista = await service.getAll({ orderby: "Title" });

      setCentros(lista);
    } catch (e: any) {
      console.error("Error cargando centros:", e);
      setError("No se pudo cargar la lista de centros");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Crear un centro en SP y refrescar automáticamente
  // ============================================================
  const agregarCentro = async (
    tipo: TipoCentroSoportado,
    centro: { Title: string; Codigo: string }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const service = crearService(tipo);

      // Crear el registro en SP
      await service.add(centro);

      // Volver a cargar la lista del tipo actual
      await cargarCentros(tipo);

      // ⭐ Notificar globalmente a CC/CO/UN que deben recargarse
      setRefreshFlag(Date.now());

    } catch (e: any) {
      console.error("Error agregando centro:", e);
      setError("No se pudo agregar el centro");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Retorno del hook listo para cualquier componente
  // ============================================================
  return {
    centros,      // Última lista consultada (según tipo)
    loading,
    error,

    cargarCentros,
    agregarCentro,

    // ⭐ Todos los hooks dependientes deben escuchar esta bandera
    refreshFlag,
  };
};
