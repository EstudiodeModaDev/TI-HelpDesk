import * as React from "react";
import { useRepositories } from "../../repositories/repositoriesContext";
import { useAuth } from "../../auth/authContext";
import type { prestamos } from "../../Models/prestamos";
import type { EstadoActivo } from "../../Models/ActivosTIMovimientos";
import type { FlowToUser } from "../../Models/FlujosPA";
import { useGraphServices } from "../../graph/GrapServicesContext";
import { FlowClient } from "../shared/FlowClient";
import { PRESTAMOS_FLOW_URL } from "../loans/prestamos";
import { toISODateTimeFlex } from "../../utils/Date";
import { escapeHTML } from "../../utils/Text";

export function useActivoPrestamo() {
  const { activosTI, movimientosTI, activotickets, tickets, logs } =
    useRepositories();
  const { prestamos: prestamosSvc } = useGraphServices();
  const { account } = useAuth();

  // Al iniciar un préstamo: el activo prestado pasa a "en_prestamo" y queda en la bitacora.

  const iniciarPrestamoActivo = React.useCallback(
    async (prestamo: prestamos, comentario?: string): Promise<boolean> => {
      if (
        !prestamo.Id ||
        !prestamo.Id_dispositivo ||
        !activosTI ||
        !movimientosTI
      )
        return false;

      // Id_dispositivo ahora guarda el id del activo.
      const {
        data: activo,
        status,
        message,
      } = await activosTI.getActivoById(prestamo.Id_dispositivo);
      if (!status || !activo) {
        console.error("No se encontró el activo del préstamo:", message);
        return false;
      }

      // 1. Bitácora (guarda el estado anterior para devolverlo al cerrar)
      const mov = await movimientosTI.createMovimientos({
        activo_id: activo.id,
        estado_anterior: activo.estado,
        estado_nuevo: "en_prestamo",
        ubicacion_origen: activo.ubicacion_tipo,
        ubicacion_destino: activo.ubicacion_tipo,
        usuario_origen_nombre: activo.nombre_usuario || "",
        usuario_origen_correo: activo.correo_usuario || "",
        usuario_destino_nombre: prestamo.nombreSolicitante,
        usuario_destino_correo: prestamo.Title,
        responsable_nombre: account?.name ?? account?.username ?? "",
        responsable_correo: account?.username ?? "",
        ticket_id: prestamo.IdTicket ? String(prestamo.IdTicket) : undefined,
        comentario: comentario?.trim() || undefined,
      });
      if (!mov.status) {
        console.error(
          "No se pudo registrar el préstamo en la bitácora:",
          mov.message,
        );
        return false;
      }

      // 2. Activo: estado "en préstamo" + referencia al préstamo activo
      const upd = await activosTI.updateActivo(activo.id, {
        estado: "en_prestamo",
        prestamo_activo_id: String(prestamo.Id),
        nombre_usuario: prestamo.nombreSolicitante,
        correo_usuario: prestamo.Title,
      });
      if (!upd.status) {
        console.error("No se pudo marcar el activo en préstamo:", upd.message);
        return false;
      }
      if (prestamo.IdTicket && activotickets) {
        const link = await activotickets.createActivoTicket({
          activo_id: activo.id,
          ticket_id: Number(prestamo.IdTicket),
          vinculado_por_nombre: account?.name ?? account?.username ?? "",
        });
        if (!link.status) {
          console.error(
            "No se pudo vincular el ticket al activo:",
            link.message,
          );
        }
      }

      return true;
    },
    [activosTI, movimientosTI, activotickets, account?.name, account?.username],
  );

  // Al devolver: el activo vuelve a su estado anterior y queda en la bitácora.
  // Devuelve true si el activo quedó actualizado.
  const finalizarPrestamoActivo = React.useCallback(
    async (prestamo: prestamos, comentario?: string): Promise<boolean> => {
      if (!prestamo.Id_dispositivo || !activosTI || !movimientosTI)
        return false;
      const {
        data: activo,
        status,
        message,
      } = await activosTI.getActivoById(prestamo.Id_dispositivo);
      if (!status || !activo) {
        console.error("No se encontró el activo del préstamo:", message);
        return false;
      }
      if (activo.estado !== "en_prestamo") return false;
      const ultimo = await movimientosTI.loadMovimientos({
        activo_id: activo.id,
        estado_nuevo: "en_prestamo",
        paginated: true,
        pageSize: 1,
        sortField: "fecha_evento",
        sortDir: "desc",
      });
      const estadoAnterior =
        (ultimo.data[0]?.estado_anterior as EstadoActivo | undefined) ??
        "Disponible";
      const usuarioAnteriorNombre = ultimo.data[0]?.usuario_origen_nombre ?? "";
      const usuarioAnteriorCorreo = ultimo.data[0]?.usuario_origen_correo ?? "";

      // 1. Bitácora
      const mov = await movimientosTI.createMovimientos({
        activo_id: activo.id,
        estado_anterior: "en_prestamo",
        estado_nuevo: estadoAnterior,
        ubicacion_origen: activo.ubicacion_tipo,
        ubicacion_destino: activo.ubicacion_tipo,
        usuario_origen_nombre: prestamo.nombreSolicitante,
        usuario_origen_correo: prestamo.Title,
        usuario_destino_nombre: usuarioAnteriorNombre,
        usuario_destino_correo: usuarioAnteriorCorreo,
        responsable_nombre: account?.name ?? account?.username ?? "",
        responsable_correo: account?.username ?? "",
        ticket_id: prestamo.IdTicket ? String(prestamo.IdTicket) : undefined,
        comentario: comentario?.trim() || undefined,
      });
      if (!mov.status) {
        console.error(
          "No se pudo registrar la devolución en la bitácora:",
          mov.message,
        );
        return false;
      }

      // 2. Activo: vuelve a su estado y deja de apuntar al préstamo
      const upd = await activosTI.updateActivo(activo.id, {
        estado: estadoAnterior,
        prestamo_activo_id: null,
        nombre_usuario: usuarioAnteriorNombre,
        correo_usuario: usuarioAnteriorCorreo,
      });
      if (!upd.status) {
        console.error(
          "No se pudo actualizar el activo al devolverlo:",
          upd.message,
        );
        return false;
      }
      return true;
    },
    [activosTI, movimientosTI, account?.name, account?.username],
  );

  // Devolución completa desde la ficha (sin pruebas):
  // cierra el préstamo y su ticket, deja el seguimiento, devuelve el activo
  // a su estado anterior y avisa al usuario por correo.
  const devolverPrestamoActivo = React.useCallback(
    async (
      prestamo: prestamos,
      buenEstado: boolean,
      comentario?: string,
    ): Promise<boolean> => {
      if (!prestamo.Id || !prestamosSvc) return false;
      const estadoDevolucion = buenEstado ? "Buen estado" : "Mal estado";
      const ahora = toISODateTimeFlex(new Date());

      try {
        // 1. Préstamo cerrado (lista de SharePoint)
        await prestamosSvc.update(prestamo.Id, {
          Estado: "Cerrado",
          FechaDevolucion: ahora,
          UsuarioRecibe: account?.name ?? "",
        });

        // 2. Ticket del préstamo cerrado + seguimiento
        if (prestamo.IdTicket) {
          await tickets?.updateTicket(prestamo.IdTicket, {
            Estadodesolicitud: "Cerrado",
            FechaMaxima: ahora,
          });
          await logs?.createLog({
            seguimientos_solvi_actor: "Sistema",
            seguimientos_solvi_descripcion: `
              Se ha cerrado el ticket ${escapeHTML(prestamo.IdTicket)} asociado al préstamo de equipo.<br><br>
              <strong>El equipo fue recibido por:</strong> ${escapeHTML(account?.name ?? "")}<br>
              <strong>Estado de devolución:</strong> ${estadoDevolucion}
              ${comentario?.trim() ? `<br><strong>Comentario:</strong> ${escapeHTML(comentario.trim())}` : ""}
            `.trim(),
            seguimientos_solvi_tipo_de_accion: "Cierre",
            seguimientos_solvi_id_ticket: Number(prestamo.IdTicket),
            seguimientos_solvi_correo_actor: "",
            seguimientos_solvi_action_date: new Date(),
          });
        }
      } catch (err) {
        console.error("Error cerrando el préstamo:", err);
        return false;
      }

      // 3. Activo: vuelve a su estado anterior + bitácora
      const ok = await finalizarPrestamoActivo(prestamo, comentario);
      if (!ok) return false;

      // 4. Correo al usuario (si falla no bloquea la devolución)
      new FlowClient(PRESTAMOS_FLOW_URL)
        .invoke<FlowToUser, unknown>({
          recipient: prestamo.Title,
          title: "Notificación de prestamo",
          message: `
            <p>
              ¡Hola ${escapeHTML(prestamo.nombreSolicitante ?? "")}!<br><br>
              Hemos registrado la devolución del equipo que tenías en préstamo.<br><br>
              <strong>Estado de devolución:</strong> ${estadoDevolucion}<br><br>
              ${
                buenEstado
                  ? "Gracias por devolver el dispositivo en buen estado."
                  : "El dispositivo no fue devuelto en buen estado. Nos pondremos en contacto contigo para informarte los próximos pasos."
              }<br><br>
              Este es un mensaje automático, por favor no respondas.
            </p>`.trim(),
          mail: true,
        })
        .catch((err) => console.error("Error notificando la devolución:", err));

      return true;
    },
    [prestamosSvc, tickets, logs, account?.name, finalizarPrestamoActivo],
  );

  return {
    iniciarPrestamoActivo,
    finalizarPrestamoActivo,
    devolverPrestamoActivo,
  };
}
