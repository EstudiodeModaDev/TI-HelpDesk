import * as React from "react";
import toast from "react-hot-toast";
import type { FormReasignarErrors } from "../../Models/nuevoTicket";
import type { FormReasignarState, Ticket } from "../../Models/Tickets";
import type { UserOption } from "../../Models/Commons";
import type { UsuariosSP } from "../../Models/Usuarios";
import type { SupabaseTickets } from "../../Models/DTO/Tickets";
import type { TicketsRepository } from "../../repositories/TicketsRepository/TicketRepository";
import type { UsuariosSPRepository } from "../../repositories/UsuariosRepository/UsuariosSPRepository";
import type { LogRepository } from "../../repositories/LogRepository/LogRespository";
import { useAuth } from "../../auth/authContext";
import { increaseResolverCaseCount } from "./utils/ticketAssignment";
import { notifyTicketReassignedResolutor, notifyTicketReassignedSolicitante } from "./utils/notifications";

type Svc = {
  Tickets: TicketsRepository;
  Usuarios: UsuariosSPRepository;
  Logs: LogRepository | null;
};

export type ResolutorOption = UserOption & {
  disponible?: string;
  casos?: number;
};

type FormReasignarFullErrors = FormReasignarErrors & { general?: string };

const NOTA_MAX = 500;

const normEmail = (s?: string | null) => String(s ?? "").trim().toLowerCase();

function toResolutorOption(u: UsuariosSP): ResolutorOption {
  const correo = String(u.Correo ?? "").trim();
  return {
    value: correo,
    label: String(u.Title ?? correo).trim() || correo,
    id: String(u.Id ?? ""),
    email: correo,
    jobTitle: u.Rol || undefined,
    disponible: u.Disponible || undefined,
    casos: Number(u.Numerodecasos ?? 0) || 0,
  };
}

export function useReasignarTicket(services: Svc, ticket: Ticket, onDone?: () => void) {
  const { Tickets, Usuarios, Logs } = services;
  const { account } = useAuth();

  const [state, setState] = React.useState<FormReasignarState>({ resolutor: null, Nota: "" });
  const [errors, setErrors] = React.useState<FormReasignarFullErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const [resolutores, setResolutores] = React.useState<ResolutorOption[]>([]);
  const [loadingResolutores, setLoadingResolutores] = React.useState(false);
  const [errorResolutores, setErrorResolutores] = React.useState<string | null>(null);

  const correoActual = normEmail(ticket.Correoresolutor);
  const estadoLower = String(ticket.Estadodesolicitud ?? "").toLowerCase();
  const isCerrado = estadoLower.includes("cerrado");

  // Carga los posibles resolutores (lista Usuarios de SharePoint), excluyendo al actual.
  React.useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingResolutores(true);
      setErrorResolutores(null);
      const res = await Usuarios.loadUsuarios();
      if (cancel) return;

      if (!res.status) {
        setErrorResolutores(res.message ?? "Error cargando resolutores");
        setResolutores([]);
        toast.error("No se pudieron cargar los resolutores.");
      } else {
        const opts = res.data
          .filter((u) => normEmail(u.Correo) && normEmail(u.Correo) !== correoActual)
          .map(toResolutorOption)
          .sort((a, b) => a.label.localeCompare(b.label));
        setResolutores(opts);
      }
      setLoadingResolutores(false);
    })();
    return () => { cancel = true; };
  }, [Usuarios, correoActual]);

  const setField = <K extends keyof FormReasignarState>(k: K, v: FormReasignarState[K]) => {
    setState((s) => ({ ...s, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined, general: undefined }));
  };

  const validate = (): boolean => {
    const e: FormReasignarFullErrors = {};
    const nuevoCorreo = normEmail(state.resolutor?.email ?? state.resolutor?.value);

    if (isCerrado) e.general = "No se puede reasignar un ticket cerrado.";
    if (!state.resolutor || !nuevoCorreo) e.resolutor = "Seleccione el nuevo resolutor.";
    else if (nuevoCorreo === correoActual) e.resolutor = "El ticket ya está asignado a este resolutor.";
    else if (state.Nota.length > NOTA_MAX) e.Nota = `Máximo ${NOTA_MAX} caracteres.`;

    setErrors(e);
    const first = e.general ?? e.resolutor ?? e.Nota;
    if (first) toast.error(first);
    return !first;
  };

  const handleReasignar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || !validate()) return;

    const nuevo = {
      nombre: state.resolutor!.label,
      correo: String(state.resolutor!.email ?? state.resolutor!.value).trim(),
    };
    const anterior = ticket.Nombreresolutor ?? ticket.Correoresolutor ?? null;
    const actor = account?.name ?? account?.username ?? "Sistema";
    const toastId = toast.loading(`Reasignando ticket #${ticket.ID}…`);

    setSubmitting(true);
    try {
      // 1) Reasignación directa en la BD: si esto falla, no se continúa.
      const payload: Partial<SupabaseTickets> = {
        ticket_solvi_resolutor: nuevo.nombre,
        ticket_solvi_correo_resolutor: nuevo.correo,
      };
      const updated = await Tickets.updateTicket(String(ticket.ID), payload);
      if (!updated.status) {
        throw new Error(updated.message ?? "No se pudo actualizar el resolutor del ticket.");
      }

      const ticketActualizado: Ticket = updated.data ?? {
        ...ticket,
        Nombreresolutor: nuevo.nombre,
        Correoresolutor: nuevo.correo,
      };

      // 2) Tareas secundarias: no revierten la reasignación si fallan.
      toast.loading("Ticket reasignado. Enviando notificaciones…", { id: toastId });

      const notifParams = { ticket: ticketActualizado, nuevoResolutor: nuevo, resolutorAnterior: anterior, actor, nota: "Reasignado por el jefe" };
      const [resResolutor, resSolicitante, resLog, resContador] = await Promise.allSettled([
        notifyTicketReassignedResolutor(notifParams),
        notifyTicketReassignedSolicitante(notifParams),
        Logs?.createLog({
          seguimientos_solvi_id_ticket: Number(ticket.ID),
          seguimientos_solvi_actor: actor,
          seguimientos_solvi_correo_actor: account?.username ?? "",
          seguimientos_solvi_descripcion: `${actor} reasignó el caso de ${anterior ?? "—"} a ${nuevo.nombre}. Motivo: "Reasignado por el jefe"`,
          seguimientos_solvi_tipo_de_accion: "Reasignación de caso",
          seguimientos_solvi_action_date: new Date(),
        }),
        increaseResolverCaseCount(Usuarios, nuevo.correo),
      ]);

      const fallidos: string[] = [];
      if (resResolutor.status === "rejected") fallidos.push("resolutor");
      if (resSolicitante.status === "rejected") fallidos.push("solicitante");

      if (resLog.status === "rejected") console.error("[Reasignar] Error creando log:", resLog.reason);
      if (resContador.status === "rejected") console.error("[Reasignar] Error actualizando contador:", resContador.reason);
      if (fallidos.length) console.error("[Reasignar] Error notificando:", resResolutor, resSolicitante);

      if (!fallidos.length) {
        toast.success(`Ticket #${ticket.ID} reasignado a ${nuevo.nombre}. Se notificó al resolutor y al solicitante.`, { id: toastId, duration: 5000 });
      } else {
        toast.success(`Ticket #${ticket.ID} reasignado a ${nuevo.nombre}.`, { id: toastId });
        toast(`No se pudo enviar la notificación al ${fallidos.join(" ni al ")}.`, { icon: "⚠️", duration: 7000 });
      }
      if (resLog.status === "rejected") {
        toast("No se pudo registrar la reasignación en el seguimiento.", { icon: "⚠️", duration: 6000 });
      }

      setState({ resolutor: null, Nota: "" });
      setErrors({});
      onDone?.();
    } catch (err) {
      const message = (err as Error)?.message ?? "Error inesperado reasignando el ticket.";
      console.error("[Reasignar] Error:", err);
      setErrors((prev) => ({ ...prev, general: message }));
      toast.error(`No se pudo reasignar el ticket: ${message}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    state,
    setField,
    errors,
    submitting,
    isCerrado,
    resolutores,
    loadingResolutores,
    errorResolutores,
    notaMax: NOTA_MAX,
    handleReasignar,
  };
}
