import { useCallback, useEffect, useMemo, useState } from "react";
import { useGraphServices } from "../graph/GrapServicesContext";
import type { DistribucionFacturaData } from "../Models/DistribucionFactura";
import { DistribucionFacturaService } from "../Services/DistribucionFactura.service";
import { useAuth } from "../auth/authContext";

// 🧠 Hook principal para manejar la lógica de distribución de facturas
export function useDistribucionFactura() {
  const { graph } = useGraphServices();
  const service = useMemo(() => new DistribucionFacturaService(graph), [graph]);
  const { account } = useAuth();
  account?.name;

  const [distribuciones, setDistribuciones] = useState<DistribucionFacturaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Obtener todas las distribuciones guardadas
  const obtenerDistribuciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lista = await service.getAll({ orderby: "createdDateTime desc" });
      console.log("📋 Distribuciones obtenidas:", lista);
      setDistribuciones(lista);
      return lista;
    } catch (err: any) {
      console.error("❌ Error al obtener distribuciones:", err);
      setError(err?.message ?? "Error al cargar las distribuciones");
      setDistribuciones([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [service]);

  // 🟢 Registrar una nueva distribución
  const registrarDistribucion = useCallback(async (data: Omit<DistribucionFacturaData, "id0">) => {
    setLoading(true);
    setError(null);
    try {
      const nueva = await service.create(data);
      setDistribuciones((prev) => [...prev, nueva]);
      return nueva;
    } catch (err: any) {
      console.error("❌ Error al registrar distribución:", err);
      setError(err?.message ?? "Error al registrar la distribución");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  // 🔁 Nuevo método: recargar distribuciones manualmente
  const recargarDistribuciones = useCallback(async () => {
    console.log("🔄 Recargando distribuciones...");
    await obtenerDistribuciones();
  }, [obtenerDistribuciones]);

  // ⚡ Carga inicial al montar
  useEffect(() => {
    void obtenerDistribuciones();
  }, [obtenerDistribuciones]);

  return {
    distribuciones,
    loading,
    error,
    obtenerDistribuciones,
    registrarDistribucion,
    recargarDistribuciones, // ✅ Ahora también se exporta
  };
}
