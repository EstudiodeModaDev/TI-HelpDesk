import type { GraphRecipient, GraphSendMailPayload } from "../../../graph/GraphRest";
import type { Ticket } from "../../../Models/Tickets";
import { toISODateTimeFlex } from "../../../utils/Date";

type MailProps = {
  payload: GraphSendMailPayload;
  senderMail: string;
};

export async function sendMail({ payload, senderMail }: MailProps) {
  const response = await fetch(
    "https://api-envio-correos-bchfaebqdhfcbdgw.canadacentral-01.azurewebsites.net/mail/send",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderMail,
        ...payload,
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `sendMail failed with ${response.status} ${response.statusText}${detail ? `: ${detail}` : ""}`,
    );
  }

  return response;
}

type ConversationCommentNotificationParams = {
  ticket: Pick<Ticket, "ID" | "AsuntoTicket">;
  authorName: string;
  authorEmail?: string | null;
  commentText: string;
  recipients: string[];
};

type MentionNotificationParams = {
  ticket: Pick<Ticket, "ID" | "AsuntoTicket">;
  authorName: string;
  authorEmail?: string | null;
  commentText: string;
  recipients: string[];
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeEmails(emails: readonly string[]): string[] {
  return [...new Set(
    emails
      .map((email) => String(email ?? "").trim().toLowerCase())
      .filter(Boolean),
  )];
}

function buildRecipients(emails: readonly string[]): GraphRecipient[] {
  return normalizeEmails(emails).map((address) => ({
    emailAddress: { address },
  }));
}

function buildCommentSnippet(commentText: string): string {
  const trimmed = String(commentText ?? "").trim();
  const compact = trimmed.replace(/\s+/g, " ");
  const shortened = compact.length > 500 ? `${compact.slice(0, 497)}...` : compact;
  return escapeHtml(shortened || "Sin contenido");
}

function buildTicketUrl(ticketId: string | number | undefined): string {
  const baseUrl = "https://prisma.estudiodemoda.co/integracion/solvi/tickets";
  const safeTicketId = String(ticketId ?? "").trim();

  if (!safeTicketId) {
    return baseUrl;
  }

  return `${baseUrl}/${encodeURIComponent(safeTicketId)}`;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));

  if (totalMinutes < 60) {
    return `${totalMinutes} ${totalMinutes === 1 ? "minuto" : "minutos"}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hoursLabel = `${hours} ${hours === 1 ? "hora" : "horas"}`;

  if (minutes === 0) {
    return hoursLabel;
  }

  return `${hoursLabel} y ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}

function buildOpenTicketButton(ticketId: string | number | undefined): string {
  const ticketUrl = buildTicketUrl(ticketId);
  return `
    <div style="margin-top:18px;">
      <a
        href="${escapeHtml(ticketUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        style="display:inline-block;padding:12px 18px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;"
      >
        Ver ticket en Prisma
      </a>
    </div>
  `.trim();
}

export async function notifyConversationComment(
  params: ConversationCommentNotificationParams,
): Promise<void> {
  const to = buildRecipients(params.recipients);

  if (!to.length) {
    return;
  }

  const subject = `Nuevo comentario en el ticket ${params.ticket.ID}`;
  const body = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;">
      <p>Hola,</p>
      <p>Se agrego un nuevo comentario en el ticket <strong>${escapeHtml(String(params.ticket.ID ?? "-"))}</strong>.</p>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#f9fafb;">
        <p style="margin:0 0 8px 0;"><strong>Ticket:</strong> ${escapeHtml(String(params.ticket.AsuntoTicket ?? "Sin asunto"))}</p>
        <p style="margin:0 0 8px 0;"><strong>Autor:</strong> ${escapeHtml(params.authorName)}${params.authorEmail ? ` (${escapeHtml(params.authorEmail)})` : ""}</p>
        <p style="margin:0;"><strong>Comentario:</strong><br>${buildCommentSnippet(params.commentText)}</p>
      </div>
      ${buildOpenTicketButton(params.ticket.ID)}
      <p style="margin-top:16px;">Este es un mensaje automatico, por favor no respondas.</p>
    </div>
  `.trim();

  await sendMail({
    payload: {
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: to,
      },
    },
    senderMail: "listo@estudiodemoda.com.co",
  });
}

export async function notifyCommentMention(
  params: MentionNotificationParams,
): Promise<void> {
  const to = buildRecipients(params.recipients);

  if (!to.length) {
    return;
  }

  const subject = `Te mencionaron en el ticket ${params.ticket.ID}`;
  const body = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;">
      <p>Hola,</p>
      <p><strong>${escapeHtml(params.authorName)}</strong>${params.authorEmail ? ` (${escapeHtml(params.authorEmail)})` : ""} te menciono en el ticket <strong>${escapeHtml(String(params.ticket.ID ?? "-"))}</strong>.</p>
      <div style="border:1px solid #dbeafe;border-radius:12px;padding:16px;background:#eff6ff;">
        <p style="margin:0 0 8px 0;"><strong>Asunto:</strong> ${escapeHtml(String(params.ticket.AsuntoTicket ?? "Sin asunto"))}</p>
        <p style="margin:0;"><strong>Comentario:</strong><br>${buildCommentSnippet(params.commentText)}</p>
      </div>
      ${buildOpenTicketButton(params.ticket.ID)}
      <p style="margin-top:16px;">Este es un mensaje automatico, por favor no respondas.</p>
    </div>
  `.trim();

  await sendMail({
    payload: {
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: to,
      },
    },
    senderMail: "listo@estudiodemoda.com.co",
  });
}

export async function notifyTicketCreatedSolicitante(ticket: Ticket): Promise<void> {
  const body = `
    <p>¡Hola ${ticket.Solicitante ?? ""}!<br><br>
    Tu solicitud ha sido registrada exitosamente y ha sido asignada a un técnico para su gestión. Estos son los detalles del caso:<br><br>
    <strong>ID del Caso:</strong> ${ticket.ID}<br>
    <strong>Espacio fisico:</strong> ${ticket.AsuntoTicket}<br>
    <strong>Resolutor asignado:</strong> ${ticket.Correoresolutor ?? "—"}<br>
    <strong>Fecha máxima de solución:</strong> ${toISODateTimeFlex(ticket.FechaMaxima) ?? "No aplica"}<br><br>
    El resolutor asignado se pondrá en contacto contigo en el menor tiempo posible para darte solución a tu requerimiento.<br><br>
    Este es un mensaje automático, por favor no respondas.
    </p>
  `.trim();

  const address = (ticket.CorreoSolicitante ?? "").trim();

  if (!address) {
    throw new Error("notifyTicketCreatedSolicitante: correo del solicitante inválido");
  }

  const to: GraphRecipient[] = [
    {
      emailAddress: { address },
    },
  ];

  await sendMail({
    payload: {
      message: {
        subject: `Asignación de Caso - ${ticket.ID}`,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: to,
      },
    },
    senderMail: "listo@estudiodemoda.com.co",
  });
}

export async function notifyTicketCreatedResolutor(ticket: Ticket): Promise<void> {
  const body = `
    <p>¡Hola!<br><br>
    Tienes un nuevo caso asignado con estos detalles:<br><br>
    <strong>ID del Caso:</strong> ${ticket.ID}<br>
    <strong>Solicitante:</strong> ${ticket.Solicitante ?? "—"}<br>
    <strong>Correo del Solicitante:</strong> ${ticket.CorreoSolicitante ?? "—"}<br>
    <strong>Asunto:</strong> ${ticket.AsuntoTicket}<br>
    <strong>Fecha máxima de solución:</strong> ${ticket.FechaMaxima}<br><br>
    Por favor, contacta al usuario para brindarle solución.<br><br>
    Este es un mensaje automático, por favor no respondas.
    </p>
  `.trim();

  if (!ticket.Correoresolutor) {
    throw new Error("notifyTicketCreatedResolutor: correo del resolutor inválido");
  }

  const to: GraphRecipient[] = [
    {
      emailAddress: { address: ticket.Correoresolutor },
    },
  ];

  await sendMail({
    payload: {
      message: {
        subject: `Nuevo caso asignado - ${ticket.ID}`,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: to,
      },
    },
    senderMail: "listo@estudiodemoda.com.co",
  });
}

export async function notifyClosedSolicitante(ticket: Ticket, detalleSolucion: string): Promise<void> {
  const body = `
    <p>Este es un mensaje automático.</p>

    <p>
      Estimado/a ${ticket.Solicitante},<br><br>
      Nos complace informarle que su caso "${ticket.AsuntoTicket}" (ID: ${ticket.ID}) ha sido cerrado.
      Esperamos que su problema haya sido resuelto satisfactoriamente.
    </p>

    <p>
      El resolutor ha brindaddo la siguiente solución:
    </p>

    ${detalleSolucion ? `<hr><div>${detalleSolucion}</div>` : ""}

    <p>Gracias por su colaboración y confianza.</p>
  `.trim();

  const address = (ticket.CorreoSolicitante ?? "").trim();

  if (!address) {
    throw new Error("notifyClosedSolicitante: correo del solicitante inválido");
  }

  const to: GraphRecipient[] = [
    {
      emailAddress: { address },
    },
  ];

  await sendMail({
    payload: {
      message: {
        subject: `Cierre de Ticket - ${ticket.ID}`,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: to,
      },
    },
    senderMail: "listo@estudiodemoda.com.co",
  });
}

export async function notifySolicitanteCategoryChange(
  prevTicket: Ticket,
  newCategoria: { Categoria: string; SubCategoria: string; Articulo: string }
): Promise<void> {
  const address = prevTicket.CorreoSolicitante?.toLowerCase();
  const title = `Actualización del caso - ${prevTicket.ID}`;
  const body = `
    <p>
      ¡Hola ${prevTicket.Solicitante ?? ""}!<br><br>
      Te informamos que tu caso ha sido <strong>actualizado de categoría</strong>. A continuación, los detalles:<br><br>
      <strong>ID del Caso:</strong> ${prevTicket.ID}<br>
      <strong>Asunto del caso:</strong> ${prevTicket.AsuntoTicket ?? "—"}<br>
      <strong>Categoría anterior:</strong> ${prevTicket.Categoria ?? "—"} > ${prevTicket.SubCategoria ?? "—"} > ${prevTicket.Articulo ?? "—"}<br>
      <strong>Nueva categoría:</strong> ${newCategoria.Categoria || "—"} > ${newCategoria.SubCategoria || "—"} > ${newCategoria.Articulo || "—"}<br>
      <strong>ANS aplicable:</strong> ${prevTicket.ANS || "—"}<br>
      <strong>Nueva fecha máxima de solución:</strong> ${prevTicket.FechaMaxima}<br>
      <strong>Resolutor asignado:</strong> ${prevTicket.Nombreresolutor ?? "—"}<br><br>
      Seguimos trabajando en tu requerimiento y te mantendremos informado ante cualquier novedad.<br><br>
      Este es un mensaje automático, por favor no respondas.
    </p>
  `.trim();

  if (!address) {
    throw new Error("notifySolicitanteCategoryChange: correo del solicitante inválido");
  }

  const to: GraphRecipient[] = [
    {
      emailAddress: { address },
    },
  ];

  await sendMail({
    payload: {
      message: {
        subject: title,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: to,
      },
    },
    senderMail: "listo@estudiodemoda.com.co",
  });
}

export async function notifyTicketPausedSolicitante(ticket: Ticket, motivo: string): Promise<void> {
  const address = (ticket.CorreoSolicitante ?? "").trim();

  if (!address) {
    throw new Error("notifyTicketPausedSolicitante: correo del solicitante inválido");
  }

  const subject = `Tu ticket ${ticket.ID} ha sido pausado`;
  const body = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;">
      <p>Hola ${escapeHtml(ticket.Solicitante ?? "")},</p>
      <p>Te informamos que tu caso ha sido <strong>puesto en pausa</strong> mientras se gestiona. El tiempo que dure la pausa no se contará dentro del tiempo de solución del caso.</p>
      <div style="border:1px solid #fde68a;border-radius:12px;padding:16px;background:#fffbeb;">
        <p style="margin:0 0 8px 0;"><strong>ID del Caso:</strong> ${escapeHtml(String(ticket.ID ?? "-"))}</p>
        <p style="margin:0 0 8px 0;"><strong>Asunto:</strong> ${escapeHtml(String(ticket.AsuntoTicket ?? "Sin asunto"))}</p>
        <p style="margin:0;"><strong>Motivo de la pausa:</strong><br>${motivo || "Sin detalle"}</p>
      </div>
      ${buildOpenTicketButton(ticket.ID)}
      <p style="margin-top:16px;">Te avisaremos apenas el caso se reanude. Este es un mensaje automático, por favor no respondas.</p>
    </div>
  `.trim();

  const to: GraphRecipient[] = [
    {
      emailAddress: { address },
    },
  ];

  await sendMail({
    payload: {
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: to,
      },
    },
    senderMail: "listo@estudiodemoda.com.co",
  });
}

export async function notifyTicketResumedSolicitante(
  ticket: Ticket,
  tiempoPausadoMs: number,
  nuevaFechaMaxima?: string | null,
): Promise<void> {
  const address = (ticket.CorreoSolicitante ?? "").trim();

  if (!address) {
    throw new Error("notifyTicketResumedSolicitante: correo del solicitante inválido");
  }

  const tiempoTexto = formatDuration(tiempoPausadoMs);
  const fechaMaximaTexto = toISODateTimeFlex(nuevaFechaMaxima ?? ticket.FechaMaxima) || "—";

  const subject = `Tu ticket ${ticket.ID} se ha reanudado`;
  const body = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;">
      <p>Hola ${escapeHtml(ticket.Solicitante ?? "")},</p>
      <p>Te informamos que tu caso se ha <strong>reanudado</strong> y ya está siendo atendido nuevamente.</p>
      <div style="border:1px solid #bbf7d0;border-radius:12px;padding:16px;background:#f0fdf4;">
        <p style="margin:0 0 8px 0;"><strong>ID del Caso:</strong> ${escapeHtml(String(ticket.ID ?? "-"))}</p>
        <p style="margin:0 0 8px 0;"><strong>Asunto:</strong> ${escapeHtml(String(ticket.AsuntoTicket ?? "Sin asunto"))}</p>
        <p style="margin:0 0 8px 0;"><strong>Tiempo que estuvo en pausa:</strong> ${tiempoTexto}</p>
        <p style="margin:0;"><strong>Nueva fecha máxima de solución:</strong> ${fechaMaximaTexto}</p>
      </div>
      <p style="margin-top:12px;">Como el caso estuvo en pausa, se sumaron <strong>${tiempoTexto}</strong> al tiempo máximo de solución, para compensar el tiempo que estuvo detenido.</p>
      ${buildOpenTicketButton(ticket.ID)}
      <p style="margin-top:16px;">Este es un mensaje automático, por favor no respondas.</p>
    </div>
  `.trim();

  const to: GraphRecipient[] = [
    {
      emailAddress: { address },
    },
  ];

  await sendMail({
    payload: {
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: to,
      },
    },
    senderMail: "listo@estudiodemoda.com.co",
  });
}

type ReassignmentNotificationParams = {
  ticket: Ticket;
  nuevoResolutor: { nombre: string; correo: string };
  resolutorAnterior?: string | null;
  actor: string;
  nota: string;
};

export async function notifyTicketReassignedResolutor(params: ReassignmentNotificationParams): Promise<void> {
  const { ticket, nuevoResolutor, resolutorAnterior, actor, nota } = params;
  const address = nuevoResolutor.correo.trim();

  if (!address) {
    throw new Error("notifyTicketReassignedResolutor: correo del resolutor inválido");
  }

  const subject = `Se te reasignó el caso ${ticket.ID}`;
  const body = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;">
      <p>Hola ${escapeHtml(nuevoResolutor.nombre)},</p>
      <p><strong>${escapeHtml(actor)}</strong> te ha reasignado el siguiente caso:</p>
      <div style="border:1px solid #dbeafe;border-radius:12px;padding:16px;background:#eff6ff;">
        <p style="margin:0 0 8px 0;"><strong>ID del Caso:</strong> ${escapeHtml(String(ticket.ID ?? "-"))}</p>
        <p style="margin:0 0 8px 0;"><strong>Asunto:</strong> ${escapeHtml(String(ticket.AsuntoTicket ?? "Sin asunto"))}</p>
        <p style="margin:0 0 8px 0;"><strong>Solicitante:</strong> ${escapeHtml(ticket.Solicitante ?? "—")}${ticket.CorreoSolicitante ? ` (${escapeHtml(ticket.CorreoSolicitante)})` : ""}</p>
        <p style="margin:0 0 8px 0;"><strong>Resolutor anterior:</strong> ${escapeHtml(resolutorAnterior || "—")}</p>
        <p style="margin:0 0 8px 0;"><strong>Fecha máxima de solución:</strong> ${toISODateTimeFlex(ticket.FechaMaxima) || "No aplica"}</p>
        <p style="margin:0;"><strong>Motivo de la reasignación:</strong><br>${buildCommentSnippet(nota)}</p>
      </div>
      ${buildOpenTicketButton(ticket.ID)}
      <p style="margin-top:16px;">Por favor, contacta al solicitante para continuar con la gestión. Este es un mensaje automático, por favor no respondas.</p>
    </div>
  `.trim();

  await sendMail({
    payload: {
      message: {
        subject,
        body: { contentType: "HTML", content: body },
        toRecipients: buildRecipients([address]),
      },
    },
    senderMail: "listo@estudiodemoda.com.co",
  });
}

export async function notifyTicketReassignedSolicitante(params: ReassignmentNotificationParams): Promise<void> {
  const { ticket, nuevoResolutor } = params;
  const address = (ticket.CorreoSolicitante ?? "").trim();

  if (!address) {
    throw new Error("notifyTicketReassignedSolicitante: correo del solicitante inválido");
  }

  const subject = `Tu caso ${ticket.ID} tiene un nuevo resolutor`;
  const body = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;">
      <p>Hola ${escapeHtml(ticket.Solicitante ?? "")},</p>
      <p>Te informamos que tu caso ha sido <strong>reasignado</strong> a un nuevo resolutor, quien continuará con su gestión.</p>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#f9fafb;">
        <p style="margin:0 0 8px 0;"><strong>ID del Caso:</strong> ${escapeHtml(String(ticket.ID ?? "-"))}</p>
        <p style="margin:0 0 8px 0;"><strong>Asunto:</strong> ${escapeHtml(String(ticket.AsuntoTicket ?? "Sin asunto"))}</p>
        <p style="margin:0 0 8px 0;"><strong>Nuevo resolutor:</strong> ${escapeHtml(nuevoResolutor.nombre)} (${escapeHtml(nuevoResolutor.correo)})</p>
        <p style="margin:0;"><strong>Fecha máxima de solución:</strong> ${toISODateTimeFlex(ticket.FechaMaxima) || "No aplica"}</p>
      </div>
      ${buildOpenTicketButton(ticket.ID)}
      <p style="margin-top:16px;">El resolutor se pondrá en contacto contigo en el menor tiempo posible. Este es un mensaje automático, por favor no respondas.</p>
    </div>
  `.trim();

  await sendMail({
    payload: {
      message: {
        subject,
        body: { contentType: "HTML", content: body },
        toRecipients: buildRecipients([address]),
      },
    },
    senderMail: "listo@estudiodemoda.com.co",
  });
}
