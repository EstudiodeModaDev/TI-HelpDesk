// src/components/Facturas/FacturaDistribuidaModal.tsx
// import React from "react";

import "./FacturaDistribuidaModal.css";

import type { DistribucionFacturaData } from "../../../Models/DistribucionFactura";

interface Props {
  distribucion: DistribucionFacturaData;
  onClose: () => void;
}

export default function FacturaDistribuidaModal({ distribucion, onClose }: Props) {
  if (!distribucion) return null;

  // Totales
  const canonFijo = distribucion.CargoFijo ?? 0;
  const impresiones = distribucion.CosToImp ?? 0;
  const valorAnIVA = distribucion.ValorAnIVA ?? 0;

  // Detalles por impresión
  const impresionesColor = (distribucion.ImpColorCalle ?? 0) + (distribucion.ImpColorPalms ?? 0);
  const impresionesBN = (distribucion.ImpBnCedi ?? 0) + (distribucion.ImpBnCalle ?? 0) + (distribucion.ImpBnPalms ?? 0);

  // Distribución del cargo fijo según tus fórmulas
  const cedi = canonFijo / 3;
  // const resta = (2 / 3) * canonFijo; // parte restante del cargo fijo
  const palms = canonFijo / 3;
  const calle = canonFijo / 3;

  // Totales por CO (los valores ya los provees en la distribución)
  const marcasNac = distribucion.CosTotMarNacionales ?? 0;
  const marcasImp = distribucion.CosTotMarImpor ?? 0;
  const servAdmin = distribucion.CosTotServAdmin ?? 0;
  const costoCedi = distribucion.CosTotCEDI ?? 0;

  // Formato moneda (COP, sin decimales)
  const fmt = (v: number) =>
    v.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 });

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Factura distribuida</h2>
          <button aria-label="Cerrar" onClick={onClose} className="modal-close">✖</button>
        </div>

        <div className="modal-body">
          {/* Totales */}
          <section className="card-section">
            <h3>Totales</h3>
            <div className="row">
              <div>Canon fijo</div>
              <div>{fmt(canonFijo)}</div>
            </div>
            <div className="row">
              <div>Impresiones</div>
              <div>{fmt(impresiones)}</div>
            </div>
            <div className="row">
              <div>Valor Ante de IVA</div>
              <div>{fmt(valorAnIVA)}</div>
            </div>
          </section>

          {/* Detalles por impresión */}
          <section className="card-section">
            <h3>Detalles por impresión</h3>
            <div className="row">
              <div>🔵 Impresiones a color</div>
              <div>{fmt(impresionesColor)}</div>
            </div>
            <div className="row">
              <div>⚪️ Impresiones B/N</div>
              <div>{fmt(impresionesBN)}</div>
            </div>
          </section>

          {/* Distribución */}
<section className="card-section">
  <h3>Distribución de canon fijo</h3>

          <div className="row">
            <div className="row-info">
              <span className="nombre">CEDI</span>
              <span className="serial">WDS3807853</span>
            </div>
            <div>{fmt(cedi)}</div>
          </div>

          <div className="row">
            <div className="row-info">
              <span className="nombre">35 Palms</span>
              <span className="serial">VZU2Z03365</span>
            </div>
            <div>{fmt(palms)}</div>
          </div>

          <div className="row">
            <div className="row-info">
              <span className="nombre">Calle</span>
              <span className="serial">VZU2Z03220</span>
            </div>
            <div>{fmt(calle)}</div>
          </div>
        </section>


          {/* Total por C.O */}
          <section className="card-section">
            <h3>Total por C.O</h3>

            <div className="co-row">
              <div className="co-desc">
                <div className="co-title">Marcas nacionales</div>
                <div className="co-sub">CO: 001 • UN: 601</div>
              </div>
              <div className="co-value">{fmt(marcasNac)}</div>
            </div>

            <div className="co-row">
              <div className="co-desc">
                <div className="co-title">Dirección marcas importadas</div>
                <div className="co-sub">CO: 001 • UN: 601</div>
              </div>
              <div className="co-value">{fmt(marcasImp)}</div>
            </div>

            <div className="co-row">
              <div className="co-desc">
                <div className="co-title">Servicios administrativos</div>
                <div className="co-sub">CO: 001 • UN: 601</div>
              </div>
              <div className="co-value">{fmt(servAdmin)}</div>
            </div>

            <div className="co-row">
              <div className="co-desc">
                <div className="co-title">CEDI</div>
                <div className="co-sub">CO: 001 • UN: 601</div>
              </div>
              <div className="co-value">{fmt(costoCedi)}</div>
            </div>
          </section>

          {/* Información adicional */}
          <section className="card-section small">
            <div className="row">
              <div>Proveedor</div>
              <div>{distribucion.Proveedor}</div>
            </div>
            <div className="row">
              <div>NIT</div>
              <div>{distribucion.Title}</div>
            </div>
            <div className="row">
              <div>Factura</div>
              <div>{distribucion.NoFactura}</div>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-close">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
