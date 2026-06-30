import * as React from "react";
import { useState } from "react";
import type { Ticket } from "../../Models/Tickets";
import type { AccountInfo } from "@azure/msal-browser";
import type { ComprasService } from "../../Services/Compras.service";
import type { TicketsRepository } from "../../repositories/TicketsRepository/TicketRepository";
import { uploadImageToSupabase } from "../shared/UploadFileToSupabase";
import toast from "react-hot-toast";
import { useRepositories } from "../../repositories/repositoriesContext";
import { notifyClosedSolicitante } from "./utils/notifications";
import type { LogDTO } from "../../Models/DTO/Log";
import type { LogRepository } from "../../repositories/LogRepository/LogRespository";
import { calcularMinutos } from "./utils/CalcularMinutos";

type Svc = { Tickets?: TicketsRepository; Logs: LogRepository; ComprasSvc: ComprasService };

export type FormDocumentarState = {
  resolutor: string;
  correoresolutor: string;
  documentacion: string;
  archivo: File | null;
};

export type FormDocErrors = Partial<Record<keyof FormDocumentarState, string>>;

const TICKETS_ATTACHMENTS_BUCKET = "ticket-attachments"

export function useDocumentarTicket(services: Svc) {
  const { Tickets, Logs, ComprasSvc } = services;
  const {attachments} = useRepositories()
  const [state, setState] = useState<FormDocumentarState>({
    resolutor: "",
    correoresolutor: "",
    documentacion: "",
    archivo: null,
  });
  const [errors, setErrors] = useState<FormDocErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof FormDocumentarState>(k: K, v: FormDocumentarState[K]) => setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: FormDocErrors = {};
    const texto = (state.documentacion ?? "").trim();
    if (!texto) e.documentacion = "Por favor escriba la documentación.";
    else if (texto.length < 50) e.documentacion = "Mínimo 50 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, tipo: "solucion" | "seguimiento", ticket: Ticket, account: AccountInfo) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    if(!ticket.Categoria){
      alert("No puedes hacer ninguna acción en el ticket antes de categorizarlo")
      return
    }
    try {
      const soluciones = await Logs.loadLogs({seguimientos_solvi_id_ticket: Number(ticket.ID) ?? 0, tipo_accion:"Solucion"})

      if(soluciones.data.length > 0 && tipo === "solucion"){
        toast.error("Este ticket ya tiene una solucion no puedes escribir mas de una por ticket")
        throw new Error("Este ticket ya tiene una solucion no puedes escribir mas de una por ticket")
      }
      
      const logPayload: LogDTO = {
        seguimientos_solvi_actor: account.name ?? account.username ?? "",
        seguimientos_solvi_correo_actor: account.username ?? "",
        seguimientos_solvi_descripcion: state.documentacion,
        seguimientos_solvi_tipo_de_accion: tipo,
        seguimientos_solvi_id_ticket: Number(ticket.ID ?? ""),
        seguimientos_solvi_action_date: new Date()
        };

      const createdLog = await Logs.createLog(logPayload);
        // (Opcional) subir archivo si aplica
      if (state.archivo) {
        try{
          const result = await uploadImageToSupabase(state.archivo, TICKETS_ATTACHMENTS_BUCKET, `${ticket.ID}/Documentacion/${state.archivo.name}`)
          if(!result.ok){
            toast.error("Algo ha salido mal subiendo el archivo, intentelo de nuevo")
            throw new Error("Algo ha salido mal")
          }
          await attachments?.createAttachment({
            attachment_path: result.url,
            attachment_type: "Documentacion",
            created_at: new Date().toISOString(),
            file_name: state.archivo.name,
            id_ticket: Number(ticket.ID),
            seguimiento_id: Number(createdLog.data?.Id) ?? 0,
            storage_bucket: TICKETS_ATTACHMENTS_BUCKET
          })
        } catch (e: any){
          toast.error("Algo ha salido mal subiendo el archivo, intentelo de nuevo")
          throw new Error("Algo ha salido mal")
        }
        
      }
      setState({archivo: null, correoresolutor: "", documentacion: "", resolutor: ""})
      setSubmitting(false);
      

      // 2) Si es solución, cerrar ticket con estado correcto
      if (tipo === "solucion") {
        if (!Tickets) throw new Error("Servicio Tickets no disponible.");

        const nuevoEstado = ticket.Estadodesolicitud === "En Atención" ? "Cerrado" : "Cerrado fuera de tiempo";
        toast.success("Caso cerrado. Enviando notificación al solicitante")
        const minutos = await calcularMinutos(new Date(ticket.FechaApertura!))
        const updated = await Tickets.updateTicket(ticket.ID!, { 
          ticket_solvi_estado: nuevoEstado, 
          FechaCierreReal: new Date(), 
          MinutosNocturnos: minutos.nocturnos,
          MinutosFestivos: minutos.festivos,
          MinutosDominicales: minutos.dominicales,
          MinutosTotales: minutos.total
         });
         console.log(updated)
        const casodecompra = await ComprasSvc.getAll({filter:  `fields/IdCreado eq '${ticket.ID}'`})
        const casodeentrega = await ComprasSvc.getAll({filter:  `fields/IdEntrega eq '${ticket.ID}'`})
        await Promise.allSettled( casodecompra.items.map((it) => { const id = String(it.Id);    return ComprasSvc.update(id, { Estado: "Pendiente por registro de factura" });}));
        await Promise.allSettled( casodeentrega.items.map((it) => { const id = String(it.Id);    return ComprasSvc.update(id, { Estado: "Pendiente por registro de factura" });}));

        const solucion = await Logs.loadLogs({seguimientos_solvi_id_ticket: Number(ticket.ID), tipo_accion:'Solucion'})

        if (ticket.CorreoSolicitante) {
          await notifyClosedSolicitante(ticket, solucion.data[0].Descripcion)
        }
      } 
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      // setError(String(err));
    } finally {
      
    }
  };

  return { state, setField, errors, submitting, handleSubmit };
}
