import { useEffect, useState } from "react";
import type { Proveedor } from "../Models/Facturas";
import { ProveedoresFacturaService } from "../Services/ProveedoresFacturas.service";
import { GraphRest } from "../graph/GraphRest";
import { useAuth } from "../auth/authContext";

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  // ✅ Mantienes tu carga original intacta
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const graph = new GraphRest(getToken);
        const service = new ProveedoresFacturaService(graph);
        const lista = await service.getAll();
        setProveedores(lista);
      } catch (e: any) {
        console.error("Error cargando proveedores:", e);
        setError("No se pudo cargar la lista de proveedores");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ✅ Nuevo método: recargar la lista manualmente (por si se agrega un nuevo proveedor)
  const cargarProveedores = async () => {
    setLoading(true);
    try {
      const graph = new GraphRest(getToken);
      const service = new ProveedoresFacturaService(graph);
      const lista = await service.getAll();
      setProveedores(lista);
    } catch (e: any) {
      console.error("Error recargando proveedores:", e);
      setError("No se pudo recargar la lista de proveedores");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Nuevo método: agregar proveedor
  const agregarProveedor = async (proveedor: { Title: string; Nombre: string }) => {
    try {
      const graph = new GraphRest(getToken);
      const service = new ProveedoresFacturaService(graph);
      await service.add(proveedor); // <-- este método lo debe tener tu service
      await cargarProveedores(); // refresca lista
    } catch (e: any) {
      console.error("Error agregando proveedor:", e);
      setError("No se pudo agregar el proveedor");
    }
  };

  // 🔹 Exportas lo nuevo sin alterar lo que ya existía
  return { proveedores, loading, error, cargarProveedores, agregarProveedor };
};
