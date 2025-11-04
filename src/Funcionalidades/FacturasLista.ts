import { useEffect, useState, useCallback } from "react";
import { FacturasService } from "../Services/Facturas.service";
import type { ReFactura } from "../Models/RegistroFacturaInterface";

// 🧠 Lógica principal para manejar la lista de facturas y sus filtros
export function FacturasLista() {
  const service = new FacturasService((window as any).graphInstance); // Asumimos que el graph se inyecta globalmente o se pasa luego
  const [facturas, setFacturas] = useState<ReFactura[]>([]);
  const [filtros, setFiltros] = useState({
    fechadeemision: "",
    numerofactura: "",
    proveedor: "",
    Title: "",
    tipodefactura: "",
  });
  const [facturaEdit, setFacturaEdit] = useState<ReFactura | null>(null);

  // 🟢 Cargar todas las facturas al iniciar
  useEffect(() => {
    (async () => {
      const lista = await service.getAll();
      setFacturas(lista.items);
    })();
  }, []);

  // 🔹 Cambiar valores de los filtros
  const handleFiltroChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFiltros((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // 🔹 Filtrar resultados según los criterios
  const facturasFiltradas = facturas.filter((f) =>
    Object.entries(filtros).every(([key, val]) =>
      val ? String((f as any)[key]).toLowerCase().includes(val.toLowerCase()) : true
    )
  );

  // 🔹 Formatear la fecha de emisión
  const formatearFecha = useCallback((fecha?: string) => {
    if (!fecha) return "";
    return new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  return {
    facturas,
    filtros,
    facturaEdit,
    setFacturaEdit,
    facturasFiltradas,
    handleFiltroChange,
    formatearFecha,
  };
}
