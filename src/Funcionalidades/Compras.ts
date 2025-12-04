import React from "react";

import type { DateRange } from "../Models/Filtros";
import { toGraphDateTime, toISODateFlex, toISODateTimeFlex } from "../utils/Date";
import type { GetAllOpts } from "../Models/Commons";
import type { ComprasService } from "../Services/Compras.service";
// 🔹 Ya NO usamos el diccionario UN quemado
import type { Compra, comprasState } from "../Models/Compras";
import type { CentroCostos } from "../Models/CentroCostos";
import type { CentroCostosService } from "../Services/CentroCostos.service";
import type { COService } from "../Services/COCostos.service";
import { calcularFechaSolucion } from "../utils/ans";
import { fetchHolidays } from "../Services/Festivos";
import type { Holiday } from "festivos-colombianos";
import type { Log } from "../Models/Log";
import type { TicketsService } from "../Services/Tickets.service";
import type { LogService } from "../Services/Log.service";
import { pickTecnicoConMenosCasos } from "../utils/Commons";
import type { UsuariosSPService } from "../Services/Usuarios.Service";
import type { FlowToUser } from "../Models/FlujosPA";
import { FlowClient } from "./FlowClient";

// ⭐ NUEVO: para leer UnidadNegocio desde SharePoint
import { useAuth } from "../auth/authContext";
import { GraphRest } from "../graph/GraphRest";
import { CentrosFacturaService } from "../Services/CentrosFactura.service";
import type { CentroFactura } from "../Models/CentroFactura";

const notifyFlow = new FlowClient(
  "https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a21d66d127ff43d7a940369623f0b27d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0ptZLGTXbYtVNKdmIvLdYPhw1Wcqb869N3AOZUf2OH4"
);

// ============================================================================
// HOOK PRINCIPAL — useCompras (SIN CAMBIOS EN LÓGICA)
// ============================================================================
export function useCompras(
  ComprasSvc: ComprasService,
  TicketsSvc: TicketsService,
  LogSvc: LogService,
  Usuarios: UsuariosSPService
) {
  const MARCAS = ["MFG", "DIESEL", "PILATOS", "SUPERDRY", "KIPLING", "BROKEN CHAINS"] as const;
  const NEXT: Record<string, string> = {
    "Pendiente por orden de compra": "Pendiente por entrega de proveedor",
    "Pendiente por entrega de proveedor": "Pendiente por entrega al usuario",
    "Pendiente por entrega al usuario": "Pendiente por registro de factura",
    "Pendiente por registro de factura": "Completado",
    // Los contratos y servicios no se van a inventario,
    // pero deja la info para la causación de las facturas
  };
  type Marca = (typeof MARCAS)[number];
  const zeroMarcas = (): Record<Marca, number> =>
    MARCAS.reduce((acc, m) => {
      acc[m] = 0;
      return acc;
    }, {} as Record<Marca, number>);

  const [rows, setRows] = React.useState<Compra[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const today = React.useMemo(() => toISODateFlex(new Date()), []);
  const [range, setRange] = React.useState<DateRange>({ from: today, to: today });
  const [pageSize, setPageSize] = React.useState<number>(10); // = $top
  const [pageIndex, setPageIndex] = React.useState<number>(1); // 1-based
  const [nextLink, setNextLink] = React.useState<string | null>(null);
  const [state, setState] = React.useState<comprasState>({
    tipoCompra: "Producto",
    productoServicio: "",
    solicitadoPor: "",
    solicitadoPorCorreo: "",
    fechaSolicitud: new Date().toISOString().slice(0, 10),
    dispositivo: "",
    co: null,
    un: "",
    ccosto: null,
    cargarA: "CO",
    noCO: "",
    marcasPct: { ...zeroMarcas() },
    motivo: "",
    codigoItem: "",
    DescItem: "",
    CorreoSolicitante: "",
  });
  const [openModal, setOpenModal] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState(false);
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);

  // HELPERS
  const totalPct = React.useMemo(
    () =>
      state.cargarA === "Marca"
        ? Object.values(state.marcasPct).reduce(
            (a, b) => a + (Number.isFinite(b) ? b : 0),
            0
          ) || 0
        : 0,
    [state.cargarA, state.marcasPct]
  );

  function setField<K extends keyof comprasState>(k: K, v: comprasState[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function setMarcaPct(m: Marca, v: number) {
    setState((s) => ({ ...s, marcasPct: { ...s.marcasPct, [m]: v } }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!state.productoServicio.trim()) e.productoServicio = "Requerido.";
    if (!state.solicitadoPor.trim()) e.solicitadoPor = "Requerido.";
    if (!state.fechaSolicitud) e.fechaSolicitud = "Requerido.";
    if (!state.co) e.co = "Seleccione CO.";
    if (!state.un) e.un = "Seleccione UN.";
    if (!state.ccosto) e.ccosto = "Seleccione C. Costo.";
    if (state.cargarA === "Marca" && totalPct !== 100)
      e.marcasPct = "El total de porcentajes debe ser 100%.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Carga de festivos inicial
  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const hs = await fetchHolidays();
        if (!cancel) setHolidays(hs);
      } catch (e) {
        if (!cancel) console.error("Error festivos:", e);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const ticketpayload = {
        Title:
          state.tipoCompra === "Alquiler"
            ? `Alquiler de ${state.productoServicio}`
            : `Compra de ${state.productoServicio}`,
        Descripcion: `Se ha solicitado una compra del siguiente dispositivo:  ${state.productoServicio} por: ${state.solicitadoPor}`,
        FechaApertura: toISODateTimeFlex(String(new Date())),
        TiempoSolucion: toGraphDateTime(calcularFechaSolucion(new Date(), 240, holidays)),
        Fuente: "Self service",
        Categoria: state.tipoCompra === "Alquiler" ? "Alquiler" : "Compra",
        SubCategoria: state.productoServicio,
        IdResolutor: "83",
        Nombreresolutor: "Cesar Eduardo Sanchez Salazar",
        Correoresolutor: "cesanchez@estudiodemoda.com.co",
        ANS: "ANS 5",
        Solicitante: state.solicitadoPor,
        Estadodesolicitud: "En Atención",
        CorreoSolicitante: "",
      };

      const createdTicket = await TicketsSvc.create(ticketpayload);

      const compra = ComprasSvc.create({
        CargarA: state.cargarA,
        CCosto: state.ccosto?.value ?? "",
        CO: state.co?.value ?? "",
        Dispositivo: state.productoServicio,
        FechaSolicitud: state.fechaSolicitud,
        PorcentajeBroken: String(state.marcasPct["BROKEN CHAINS"]) ?? "0",
        PorcentajeDiesel: String(state.marcasPct["DIESEL"]) ?? "0",
        PorcentajeKipling: String(state.marcasPct["KIPLING"]) ?? "0",
        PorcentajeMFG: String(state.marcasPct["MFG"] ?? "0"),
        PorcentajePilatos: String(state.marcasPct["PILATOS"] ?? "0"),
        PorcentajeSuperdry: String(state.marcasPct["SUPERDRY"] ?? "0"),
        SolicitadoPor: state.solicitadoPor,
        Title: state.tipoCompra,
        UN: state.un,
        DescItem: state.DescItem,
        CodigoItem: state.codigoItem,
        CorreoSolicitante: state.CorreoSolicitante,
        IdCreado: createdTicket.ID ?? "",
      });

      const logpayload: Log = {
        Actor: "Sistema",
        Descripcion:
          state.tipoCompra === "Alquiler"
            ? `Se ha creado un ticket bajo concepto de alquiler del siguiente dispositivo:  ${state.dispositivo} por solicitud de ${state.solicitadoPor}`
            : `Se ha creado un ticket bajo concepto de compra:  ${state.dispositivo} por solicitud de ${state.solicitadoPor}`,
        CorreoActor: "",
        Tipo_de_accion: "Creacion",
        Title: createdTicket.ID ?? "",
      };

      const createdLog = await LogSvc.create(logpayload);

      console.log(createdLog);

      alert("Se ha creado la solicitud de compra con éxito");
      console.log(compra);
      setState({
        productoServicio: "",
        cargarA: "CO",
        solicitadoPor: "",
        motivo: "",
        fechaSolicitud: "",
        tipoCompra: "Producto",
        dispositivo: "",
        noCO: "",
        marcasPct: { ...zeroMarcas() },
        co: null,
        ccosto: null,
        un: "",
        solicitadoPorCorreo: "",
        codigoItem: "",
        DescItem: "",
        CorreoSolicitante: "",
      });
    },
    [state, ComprasSvc, holidays]
  );

  const buildFilter = React.useCallback(
    (): GetAllOpts => {
      const filters: string[] = [];

      if (range.from && range.to && range.from < range.to) {
        if (range.from)
          filters.push(`fields/FechaApertura ge '${range.from}T00:00:00Z'`);
        if (range.to)
          filters.push(`fields/FechaApertura le '${range.to}T23:59:59Z'`);
      }
      return {
        filter: filters.join(" and "),
        top: pageSize,
      };
    },
    [range.from, range.to, pageSize]
  );

  const loadFirstPage = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items, nextLink } = await ComprasSvc.getAll(buildFilter());
      setRows(items);
      setNextLink(nextLink ?? null);
      setPageIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setRows([]);
      setNextLink(null);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [ComprasSvc, buildFilter]);

  const ticketEntrega = async (
    tipo: string,
    solicitante: string,
    Correosolicitante: string,
    entrega: string
  ) => {
    if (tipo === "Contrato") return;
    try {
      const apertura = new Date();
      const solucion = calcularFechaSolucion(apertura, 56, holidays);

      const aperturaISO = toGraphDateTime(apertura);
      const tiempoSolISO = toGraphDateTime(solucion as any);

      const resolutor = await pickTecnicoConMenosCasos(Usuarios);
      console.log(resolutor);

      const payload = {
        Title: `Entrega de ${tipo} solicitada por ${solicitante}`,
        Descripcion: `El proveedor ha hecho enrega de ${entrega} se crea ticket para la configuración y entrega a ${solicitante}`,
        FechaApertura: aperturaISO,
        TiempoSolucion: tiempoSolISO,
        Nombreresolutor: resolutor?.Title,
        Correoresolutor: resolutor?.Correo,
        Solicitante: solicitante,
        CorreoSolicitante: Correosolicitante,
        Estadodesolicitud: "En Atención",
        Categoria: "Hardware",
        SubCategoria: "Entrega",
        Fuente: "Self service",
        ANS: "ANS 4",
      };

      const ticketCreated = await TicketsSvc?.create(payload);
      console.log(ticketCreated);
      if (resolutor) {
        const casosActuales = Number(resolutor.Numerodecasos ?? 0);
        const nuevoTotal = casosActuales + 1;
        await Usuarios.update(String(resolutor.Id), { Numerodecasos: nuevoTotal });
      }

      alert("caso creado con ID " + ticketCreated?.ID);
      LogSvc.create({
        Actor: "Sitema",
        Descripcion: `Se ha creado un nuevo ticket para el siguiente requerimiento: ${
          ticketCreated!.ID ?? ""
        }`,
        CorreoActor: "",
        Tipo_de_accion: "Creacion",
        Title: ticketCreated?.ID ?? "",
      });

      if (ticketCreated?.CorreoSolicitante) {
        const title = `Asignación de Caso - ${ticketCreated.ID}`;
        const message = `
          <p>¡Hola ${payload.Solicitante ?? ""}!<br><br>
          Tu solicitud ha sido registrada exitosamente y ha sido asignada a un técnico para su gestión. Estos son los detalles del caso:<br><br>
          <strong>ID del Caso:</strong> ${ticketCreated.ID}<br>
          <strong>Asunto del caso:</strong> ${payload.Title}<br>
          <strong>Resolutor asignado:</strong> ${
            payload.Nombreresolutor ?? "—"
          }<br>
          El resolutor asignado se pondrá en contacto contigo en el menor tiempo posible para darte solución a tu requerimiento.<br><br>
          Si hay algun cambio con su ticket sera notificado.
          Este es un mensaje automático, por favor no respondas.
          </p>`.trim();

        try {
          await notifyFlow.invoke<FlowToUser, any>({
            recipient: ticketCreated?.CorreoSolicitante,
            title,
            message,
            mail: true,
          });
        } catch (err) {
          console.error("[Flow] Error enviando a solicitante:", err);
        }
      }

      if (ticketCreated?.CorreoResolutor) {
        const title = `Nuevo caso asignado - ${ticketCreated.ID}`;
        const message = `
        <p>¡Hola!<br><br>
        Tienes un nuevo caso asignado con estos detalles:<br><br>
        <strong>ID del Caso:</strong> ${ticketCreated}<br>
        <strong>Solicitante:</strong> ${payload.Solicitante ?? "—"}<br>
        <strong>Correo del Solicitante:</strong> ${
          payload.CorreoSolicitante ?? "—"
        }<br>
        <strong>Asunto:</strong> ${payload.Title}<br>
        <strong>Fecha máxima para categorización:</strong> ${
          ticketCreated.FechaApertura
        }<br><br>
        En caso de no categorizar el ticket este se vencera y sera irreversible.<br><br>
        Este es un mensaje automático, por favor no respondas.
        </p>`.trim();

        try {
          await notifyFlow.invoke<FlowToUser, any>({
            recipient: ticketCreated.CorreoResolutor,
            title,
            message,
            mail: true,
          });
        } catch (err) {
          console.error("[Flow] Error enviando a resolutor:", err);
        }
      }
    } catch (err) {
      console.error("Error en handleSubmit:", err);
    }
  };

  const handleNext = React.useCallback(
    async (idItem: string) => {
      if (saving) return;
      setSaving(true);
      setError(null);

      try {
        const current = await ComprasSvc.get(idItem);
        const prev = current.Estado ?? "";
        const next = NEXT[prev];

        if (prev === next) {
          setSaving(false);
          return;
        }

        try {
          const updated = await ComprasSvc.update(idItem, { Estado: next });

          if (updated.Estado === "Pendiente por entrega al usuario") {
            await ticketEntrega(
              current.Title,
              current.SolicitadoPor,
              current.CorreoSolicitante,
              state.productoServicio
            );
            setOpenModal(true);
          }
          alert(
            `Se ha actualizado el registro con el siguiente estado: ${
              updated?.Estado ?? "—"
            }`
          );
          reloadAll();
        } catch (e: any) {
          const code = e?.status ?? e?.code ?? e?.response?.status;
          if (code === 409 || code === 412) {
            const fresh = await ComprasSvc.get(idItem);
            const freshPrev = fresh.Estado ?? "";
            const freshNext = NEXT[freshPrev];

            if (freshPrev === freshNext) {
              setField?.("estado", freshPrev);
              setSaving(false);
              return;
            }

            // Segundo intento con el ETag más reciente
            await ComprasSvc.update(idItem, { Estado: freshNext });
            setField?.("estado", freshNext);
          } else {
            throw e;
          }
        }
      } catch (e: any) {
        setError(e?.message ?? "No se pudo avanzar el estado");
      } finally {
        setSaving(false);
      }
    },
    [ComprasSvc, setField, saving]
  );

  React.useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const hasNext = !!nextLink;

  const nextPage = React.useCallback(async () => {
    if (!nextLink) return;
    setLoading(true);
    setError(null);
    try {
      const { items, nextLink: n2 } = await ComprasSvc.getByNextLink(nextLink);
      setRows(items); // reemplaza la página visible
      setNextLink(n2 ?? null); // null si no hay más
      setPageIndex((i) => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, ComprasSvc]);

  const applyRange = React.useCallback(() => {
    loadFirstPage();
  }, [loadFirstPage]);
  const reloadAll = React.useCallback(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  return {
    rows,
    loading,
    error,
    MARCAS,
    pageSize,
    pageIndex,
    hasNext,
    errors,
    state,
    range,
    totalPct,
    openModal,
    setPageSize,
    nextPage,
    setRange,
    applyRange,
    reloadAll,
    setField,
    setMarcaPct,
    setState,
    zeroMarcas,
    handleSubmit,
    handleNext,
    setOpenModal,
  };
}

// ============================================================================
// HOOK PARA CENTRO DE COSTOS (SIN CAMBIOS EN LÓGICA)
// ============================================================================
export function useCentroCostos(CCSvc: CentroCostosService, refreshFlag?: number) {
  const [CC, setCC] = React.useState<CentroCostos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadCC = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await CCSvc.getAll();
      setCC(Array.isArray(items) ? items : []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando centros de costo");
      setCC([]);
    } finally {
      setLoading(false);
    }
  }, [CCSvc]);

  React.useEffect(() => {
    loadCC();
  }, [loadCC, refreshFlag]); // ⭐ escucha el refreshFlag

  const ccOptions = React.useMemo(
    () =>
      CC.map((c) => ({
        value: c.Codigo,
        label: c.Title,
      })),
    [CC]
  );

  return {
    CC,
    ccOptions,
    loading,
    error,
    reload: loadCC,
  };
}

// ============================================================================
// HOOK PARA CENTROS OPERATIVOS + UNIDAD DE NEGOCIO (SP)
// ============================================================================
export function useCO(COSvc: COService, refreshFlag?: number) {
  const [CentrosOperativos, setCO] = React.useState<CentroCostos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ⭐ NUEVO: leemos UnidadNegocio desde la lista de SP usando CentrosFacturaService
  const { getToken } = useAuth();
  const [unidadesNegocio, setUnidadesNegocio] = React.useState<CentroFactura[]>([]);

  const LoadCentroOperativos = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await COSvc.getAll();
      setCO(Array.isArray(items) ? items : []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando centros operativos");
      setCO([]);
    } finally {
      setLoading(false);
    }
  }, [COSvc]);

  // ⭐ Cargar Unidades de Negocio (lista UnidadNegocio en SP)
  const loadUnidadesNegocio = React.useCallback(async () => {
    try {
      const graph = new GraphRest(getToken);
      const svcUN = new CentrosFacturaService(graph, "UnidadNegocio");
      const lista = await svcUN.getAll({ orderby: "Title" });
      setUnidadesNegocio(Array.isArray(lista) ? lista : []);
    } catch (e) {
      console.error("Error cargando unidades de negocio:", e);
      setUnidadesNegocio([]);
    }
  }, [getToken]);

  React.useEffect(() => {
    LoadCentroOperativos();
  }, [LoadCentroOperativos, refreshFlag]); // ⭐ escucha el refreshFlag para CO

  React.useEffect(() => {
    // Cada vez que se cree/actualice algo (refreshFlag) recargamos también U.N
    loadUnidadesNegocio();
  }, [loadUnidadesNegocio, refreshFlag]);

  const COOptions = React.useMemo(
    () =>
      CentrosOperativos.map((c) => ({
        value: c.Codigo,
        label: c.Title,
      })),
    [CentrosOperativos]
  );

  // ⭐ Opciones de Unidad de Negocio desde SP
  const UNOptions = React.useMemo(
    () =>
      unidadesNegocio.map((un) => ({
        value: un.Codigo,
        label: `${un.Codigo} - ${un.Title}`,
      })),
    [unidadesNegocio]
  );

  return {
    CentrosOperativos,
    COOptions,
    loading,
    error,
    reload: LoadCentroOperativos,
    UNOptions,
  };
}
