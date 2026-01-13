// ============================================================
// RegistroFactura.tsx — versión COMPLETA, FUNCIONAL Y COMENTADA
// (✅ Reintegrado handleConector para exportar facturas)
// ============================================================

import React, { useEffect, useState } from "react";
import "./RegistroFactura.css";

import DistribucionFactura from "./DistribucionFactura/DistribucionFactura";
import FacturasLista from "./FacturasLista/FacturasLista";

import { useFacturas } from "../../Funcionalidades/RegistrarFactura";
import { useAuth } from "../../auth/authContext";
import { useProveedores } from "../../Funcionalidades/ProveedoresFactura";

import { useGraphServices } from "../../graph/GrapServicesContext";
import { useCentroCostos, useCO } from "../../Funcionalidades/Compras";

import { useCentrosFactura } from "../../Funcionalidades/CentrosFactura";

// Modal proveedor y modal centros
import ProveedorModal from "./ProveedorModal/ProveedorModal";
import CentroModal from "./ProveedorModal/CentroModal";

// Utils
import Select from "react-select";
import { formatPesosEsCO, toNumberFromEsCO } from "../../utils/Number";

// Modelos
import type { ReFactura } from "../../Models/RegistroFacturaInterface";
import type { Compra } from "../../Models/Compras";
import { Items } from "../../Models/Compras";

// Servicios
import { ComprasService } from "../../Services/Compras.service";
import { GraphRest } from "../../graph/GraphRest";

export default function RegistroFactura() {
  // ============================================================
  // Hooks base del sistema
  // ============================================================
  const { account, getToken } = useAuth();
  const graph = new GraphRest(getToken);
  const comprasService = new ComprasService(graph);

  // ✅ Antes: solo registrarFactura
  // ✅ Ahora: también handleConector (exportar por Flow)
  const { registrarFactura, handleConector } = useFacturas();

  // ============================================================
  // Hooks de proveedores
  // ============================================================
  const { proveedores, loading, error, agregarProveedor } = useProveedores();

  // ============================================================
  // Hooks de centros desde SP
  // ============================================================
  const { CentroCostos, CentroOperativo } = useGraphServices();

  // Hook unificado para crear CC / CO / UN
  const { agregarCentro, refreshFlag } = useCentrosFactura();

  // CC, CO y UN vienen de tu hook de Compras (lo respetamos)
  const { ccOptions } = useCentroCostos(CentroCostos as any, refreshFlag);
  const { COOptions, UNOptions } = useCO(CentroOperativo as any, refreshFlag);

  // ============================================================
  // Estados principales
  // ============================================================
  const [compras, setCompras] = useState<Compra[]>([]);
  const [mostrarDistribucion, setMostrarDistribucion] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [isModalProveedorOpen, setIsModalProveedorOpen] = useState(false);
  const [showCentroModal, setShowCentroModal] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");

  const [selectedCompra, setSelectedCompra] = useState("");
  const [displayValor, setDisplayValor] = useState("");

  // ✅ Export (Flow)
  const [exportInitialDate, setExportInitialDate] = useState("");
  const [exportFinalDate, setExportFinalDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const [formData, setFormData] = useState<ReFactura>({
    FechaEmision: "",
    NoFactura: "",
    Proveedor: "",
    Title: "",
    Items: "",
    DescripItems: "",
    ValorAnIVA: 0,
    CC: "",
    CO: "",
    un: "",
    DetalleFac: "",
    FecEntregaCont: null,
    DocERP: "",
    Observaciones: "",
    RegistradoPor: account?.name ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================================
  // Cargar compras relevantes
  // ============================================================
  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const filtro = [
          "Pendiente por registro de inventario",
          "Pendiente por entrega al usuario",
          "Pendiente por registro de factura",
        ]
          .map((e) => `fields/Estado eq '${e}'`)
          .join(" or ");

        const { items } = await comprasService.getAll({
          filter: filtro,
          orderby: "fields/FechaSolicitud desc",
          top: 100,
        });

        setCompras(items);
      } catch (error) {
        console.error("Error cargando compras filtradas:", error);
      }
    };

    fetchCompras();
  }, []);

  // ============================================================
  // Handlers del formulario
  // ============================================================
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "Items") {
      const seleccion = Items.find((o) => o.codigo === value);
      setFormData((prev) => ({
        ...prev,
        Items: value,
        DescripItems: seleccion ? seleccion.descripcion : "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "ValorAnIVA" ? toNumberFromEsCO(value) : value,
    }));
  };

  // ============================================================
  // Cuando se selecciona una compra, llenar CC/CO/UN y Items
  // ============================================================
  const handleCompraSeleccionada = async (id: string) => {
    setSelectedCompra(id);

    if (!id) {
      setFormData((prev) => ({
        ...prev,
        CC: "",
        CO: "",
        un: "",
        DetalleFac: "",
        Items: "",
        DescripItems: "",
      }));
      return;
    }

    try {
      const compra = await comprasService.get(id);

      setFormData((prev) => ({
        ...prev,
        Items: compra.CodigoItem || "",
        DescripItems: compra.DescItem || "",
        CC: compra.CCosto || "",
        CO: compra.CO || "",
        un: compra.UN || "",
        DetalleFac: compra.Dispositivo || "",
      }));
    } catch (error) {
      console.error("❌ Error al cargar la compra:", error);
    }
  };

  // ============================================================
  // Seleccionar proveedor
  // ============================================================
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

  // ============================================================
  // Guardar centro desde el modal
  // Soporta: CentroCostos, CentrosOperativos, UnidadNegocio
  // ============================================================
  const handleSaveCentro = async (payload: {
    tipo: "CentroCostos" | "CentrosOperativos" | "UnidadNegocio";
    Title: string;
    Codigo: string;
  }) => {
    await agregarCentro(payload.tipo, {
      Title: payload.Title,
      Codigo: payload.Codigo,
    });
  };

  // ============================================================
  // Validación del formulario
  // ============================================================
  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!formData.Proveedor) e.Proveedor = "Proveedor requerido.";
    if (!formData.FechaEmision) e.FechaEmision = "Fecha requerida.";
    if (!formData.Items) e.Items = "Ítem requerido.";
    if (!formData.ValorAnIVA) e.ValorAnIVA = "Valor requerido.";
    if (!formData.DetalleFac) e.DetalleFac = "Detalle requerido.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ============================================================
  // Enviar factura
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await registrarFactura(formData);

    alert("✅ Factura registrada con éxito");

    setFormData({
      FechaEmision: "",
      NoFactura: "",
      Proveedor: "",
      Title: "",
      Items: "",
      DescripItems: "",
      ValorAnIVA: 0,
      CC: "",
      CO: "",
      un: "",
      DetalleFac: "",
      FecEntregaCont: null,
      DocERP: "",
      Observaciones: "",
      RegistradoPor: account?.name ?? "",
    });

    setDisplayValor("");
    setSelectedCompra("");
    setProveedorSeleccionado("");
  };

  // ============================================================
  // ✅ Exportar facturas (Power Automate Flow / Conector)
  // ============================================================
  const handleExportFacturas = async () => {
    if (!exportInitialDate || !exportFinalDate) {
      alert("⚠️ Debes seleccionar fecha inicial y fecha final.");
      return;
    }

    if (new Date(exportInitialDate) > new Date(exportFinalDate)) {
      alert("⚠️ La fecha inicial no puede ser mayor que la fecha final.");
      return;
    }

    try {
      setExporting(true);
      await handleConector(exportInitialDate, exportFinalDate);
      // Nota: tu hook ya hace alert de éxito. Si quieres, lo quitamos del hook y lo dejamos aquí.
    } catch (err) {
      console.error("❌ Error exportando facturas:", err);
      alert("❌ No se pudo generar el export. Revisa consola.");
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="registro-container">
      {/* ============================================================
        DISTRIBUCIÓN
      ============================================================ */}
      {mostrarDistribucion ? (
        <>
          <div className="acciones-top">
            <button
              type="button"
              className="btn btn-secondary-final btn-personalized"
              onClick={() => setMostrarDistribucion(false)}
            >
              🔙 Volver
            </button>
          </div>

          <DistribucionFactura />
        </>
      ) : (
        <>
          <h2>
            {mostrarLista ? "📄 Facturas Registradas" : "Registro de Facturas"}
          </h2>

          {/* ============================================================
            FORMULARIO PRINCIPAL
          ============================================================ */}
          {!mostrarLista ? (
            <form className="registro-form" onSubmit={handleSubmit}>
              {/* ============================ */}
              {/*       COMPRA + PROVEEDOR     */}
              {/* ============================ */}

              <div className="campo">
                <label>Compra relacionada:</label>
                <select
                  className="proveedor-select"
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

              <div className="fila-compra-proveedor">
                <div className="form-group fila-compra-proveedor__proveedor">
                  <div className="form-group__field">
                    <label>Proveedor:</label>

                    {loading ? (
                      <span>Cargando...</span>
                    ) : error ? (
                      <span style={{ color: "red" }}>{error}</span>
                    ) : (
                      <select
                        value={proveedorSeleccionado}
                        onChange={(e) =>
                          handleProveedorSeleccionado(e.target.value)
                        }
                      >
                        <option value="">-- Seleccione proveedor --</option>
                        {proveedores.map((p) => (
                          <option key={p.Id} value={p.Id}>
                            {p.Nombre}
                          </option>
                        ))}
                      </select>
                    )}

                    <small className="error">{errors.Proveedor}</small>
                  </div>

                  <div className="fila-compra-proveedor__acciones">
                    <button
                      type="button"
                      className="btn btn-terciary btn-sm form-group__btn"
                      onClick={() => setIsModalProveedorOpen(true)}
                    >
                      + Nuevo proveedor
                    </button>

                    <div className="acciones-cc">
                      <span className="acciones-cc__label">¿No aparece?</span>
                      <button
                        type="button"
                        className="btn btn-terciary btn-sm acciones-cc__btn"
                        onClick={() => setShowCentroModal(true)}
                      >
                        + Nuevo C.C/C.O/U.N
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================ */}
              {/*      CAMPOS GENERALES       */}
              {/* ============================ */}
              <div className="form-grid">
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

                <div className="campo">
                  <label>
                    No. Factura
                    <input
                      type="text"
                      name="NoFactura"
                      value={formData.NoFactura}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <div className="campo">
                  <label>
                    NIT
                    <input
                      type="text"
                      name="Title"
                      value={formData.Title}
                      readOnly
                    />
                  </label>
                </div>

                <div className="campo">
                  <label>Ítem</label>
                  <Select
                    classNamePrefix="rs"
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
                                ?.descripcion ?? "",
                          }
                        : null
                    }
                    onChange={(opt) =>
                      setFormData((prev) => ({
                        ...prev,
                        Items: opt?.value ?? "",
                        DescripItems: opt?.label?.split(" - ")[1] ?? "",
                      }))
                    }
                  />
                </div>

                <div className="campo">
                  <label>Descripción del ítem</label>
                  <input value={formData.DescripItems} readOnly />
                  <small className="error">{errors.Items}</small>
                </div>

                <div className="campo">
                  <label>
                    Valor antes IVA
                    <input
                      type="text"
                      name="ValorAnIVA"
                      value={displayValor}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const f = formatPesosEsCO(raw);
                        const num = toNumberFromEsCO(f);

                        setDisplayValor(f);

                        setFormData((prev) => ({
                          ...prev,
                          ValorAnIVA: num,
                        }));
                      }}
                      onBlur={() => {
                        const num = toNumberFromEsCO(displayValor);
                        setDisplayValor(
                          new Intl.NumberFormat("es-CO", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(num)
                        );
                      }}
                    />
                  </label>
                  <small className="error">{errors.ValorAnIVA}</small>
                </div>

                <div className="campo">
                  <label>Centro de Costos (C.C)</label>
                  <Select
                    classNamePrefix="rs"
                    options={ccOptions.map((cc) => ({
                      value: cc.value,
                      label: `${cc.value} - ${cc.label}`,
                    }))}
                    isClearable
                    placeholder="Buscar C.C..."
                    value={
                      formData.CC
                        ? {
                            value: formData.CC,
                            label:
                              ccOptions.find((cc) => cc.value === formData.CC)
                                ?.label ?? "",
                          }
                        : null
                    }
                    onChange={(opt) =>
                      setFormData((prev) => ({
                        ...prev,
                        CC: opt?.value ?? "",
                      }))
                    }
                  />
                </div>

                <div className="campo">
                  <label>Centro Operativo (C.O)</label>
                  <Select
                    classNamePrefix="rs"
                    options={COOptions.map((co) => ({
                      value: co.value,
                      label: `${co.value} - ${co.label}`,
                    }))}
                    isClearable
                    placeholder="Buscar C.O..."
                    value={
                      formData.CO
                        ? {
                            value: formData.CO,
                            label:
                              COOptions.find((co) => co.value === formData.CO)
                                ?.label ?? "",
                          }
                        : null
                    }
                    onChange={(opt) =>
                      setFormData((prev) => ({
                        ...prev,
                        CO: opt?.value ?? "",
                      }))
                    }
                  />
                </div>

                <div className="campo">
                  <label>Unidad de Negocio (U.N)</label>
                  <Select
                    classNamePrefix="rs"
                    options={UNOptions.map((un) => ({
                      value: un.value,
                      label: `${un.value} - ${un.label}`,
                    }))}
                    isClearable
                    placeholder="Buscar U.N..."
                    value={
                      formData.un
                        ? {
                            value: formData.un,
                            label:
                              UNOptions.find((u) => u.value === formData.un)
                                ?.label ?? "",
                          }
                        : null
                    }
                    onChange={(opt) =>
                      setFormData((prev) => ({
                        ...prev,
                        un: opt?.value ?? "",
                      }))
                    }
                  />
                </div>

                <div className="campo">
                  <label>Detalle Fac</label>
                  <input
                    name="DetalleFac"
                    value={formData.DetalleFac}
                    onChange={handleChange}
                  />
                </div>

                <div className="campo">
                  <label>
                    Fecha entrega contabilidad
                    <input
                      type="date"
                      name="FecEntregaCont"
                      value={formData.FecEntregaCont ?? ""}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <div className="campo">
                  <label>Documento ERP</label>
                  <input
                    name="DocERP"
                    value={formData.DocERP}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="campo">
                <label>
                  Observaciones
                  <textarea
                    name="Observaciones"
                    value={formData.Observaciones}
                    onChange={handleChange}
                    rows={2}
                  />
                </label>
              </div>

              <div className="botones-container">
                <button type="submit" className="btn btn-primary-final">
                  Registrar factura
                </button>

                <button
                  type="button"
                  className="btn btn-secondary-final"
                  onClick={() => setMostrarLista(true)}
                >
                  Ver facturas
                </button>

                <button
                  type="button"
                  className="btn-distribucion"
                  onClick={() => setMostrarDistribucion(true)}
                >
                  Distribuir factura
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* ============================================================
                ✅ Panel exportar (Flow)
              ============================================================ */}
              <div className="export-panel">
                <div className="export-panel__row">
                  <div className="export-panel__field">
                    <label>Fecha inicial</label>
                    <input
                      type="date"
                      value={exportInitialDate}
                      onChange={(e) => setExportInitialDate(e.target.value)}
                    />
                  </div>

                  <div className="export-panel__field">
                    <label>Fecha final</label>
                    <input
                      type="date"
                      value={exportFinalDate}
                      onChange={(e) => setExportFinalDate(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary-final"
                    onClick={handleExportFacturas}
                    disabled={exporting}
                    title="Genera el conector/export y lo envía al correo"
                  >
                    {exporting ? "Generando..." : "Exportar facturas"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary-final"
                    onClick={() => setMostrarLista(false)}
                  >
                    Volver
                  </button>
                </div>
              </div>

              <FacturasLista onVolver={() => setMostrarLista(false)} />
            </>
          )}

          {/* MODAL PROVEEDOR */}
          <ProveedorModal
            isOpen={isModalProveedorOpen}
            onClose={() => setIsModalProveedorOpen(false)}
            onSave={agregarProveedor}
          />

          {/* MODAL CENTROS (CC / CO / UN) */}
          <CentroModal
            isOpen={showCentroModal}
            onClose={() => setShowCentroModal(false)}
            onSave={handleSaveCentro}
          />
        </>
      )}
    </div>
  );
}
