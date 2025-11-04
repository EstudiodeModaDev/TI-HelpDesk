// Funcionalidades/Escalamiento.ts
import * as React from "react";
import { useGraphServices } from "../graph/GrapServicesContext";
import { useAuth } from "../auth/authContext";
import type { SociedadesService } from "../Services/Sociedades.service";
import type { FormEscalamientoState, InternetTiendas } from "../Models/Internet";
import type { Sociedades } from "../Models/Sociedades";
import type { LogService } from "../Services/Log.service";
import { FlowClient } from "./FlowClient";
import type { Escalamiento, } from "../Models/FlujosPA";
import type { InternetTiendasService } from "../Services/InternetTiendas.service";
import type { FormEscalamientoStateErrors } from "../Models/nuevoTicket";

const normUpper = (s?: string | null) =>
  String(s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase().trim();

const MAX_MB = 3;               // útil si enviarás por Graph como inline
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "application/pdf"]; // ajusta
const MAX_FILES = 10;

async function fileToBase64(file: File): Promise<string> {
  // Lee como data URL: "data:<mime>;base64,<BASE64>"
  const b64 = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error("No se pudo leer el archivo"));
    fr.readAsDataURL(file);
  });
  // Devuelve solo el payload base64 (lo que espera tu Flow)
  const comma = b64.indexOf(",");
  return comma >= 0 ? b64.slice(comma + 1) : b64;
}

const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a031c29889694d0184b5f480c5dc9834/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=WFf3MbRjOYrUiFpzepTr0aeEM4zSyBBds-RLDxejy1I")

export function useEscalamiento(correoSolicitante: string, ticketId: string) {
    const { account } = useAuth();
    const {Logs: LogSvc, Sociedades: SociedadesSvc, InternetTiendas: IntTiendasSvc} = useGraphServices() as ReturnType<typeof useGraphServices> & {
        Logs: LogService;
        Sociedades: SociedadesService;
        InternetTiendas: InternetTiendasService
    };
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [infoInternet, setInfoInternet] = React.useState<InternetTiendas | null>(null);
    const [compania, setCompania] = React.useState<Sociedades | null>(null);
    const [state, setState] = React.useState<FormEscalamientoState>({
        proveedor: "",
        identificador: "",
        tienda: "",
        ciudad: "",
        empresa: "",
        nit: "",
        centroComercial: "",
        local: "",
        nombre: "",
        apellidos: "",
        cedula: "",
        telefono: "313 745 3700/319 254 9920",
        descripcion: "",
        adjuntos: [],
    });
    const [errors, setErrors] = React.useState<FormEscalamientoStateErrors>({});
    const setField = <K extends keyof FormEscalamientoState>(k: K, v: FormEscalamientoState[K]) => setState((s) => ({ ...s, [k]: v }));


    const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const incoming = Array.from(files);
    const filtered = incoming.filter(
        (f) => (ALLOWED.length === 0 || ALLOWED.includes(f.type)) && f.size <= MAX_BYTES
    );
    if (filtered.length === 0) return;

    setState((s) => ({
        ...s,
        adjuntos: [...(s.adjuntos ?? []), ...filtered].slice(0, MAX_FILES),
    }));
    };

    const load = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
        const Tiendas = await IntTiendasSvc.getAll({filter: `fields/CORREO eq '${correoSolicitante}'`,top: 1});
        const tiendaSel = Tiendas[0]
        setInfoInternet(tiendaSel)

        if (tiendaSel) {
            const compNorm = normUpper((tiendaSel as any).Compa_x00f1__x00ed_a);
            const sociedades = await SociedadesSvc.get(compNorm)
            setCompania(sociedades);

            //Setear state
            setState({
                apellidos: account?.name!,
                cedula: "",
                centroComercial: tiendaSel?.Centro_x0020_Comercial ?? "",
                ciudad: tiendaSel?.Title ?? "",
                descripcion: "",
                empresa: sociedades?.Title ?? "",
                identificador: tiendaSel?.IDENTIFICADOR ?? "",
                local: tiendaSel?.Local ?? "",
                nit: sociedades?.Nit ?? "",
                nombre: account?.username ?? "",
                proveedor: tiendaSel?.PROVEEDOR ?? "",
                telefono: "313 745 3700/319 254 9920",
                tienda: tiendaSel?.Tienda ?? "",
                adjuntos: []
            })
        } else {
            setCompania(null);
        }
        } catch (e: any) {
        setError(e?.message ?? "Error al inicializar escalamiento");
        } finally {
        setLoading(false);
        }
    }, [SociedadesSvc, correoSolicitante]);

    const onSearch = React.useCallback(async (term: string) => {
        setLoading(true);
        setError(null);
        try {
            const tiendas = await IntTiendasSvc.getAll({filter: `(fields/CORREO eq '${term}' or fields/Tienda eq '${term}' or fields/IDENTIFICADOR eq '${term}')`, top: 1, });

            const tiendaSel = tiendas?.[0] ?? null;
            setInfoInternet(tiendaSel);

            //Si hay tienda, busca la compañía por Title (ajusta el campo si es otro)
            if (tiendaSel) {
                const compName = (tiendaSel as any).Compa_x00f1__x00ed_a ?? (tiendaSel as any).Compania ?? "";

                // Busca la sociedad por Título exacto
                const sociedades = await SociedadesSvc.get(compName)

                setCompania(sociedades ?? null);
                setState({
                    apellidos: account?.name!,
                    cedula: "",
                    centroComercial: tiendaSel?.Centro_x0020_Comercial ?? "",
                    ciudad: tiendaSel?.Title ?? "",
                    descripcion: "",
                    empresa: sociedades.Title ?? "",
                    identificador: tiendaSel?.IDENTIFICADOR ?? "",
                    local: tiendaSel?.Local ?? "",
                    nit: sociedades?.Nit ?? "",
                    nombre: account?.username ?? "",
                    proveedor: tiendaSel?.PROVEEDOR ?? "",
                    telefono: "313 745 3700/319 254 9920",
                    tienda: tiendaSel?.Tienda ?? "",
                    adjuntos: []
                })
            } else {
                setCompania(null);
            }
        } catch (e: any) {
        setError(e?.message ?? "Error al inicializar escalamiento");
        } finally {
        setLoading(false);
        }
    },
    [IntTiendasSvc, SociedadesSvc, correoSolicitante]
    );

    const validate = () => {
    const e: FormEscalamientoStateErrors = {};
    if (state.adjuntos.length < 1) e.adjuntos = "Debe adjuntar al menos una prueba del problema";
    if (!state.apellidos) e.apellidos = "Digite sus apellidos";
    if (!state.cedula) e.cedula = "Digite su cédula";
    if (!state.centroComercial) e.centroComercial = "Digite el centro comercial en el que se ubica la tienda";
    if (!state.ciudad.trim()) e.ciudad = "Ingrese la ciudad de la tienda";
    if (!state.descripcion.trim()) e.descripcion = "Seleccione la descripción mas acorde a su problema";
    if (!state.empresa) e.empresa = "Escriba la compañia a la que pertence la tienda";
    if (!state.identificador) e.identificador = "Escriba el identificador de servicio de la tienda";
    if (!state.local) e.local = "Escriba el local en el que se ubica la tienda";
    if (!state.nit) e.nit = "Escriba el NIT de la compañia a la que pertenece la tienda";
    if (!state.nombre) e.nombre = "Escriba su nombre";
    if (!state.proveedor) e.proveedor = "Escriba el proveedor de internet de la tienda";
    if (!state.tienda) e.tienda = "Escriba el nombre de la tienda";
    setErrors(e);
    return Object.keys(e).length === 0;
    } ;

    const handleSubmit = React.useCallback(async () => {
        if(!validate()) return;
        setLoading(true);
        setError(null);
        try {
            const created = LogSvc.create({
                Actor: account?.name ?? "",
                CorreoActor: account?.username ?? "",
                Tipo_de_accion: "seguimiento",
                Descripcion: `Se ha iniciado un escalamiento de internet al proveedor: ${state.proveedor} para la tienda: ${state.tienda}`,
                Title: ticketId
            })
            console.log(created)
            alert("Se ha iniciado el escalamiento de servicio de internet")
            const correoPara =   state.proveedor.toLowerCase() === "tigo" ? "soportecnicoempresarial@tigo.com.co" : "cliente.co@claro.com.co";
            try {
            await notifyFlow.invoke<Escalamiento, any>({
                adjuntos: await Promise.all((state.adjuntos ?? []).map(async (f) => ({name: f.name, size: f.size, type:f.type || "application/octet-stream", contentBase: await fileToBase64(f)}))),
                apellidos: state.apellidos,
                cedula: state.cedula,
                centroComercial: state.centroComercial,
                ciudad: state.ciudad,
                descripcion: state.descripcion,
                empresa: state.empresa,
                identificador: state.identificador,
                local: state.local,
                nit: state.nit,
                nombre: state.nombre,
                proveedor: state.proveedor,
                telefono: state.telefono,
                tienda: state.tienda,
                para: correoPara
            });
            alert("Se ha enviado el correo.")
            } catch (err) {
            console.error("[Flow] Error enviando a resolutor:", err);
            }


        } catch (e: any) {
        setError(e?.message ?? "Error al inicializar escalamiento");
        } finally {
        setLoading(false);
        }
    },
    [IntTiendasSvc, SociedadesSvc, correoSolicitante, state, notifyFlow, LogSvc]
);


  React.useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try { await load(); } finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [load]);

  return {
    loading,
    error,
    user: account,  
    infoInternet,
    compania,
    reload: load,
    onSearch,
    state,
    setField,
    handleFiles,
    handleSubmit,
    errors
  };
}
