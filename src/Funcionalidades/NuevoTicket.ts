import * as React from "react";
import { useState, useEffect } from "react";
import { calcularFechaSolucion, calculoANS } from "../utils/ans";
import { fetchHolidays} from "../Services/Festivos";
import type { FormState, FormErrors, UserFormState, FormUserErrors } from "../Models/nuevoTicket";
import type { Articulo, Categoria, Subcategoria } from "../Models/Categorias";
import type {  GetAllOpts, } from "../Models/Commons";
import type { FlowToUser } from "../Models/FlujosPA";
import type { TZDate } from "@date-fns/tz";
import { TicketsService } from "../Services/Tickets.service";
import { toGraphDateTime } from "../utils/Date";
import type { Holiday } from "festivos-colombianos";
import { UsuariosSPService } from "../Services/Usuarios.Service";
import { FlowClient } from "./FlowClient";
import type { LogService } from "../Services/Log.service";
import { useAuth } from "../auth/authContext";
import { pickTecnicoConMenosCasos } from "../utils/Commons";
import type { UsuariosSP } from "../Models/Usuarios";


type Svc = {
  Categorias: { getAll: (opts?: any) => Promise<any[]> };
  SubCategorias: { getAll: (opts?: any) => Promise<any[]> };
  Articulos: { getAll: (opts?: any) => Promise<any[]> };
  Tickets?: TicketsService;
  Usuarios: UsuariosSPService
  Logs: LogService
}; 

export const first = (...vals: any[]) => vals.find((v) => v !== undefined && v !== null && v !== "");

export function useNuevoTicketForm(services: Svc) {
  const { Categorias, SubCategorias, Articulos, Tickets, Usuarios, Logs} = services;
  const [state, setState] = useState<FormState>({
    solicitante: null,
    resolutor: null,
    usarFechaApertura: false,
    fechaApertura: null,
    fuente: "",
    motivo: "",
    descripcion: "",
    categoria: "",    // Título
    subcategoria: "", // Título
    articulo: "",     // Título
    ANS: "",
    archivo: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [fechaSolucion, setFechaSolucion] = useState<Date | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [articulosAll, setArticulosAll] = useState<Articulo[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);

  // ---- Instancia del servicio de Flow (useRef para no depender de React.*)
  const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a21d66d127ff43d7a940369623f0b27d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0ptZLGTXbYtVNKdmIvLdYPhw1Wcqb869N3AOZUf2OH4")

  // Carga de festivos inicial
  useEffect(() => {
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

  // Carga de catálogo de servicios
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoadingCatalogos(true);
        setErrorCatalogos(null);

        const [catsRaw, subsRaw, artsRaw] = await Promise.all([
          Categorias.getAll({ orderby: "fields/Title asc" }),
          SubCategorias.getAll({ orderby: "fields/Title asc", top: 5000 }),
          Articulos.getAll({ orderby: "fields/Title asc", top: 5000 }),
        ]);

        if (cancel) return;

        const cats: Categoria[] = (catsRaw ?? []).map((r: any) => ({
          ID: String(first(r.ID, r.Id, r.id)),
          Title: String(first(r.Title, "No mapeado")),
        }));

        const subs: Subcategoria[] = (subsRaw ?? []).map((r: any) => ({
          ID: String(first(r.ID, r.Id, r.id)),
          Title: String(first(r.Title, "No mapeado")),
          Id_categoria: String(first(r.Id_categoria, "")),
        }));

        const arts: Articulo[] = (artsRaw ?? []).map((r: any) => ({
          ID: String(first(r.ID, r.Id, r.id)),
          Title: String(first(r.Title, "")),
          Id_subCategoria: String(first(r.Id_Subcategoria, r.Id_subcategoria, "")),
        }));

        setCategorias(cats);
        setSubcategorias(subs);
        setArticulosAll(arts);
      } catch (e: any) {
        if (!cancel) setErrorCatalogos(e?.message ?? "Error cargando catálogos");
      } finally {
        if (!cancel) setLoadingCatalogos(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [Categorias, SubCategorias, Articulos]);

  /* ============================
     Helpers de formulario
     ============================ */
  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: FormErrors = {};
    if (!state.solicitante) e.solicitante = "Requerido";
    if (!state.resolutor) e.resolutor = "Requerido";
    if (state.usarFechaApertura && !state.fechaApertura) e.fechaApertura = "Seleccione la fecha";
    if (!state.fuente) e.fuente = "Seleccione una fuente";
    if (!state.motivo.trim()) e.motivo = "Ingrese el motivo";
    if (!state.descripcion.trim()) e.descripcion = "Describa el problema";
    if (!state.categoria) e.categoria = "Seleccione una categoría";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const apertura = state.usarFechaApertura && state.fechaApertura ? new Date(state.fechaApertura) : new Date();

      const horasPorANS: Record<string, number> = {
        "ANS 1": 2,
        "ANS 2": 4,
        "ANS 3": 8,
        "ANS 4": 56,
        "ANS 5": 240,
      };
      let solucion: TZDate | null = null;

      const ANS = calculoANS(state.categoria, state.subcategoria, state.articulo);
      const horasAns = horasPorANS[ANS] ?? 0;

      if (horasAns > 0) {
        solucion = calcularFechaSolucion(apertura, horasAns, holidays);
        setFechaSolucion(solucion);
      }

      const aperturaISO  = toGraphDateTime(apertura);           
      const tiempoSolISO = toGraphDateTime(solucion as any);      

      // Objeto de creación
      const payload = {
        Title: state.motivo,
        Descripcion: state.descripcion,
        FechaApertura: aperturaISO,
        TiempoSolucion: tiempoSolISO,
        Fuente: state.fuente,
        Categoria: state.categoria,       
        SubCategoria: state.subcategoria, 
        SubSubCategoria: state.articulo,  
        Nombreresolutor: state.resolutor?.label,
        Correoresolutor: state.resolutor?.email,
        Solicitante: state.solicitante?.label,
        CorreoSolicitante: state.solicitante?.value,
        Estadodesolicitud: "En Atención",
        ANS: ANS
      };

      //Ibtener el resolutor y sumarle un caso en el mes
      try {
        const email = payload.Correoresolutor?.trim();
        if (!email) {
          console.warn("No hay Correoresolutor en el payload; no se puede incrementar conteo.");
        } else {
          // 1) Buscar resolutor por correo (top 1)
          const opts: GetAllOpts = {
            filter: `fields/Correo eq '${email}'`,
            top: 1,
          };

          const rows = await Usuarios.getAll(opts);
          const resolutorRow = rows?.[0];
          console.table(resolutorRow)

          if (!resolutorRow) {
            console.warn("No se encontró resolutor con ese correo:", email);
          } else {
            // 2) Calcular nuevo conteo de casos (normaliza null/undefined)
            const prev = Number(resolutorRow.Numerodecasos ?? 0);
            const next = prev + 1;

            // 3) Hacer update (espera Promise)
            const updated = await Usuarios.update(String(resolutorRow.Id), {
              Numerodecasos: next,
            });

            console.log("Resolutor actualizado:", updated);
          }
        }
      } catch (err) {
        console.error("Error actualizando contador del resolutor:", err);
      }

      // === Crear ticket (usa el servicio inyectado)
      let createdId: string | number = "";
      if (!Tickets?.create) {
        console.error("Tickets service no disponible. Verifica el GraphServicesProvider.");
      } else {
        const created = await Tickets.create(payload);

        createdId = created?.ID ?? "";
        console.log("Ticket creado con ID:", createdId);

        const idTexto = String(createdId || "—");
        const fechaSolTexto = solucion ? new Date(solucion as unknown as string).toLocaleString() : "No aplica";
        const solicitanteEmail = state.solicitante?.email || state.solicitante?.value || "";
        const resolutorEmail = state.resolutor?.email || state.resolutor?.value || "";

        //Crear Log
        Logs.create({Actor: "Sitema", Descripcion:  `Se ha creado un nuevo ticket para el siguiente requerimiento: ${idTexto}`, CorreoActor: "", Tipo_de_accion:"Creacion", Title: idTexto})

        setSubmitting(false);
       
          // Notificar solicitante
        if (solicitanteEmail) {
          const title = `Asignación de Caso - ${idTexto}`;
          const message = `
          <p>¡Hola ${payload.Solicitante ?? ""}!<br><br>
          Tu solicitud ha sido registrada exitosamente y ha sido asignada a un técnico para su gestión. Estos son los detalles del caso:<br><br>
          <strong>ID del Caso:</strong> ${idTexto}<br>
          <strong>Asunto del caso:</strong> ${payload.Title}<br>
          <strong>Resolutor asignado:</strong> ${payload.Nombreresolutor ?? "—"}<br>
          <strong>Fecha máxima de solución:</strong> ${fechaSolTexto}<br><br>
          El resolutor asignado se pondrá en contacto contigo en el menor tiempo posible para darte solución a tu requerimiento.<br><br>
          Este es un mensaje automático, por favor no respondas.
          </p>`.trim();

          try {
            await notifyFlow.invoke<FlowToUser, any>({
              recipient: solicitanteEmail,
              title,
              message,
              mail: true, 
            });
          } catch (err) {
            console.error("[Flow] Error enviando a solicitante:", err);
          }
        }

        // Notificar resolutor    
        if (resolutorEmail) {
          const title = `Nuevo caso asignado - ${idTexto}`;
          const message = `
          <p>¡Hola!<br><br>
          Tienes un nuevo caso asignado con estos detalles:<br><br>
          <strong>ID del Caso:</strong> ${idTexto}<br>
          <strong>Solicitante:</strong> ${payload.Solicitante ?? "—"}<br>
          <strong>Correo del Solicitante:</strong> ${payload.CorreoSolicitante ?? "—"}<br>
          <strong>Asunto:</strong> ${payload.Title}<br>
          <strong>Fecha máxima de solución:</strong> ${fechaSolTexto}<br><br>
          Por favor, contacta al usuario para brindarle solución.<br><br>
          Este es un mensaje automático, por favor no respondas.
          </p>`.trim();

          try {
            await notifyFlow.invoke<FlowToUser, any>({
              recipient: resolutorEmail, 
              title,
              message,
              mail: true,
            });
          } catch (err) {
            console.error("[Flow] Error enviando a resolutor:", err);
          }
        }
      
        //Limpiar formularior
        setState({solicitante: null, resolutor: null, usarFechaApertura: false, fechaApertura: null, fuente: "", motivo: "", descripcion: "", categoria: "", subcategoria: "", articulo: "",  ANS: "", archivo: null,})
        setErrors({})
      }
      } finally {
        
      }
    };

  const balanceCharge = async (targetId: string, maxDiff= 3) => {
    const resolutores: UsuariosSP[] = await Usuarios.getAll({filter: "fields/Rol eq 'Tecnico' and fields/Disponible eq 'Disponible'"})
    
    if(resolutores.length  > 0){
        const countsDespues = resolutores.map(r => {
          const base = r.Numerodecasos ?? 0;
          return base;
        });

        const resolutor = await Usuarios.get(targetId)

        const min = Math.min(...countsDespues);
        const respuesta = ((Number(resolutor.Numerodecasos ?? 0)+1) - min) < maxDiff; 

        return {
          ok: respuesta
        }
    }
  } 


  return {
    state, errors, submitting, fechaSolucion, categorias, subcategoriasAll: subcategorias, articulosAll, loadingCatalogos, errorCatalogos,
    handleSubmit, setField, balanceCharge
  };
}

export function useNuevoUsuarioTicketForm(services: Svc) {
  const { Usuarios, Tickets, Logs} = services;
  const { account, } = useAuth();
  const [state, setState] = useState<UserFormState>({archivo: null, Correosolicitante: account?.username ?? "", descripcion: "", motivo: "", solicitante: ""});
  const [errors, setErrors] = useState<FormUserErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [fechaSolucion, setFechaSolucion] = useState<Date | null>(null);
  const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a21d66d127ff43d7a940369623f0b27d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0ptZLGTXbYtVNKdmIvLdYPhw1Wcqb869N3AOZUf2OH4")

  useEffect(() => {
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

  const setField = <K extends keyof UserFormState>(k: K, v: UserFormState[K]) => setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: FormUserErrors = {};
    if (!state.descripcion) e.descripcion = "Requerida";
    if (state.descripcion.length < 60) e.descripcion = "La descripción debe tener minimo 60 caracteres";
    if (!state.motivo.trim()) e.motivo = "Ingrese el motivo";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const apertura = new Date();
      const solucion = calcularFechaSolucion(apertura, 2.5, holidays);
      setFechaSolucion(solucion);

      const aperturaISO  = toGraphDateTime(apertura);
      const tiempoSolISO = toGraphDateTime(solucion as any);

      const resolutor = await pickTecnicoConMenosCasos(Usuarios);
      console.log(resolutor);

      const payload = {
        Title: state.motivo,
        Descripcion: state.descripcion,
        FechaApertura: aperturaISO,
        TiempoSolucion: tiempoSolISO,
        Nombreresolutor: resolutor?.Title,
        Correoresolutor: resolutor?.Correo,
        Solicitante: account?.name,
        CorreoSolicitante: account?.username,
        Estadodesolicitud: "En Atención",
        Fuente: "Aplicación"
      };

      const ticketCreated = await Tickets?.create(payload);
      console.log(ticketCreated);
      if (resolutor) {
        const casosActuales = Number(resolutor.Numerodecasos ?? 0); // ← default 0 ANTES de Number()
        const nuevoTotal = casosActuales + 1;
        await Usuarios.update(String(resolutor.Id), {Numerodecasos: nuevoTotal,});
      }

      alert("caso creado con ID " + ticketCreated?.ID)
      Logs.create({
        Actor: "Sitema", 
        Descripcion:  `Se ha creado un nuevo ticket para el siguiente requerimiento: ${ticketCreated!.ID ?? ""}`, 
        CorreoActor: "", 
        Tipo_de_accion: 
        "Creacion", 
        Title: ticketCreated?.ID ?? ""
      })

      setState({archivo: null, Correosolicitante: account?.username ?? "", descripcion: "", motivo: "", solicitante: account?.name ?? ""})

      setSubmitting(false); 

      if (ticketCreated?.CorreoSolicitante) {
        const title = `Asignación de Caso - ${ticketCreated.ID}`;
        const message = `
          <p>¡Hola ${payload.Solicitante ?? ""}!<br><br>
          Tu solicitud ha sido registrada exitosamente y ha sido asignada a un técnico para su gestión. Estos son los detalles del caso:<br><br>
          <strong>ID del Caso:</strong> ${ticketCreated.ID}<br>
          <strong>Asunto del caso:</strong> ${payload.Title}<br>
          <strong>Resolutor asignado:</strong> ${payload.Nombreresolutor ?? "—"}<br>
          El resolutor asignado se pondrá en contacto contigo en el menor tiempo posible para darte solución a tu requerimiento.<br><br>
          Si hay algun cambio con su ticket sera notificado.
          Este es un mensaje automático, por favor no respondas.
          </p>`.trim();

          try {
            await notifyFlow.invoke<FlowToUser, any>({recipient: ticketCreated?.CorreoSolicitante, title, message, mail: true, });
          } catch (err) {
            console.error("[Flow] Error enviando a solicitante:", err);
          }
        }

        // Notificar resolutor    
        if (ticketCreated?.CorreoResolutor) {
          const title = `Nuevo caso asignado - ${ticketCreated.ID}`;
          const message = `
          <p>¡Hola!<br><br>
          Tienes un nuevo caso asignado con estos detalles:<br><br>
          <strong>ID del Caso:</strong> ${ticketCreated}<br>
          <strong>Solicitante:</strong> ${payload.Solicitante ?? "—"}<br>
          <strong>Correo del Solicitante:</strong> ${payload.CorreoSolicitante ?? "—"}<br>
          <strong>Asunto:</strong> ${payload.Title}<br>
          <strong>Fecha máxima para categorización:</strong> ${ticketCreated.FechaApertura}<br><br>
          En caso de no categorizar el ticket este se vencera y sera irreversible.<br><br>
          Este es un mensaje automático, por favor no respondas.
          </p>`.trim();

          try {
            await notifyFlow.invoke<FlowToUser, any>({recipient: ticketCreated.CorreoResolutor, title, message, mail: true,});
          } catch (err) {
            console.error("[Flow] Error enviando a resolutor:", err);
          }
        }
 
    } catch (err) {
      console.error("Error en handleSubmit:", err);
    } finally {
      
    }
  };


  return {
    state, errors, submitting, fechaSolucion,
    handleSubmit, setField, 
  };
}


