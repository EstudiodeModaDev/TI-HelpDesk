import React, { useState, useEffect } from "react";
import "./FacturaFiltros.css";
import type { ReFactura } from "../../../Models/RegistroFacturaInterface";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import { useCentroCostos, useCO } from "../../../Funcionalidades/Compras";

/**
 * 🔎 Componente de filtros reutilizable
 * Recibe una prop `onFiltrar` para comunicar los filtros al padre.
 */
export default function FacturaFiltros({
  onFiltrar,
}: {
  onFiltrar: (filtros: Partial<ReFactura>) => void;
}) {
  const [filtros, setFiltros] = useState<Partial<ReFactura>>({
    FechaEmision: "",
    NoFactura: "",
    Proveedor: "",
    Title: "",
    Items: "",
    DescripItems: "",
  });
    const { CentroCostos, CentroOperativo } = useGraphServices();
    const { ccOptions} = useCentroCostos(CentroCostos as any);
    const { COOptions, UNOptions} = useCO(CentroOperativo as any);

  const opcionesFactura = [
    { codigo: "SC11", descripcion: "ARREND. EQ. COMPUTAC Y COMUNICACIÓN" },
    { codigo: "SC40", descripcion: "MMTO. EQ. COMPUTO Y COMU COMPRAS RC" },
    { codigo: "SC41", descripcion: "MMTO. EQ. COMPUTO Y COMU SERVICIOS RC" },
    { codigo: "SC70", descripcion: "UTILES, PAPELERIA Y FOTOCOPIAS RC" },
    { codigo: "SC80", descripcion: "SERVICIO DE TELEFONIA" },
  ];

  // 🔁 Llama automáticamente al padre cada vez que cambian los filtros
  useEffect(() => {
    onFiltrar(filtros);
  }, [filtros]);

  // 🧠 Actualiza los filtros locales
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "Items") {
      const seleccion = opcionesFactura.find((o) => o.codigo === value);
      setFiltros((prev) => ({
        ...prev,
        Items: value,
        DescripItems: seleccion ? seleccion.descripcion : "",
      }));
      
    } else {
      setFiltros((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="filtros-container">
      <h3>🔍 Filtros de búsqueda</h3>

      <div className="filtros-grid">
         

        <input
          type="text"
          name="NoFactura"
          value={filtros.NoFactura || ""}
          onChange={handleChange}
          placeholder="Número de factura"
        />

        <input
          type="text"
          name="Proveedor"
          value={filtros.Proveedor || ""}
          onChange={handleChange}
          placeholder="Proveedor"
        />

        <input
          type="text"
          name="Title"
          value={filtros.Title || ""}
          onChange={handleChange}
          placeholder="NIT"
        />

        {/* 🧾 Selector de ítem */}
        <select name="Items" value={filtros.Items || ""} onChange={handleChange}>
          <option value="">Seleccionar código</option>
          {opcionesFactura.map((op) => (
            <option key={op.codigo} value={op.codigo}>
              {op.codigo} - {op.descripcion}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="DescripItems"
          value={filtros.DescripItems || ""}
          readOnly
          placeholder="Descripción del ítem"
        />


        {/* 🧾 Selector de cc */}
        <select name="CC" value={filtros.CC || ""} onChange={handleChange}>
          <option value="">Sel centro cos</option>
          {ccOptions.map((oc) => (
            <option key={oc.value} value={oc.label}>
              {oc.value} - {oc.label}
            </option>
          ))}
        </select>


        {/* 🧾 Selector de co */}
        <select name="CO" value={filtros.CO || ""} onChange={handleChange}>
          <option value="">Sel centro ope</option>
          {COOptions.map((oco) => (
            <option key={oco.value} value={oco.value}>
              {oco.value} - {oco.label}
            </option>
          ))}
        </select>

         {/* 🧾 Selector de un */}
        <select name="un" value={filtros.un || ""} onChange={handleChange}>
          <option value="">Sel und. negocio</option>
          {UNOptions.map((ou) => (
            <option key={ou.value} value={ou.label}>
              {ou.value} - {ou.label}
            </option>
          ))}
        </select>


       

                <input
          type="text"
          name="DocERP"
          value={filtros.DocERP || ""}
          onChange={handleChange}   // ← 👈 falta esto
          placeholder="Doc ERP"
        />

         <label>
          Fecha entrega cont
          <input
            type="date"
            name="FecEntregaCont"
            value={filtros.FecEntregaCont || ""}
            onChange={handleChange}
          />
        </label>

        <label>
            Fecha de emisión
            <input
              type="date"
              name="FechaEmision"
              value={filtros.FechaEmision || ""}
              onChange={handleChange}
            />
          </label>


      </div>
    </div>
  );
}