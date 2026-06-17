import * as React from "react";
import { useState, useEffect } from "react";
import { calcularFechaSolucion, calculoANS } from "../../utils/ans";
import { fetchHolidays} from "../../Services/Festivos";
import type { FormState, FormErrors, UserFormState, FormUserErrors } from "../../Models/nuevoTicket";
import type { Articulo, Categoria, Subcategoria } from "../../Models/Categorias";
import type {  GetAllOpts, } from "../../Models/Commons";
import type { TZDate } from "@date-fns/tz";
import { toGraphDateTime } from "../../utils/Date";
import type { Holiday } from "festivos-colombianos";
import { UsuariosSPService } from "../../Services/Usuarios.Service";
import { useAuth } from "../../auth/authContext";
import { pickTecnicoConMenosCasos } from "../../utils/Commons";
import type { UsuariosSP } from "../../Models/Usuarios";
import type { Ticket } from "../../Models/Tickets";
import type { TicketsRepository } from "../../repositories/TicketsRepository/TicketRepository";
import { notifyTicketCreatedResolutor, notifyTicketCreatedSolicitante } from "./utils/notifications";
import toast from "react-hot-toast";
import { uploadImageToSupabase } from "../shared/UploadFileToSupabase";
import { useRepositories } from "../../repositories/repositoriesContext";
import type { LogRepository } from "../../repositories/LogRepository/LogRespository";


type Svc = {
  Categorias: { getAll: (opts?: any) => Promise<any[]> };
  SubCategorias: { getAll: (opts?: any) => Promise<any[]> };
  Articulos: { getAll: (opts?: any) => Promise<any[]> };
  Tickets?: TicketsRepository;
  Usuarios: UsuariosSPService
  Logs: LogRepository
}; 

export const first = (...vals: any[]) => vals.find((v) => v !== undefined && v !== null && v !== "");

const TICKETS_ATTACHMENTS_BUCKET = "ticket-attachments"

export function useNuevoTicketForm(services: Svc) {
  const { Categorias, SubCategorias, Articulos, Tickets, Usuarios, Logs} = services;
  const {attachments} = useRepositories()
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
    archivo: [],
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

  const updateTicketsNumber = async (correoResolutor: string) => {
    try {
      const email = correoResolutor.trim();
      if (!email) {
        toast.error("No hay Correoresolutor en el payload; no se puede incrementar conteo.");
        return
      } 
        
      // 1) Buscar resolutor por correo (top 1)
      const opts: GetAllOpts = {
        filter: `fields/Correo eq '${email}'`,
        top: 1,
      };

      const rows = await Usuarios.getAll(opts);
      const resolutorRow = rows?.[0];
      console.table(resolutorRow)

      if (!resolutorRow) {
        toast.error("No se encontró resolutor con ese correo: " + email);
        return
      } 
        
      // 2) Calcular nuevo conteo de casos (normaliza null/undefined)
      const prev = Number(resolutorRow.Numerodecasos ?? 0);
      const next = prev + 1;

      // 3) Hacer update (espera Promise)
      await Usuarios.update(String(resolutorRow.Id), {
          Numerodecasos: next,
        });

    } catch (err) {
      toast.error("Error actualizando contador del resolutor:" + err);
      throw new Error("Error actualizando contador del resolutor" + err)
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
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

      const payload: Ticket =  { 
        AsuntoTicket: state.motivo,
        Descripcion: state.descripcion,
        FechaApertura: aperturaISO,
        FechaMaxima: tiempoSolISO,
        Fuente: state.fuente,
        Categoria: state.categoria,       
        SubCategoria: state.subcategoria, 
        Articulo: state.articulo,  
        Nombreresolutor: state.resolutor?.label,
        Correoresolutor: state.resolutor?.email,
        Solicitante: state.solicitante?.label,
        CorreoSolicitante: state.solicitante?.value,
        Estadodesolicitud: state.cerrar ? "Cerrado" : "En Atención",
        ANS: ANS
      }

      // === Crear ticket (usa el servicio inyectado)
      let createdId: string | number = "";
      if (!Tickets) {
        toast.error("Tickets service no disponible. Verifica el GraphServicesProvider.")
        throw new Error("Tickets service no disponible. Verifica el GraphServicesProvider.");
      }

      try{
        const created = await Tickets.createTicket(payload);
        createdId = created.data?.ID ?? ""
        await updateTicketsNumber(state.resolutor?.email ?? "")

        console.log(state.archivo)
        if(state.archivo.length > 0){
          await Promise.all(
            state.archivo.map(async (file) => {
                const result = await uploadImageToSupabase(file, TICKETS_ATTACHMENTS_BUCKET, `/${createdId}/Creacion/${file.name}`)
                await attachments?.createAttachment({
                  attachment_path: result.url,
                  attachment_type: "Creacion",
                  created_at: new Date().toISOString(),
                  file_name: file.name,
                  id_ticket: Number(created.data?.ID),
                  storage_bucket: TICKETS_ATTACHMENTS_BUCKET
                })
              }
            )
          )
        }

        toast.success("Se ha creado el ticket con éxito")

        const idTexto = Number(createdId);
        const solicitanteEmail = state.solicitante?.email || state.solicitante?.value || "";
        const resolutorEmail = state.resolutor?.email || state.resolutor?.value || "";

        //Crear Log
        Logs.createLog({
          seguimientos_solvi_actor: "Sitema", 
          seguimientos_solvi_descripcion: `Se ha creado un nuevo ticket para el requerimiento con ID: ${idTexto}`,
          seguimientos_solvi_correo_actor: "", 
          seguimientos_solvi_tipo_de_accion:"Creacion", 
          seguimientos_solvi_id_ticket: idTexto,
          seguimientos_solvi_action_date: new Date()
        })

        setSubmitting(false);
        
          // Notificar solicitante
        if (solicitanteEmail) {
          await notifyTicketCreatedSolicitante(created.data!)
        }

          // Notificar resolutor    
        if (resolutorEmail) {
          await notifyTicketCreatedResolutor(created.data!)
        }
      } catch(e: any){
        toast.error("Algo ha salido mal creando el ticket " + e)
        setSubmitting(false)
        throw new Error("Algo ha salido mal creando el ticket " + e)
      }

     
      //Limpiar formularior
      setState({solicitante: null, resolutor: null, usarFechaApertura: false, fechaApertura: null, fuente: "", motivo: "", descripcion: "", categoria: "", subcategoria: "", articulo: "",  ANS: "", archivo: [],})
      setErrors({})
    }
    

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
  const [state, setState] = useState<UserFormState>({archivo: [], Correosolicitante: account?.username ?? "", descripcion: "", motivo: "", solicitante: ""});
  const [errors, setErrors] = useState<FormUserErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [fechaSolucion, setFechaSolucion] = useState<Date | null>(null);
  const {attachments} = useRepositories()

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

      const payload: Ticket = {
        AsuntoTicket: state.motivo,
        Descripcion: state.descripcion,
        FechaApertura: aperturaISO,
        FechaMaxima: tiempoSolISO,
        Nombreresolutor: resolutor?.Title,
        Correoresolutor: resolutor?.Correo,
        Solicitante: account?.name,
        CorreoSolicitante: account?.username,
        Estadodesolicitud: "En Atención",
        Fuente: "Aplicación"
      };

      const ticketCreated = await Tickets?.createTicket(payload);

      if(state.archivo.length > 0){
        await Promise.all(
          state.archivo.map(async (file) => {
              const result = await uploadImageToSupabase(file, TICKETS_ATTACHMENTS_BUCKET, `/${ticketCreated?.data?.ID}/Creacion/${file.name}`)
              await attachments?.createAttachment({
                attachment_path: result.url,
                attachment_type: "Creacion",
                created_at: new Date().toISOString(),
                file_name: file.name,
                id_ticket: Number(ticketCreated?.data?.ID),
                storage_bucket: TICKETS_ATTACHMENTS_BUCKET
              })
            }
          )
        )
      }


      console.log(ticketCreated);
      if (resolutor) {
        const casosActuales = Number(resolutor.Numerodecasos ?? 0); // ← default 0 ANTES de Number()
        const nuevoTotal = casosActuales + 1;
        await Usuarios.update(String(resolutor.Id), {Numerodecasos: nuevoTotal,});
      }

      alert("caso creado con ID " + ticketCreated?.data?.ID)
      Logs.createLog({
        seguimientos_solvi_actor: "Sitema", 
        seguimientos_solvi_descripcion:  `Se ha creado un nuevo ticket para el siguiente requerimiento: ${ticketCreated!.data?.ID ?? ""}`, 
        seguimientos_solvi_correo_actor: "", 
        seguimientos_solvi_tipo_de_accion: "Creacion", 
        seguimientos_solvi_id_ticket: Number(ticketCreated?.data?.ID),
        seguimientos_solvi_action_date: new Date()
      })

      setState({archivo: [], Correosolicitante: account?.username ?? "", descripcion: "", motivo: "", solicitante: account?.name ?? ""})

      setSubmitting(false); 

      if (ticketCreated?.data?.CorreoSolicitante) {

          try {
            await notifyTicketCreatedSolicitante(payload)
          } catch (err) {
            console.error("[Flow] Error enviando a solicitante:", err);
          }
        }

      // Notificar resolutor    
      if (ticketCreated?.data?.Correoresolutor) {

        try {
          await notifyTicketCreatedResolutor(ticketCreated.data)
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


