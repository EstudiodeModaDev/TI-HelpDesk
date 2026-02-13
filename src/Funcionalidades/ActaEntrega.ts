// Funcionalidades/Escalamiento.ts
import * as React from "react";
import { useGraphServices } from "../graph/GrapServicesContext";
import { useAuth } from "../auth/authContext";
import type { LogService } from "../Services/Log.service";
import type {
  ActasEntrega,
  CamposPayload,
  DetalleEntrega,
  FormActaStateErrors,
  FormStateActa,
  TipoUsuario,
} from "../Models/ActasEntrega";
import type { ActasdeentregaService } from "../Services/Actasdeentrega.service";
import { FlowClient } from "./FlowClient";
import { toGraphDateOnly } from "../utils/Date";

/* ===== Config ===== */
const ENTREGAS_BY_TIPO: Record<TipoUsuario, string[]> = {
  "Usuario administrativo": ["Computador", "Cargador", "Mouse", "Multipuertos", "Diadema"],
  "Usuario de diseño": ["Computador", "Tableta graficadora", "Cargador", "Mouse", "Multipuertos", "Diadema"],
  "Tienda": ["Computador", "Monitor", "Teclado", "Mouse", "Lector CB", "Cajón Monedero", "Cámara", "Teléfono", "Multipuertos"],
};
const ITEMS_CON_TIPO_COMPUTADOR = new Set(["Computador", "CPU"]);
const VACIO = "-------";

/* ===== Helpers ===== */
function crearDetalleDefault(nombre: string, tipoComputador?: string): DetalleEntrega {
  const esPC = ITEMS_CON_TIPO_COMPUTADOR.has(nombre);
  const elemento = esPC && tipoComputador ? `Computador ${tipoComputador}` : nombre;
  const descripcion = esPC ? `Computador ${tipoComputador ?? ""}`.trim() : nombre;

  return {
    Elemento: elemento,
    Detalle: descripcion,
    Marca: "",
    Referencia: "",
    Serial: "",
    Propiedad: "Alquilado",
    Proveedor: "",
    Prueba: "",
  };
}

function sociedadFromEmail(email: string): CamposPayload["Franquicia"] {
  const dom = email.split("@")[1]?.toLowerCase() ?? "";
  if (dom === "movivisual.com") return "MV";
  if (dom === "replaycol.com")  return "DH";
  if (dom === "mtagraphics.com")return "MG";
  // default
  return "EDM";
}

function hayDatosMinimos(detalles: Record<string, DetalleEntrega>): boolean {
  return Object.values(detalles).some((d) => d?.Referencia?.trim() || d?.Serial?.trim() || d?.Marca?.trim());
}

const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/6df67607363d43f8abd304408f0aa92c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=cW7ulKEF9I05AN-lLcP9l3SK8IHtwc713B9xSLdpOUY")

function esPortatil(state: FormStateActa, selectedKeys: string[]) {
  const textos = [
    state.tipoComputador ?? "",
    ...selectedKeys.map((k) => state.detalles[k]?.Elemento ?? ""),
  ].join(" ");
  return /port[aá]til/i.test(textos);
}

/** Construye Campos 1..12 con VACIO si falta */
function buildCampos(state: FormStateActa, selectedKeys: string[], nombreEntrega: string, correoEntrega: string, idActa: number): CamposPayload {
  const items = selectedKeys.slice(0, 12).map((k, i) => ({ idx: i + 1, d: state.detalles[k] }));

  const base: Partial<CamposPayload> = {
    SedeDestino: state.sedeDestino,
    NombreRecibe: state.persona,
    CorreoRecibe: state.correo,
    NombreEntrega: nombreEntrega,
    CorreoEntrega: correoEntrega,
    SedeOrigen: "TI",
    ID: state.numeroTicket,
    Enviar: state.enviarEquipos,
    Portatil: esPortatil(state, selectedKeys),
    Franquicia: sociedadFromEmail(state.correo),
    IdCaso: idActa
  };

  for (let i = 1; i <= 12; i++) {
    const found = items.find((x) => x.idx === i)?.d;
    (base as any)[`Marca_${i}`]       = found?.Marca?.trim()        || VACIO;
    (base as any)[`Referencia_${i}`]  = found?.Referencia?.trim()   || VACIO;
    (base as any)[`Serial_${i}`]      = found?.Serial?.trim()       || VACIO;
    (base as any)[`Descripcion_${i}`] = found?.Elemento?.trim()     || VACIO;
    (base as any)[`Proveedor_${i}`]   = (found?.Proveedor ?? VACIO).trim() || VACIO;
    (base as any)[`Prueba_${i}`]      = (found?.Prueba?.trim() || found?.Detalle?.trim()) || VACIO;
  }

  return base as CamposPayload;
}

/* ===== Hook ===== */
export function useActaEntrega(ticketId: string) {
  const { account } = useAuth();
  const { Logs: LogSvc, ActasEntrega: EntregaSvc} = useGraphServices() as ReturnType<typeof useGraphServices> & {
    Logs: LogService;
    ActasEntrega: ActasdeentregaService;
  };
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<FormActaStateErrors>({});
  const [state, setState] = React.useState<FormStateActa>({
    numeroTicket: ticketId,
    persona: "",
    sedeDestino: "",
    correo: account?.username ?? "",
    cedula: "",
    enviarEquipos: "",
    tipoUsuario: "" as TipoUsuario | "",
    tipoComputador: "",
    entregas: {},
    detalles: {},
  });

  const setField = <K extends keyof FormStateActa>(k: K, v: FormStateActa[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  /** Ítems según tipo de usuario */
  const items = React.useMemo(() => {
    return state.tipoUsuario ? ENTREGAS_BY_TIPO[state.tipoUsuario] ?? [] : [];
  }, [state.tipoUsuario]);

  /** Mantener coherencia cuando cambia el tipo de usuario */
  React.useEffect(() => {
    if (!state.tipoUsuario) return;

    const nextEntregas: Record<string, boolean> = {};
    const nextDetalles: Record<string, DetalleEntrega> = {};

    for (const k of items) {
      const activo = !!state.entregas[k];
      nextEntregas[k] = activo;
      if (activo) nextDetalles[k] = state.detalles[k] ?? crearDetalleDefault(k, state.tipoComputador);
    }

    const algunComputadorActivo = items.some((k) => ITEMS_CON_TIPO_COMPUTADOR.has(k) && !!nextEntregas[k]);

    setState((s) => ({
      ...s,
      entregas: nextEntregas,
      detalles: nextDetalles,
      tipoComputador: algunComputadorActivo ? (s.tipoComputador ?? "") : "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tipoUsuario, items]);

  /** Si cambia tipoComputador, reflejar en Elemento/Detalle de Computador/CPU seleccionados */
  React.useEffect(() => {
    if (!state.tipoComputador) return;
    setState((s) => {
      const detalles = { ...s.detalles };
      Object.keys(s.entregas)
        .filter((k) => s.entregas[k] && ITEMS_CON_TIPO_COMPUTADOR.has(k))
        .forEach((k) => {
          const prev = detalles[k] ?? crearDetalleDefault(k, s.tipoComputador);
          detalles[k] = {
            ...prev,
            Elemento: `Computador ${s.tipoComputador}`,
            Detalle: `Computador ${s.tipoComputador}`,
          };
        });
      return { ...s, detalles };
    });
  }, [state.tipoComputador]);

  const toggleEntrega = (key: string, v: boolean) =>
    setState((s) => {
      const entregas = { ...s.entregas, [key]: v };
      const detalles = { ...s.detalles };
      if (v) {
        if (!detalles[key]) detalles[key] = crearDetalleDefault(key, s.tipoComputador);
      } else {
        delete detalles[key];
      }
      return { ...s, entregas, detalles };
    });

  const updateDetalle = (key: string, patch: Partial<DetalleEntrega>) =>
    setState((s) => {
      const prev = s.detalles[key] ?? crearDetalleDefault(key, s.tipoComputador);
      let next: DetalleEntrega = { ...prev, ...patch };

      if (patch.Propiedad && patch.Propiedad !== "Alquilado") {
        next = { ...next, Proveedor: "-" };
      }
      if (patch.Propiedad === "Alquilado" && prev.Proveedor === "-") {
        next.Proveedor = "";
      }
      return { ...s, detalles: { ...s.detalles, [key]: next } };
    });

  /** Reglas de validación */
  const requiereTipoComputador = Object.entries(state.entregas)
    .some(([k, v]) => v && ITEMS_CON_TIPO_COMPUTADOR.has(k));

  const validate = () => {
    const e: FormActaStateErrors = {};
    if (!state.cedula) e.cedula = "Digite la cédula de quien recibe";
    if (!state.correo) e.correo = "Digite el correo de quien recibe";
    if (!Object.values(state.entregas).some(Boolean)) e.entregas = "Debe seleccionar al menos un objeto a entregar";
    if (!state.enviarEquipos) e.enviarEquipos = "Debe definir si los equipos se enviarán";
    if (!state.persona.trim()) e.persona = "Escriba el nombre completo de quien recibe";
    if (!state.tipoUsuario) e.tipoUsuario = "Seleccione a qué tipo de usuario se le hará la entrega";
    if (requiereTipoComputador && !state.tipoComputador) e.tipoComputador = "Seleccione el tipo de computador";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Validación mínima estilo Power Apps (txtReferencia_1 / txtSerial / txtMarca)
    if (!hayDatosMinimos(state.detalles)) {
      alert("Por favor llene todos los campos requeridos");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Log (opcional)
      await LogSvc.create({
        Actor: account?.name ?? "",
        CorreoActor: account?.username ?? "",
        Tipo_de_accion: "seguimiento",
        Descripcion: `Se diligenció acta para ${state.persona} (${state.tipoUsuario})`,
        Title: state.numeroTicket,
      });

      // (Opcional) solo para inspección en consola
      const entregasSeleccionadas = Object.keys(state.entregas).filter((k) => state.entregas[k]);
      const coleccion = entregasSeleccionadas.map((k, i) => ({ ID: i + 1, ...state.detalles[k] }));
      console.log("[ACTA] Colección (debug):", coleccion);

      // === Invoca el flujo y crea el acta en SharePoint desde emitirActa ===
      const flowResp = await emitirActa();

      alert("Se ha generado el acta con éxito. Ingrese a su correo y fírmela.");
      console.log("[Flow] Respuesta:", flowResp);
      // navigate("/seguimiento"); // si aplica

    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Error generando el acta");
    } finally {
      setLoading(false);
    }
  };


  const selectedKeys = React.useMemo(
    () => Object.keys(state.entregas).filter((k) => state.entregas[k]),
    [state.entregas]
  );

  // ...dentro del hook useActaEntrega

  const emitirActa = async () => {
    const entregasSeleccionadas = Object.keys(state.entregas).filter((k) => state.entregas[k]);
    const actaPayload: ActasEntrega = {
      Cedula: state.cedula,
      Correo_x0028_QuienRecibe_x0029_: state.correo,
      Estado: "Enviado",
      Id_caso: state.numeroTicket,
      Tecnico_x0028_Queentrega_x0029_: account?.username ?? "",
      Title: account?.name ?? "",
      Fecha: toGraphDateOnly(new Date()),
      Persona_x0028_Quienrecibe_x0029_: state.persona
    }
    const actaLista = await EntregaSvc.create(actaPayload)

    const Campos = buildCampos(
      state,
      entregasSeleccionadas,
      account?.name ?? "",
      account?.username ?? "",
      Number(actaLista.Id)
    );

    const body = {
      ...Campos,                

    };

    const resp = await notifyFlow.invoke<typeof body, any>(body);
    return resp;
  };

  

  return {
    loading,
    error,
    user: account,
    items,
    state,
    setField,
    handleSubmit,
    errors,
    toggleEntrega,
    ITEMS_CON_TIPO_COMPUTADOR,
    updateDetalle,
    selectedKeys,
    emitirActa
  };
}
