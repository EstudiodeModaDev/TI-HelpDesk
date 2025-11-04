// src/components/DistribucionFactura/DistribucionFacturaEditar.tsx
import React, { useState, useEffect } from "react";
import type { DistribucionFacturaData } from "../../../Models/DistribucionFactura";
import { DistribucionFacturaService } from "../../../Services/DistribucionFactura.service";
import { FacturasService } from "../../../Services/Facturas.service";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import "./DistribucionFacturaEditar.css";

interface Props {
  distribucion: DistribucionFacturaData;
  onClose: () => void;
  onGuardar?: () => void;
  onEliminar?: (id: string) => void;
}

export default function DistribucionFacturaEditar({
  distribucion,
  onClose,
  onGuardar,
  onEliminar,
}: Props) {
  const { graph } = useGraphServices();
  const serviceDist = new DistribucionFacturaService(graph);
  const serviceFact = new FacturasService(graph);

  // 🧮 Estado local con los campos editables
  const [formData, setFormData] = useState({
    FechaEmision: distribucion.FechaEmision
      ? new Date(distribucion.FechaEmision).toISOString().split("T")[0]
      : "",
    NoFactura: distribucion.NoFactura ?? "",
    CargoFijo: distribucion.CargoFijo ?? 0,
    CosToImp: distribucion.CosToImp ?? 0,
    ImpBnCedi: distribucion.ImpBnCedi ?? 0,
    ImpBnPalms: distribucion.ImpBnPalms ?? 0,
    ImpColorPalms: distribucion.ImpColorPalms ?? 0,
    ImpBnCalle: distribucion.ImpBnCalle ?? 0,
    ImpColorCalle: distribucion.ImpColorCalle ?? 0,

    // Valores calculados
    ValorAnIVA: distribucion.ValorAnIVA ?? 0,
    CosTotCEDI: distribucion.CosTotCEDI ?? 0,
    CosTotMarNacionales: distribucion.CosTotMarNacionales ?? 0,
    CosTotMarImpor: distribucion.CosTotMarImpor ?? 0,
    CosTotServAdmin: distribucion.CosTotServAdmin ?? 0,
  });

  // 🔹 Función para actualizar campos del form
  const setField = <K extends keyof typeof formData>(k: K, v: typeof formData[K]) =>
    setFormData((s) => ({ ...s, [k]: v }));

  // ✅ Limpieza de datos antes de enviar
  const limpiarDatos = (obj: Record<string, any>) => {
    const limpio: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      if (v === "") limpio[k] = null;
      else if (typeof v === "number" && isNaN(v)) limpio[k] = 0;
      else limpio[k] = v;
    }
    return limpio;
  };

  // 🧮 Recalcular campos derivados cada vez que cambia algo
  useEffect(() => {
    const parse = (v: unknown) =>
      typeof v === "number"
        ? v
        : typeof v === "string"
        ? Number(v.replace(/\./g, "").replace(",", ".")) // "es-CO"
        : 0;

    const CargoFijo = parse(formData.CargoFijo);
    const ImpBnCedi = parse(formData.ImpBnCedi);
    const ImpBnPalms = parse(formData.ImpBnPalms);
    const ImpColorPalms = parse(formData.ImpColorPalms);
    const ImpBnCalle = parse(formData.ImpBnCalle);
    const ImpColorCalle = parse(formData.ImpColorCalle);

    const CosToImp = ImpBnCedi + ImpBnPalms + ImpColorPalms + ImpBnCalle + ImpColorCalle;
    const cargoFijo3 = CargoFijo - CargoFijo / 3;
    const ValorAnIVA = CargoFijo + CosToImp;
    const CosTotCEDI = CargoFijo / 3 + ImpBnCedi;
    const promedioOtros = (ImpBnPalms + ImpColorPalms + ImpBnCalle + ImpColorCalle) / 3;
    const otrosCostos = cargoFijo3 / 3 + promedioOtros;

    setFormData((prev) => ({
      ...prev,
      CosToImp,
      ValorAnIVA,
      CosTotCEDI,
      CosTotMarNacionales: otrosCostos,
      CosTotMarImpor: otrosCostos,
      CosTotServAdmin: otrosCostos,
    }));
  }, [
    formData.CargoFijo,
    formData.ImpBnCedi,
    formData.ImpBnPalms,
    formData.ImpColorPalms,
    formData.ImpBnCalle,
    formData.ImpColorCalle,
  ]);

  // 🧾 Guardar cambios (actualiza distribución + facturas relacionadas)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!distribucion.Id) {
      console.error("❌ No se encontró Id del registro de distribución.");
      alert("No se puede actualizar: falta el Id del registro.");
      return;
    }

    try {
      // 🔹 1️⃣ Actualizar distribución
      const cambiosDist = limpiarDatos({
        FechaEmision: formData.FechaEmision || null,
        NoFactura: formData.NoFactura,
        CargoFijo: formData.CargoFijo,
        CosToImp: formData.CosToImp,
        ImpBnCedi: formData.ImpBnCedi,
        ImpBnPalms: formData.ImpBnPalms,
        ImpColorPalms: formData.ImpColorPalms,
        ImpBnCalle: formData.ImpBnCalle,
        ImpColorCalle: formData.ImpColorCalle,
        ValorAnIVA: formData.ValorAnIVA,
        CosTotCEDI: formData.CosTotCEDI,
        CosTotMarNacionales: formData.CosTotMarNacionales,
        CosTotMarImpor: formData.CosTotMarImpor,
        CosTotServAdmin: formData.CosTotServAdmin,
      });

      console.log("📦 Actualizando distribución con:", cambiosDist);
      await serviceDist.update(String(distribucion.Id), cambiosDist);
      console.log("✅ Distribución actualizada correctamente.");

      // 🔹 2️⃣ Buscar facturas relacionadas
      const filtro = `fields/IdDistrubuida eq ${distribucion.Id}`;
      const posiblesFacturas = await serviceFact.getAll({ filter: filtro });
      const facturasRelacionadas = posiblesFacturas.items || [];

      if (facturasRelacionadas.length === 0) {
        console.warn("⚠️ No se encontraron facturas relacionadas con ese IdDistrubuida.");
      } else {
        console.log(`📄 Se encontraron ${facturasRelacionadas.length} facturas con IdDistrubuida=${distribucion.Id}`);

        // 🔹 3️⃣ Determinar valores por tipo de factura
        const partidas = [
          { tipo: "CCmn", ValorAnIVA: formData.CosTotMarNacionales },
          { tipo: "CCmi", ValorAnIVA: formData.CosTotMarImpor },
          { tipo: "CCcedi", ValorAnIVA: formData.CosTotCEDI },
          { tipo: "CCsa", ValorAnIVA: formData.CosTotServAdmin },
        ];

        // 🔁 4️⃣ Actualizar cada factura
        for (let i = 0; i < facturasRelacionadas.length; i++) {
          const factura = facturasRelacionadas[i];
          const partida = partidas[i] || partidas[0];

          const cambiosFactura = limpiarDatos({
            FechaEmision: formData.FechaEmision || null,
            NoFactura: formData.NoFactura,
            ValorAnIVA: partida.ValorAnIVA,
          });

          if (factura.id0 != null) {
            await serviceFact.update(String(factura.id0), cambiosFactura);
            console.log(`🧾 Factura ${factura.id0} actualizada.`);
          }
        }

        console.log(`✅ ${facturasRelacionadas.length} factura(s) actualizadas correctamente.`);
      }

      onGuardar?.();
      onClose();
    } catch (err) {
      console.error("❌ Error al actualizar distribución o facturas:", err);
      alert("Error al actualizar la distribución. Revisa la consola para más detalles.");
    }
  };

  // 🗑️ Eliminar distribución y facturas relacionadas
const handleEliminar = async () => {
  if (!distribucion.Id) {
    alert("No se puede eliminar: falta el Id del registro.");
    return;
  }

  const confirmar = window.confirm(
    "¿Seguro deseas eliminar el registro de distribución y sus facturas relacionadas?"
  );
  if (!confirmar) return;

  try {
    // 1️⃣ Buscar facturas relacionadas con este IdDistrubuida
    const filtro = `fields/IdDistrubuida eq ${distribucion.Id}`;
    const posiblesFacturas = await serviceFact.getAll({ filter: filtro });
    const facturasRelacionadas = posiblesFacturas.items || [];

    if (facturasRelacionadas.length > 0) {
      console.log(`🗑️ Se eliminarán ${facturasRelacionadas.length} facturas con IdDistrubuida=${distribucion.Id}`);

      // 2️⃣ Eliminar cada factura encontrada
      for (const factura of facturasRelacionadas) {
        if (factura.id0 != null) {
          try {
            await serviceFact.delete(String(factura.id0));
            console.log(`✅ Factura eliminada Id=${factura.id0}`);
          } catch (err) {
            console.error(`❌ Error al eliminar factura Id=${factura.id0}:`, err);
          }
        }
      }
    } else {
      console.log("ℹ️ No se encontraron facturas relacionadas para eliminar.");
    }

    // 3️⃣ Eliminar la distribución principal
    await serviceDist.delete(String(distribucion.Id));
    console.log("✅ Distribución eliminada correctamente.");

    // 4️⃣ Refrescar o cerrar modal
    onEliminar?.(String(distribucion.Id));
    onClose();
  } catch (err) {
    console.error("❌ Error al eliminar distribución o facturas:", err);
    alert("Error al eliminar la distribución o sus facturas relacionadas.");
  }
};


  // 🧱 UI del modal
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>✏️ Editar Distribución #{distribucion.NoFactura}</h3>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Fecha de Emisión:
            <input
              type="date"
              value={formData.FechaEmision}
              onChange={(e) => setField("FechaEmision", e.target.value)}
            />
          </label>

          <label>
            No. Factura:
            <input
              type="text"
              value={formData.NoFactura}
              onChange={(e) => setField("NoFactura", e.target.value)}
              placeholder="Número de factura"
            />
          </label>

          <label>
            Cargo Fijo:
            <input
              type="number"
              value={formData.CargoFijo}
              onChange={(e) => setField("CargoFijo", Number(e.target.value))}
            />
          </label>

          <h4>🖨️ Valores de Impresiones</h4>

          <label>
            Imp. B/N CEDI:
            <input
              type="number"
              value={formData.ImpBnCedi}
              onChange={(e) => setField("ImpBnCedi", Number(e.target.value))}
            />
          </label>

          <label>
            Imp. B/N Palms:
            <input
              type="number"
              value={formData.ImpBnPalms}
              onChange={(e) => setField("ImpBnPalms", Number(e.target.value))}
            />
          </label>

          <label>
            Imp. Color Palms:
            <input
              type="number"
              value={formData.ImpColorPalms}
              onChange={(e) => setField("ImpColorPalms", Number(e.target.value))}
            />
          </label>

          <label>
            Imp. B/N Calle:
            <input
              type="number"
              value={formData.ImpBnCalle}
              onChange={(e) => setField("ImpBnCalle", Number(e.target.value))}
            />
          </label>

          <label>
            Imp. Color Calle:
            <input
              type="number"
              value={formData.ImpColorCalle}
              onChange={(e) => setField("ImpColorCalle", Number(e.target.value))}
            />
          </label>

          <div className="modal-buttons">
            <button type="submit" className="btn-guardar">✅ Guardar</button>
            <button type="button" className="btn-cancelar" onClick={onClose}>❌ Cancelar</button>
            <button type="button" className="btn-eliminar" onClick={handleEliminar}>🗑️ Eliminar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
