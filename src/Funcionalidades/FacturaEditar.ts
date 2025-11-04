import { useCallback } from "react";

import type { ReFactura } from "../Models/RegistroFacturaInterface";
import { useGraphServices } from "../graph/GrapServicesContext";

export function FacturaEditar() {
  const { Facturas } = useGraphServices(); // ✅ Ya viene con GraphRest configurado

  // 🟢 Crear
  const registrarFactura = useCallback(async (nuevaFactura: ReFactura) => {
    try {
      await Facturas.create(nuevaFactura);
      return true;
    } catch (error) {
      console.error("Error al registrar factura:", error);
      return false;
    }
  }, [Facturas]);

  // ✏️ Actualizar
  const actualizarFactura = useCallback(async (id: number, cambios: Partial<ReFactura>) => {
    try {
      await Facturas.update(String(id), cambios);
      return true;
    } catch (error) {
      console.error("Error al actualizar factura:", error);
      return false;
    }
  }, [Facturas]);

  // 🗑️ Eliminar
  const eliminarFactura = useCallback(async (id: number) => {
    try {
      await Facturas.delete(String(id));
      return true;
    } catch (error) {
      console.error("Error al eliminar factura:", error);
      return false;
    }
  }, [Facturas]);

  return { registrarFactura, actualizarFactura, eliminarFactura };
}
