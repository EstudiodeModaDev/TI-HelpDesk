// src/components/DistribucionFactura/DistribucionFactura.tsx
import React, { useState, useEffect } from "react";
import "./DistribucionFactura.css";
import { useProveedores } from "../../../Funcionalidades/ProveedoresFactura";
import type { DistribucionFacturaData } from "../../../Models/DistribucionFactura";
import { useDistribucionFactura } from "../../../Funcionalidades/DistribucionFactura";
import { formatPesosEsCO, toNumberFromEsCO } from "../../../utils/Number";
import { useFacturas } from "../../../Funcionalidades/RegistrarFactura";
import DistribucionesLista from "./DistribucionesLista"; // ✅ Importamos la lista
import { useAuth } from "../../../auth/authContext";

import Select from "react-select"; // ✅ nuevo: para el campo de ítems


export default function DistribucionFactura() {

  // Obtener mes actual en español
const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const fecha = new Date();
const mesActual = meses[fecha.getMonth()]; // getMonth() devuelve 0-11

// Construir mensaje predeterminado
const mensajePredeterminado = `Detalle de impresiones en ${mesActual}`;


  const { proveedores, loading, error } = useProveedores();
  const { registrarDistribucion } = useDistribucionFactura();
  const { registrarFactura } = useFacturas();

  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string>("");
  const [mostrarLista, setMostrarLista] = useState(false); // ✅ alternar entre vista formulario / lista

  // ✅ Estado base con todos los campos (incluidos los ocultos)
  const [formData, setFormData] = useState<DistribucionFacturaData>({
    Proveedor: "",
    Title: "",
    CargoFijo: 0,
    CosToImp: 0,
    ValorAnIVA: 0,
    ImpBnCedi: 0,
    ImpBnPalms: 0,
    ImpColorPalms: 0,
    ImpBnCalle: 0,
    ImpColorCalle: 0,
    CosTotMarNacionales: 0,
    CosTotMarImpor: 0,
    CosTotCEDI: 0,
    CosTotServAdmin: 0,
    FechaEmision: "",
    NoFactura: "",
    
    Items: "",
    DescripItems: "",
    // 🔸 Campos ocultos (no visibles en el formulario)
    CCmn: "22111",
    CCmi: "21111",
    CCcedi: "31311",
    CCsa: "31611",
    CO: "001",
    un: "601",
    DetalleFac: mensajePredeterminado,
  });

  // 🔢 Estados visuales para los campos numéricos
  const [displayCargoFijo, setdisplayCargoFijo] = React.useState("");
  const [displayCostoTotalImpresion, setdisplayCostoTotalImpresion] = React.useState("");
  const [displayValorAntesIva, setdisplayValorAntesIva] = React.useState("");
  const [displayImpresionesBNCedi, setdisplayImpresionesBNCedi] = React.useState("");
  const [displayImpresionesBNPalms, setdisplayImpresionesBNPalms] = React.useState("");
  const [displayImpresionesColorPalms, setdisplayImpresionesColorPalms] = React.useState("");
  const [displayImpresionesBNCalle, setdisplayImpresionesBNCalle] = React.useState("");
  const [displayImpresionesColorCalle, setdisplayImpresionesColorCalle] = React.useState("");
  const [displayTotalCedi, setdisplayTotalCedi] = React.useState("");
  const [displayTotalOtrasMarcas, setDisplayTotalOtrasMarcas] = React.useState("");

  // 🔹 Selección de proveedor
  const handleProveedorSeleccionado = (id: string) => {
    setProveedorSeleccionado(id);
    if (!id) {
      setFormData((prev) => ({ ...prev, Proveedor: "", Title: "" }));
      return;
    }
    const prov = proveedores.find((p) => String(p.Id) === String(id));
    if (prov) {
      setFormData((prev) => ({
        ...prev,
        Proveedor: prov.Nombre ?? "",
        Title: prov.Title ?? "",
      }));
    }
  };

  // 🧮 Efecto para cálculos automáticos
  useEffect(() => {
    const parse = (v: unknown) =>
    typeof v === "number"
      ? v
      : typeof v === "string"
        ? Number(v.replace(/\./g, "").replace(",", ".")) // "es-CO" → número
        : 0;

    const CargoFijo        = parse(formData.CargoFijo);
    const CosToImp         = parse(formData.CosToImp);
    const ImpBnCedi        = parse(formData.ImpBnCedi);
    const ImpBnPalms       = parse(formData.ImpBnPalms);
    const ImpColorPalms    = parse(formData.ImpColorPalms);
    const ImpBnCalle       = parse(formData.ImpBnCalle);
    const ImpColorCalle    = parse(formData.ImpColorCalle);

    const cargoFijo3 = CargoFijo - CargoFijo / 3;
    const ValorAnIVA = CargoFijo + CosToImp;
    const CosTotCEDI = CargoFijo / 3 + ImpBnCedi;
    const promedioOtros = (ImpBnPalms + ImpColorPalms + ImpBnCalle + ImpColorCalle) / 3;
    const otrosCostos = cargoFijo3 / 3 + promedioOtros;
    const totalImpresion = ImpBnCalle + ImpBnCedi + ImpBnPalms + ImpColorCalle + ImpColorPalms;

    setdisplayCostoTotalImpresion( formatPesosEsCO(totalImpresion) );
    setdisplayValorAntesIva(      formatPesosEsCO(ValorAnIVA) );
    setdisplayTotalCedi(          formatPesosEsCO(CosTotCEDI) );
    setDisplayTotalOtrasMarcas(   formatPesosEsCO(otrosCostos) );

    setFormData(prev => ({
      ...prev,
      ValorAnIVA,
      CosTotCEDI,
      CosTotMarNacionales: otrosCostos,
      CosTotMarImpor: otrosCostos,
      CosTotServAdmin: otrosCostos,
      CosToImp: totalImpresion,
    }));
  }, [ formData.CargoFijo, formData.CosToImp, formData.ImpBnCedi, formData.ImpBnPalms, formData.ImpColorPalms, formData.ImpBnCalle, formData.ImpColorCalle,]);

  const { account } = useAuth(); // <-- aquí asegúrate de tenerlo

  // 🧾 Guardar registro único + generar 4 facturas relacionadas
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
  // 1) Validaciones
  if (!formData.Proveedor || !formData.Title) {
    alert("⚠️ Por favor selecciona un proveedor y un título antes de guardar.");
    return;
  }
  
  if (formData.CargoFijo <= 0) {
    alert("⚠️ El Cargo Fijo debe ser mayor que cero.");
    return;
  }

  if (
    formData.ImpBnCedi <= 0 &&
    formData.ImpBnPalms <= 0 &&
    formData.ImpColorPalms <= 0 &&
    formData.ImpBnCalle <= 0 &&
    formData.ImpColorCalle <= 0
  ) {
    alert("⚠️ Por favor ingresa al menos un valor mayor que cero en las impresiones.");
    return;
  }

  if (!formData.FechaEmision) {
    alert("⚠️ Por favor ingresa la fecha de emisión.");
    return;
  }

  if (!formData.NoFactura.trim()) {
    alert("⚠️ Por favor ingresa el número de factura.");
    return;
  }


      const sumaCostos =
        (formData.ImpBnCedi ?? 0) +
        (formData.ImpBnPalms ?? 0) +
        (formData.ImpColorPalms ?? 0) +
        (formData.ImpBnCalle ?? 0) +
        (formData.ImpColorCalle ?? 0);

      const diferencia = Math.abs(sumaCostos - (formData.CosToImp ?? 0));
      if (diferencia > 0.1) {
        alert("⚠️ Los costos de impresión no coinciden con el total (CosToImp).");
        return;
      }

      // 2) Helpers
      const EXCLUIR_EN_FACTURA = [
        "CargoFijo","CosToImp","ImpBnCedi","ImpBnPalms","ImpColorPalms","ImpBnCalle","ImpColorCalle",
        "CosTotMarNacionales","CosTotMarImpor","CosTotCEDI","CosTotServAdmin",
        "CCmn","CCmi","CCcedi","CCsa","CostoTotal","Id"
      ] as const;

      const toFacturaBase = (src: any) => {
        const copia = { ...src };
        EXCLUIR_EN_FACTURA.forEach((k) => delete (copia as any)[k]);
        copia.RegistradoPor = src.RegistradoPor ?? account?.name ?? "";
          // ✅ Asegurar que la fecha se envíe como tipo Date o ISO
          if (src.FechaEmision) {
             copia.FechaEmision = src.FechaEmision;
          }
        return copia;
      };

      const partidas = [
        { CC: formData.CCmn,   ValorAnIVA: formData.CosTotMarNacionales },
        { CC: formData.CCmi,   ValorAnIVA: formData.CosTotMarImpor },
        { CC: formData.CCcedi, ValorAnIVA: formData.CosTotCEDI },
        { CC: formData.CCsa,   ValorAnIVA: formData.CosTotServAdmin },
      ];

      // 3) Primero: crear DISTRIBUCIÓN y capturar su Id
      const distribucion = { ...formData };
      delete (distribucion as any).Id;

              // ✅ Convertir fecha antes de enviar
        if (formData.FechaEmision) {
          distribucion.FechaEmision = formData.FechaEmision;
        }

      const res = await registrarDistribucion(distribucion);
      const distribucionId = (res && (res.Id)) ?? res; 

      if (distribucionId === undefined || distribucionId === null) {
        console.error("No se recibió Id de la distribución:", res);
        alert("⚠️ No se pudo obtener el Id de la distribución creada.");
        return;
      }

      // 4) Luego: crear UNA FACTURA por cada CO/CC, ligando IdDistribucion
      for (const p of partidas) {
        const { CC, ValorAnIVA } = p;
        if (!CC || ValorAnIVA == null || Number(ValorAnIVA) === 0) continue;

        const factura = {
          ...toFacturaBase(formData),
          CC,
          ValorAnIVA,
          IdDistrubuida: distribucionId, // <-- vínculo aquí
        };

        await registrarFactura(factura);
      }

      alert("✅ Distribución y facturas guardadas con éxito.");
      setProveedorSeleccionado("");
    } catch (error: any) {
      console.error("❌ Error al guardar:", error);
      alert("⚠️ Ocurrió un error al guardar.");
    }
  };

  const setField = <K extends keyof DistribucionFacturaData>(k: K, v: DistribucionFacturaData[K]) => setFormData((s) => ({ ...s, [k]: v }));

  if (mostrarLista) {
    return (
      <div className="distribucion-container">
        {/* ✅ Solo renderizamos la lista, ya incluye su propio título y botón */}
        <DistribucionesLista onVolver={() => setMostrarLista(false)} />
      </div>
    );
  }

  return (
    <div className="distribucion-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>📦 Distribución de Factura</h2>
        <button className="btn btn-primary" onClick={() => setMostrarLista(true)}>
          📋 Ver distribuciones registradas
        </button>
      </div>
      <form className="distribucion-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Proveedor y NIT */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="proveedor-select">Proveedor:</label>
              {loading ? (
                <span>Cargando...</span>
              ) : error ? (
                <span style={{ color: "red" }}>{error}</span>
              ) : (
                <select
                  id="proveedor-select"
                  value={proveedorSeleccionado}
                  onChange={(e) => handleProveedorSeleccionado(e.target.value)}
                >
                  <option value="">-- Selecciona un proveedor --</option>
                  {proveedores.map((p) => (
                    <option key={p.Id} value={p.Id}>
                      {p.Nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="nit">NIT:</label>
              <input type="text" id="nit" name="Title" value={formData.Title} readOnly />
            </div>
          </div>

          {/* 🧾 Ítem (Código + descripción automática con búsqueda) */}
{/* --------------------------------------------------------------
    Este bloque permite seleccionar un código de ítem y su descripción
    sin que se llenen automáticamente desde valores fijos del estado.
    Puedes cargar la lista desde tu servicio o definirla localmente.
   -------------------------------------------------------------- */}
{(() => {
  // Lista local de ejemplo (puedes reemplazarla por datos desde SharePoint)
  const Items = [
    { codigo: "SC11", descripcion: "ARREND. EQ. COMPUTAC Y COMUNICACIÓN" },
    { codigo: "SC40", descripcion: "MMTO. EQ. COMPUTO Y COMU COMPRAS RC" },
    { codigo: "SC41", descripcion: "MMTO. EQ. COMPUTO Y COMU SERVICIOS RC" },
    { codigo: "SC70", descripcion: "UTILES, PAPELERIA Y FOTOCOPIAS RC" },
    { codigo: "SC80", descripcion: "SERVICIO DE TELEFONIA" },
    { codigo: "SC254", descripcion: "MTTO.EQ.COMPUTO Y COMUN SERVIC(items o servicios sin iva)" },
  ];

  // Estado de errores opcional
  const errors = { Items: "" };

  return (
    <>
      <div className="form-group">
        <label>Ítem (Código + descripción)</label>
        <Select
          classNamePrefix="rs"
          className="rs-override"
          options={Items.map((op) => ({
            value: op.codigo,
            label: `${op.codigo} - ${op.descripcion}`,
          }))}
          placeholder="Buscar ítem…"
          isClearable
          value={
            formData.Items
              ? {
                  value: formData.Items,
                  label:
                    Items.find((op) => op.codigo === formData.Items)?.descripcion ||
                    formData.Items,
                }
              : null
          }
          onChange={(opt) => {
            // ✅ Permite seleccionar manualmente ítem y descripción
            setFormData((prev) => ({
              ...prev,
              Items: opt?.value || "",
              DescripItems: opt?.label?.split(" - ")[1] || "",
            }));
          }}
          filterOption={(option, input) =>
            option.label.toLowerCase().includes(input.toLowerCase())
          }
        />
        <small className="error">{errors.Items}</small>
      </div>

      {/* 📝 Descripción del ítem (solo lectura o editable según necesidad) */}
      <div className="form-group">
        <label htmlFor="DescripItems">Descripción del ítem</label>
        <input
          id="DescripItems"
          name="DescripItems"
          value={formData.DescripItems}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              DescripItems: e.target.value,
            }))
          }
          placeholder="Escribe o selecciona descripción del ítem"
        />
        <small className="error">{errors.Items}</small>
      </div>
    </>
  );
})()}


          {/* Fecha de Emisión */}
          <div className="form-group">
            <label htmlFor="FechaEmision">Fecha de Emisión:</label>
            <input type="date" id="FechaEmision" name="FechaEmision" value={formData.FechaEmision} onChange={(e) => setField("FechaEmision", e.target.value)}/>
          </div>

          {/* NoFactura */}
          <div className="form-group">
            <label htmlFor="NoFactura">Número de Factura:</label>
            <input
              type="text"
              id="NoFactura"
              name="NoFactura"
              placeholder="Ej: FAC-1234"
              value={formData.NoFactura}
              onChange={(e) => setField("NoFactura", e.target.value)}
            />
          </div>


          {/* Campo Cargo Fijo */}
          <div className="form-group">
            <label htmlFor="CargoFijo">Cargo Fijo:</label>
            <input type="text" inputMode="numeric" name="CargoFijo" placeholder="Ej: 100.000,00" value={String(displayCargoFijo)}  
              onChange={(e) => {
                const raw = e.target.value;
                const f = formatPesosEsCO(raw);
                const num = toNumberFromEsCO(f);
                setdisplayCargoFijo(f);
                setField("CargoFijo", num)
              }}
              onBlur={() => {
                const num = toNumberFromEsCO(displayCargoFijo);
                setdisplayCargoFijo(
                  new Intl.NumberFormat("es-CO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  }).format(Number.isFinite(num) ? num : 0)
                );
              }}/>
          </div>

          {/* Campo CosToImp */}
          <div className="form-group">
            <label htmlFor="CosToImp">Costo total de Impresión:</label>
            <input type="text" inputMode="numeric" name="CosToImp" placeholder="Se llenara automaticamente" value={String(displayCostoTotalImpresion)} readOnly/>
          </div>

          {/* ValorAnIVA */}
          <div className="form-group">
            <label htmlFor="ValorAnIVA">Valor antes de IVA:</label>
            <input type="text" inputMode="numeric" name="ValorAnIVA" placeholder="Se llenara automaticamente" value={String(displayValorAntesIva)} readOnly/>
          </div>

          {/* Campos Impresiones */}
          <div className="form-group">
            <label htmlFor="ImpBnCedi">Impresiones B/N CEDI</label>
            <input type="text" inputMode="numeric" name="ImpBnCedi" placeholder="Ej: 100.000" value={String(displayImpresionesBNCedi)}  
              onChange={(e) => {
                const raw = e.target.value;
                const f = formatPesosEsCO(raw);
                const num = toNumberFromEsCO(f);
                setdisplayImpresionesBNCedi(f);
                setField("ImpBnCedi", num)
              }}
              onBlur={() => {
                const num = toNumberFromEsCO(displayImpresionesBNCedi);
                setdisplayImpresionesBNCedi(
                  new Intl.NumberFormat("es-CO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  }).format(Number.isFinite(num) ? num : 0)
                );
              }}/>
          </div>

          <div className="form-group">
            <label htmlFor="ImpBnPalms">Impresiones B/N 35 Palms</label>
            <input type="text" inputMode="numeric" name="ImpBnPalms" placeholder="Ej: 100.000" value={String(displayImpresionesBNPalms)}  
              onChange={(e) => {
                const raw = e.target.value;
                const f = formatPesosEsCO(raw);
                const num = toNumberFromEsCO(f);
                setdisplayImpresionesBNPalms(f);
                setField("ImpBnPalms", num)
              }}
              onBlur={() => {
                const num = toNumberFromEsCO(displayImpresionesBNPalms);
                setdisplayImpresionesBNPalms(
                  new Intl.NumberFormat("es-CO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  }).format(Number.isFinite(num) ? num : 0)
                );
              }}/>
          </div>

          <div className="form-group">
            <label htmlFor="ImpColorPalms">Impresiones Color 35 Palms</label>
            <input type="text" inputMode="numeric" name="ImpColorPalms" placeholder="Ej: 100.000" value={String(displayImpresionesColorPalms)}  
              onChange={(e) => {
                const raw = e.target.value;
                const f = formatPesosEsCO(raw);
                const num = toNumberFromEsCO(f);
                setdisplayImpresionesColorPalms(f);
                setField("ImpColorPalms", num)
              }}
              onBlur={() => {
                const num = toNumberFromEsCO(displayImpresionesColorPalms);
                setdisplayImpresionesColorPalms(
                  new Intl.NumberFormat("es-CO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  }).format(Number.isFinite(num) ? num : 0)
                );
              }}/>
          </div>

          <div className="form-group">
          <label htmlFor="ImpBnCalle">Impresiones B/N Calle</label>
          <input
            type="text"
            inputMode="numeric"
            name="ImpBnCalle"  // ✅ CORRECTO
            placeholder="Ej: 100.000"
            value={String(displayImpresionesBNCalle)}  
            onChange={(e) => {
              const raw = e.target.value;
              const f = formatPesosEsCO(raw);
              const num = toNumberFromEsCO(f);
              setdisplayImpresionesBNCalle(f);
              setField("ImpBnCalle", num);  // ✅ CORRECTO
            }}
            onBlur={() => {
              const num = toNumberFromEsCO(displayImpresionesBNCalle);
              setdisplayImpresionesBNCalle(
                new Intl.NumberFormat("es-CO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(Number.isFinite(num) ? num : 0)
              );
            }}
          />
        </div>


          <div className="form-group">
            <label htmlFor="ImpColorCalle">Impresiones Color Calle</label>
            <input type="text" inputMode="numeric" name="ImpColorCalle" placeholder="Ej: 100.000" value={String(displayImpresionesColorCalle)}  
              onChange={(e) => {
                const raw = e.target.value;
                const f = formatPesosEsCO(raw);
                const num = toNumberFromEsCO(f);
                setdisplayImpresionesColorCalle(f);
                setField("ImpColorCalle", num)
              }}
              onBlur={() => {
                const num = toNumberFromEsCO(displayImpresionesColorCalle);
                setdisplayImpresionesColorCalle(
                  new Intl.NumberFormat("es-CO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  }).format(Number.isFinite(num) ? num : 0)
                );
              }}/>
          </div>

          {/* Campos automáticos de costos totales */}
          <div className="form-group">
            <label htmlFor="CosTotCEDI">Costo Total del CEDI</label>
            <input type="text" inputMode="numeric" name="CosTotCEDI" placeholder="Se llenara automaticamente" value={String(displayTotalCedi)} readOnly/>
          </div>

          <div className="form-group">
            <label htmlFor="CosTotMarNacionales">Costo Total Marcas Nacionales</label>
            <input type="text" inputMode="numeric" name="CosTotMarNacionales" placeholder="Se llenara automaticamente" value={String(displayTotalOtrasMarcas)} readOnly/>
          </div>

          <div className="form-group">
            <label htmlFor="CosTotMarImpor">Costo Total Marcas Importaciones</label>
            <input type="text" inputMode="numeric" name="CosTotMarImpor" placeholder="Se llenara automaticamente" value={String(displayTotalOtrasMarcas)} readOnly/>
          </div>

          <div className="form-group">
            <label htmlFor="CosTotServAdmin">Costo Total de Servicios Administrativos</label>
             <input type="text" inputMode="numeric" name="CosTotServAdmin" placeholder="Se llenara automaticamente" value={String(displayTotalOtrasMarcas)} readOnly/>
          </div>
        </div>

        <button type="submit" className="btn-guardar">
          Guardar Distribución
        </button>
      </form>
    </div>
  );
}
