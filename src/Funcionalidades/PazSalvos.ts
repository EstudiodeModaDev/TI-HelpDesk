import * as React from "react";
import { useState, useEffect } from "react";
import { calcularFechaSolucion } from "../utils/ans";
import { fetchHolidays} from "../Services/Festivos";
import type { FlowToUser } from "../Models/FlujosPA";
import type { TZDate } from "@date-fns/tz";
import { toGraphDateTime, toISODateFlex } from "../utils/Date";
import type { Holiday } from "festivos-colombianos";
import { useAuth } from "../auth/authContext";
import { pickTecnicoConMenosCasos } from "../utils/Commons";
import type { PazSalvosService } from "../Services/PazSalvos.service";
import type { PazSalvos, PazSalvosErrors } from "../Models/PazYsalvos";
import type { UsuariosSPService } from "../Services/Usuarios.Service";
import type { TicketsService } from "../Services/Tickets.service";
import type { LogService } from "../Services/Log.service";
import { FlowClient } from "./FlowClient";
import type { GetAllOpts } from "../Models/Commons";
import type { DateRange } from "../Models/Filtros";

type Svc = {
    PazYSalvos: PazSalvosService;
    Usuarios: UsuariosSPService;
    TicketSvc: TicketsService;
    LogSvc: LogService
}; 

export const first = (...vals: any[]) => vals.find((v) => v !== undefined && v !== null && v !== "");

export function usePazSalvos(services: Svc) {
    const { PazYSalvos, Usuarios, TicketSvc, LogSvc } = services;
    const [state, setState] = useState<PazSalvos>({
    Cargo: "",
    Cedula: "",
    CO: "",
    Fechadeingreso: "",
    Fechadesalida: "",
    Jefe: "",
    Nombre: "",
    Title: "",   
    Empresa: "", 
    Consecutivo: "",
    CorreoJefe: "",
    Correos: "",
    Solicitante: ""
    });
    const [errors, setErrors] = useState<PazSalvosErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [rows, setRows] = useState<PazSalvos[]>([])
    const [filterMode, setFilterMode] = useState<string>("");
    const today = React.useMemo(() => toISODateFlex(new Date()), []);
    const [range, setRange] = React.useState<DateRange>({ from: today, to: today });
    const [pageSize, setPageSize] = React.useState<number>(20);
    const [nextLink, setNextLink] = React.useState<String | null>(null)
    const [pageIndex, setPageIndex] = React.useState<number>(1)
    const {account } = useAuth();
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

  /* ============================
     Helpers de formulario
     ============================ */
    const setField = <K extends keyof PazSalvos>(k: K, v: PazSalvos[K]) => setState((s) => ({ ...s, [k]: v }));

    const validate = () => {
        const e: PazSalvosErrors = {};
        if (!state.CO) e.CO = "Requerido";
        if (!state.Cargo) e.Cargo = "Requerido";
        if (!state.Cedula) e.Cedula = "Requerido";
        if (!state.Empresa) e.Empresa = "Requerido";
        if (!state.Fechadeingreso) e.Fechadeingreso = "Requerido";
        if (!state.Fechadesalida) e.Fechadesalida = "Requerido";
        if (!state.Jefe) e.Jefe = "Requerido";
        if (!state.Nombre) e.Nombre = "Requerido";
        if (!state.Correos) e.Correos = "Debe seleccionar almenos un aprobador";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
            const apertura = new Date();
            let solucion: TZDate | null = null;
            solucion = calcularFechaSolucion(apertura, 8, holidays);
            const aperturaISO  = toGraphDateTime(apertura);           
            const tiempoSolISO = toGraphDateTime(solucion as any);      
            const payload: PazSalvos = {
                Title: state.Title,
                Cargo: state.Cargo,
                Cedula: state.Cedula,
                CO: state.CO,
                Empresa: state.Empresa,
                Fechadeingreso: state.Fechadeingreso,       
                Fechadesalida: state.Fechadesalida, 
                Jefe: state.Jefe,  
                Nombre: state.Nombre,
                Consecutivo: state.Consecutivo,
                CorreoJefe: state.CorreoJefe,
                Correos: state.Correos,
                Solicitante: account?.name ?? ""
            };
            const resolutor = await pickTecnicoConMenosCasos(Usuarios) 
            const ticketPayload = {
                ANS: "ANS 3",
                Categoria: "Inventario",
                CorreoObservador: "",
                Correoresolutor: resolutor?.Correo,
                CorreoSolicitante: account?.username,
                Descripcion: `Se ha solicitado el paz y salvo del tercero ${state.Nombre} port ${account?.name}`,
                Estadodesolicitud: "En espera",
                FechaApertura: aperturaISO,
                Fuente: "Aplicativo",
                IdResolutor: resolutor?.Id,
                Nombreresolutor: resolutor?.Title,
                Solicitante: account?.name,
                SubCategoria: "Salida",
                Title: `LIQUIDACIÓN FINAL ${state.Cedula} - ${state.Nombre}`,
                SubSubCategoria: "Paz y salvo",
                TiempoSolucion: tiempoSolISO
            }
        try {
            PazYSalvos.create(payload);
            const ticketCreated = await TicketSvc.create(ticketPayload);
            alert("Se ha registrado la solicitud con éxito")
            const idTexto = String(ticketCreated.ID || "—");
            const fechaSolTexto = solucion ? new Date(solucion as unknown as string).toLocaleString() : "No aplica";
            const resolutorEmail = ticketCreated.CorreoResolutor || "";
            LogSvc.create({Actor: "Sitema", Descripcion:  `Se ha creado un nuevo ticket para el siguiente requerimiento: ${ticketCreated.Title}`,  Tipo_de_accion: "Creacion", Title: idTexto, CorreoActor: ""});   
            setState({Cargo: "", Cedula: "", CO: "", Empresa: "", Fechadeingreso: "", Fechadesalida: "", Jefe: "", Nombre: "", Title: "", Consecutivo: "", CorreoJefe: "", Correos: "", Solicitante: ""});
            setErrors({})
            if (resolutorEmail) {
            const title = `Nuevo caso asignado - ${idTexto}`;
            const message = `
            <p>¡Hola!<br><br>
            Tienes un nuevo caso asignado con estos detalles:<br><br>
            <strong>ID del Caso:</strong> ${idTexto}<br>
            <strong>Solicitante:</strong> ${ticketCreated.Solicitante ?? "—"}<br>
            <strong>Correo del Solicitante:</strong> ${ticketCreated.CorreoSolicitante ?? "—"}<br>
            <strong>Asunto:</strong> ${ticketCreated.Title}<br>
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
        } catch (err) {
            console.error("Error actualizando contador del resolutor:", err);
        }finally {
            setSubmitting(false);
        }
    };

    const buildFilter = React.useCallback((): GetAllOpts => {
        const filters: string[] = [];
    
        if (filterMode === "En espera") {
          filters.push(`(fields/Title eq 'En espera')`);
        } else {
          filters.push(`(fields/Title eq 'Finalizado')`);
        }
    
        if (range.from && range.to && (range.from < range.to)) {
          if (range.from) filters.push(`fields/Created ge '${range.from}T00:00:00Z'`);
          if (range.to)   filters.push(`fields/Created le '${range.to}T23:59:59Z'`);
        }
    
        return {
          filter: filters.join(" and "),
          orderby: "fields/Created desc",
          top: pageSize,
        };
      }, [filterMode, range.from, range.to, pageSize,]); 

    const loadFirstPage = React.useCallback(async (e?: React.FormEvent) => {
        if(e){
          e.preventDefault();  
        }
        setSubmitting(true);  
        try {
            const rows = await PazYSalvos.getAll(buildFilter());
            setRows(rows.items);
            setNextLink(rows.nextLink);
            setPageIndex(1)
            console.table(rows)
        } catch (e: any) {
            setRows([]);
            setNextLink(null);
            setPageIndex(1);
        } finally {
            setSubmitting(false);
        }
    }, [TicketSvc, buildFilter]);


  return {
    state, errors, submitting, rows, nextLink, pageIndex, filterMode, range,
    setField, handleSubmit, loadFirstPage, setFilterMode, setRange, setPageSize, 
  };
}




