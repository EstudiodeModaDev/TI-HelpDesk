import type { GraphRecipient, GraphSendMailPayload } from "../../../graph/GraphRest";
import type { Ticket } from "../../../Models/Tickets";
import { toISODateTimeFlex } from "../../../utils/Date";

type MailProps = {
  payload: GraphSendMailPayload;
  senderMail: string;
};

export async function sendMail({ payload, senderMail }: MailProps) {
  const sended = await fetch(
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

  console.log(sended);
  return sended;
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
