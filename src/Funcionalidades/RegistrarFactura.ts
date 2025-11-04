// ✅ Hook principal: maneja la lógica de registrar y listar facturas
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGraphServices } from "../graph/GrapServicesContext";
import type { ReFactura } from "../Models/RegistroFacturaInterface";
import { useAuth } from "../auth/authContext";
import { FacturasService } from "../Services/Facturas.service";
import { FlowClient } from "./FlowClient";
import type { conectorFacturas } from "../Models/FlujosPA";

const toMs = (v: string | number | Date | null | undefined) =>
  v == null ? -Infinity : new Date(v).getTime();

export function useFacturas() {
  // Traemos el GraphRest desde el contexto global (ya autenticado)
  const { graph } = useGraphServices();
  const { account } = useAuth();
  account?.name

  const service = useMemo(() => new FacturasService(graph), [graph]);
  const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9a72962755ff499897a60603bf97337c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Zg3IBn51rBif8_R-Du4q2Z3TpfkKP-xdNXQQ3IEKkac")
  
  const [facturas, setFacturas] = useState<ReFactura[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const obtenerFacturas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lista = await service.getAll({orderby: "createdDateTime desc"});
      console.log("Desordenada", lista.items)
      const listaOrdenada = lista.items.sort((a, b) => toMs(b.Created!) - toMs(a.Created!)); // Descendente

      console.log(listaOrdenada)
      setFacturas(listaOrdenada);
      return listaOrdenada;
    } catch (err: any) {
      console.error("Error al obtener facturas:", err);
      setError(err?.message ?? "Error desconocido al cargar facturas");
      setFacturas([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [service]);

  const registrarFactura = useCallback(async (f: Omit<ReFactura, "id0">) => {
    setLoading(true);
    setError(null);
    try {
      // Llamamos al servicio para crearla
      const nueva = await service.create(f);

      // La añadimos a la lista local sin tener que recargar todo
      setFacturas((prev) => [...prev, nueva]);

      return nueva;
    } catch (err: any) {
      console.error("Error al registrar factura:", err);
      setError(err?.message ?? "Error desconocido al registrar factura");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void obtenerFacturas();
  }, [obtenerFacturas]);

  const handleConector = async (InitialDate: string, finalDate: string,) => {
    
    try {
      await notifyFlow.invoke<conectorFacturas, any>({InitialDate: InitialDate, FinalDate: finalDate, user: account?.username ?? "" });
      alert("se ha generado con éxito su conector, en minutos le llegar a su correo")

    } catch (err) {
        console.error("Ha ocurrido un error descargando el conector:", err);
      } 
    };

  // Retornamos el estado y las funciones públicas del hook
  return {
    facturas,
    loading,
    error,
    obtenerFacturas,
    registrarFactura,
    handleConector
  };
}

