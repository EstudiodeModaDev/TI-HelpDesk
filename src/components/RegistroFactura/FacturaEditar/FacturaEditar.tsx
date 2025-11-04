// src/components/RegistrarFactura/FacturaEditar/FacturaEditar.tsx
import React, { useState } from "react";
import type { ReFactura } from "../../../Models/RegistroFacturaInterface";
import { FacturaEditar as facturaFx } from "../../../Funcionalidades/FacturaEditar";
import "./FacturaEditar.css";
import { opcionescc, opcionesco, opcionesFactura, opcionesun } from "../RegistroFactura";

interface Props {
  factura: ReFactura;
  onClose: () => void;
  onEliminar?: (id: number) => void;
  onGuardar?: () => void;
}

export default function FacturaEditarCompo({ factura, onClose, onEliminar, onGuardar }: Props) {
  const { actualizarFactura, eliminarFactura } = facturaFx();
  const [formData, setFormData] = useState({
    proveedor: factura.Proveedor ?? "",
    Title: factura.Title ?? "",
    ValorAnIVA: typeof factura.ValorAnIVA === "number" ? factura.ValorAnIVA : Number(factura.ValorAnIVA) || 0,
    DetalleFac: factura.DetalleFac,
    Items: factura.Items ?? "",
    CC: factura.CC ?? "", 
    Observaciones: factura.Observaciones,
    CO: factura.CO ?? "",
    un: factura.un ?? "", 
    DocERP: factura.DocERP ?? "", 
    FechaEmision: factura.FechaEmision
    ? new Date(factura.FechaEmision).toISOString().split("T")[0]
    : "",
    
    FecEntregaCont: factura.FecEntregaCont
    ? new Date(factura.FecEntregaCont).toISOString().split("T")[0]
    : "", 
    
  });
  
  const setField = <K extends keyof ReFactura>(k: K, v: ReFactura[K]) => setFormData((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault();

  const cambios: Partial<ReFactura> = {
    Proveedor: formData.proveedor,
    Title: formData.Title,
    ValorAnIVA: formData.ValorAnIVA,
    DetalleFac: formData.DetalleFac,
    Items: formData.Items,
    CC: formData.CC,
    CO: formData.CO,
    un: formData.un,
    DocERP: formData.DocERP,
    FechaEmision: formData.FechaEmision,
    FecEntregaCont: formData.FecEntregaCont,
    Observaciones: formData.Observaciones
  };

    const id = factura.id0;
    if (id == null) {
      console.error("No se encontró id0 en la factura. No se puede actualizar.");
      return;
    }

    const ok = await actualizarFactura(id, cambios);
    if (ok) {
      onGuardar?.();
      onClose();
    }
  };

  const handleEliminar = async () => {
    const id = factura.id0;
    if (id == null) {
      console.error("No se encontró id0 en la factura. No se puede eliminar.");
      return;
    }

    const confirmar = window.confirm(`¿Seguro deseas eliminar la factura #${factura.NoFactura}?`);
    if (!confirmar) return;

    const ok = await eliminarFactura(id);
    if (ok) {
      onEliminar?.(id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>✏️ Editar Factura #{factura.NoFactura}</h3>

        <form onSubmit={handleSubmit} className="modal-form">
          <label> Proveedor: 
            <input name="proveedor" value={formData.proveedor} onChange={(e) => setField("Proveedor", e.target.value)} placeholder="Proveedor" />
          </label>

          <label> NIT: 
            <input name="Title" value={formData.Title} onChange={(e) => setField("Title", e.target.value)} placeholder="NIT" />
          </label>

          <label> Valor Antes del IVA: 
            <input name="ValorAnIVA" type="number" value={formData.ValorAnIVA} onChange={(e) => setField("ValorAnIVA", Number(e.target.value))} placeholder="Valor" />
          </label>

          <label> Detalle de la factura: 
            <input name="DetalleFac" type="text" value={formData.DetalleFac} onChange={(e) => setField("DetalleFac", e.target.value)} placeholder="Detalle de la factura" />
          </label>

          <label>Ítems:
            <select name="Items" value={formData.Items} onChange={(e) => {
                                                        const codigo = e.target.value;
                                                        const item = opcionesFactura.find((of) => String(of.codigo) === String(codigo));
                                                        setField("Items", codigo);
                                                        setField("DescripItems", item?.descripcion ?? "");
                                                      }}
                                                      required
                                                    >
              <option value="">Seleccionar ítem</option>
              {opcionesFactura.map((of) => (
                <option key={of.codigo} value={of.codigo}>
                  {of.codigo} - {of.descripcion}
                </option>
              ))}
            </select>
          </label>

          <label> C.C:
            <select name="CC" value={formData.CC} onChange={(e) => {setField("CC", e.target.value);}} required> <option value="">Seleccionar centro de costo</option>
                  {opcionescc.map((cc) => (
                    <option key={cc.codigo} value={cc.codigo}>
                      {cc.codigo} - {cc.descripcion}
                    </option>
                  ))}
            </select>
          </label>

          <label> C.O:
            <select name="CO" value={formData.CO} onChange={(e) => {setField("CO", e.target.value);}}  required> <option value="">Seleccionar centro operativo</option>
                  {opcionesco.map((co) => (
                    <option key={co.codigo} value={co.codigo}>
                      {co.codigo} - {co.descripcion}
                    </option>
                  ))}
            </select>
          </label>
          
          <label> U.N:
          <select name="UN" value={formData.un} onChange={(e) => {setField("un", e.target.value);}}  required> <option value="">Seleccionar unidad de negocio</option>
                {opcionesun.map((un) => (
                  <option key={un.codigo} value={un.codigo}>
                    {un.codigo} - {un.descripcion}
                  </option>
                ))}
            </select>
          </label>
          
          <label> Fecha de Emisión:
          <input name="FechaEmision" type="date" value={formData.FechaEmision} onChange={(e) => {setField("FechaEmision", e.target.value);}}  /></label>
          <label> Fecha Entrega a Contabilidad:
          <input name="FechaEntregaConta" type="date" value={formData.FecEntregaCont} onChange={(e) => {setField("FecEntregaCont", e.target.value);}}  /></label>
          <label> Doc ERP:
          <input name="DocERP" value={formData.DocERP} onChange={(e) => {setField("DocERP", e.target.value);}}  placeholder="Documento ERP" /></label>
          <label>Observaciones: <input name="Obs" type="text" value={formData.Observaciones} onChange={(e) => setField("Observaciones", e.target.value)} placeholder="Observaciones de la factura" /></label>

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