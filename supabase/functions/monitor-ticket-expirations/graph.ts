import type {
  GraphMailPayload,
  GraphTokenResponse,
  MonitorConfig,
  Ticket,
} from "./types.ts";
import { formatDateTimeInColombia } from "./time.ts";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildMailCard(title: string, body: string): string {
  return `
    <div style="max-width:640px;margin:0 auto;font-family:Segoe UI,Arial,sans-serif;background:#ffffff;border:1px solid #dbe3ea;border-radius:14px;overflow:hidden;color:#0f172a;">
      <div style="background:#0f766e;color:#ffffff;padding:18px 24px;">
        <h2 style="margin:0;font-size:20px;">${escapeHtml(title)}</h2>
      </div>
      <div style="padding:24px;line-height:1.6;font-size:14px;">
        ${body}
      </div>
    </div>
  `;
}

function normalizeTicketId(ticket: Ticket): string {
  return String(ticket.ticket_solvi_id);
}

function normalizeTicketTitle(ticket: Ticket): string {
  return ticket.ticket_solvi_titulo?.trim() || "Sin título";
}

function formatHoursRemaining(hoursRemaining: number): string {
  if (hoursRemaining >= 1) {
    return `${hoursRemaining.toFixed(2)} horas`;
  }

  return `${Math.round(hoursRemaining * 60)} minutos`;
}

export async function getGraphAccessToken(
  config: MonitorConfig,
): Promise<string> {
  const response = await fetch(
    `https://login.microsoftonline.com/${config.msTenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.msClientId,
        client_secret: config.msClientSecret,
        scope: config.graphScope,
        grant_type: "client_credentials",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to obtain Graph token (${response.status}): ${await response.text()}`,
    );
  }

  const payload = await response.json() as GraphTokenResponse;
  if (!payload.access_token) {
    throw new Error("Graph token response did not include access_token");
  }

  return payload.access_token;
}

export async function sendGraphMail(
  accessToken: string,
  config: MonitorConfig,
  payload: GraphMailPayload,
): Promise<void> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${
      encodeURIComponent(config.mailboxUser)
    }/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: payload.subject,
          body: {
            contentType: "HTML",
            content: payload.htmlContent,
          },
          toRecipients: [
            {
              emailAddress: {
                address: payload.to,
              },
            },
          ],
        },
        saveToSentItems: true,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Graph sendMail failed (${response.status}): ${await response.text()}`,
    );
  }
}

export async function sendExpirationEmail(
  accessToken: string,
  config: MonitorConfig,
  ticket: Ticket,
  now: Date,
  dueDate: Date,
): Promise<void> {
  const recipient = ticket.ticket_solvi_correo_resolutor?.trim();
  if (!recipient) {
    throw new Error("Ticket does not have ticket_solvi_correo_resolutor");
  }

  const subject =
    `[Ticket Vencido] Ticket #${normalizeTicketId(ticket)} fuera de tiempo`;
  const html = buildMailCard(
    "Ticket vencido",
    `
      <p>Hola,</p>
      <p>El ticket asignado ya superó su fecha máxima de solución y fue actualizado automáticamente.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>ID</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${
      escapeHtml(normalizeTicketId(ticket))
    }</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>Título</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${
      escapeHtml(normalizeTicketTitle(ticket))
    }</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>Fecha máxima</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${
      escapeHtml(formatDateTimeInColombia(dueDate))
    }</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>Fecha actual</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${
      escapeHtml(formatDateTimeInColombia(now))
    }</td></tr>
        <tr><td style="padding:8px;"><strong>Estado</strong></td><td style="padding:8px;">Fuera de tiempo</td></tr>
      </table>
      <p style="margin-top:20px;">Por favor revisa el caso cuanto antes.</p>
    `,
  );

  await sendGraphMail(accessToken, config, {
    to: recipient,
    subject,
    htmlContent: html,
  });
}

export async function sendWarningEmail(
  accessToken: string,
  config: MonitorConfig,
  ticket: Ticket,
  dueDate: Date,
  hoursRemaining: number,
): Promise<void> {
  const recipient = ticket.ticket_solvi_correo_resolutor?.trim();
  if (!recipient) {
    throw new Error("Ticket does not have ticket_solvi_correo_resolutor");
  }

  const subject = "[Alerta] Ticket próximo a vencer";
  const html = buildMailCard(
    "Ticket próximo a vencer",
    `
      <p>Hola,</p>
      <p>Este ticket está próximo a vencer y requiere atención prioritaria.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>ID</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${
      escapeHtml(normalizeTicketId(ticket))
    }</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>Título</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${
      escapeHtml(normalizeTicketTitle(ticket))
    }</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;"><strong>Tiempo restante</strong></td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">${
      escapeHtml(formatHoursRemaining(hoursRemaining))
    }</td></tr>
        <tr><td style="padding:8px;"><strong>Fecha máxima</strong></td><td style="padding:8px;">${
      escapeHtml(formatDateTimeInColombia(dueDate))
    }</td></tr>
      </table>
      <p style="margin-top:20px;">Se envía esta alerta de forma preventiva para evitar el vencimiento del caso.</p>
    `,
  );

  await sendGraphMail(accessToken, config, {
    to: recipient,
    subject,
    htmlContent: html,
  });
}
