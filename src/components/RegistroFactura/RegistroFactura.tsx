import DistribucionFactura from "./DistribucionFactura/DistribucionFactura";
import React, { useEffect, useState } from "react";
import { useFacturas } from "../../Funcionalidades/RegistrarFactura";
import FacturasLista from "./FacturasLista/FacturasLista";
import type { ReFactura } from "../../Models/RegistroFacturaInterface";
import "./RegistroFactura.css";
import { useAuth } from "../../auth/authContext";
import Select from "react-select";
import { useProveedores } from "../../Funcionalidades/ProveedoresFactura";
import ProveedorModal from "./ProveedorModal/ProveedorModal";
import { Items, type Compra } from "../../Models/Compras";
import { ComprasService } from "../../Services/Compras.service";
import { GraphRest } from "../../graph/GraphRest";
import { formatPesosEsCO, toNumberFromEsCO } from "../../utils/Number";
import { useGraphServices } from "../../graph/GrapServicesContext";
import { useCentroCostos, useCO } from "../../Funcionalidades/Compras";

export default function RegistroFactura() {
  const { getToken } = useAuth();
  const [compras, setCompras] = useState<Compra[]>([]);
  const { CentroCostos, CentroOperativo } = useGraphServices();
  const { ccOptions } = useCentroCostos(CentroCostos as any);
  const { COOptions, UNOptions} = useCO(CentroOperativo as any);
  const [mostrarFechas, setMostrarFechas] = useState(false);
  const { registrarFactura, handleConector } = useFacturas();
  const [initialDate, setInitialDate] = useState("");
  const [finalDate, setFinalDate] = useState("");
  const [selectedCompra, setSelectedCompra] = useState<string>("");
  const { proveedores, loading, error, agregarProveedor  } = useProveedores();
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const graph = new GraphRest(getToken);
  const comprasService = new ComprasService(graph);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [mostrarDistribucion, setMostrarDistribucion] = useState(false);
  const {account} = useAuth()
  const [formData, setFormData] = useState<ReFactura>({FechaEmision: "", NoFactura: "", Proveedor: "", Title: "", Items: "", DescripItems: "", ValorAnIVA: 0, CC: "", CO: "", un: "", DetalleFac: "", FecEntregaCont: null, DocERP: "", Observaciones: "", RegistradoPor: account?.name ?? ""});
  const [displayValor, setDisplayValor] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const filtro = ["Pendiente por registro de inventario", "Pendiente por entrega al usuario", "Pendiente por registro de factura"].map(e => `fields/Estado eq '${e}'`).join(" or ");
        const { items } = await comprasService.getAll({filter: filtro, orderby: "fields/FechaSolicitud desc", top: 100,});
        setCompras(items);
      } catch (error) {
        console.error("Error cargando compras filtradas:", error);
      }
    };
    fetchCompras();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "Items") {
      const seleccion = Items.find((o) => o.codigo === value);
      setFormData((prev) => ({...prev, Items: value, DescripItems: seleccion ? seleccion.descripcion : "",}));
    } else {
      setFormData((prev) => ({...prev, [name]: name === "ValorAnIVA" ? toNumberFromEsCO(value) : value,}));
    }
  };

  const handleCompraSeleccionada = async (id: string) => {
    setSelectedCompra(id);
    if (!id) {
      setFormData((prev) => ({...prev, CC: "", CO: "", un: "", DetalleFac: "", Items: "", DescripItems: ""}));
      return;
    }

    try {
      const compra = await comprasService.get(id);
      setFormData((prev) => ({...prev, Items: compra.CodigoItem || "", DescripItems: compra.DescItem || "",  CC: compra.CCosto || "", CO: compra.CO || "", un: compra.UN || "", DetalleFac: compra.Dispositivo || "",}));
    } catch (error) {
      console.error("❌ Error al cargar la compra seleccionada:", error);
    }
  };

  const handleProveedorSeleccionado = (id: string) => {
    setProveedorSeleccionado(id);
    if (!id) {
      setFormData(prev => ({...prev, Proveedor: "", Title: "",}));
      return;
    }

    // Buscar el proveedor por Id en la lista del hook
    const prov = proveedores.find(p => String(p.Id) === String(id));

    if (prov) {
      setFormData(prev => ({
        ...prev,
        Proveedor: prov.Nombre ?? "", // ← Nombre del proveedor  aca ya se guardan, pero el input de proveedor se quita para no ser redundantes
        Title: prov.Title ?? "",      // ← NIT del proveedor     este si lo trae y lo llena automaticamwnte
      }));
    } else {
      console.warn("Proveedor seleccionado no encontrado en lista:", id);
    }
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!formData.Proveedor)      e.Proveedor  = "Proveedor Requerido.";
    if (!formData.FechaEmision)   e.FechaEmision = "Seleccione fecha de emision.";
    if (!formData.Items)          e.Items              = "Seleccione item.";
    if (!formData.ValorAnIVA)     e.ValorAnIVA          = "Requerida.";
    if (!formData.ValorAnIVA)     e.ValorAnIVA          = "Requerida.";
    if (!formData.DetalleFac)     e.DetalleFact          = "Requerida.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!(validate())) return
    await registrarFactura(formData);
    alert("✅ Factura registrada con éxito");
    setFormData({FechaEmision: "", NoFactura: "", Proveedor: "", Title: "", Items: "", DescripItems: "", ValorAnIVA: 0, CC: "", CO: "", un: "", DetalleFac: "",  FecEntregaCont: null, DocERP: "", Observaciones: "", RegistradoPor: account?.name ?? "", });
  };

  return (
  <div className="registro-container">
    {/* ✅ Si se pide mostrar el formulario de Distribución, lo mostramos */}
    {mostrarDistribucion ? (
     <>
      <button
        type="button"
        className="btn-volver"
        onClick={() => setMostrarDistribucion(false)}
      >
        🔙 Volver al registro de factura
      </button>

      {/* 🔹 Bloque para el conector con selectores de fecha */}
      {!mostrarFechas ? (
        <button
          type="button"
          className="btn-volver"
          onClick={() => setMostrarFechas(true)}
        >
          📅 Prueba conector
        </button>
      ) : (
        <div className="selector-fechas-container">
          <label className="selector-label">
            Fecha inicial:
            <input
              type="date"
              value={initialDate}
              onChange={(e) => setInitialDate(e.target.value)}
            />
          </label>

          <label className="selector-label">
            Fecha final:
            <input
              type="date"
              value={finalDate}
              onChange={(e) => setFinalDate(e.target.value)}
            />
          </label>

          <div className="selector-botones">
            <button
              type="button"
              className="btn-volver"
              onClick={async () => {
                if (!initialDate || !finalDate) {
                  alert("⚠️ Debes seleccionar ambas fechas.");
                  return;
                }
                await handleConector(initialDate, finalDate);
                setMostrarFechas(false);
                setInitialDate("");
                setFinalDate("");
              }}
            >
              ✅ Ejecutar conector
            </button>

            <button
              type="button"
              className="btn-cancelar"
              onClick={() => {
                setMostrarFechas(false);
                setInitialDate("");
                setFinalDate("");
              }}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

        <DistribucionFactura />
      </>
    ) : (
      <>
        <h2>{mostrarLista ? "📄 Facturas Registradas" : "Registro de Facturas"}</h2>

        {!mostrarLista ? (
          <form className="registro-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* relacionamiento con compras  */}
              <div className="form-group mb-3">
                <label htmlFor="compraSelect">Seleccionar compra relacionada:</label>
                <select
                  id="compraSelect"
                  className="form-control"
                  value={selectedCompra}
                  onChange={(e) => handleCompraSeleccionada(e.target.value)}
                >
                  <option value="">-- Seleccione una compra --</option>
                  {compras.map((c) => (
                    <option key={c.Id} value={c.Id}>
                      {c.Title} - {c.SolicitadoPor} - {c.Estado}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔹 Desplegable de proveedores */}
              <div className="form-group mb-3">
                <div>
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
                  <small className="error">{errors.Proveedor}</small>
                </div>

                {/* 🔹 Botón para abrir modal (se implementará más adelante) */}
                <button
                  type="button"
                  className="btn-nuevo-proveedor"
                  onClick={() => setIsModalOpen(true)}
                >
                  + Nuevo proveedor
                </button>
              </div>

              {/* 📆 Fecha de emisión */}
              <div className="campo">
                <label>
                  Fecha de emisión
                  <input
                    type="date"
                    name="FechaEmision"
                    value={formData.FechaEmision}
                    onChange={handleChange}
                    required
                  />
                  <small className="error">{errors.FechaEmision}</small>
                </label>
              </div>

              {/* 🔢 Número de factura */}
              <div className="campo">
                <label>
                  No. Factura
                  <input
                    type="text"
                    name="NoFactura"
                    value={formData.NoFactura}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              {/* 🧾 NIT (Title) (llenado automático; readonly) */}
              <div className="campo">
                <label>
                  NIT
                  <input
                    type="text"
                    name="Title"
                    value={formData.Title}
                    onChange={handleChange}
                    required
                    readOnly
                  />
                  <small className="error">{errors.Proveedor}</small>
                </label>
              </div>

              {/* 🧾 Ítem (Código + descripción automática con búsqueda) */}
              <div className="campo">
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
                            Items.find((op) => op.codigo === formData.Items)
                              ?.descripcion || formData.Items,
                        }
                      : null
                  }
                  onChange={(opt) => {
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

              {/* 📝 Descripción del ítem (solo lectura, se llena automático) */}
              <div className="campo">
                <label>
                  Descripción del ítem
                  <input name="DescripItems" value={formData.DescripItems} readOnly />
                  <small className="error">{errors.Items}</small>
                </label>
              </div>

              {/* 💰 Valor */}
              <div className="campo">
                <label>
                  Valor antes iva (en pesos)
                  <input
                    type="text"
                    inputMode="numeric"
                    name="ValorAnIVA"
                    placeholder="Ej: 100.000,00"
                    value={String(displayValor)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const f = formatPesosEsCO(raw);
                      const num = toNumberFromEsCO(f);
                      setDisplayValor(f);
                      handleChange({
                        target: { name: "ValorAnIVA", value: String(num) },
                      } as unknown as React.ChangeEvent<HTMLInputElement>);
                    }}
                    onBlur={() => {
                      const num = toNumberFromEsCO(displayValor);
                      setDisplayValor(
                        new Intl.NumberFormat("es-CO", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(Number.isFinite(num) ? num : 0)
                      );
                    }}
                  />
                  <small className="error">{errors.ValorAnIVA}</small>
                </label>
              </div>

              {/* 🏢 Centro de Costos (C.C) */}
              <div className="campo">
                <label>Centro de Costos (C.C)</label>
                <Select
                  classNamePrefix="rs"
                  className="rs-override"
                  options={ccOptions.map((cc) => ({value: cc.value, label: `${cc.value} - ${cc.label}`, }))}
                  placeholder="Buscar centro de costo…"
                  isClearable
                  value={
                    formData.CC
                      ? {
                          value: formData.CC,
                          label:
                            ccOptions.find((cc) => cc.value === formData.CC)
                              ?.label || formData.CC,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData((prev) => ({
                      ...prev,
                      CC: opt?.value || "",
                    }))
                  }
                  filterOption={(option, input) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                />
                <small className="error">{errors.CC}</small>
              </div>

              {/* 🏭 Centro Operativo (C.O) */}
              <div className="campo">
                <label>Centro Operativo (C.O)</label>
                <Select
                  classNamePrefix="rs"
                  className="rs-override"
                  options={COOptions.map((co) => ({
                    value: co.value,
                    label: `${co.value} - ${co.label}`,
                  }))}
                  placeholder="Buscar centro operativo…"
                  isClearable
                  value={
                    formData.CO
                      ? {
                          value: formData.CO,
                          label:
                            COOptions.find((co) => co.value === formData.CO)
                              ?.label || formData.CO,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData((prev) => ({
                      ...prev,
                      CO: opt?.value || "",
                    }))
                  }
                  filterOption={(option, input) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                />
                <small className="error">{errors.CO}</small>
              </div>

              {/* 🧱 Unidad de Negocio (U.N) */}
              <div className="campo">
                <label>Unidad de Negocio (U.N)</label>
                <Select
                  classNamePrefix="rs"
                  className="rs-override"
                  options={UNOptions.map((un) => ({
                    value: un.value,
                    label: `${un.value} - ${un.label}`,
                  }))}
                  placeholder="Buscar unidad de negocio…"
                  isClearable
                  value={
                    formData.un
                      ? {
                          value: formData.un,
                          label:
                            UNOptions.find((u) => u.value === formData.un)
                              ?.label || formData.un,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData((prev) => ({
                      ...prev,
                      un: opt?.value || "",
                    }))
                  }
                  filterOption={(option, input) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                />
                <small className="error">{errors.un}</small>
              </div>

              {/* 🧾 Detalle */}
              <div className="campo">
                <label>
                  Detalle Fac
                  <input name="DetalleFac" value={formData.DetalleFac} onChange={handleChange} />
                </label>
              </div>

              {/* 📦 Fecha de entrega contabilidad */}
              <div className="campo">
                <label>
                  Fecha de entrega contabilidad
                  <input
                    type="date"
                    name="FecEntregaCont"
                    value={formData.FecEntregaCont ?? ""}
                    onChange={handleChange}
                  />
                </label>
              </div>

              {/* 📎 Documento ERP */}
              <div className="campo">
                <label>
                  Documento ERP
                  <input type="text" name="DocERP" value={formData.DocERP} onChange={handleChange} />
                </label>
              </div>
            </div>

            {/* 🗒️ Observaciones */}
            <div className="campo">
              <label>
                Observaciones
                <textarea
                  name="Observaciones"
                  rows={2}
                  value={formData.Observaciones}
                  onChange={handleChange}
                  placeholder="Escribe observaciones si aplica..."
                />
              </label>
            </div>

            {/* Botones */}
            <div className="botones-container">
              <button type="submit" className="btn-registrar">
                ✅  Registrar Factura
              </button>

              <button
                type="button"
                className="btn-ver-facturas"
                onClick={() => setMostrarLista(true)}
              >
                📄 Mostrar Facturas
              </button>

              {/* botón para abrir DistribucionFactura */}
              <button
                type="button"
                className="btn-distribucion"
                onClick={() => setMostrarDistribucion(true)}
              >
                📦 Distribuir Factura
              </button>
            </div>
          </form>
        ) : (
          // 📋 Vista de facturas con su propio componente de filtros
          <div>
            <FacturasLista onVolver={() => setMostrarLista(false)} />
          </div>
        )}

        {/* Modal de proveedor (mantener como en tu versión) */}
        <ProveedorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={agregarProveedor}
        />
      </>
    )}
  </div>
);

}
