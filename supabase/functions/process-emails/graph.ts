import type {
  GraphAttachment,
  GraphListResponse,
  GraphMessage,
  GraphTokenResponse,
  ProcessEmailsConfig,
  SharePointListItem,
} from "./types.ts";

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

function toSafeText(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  return fallback;
}

function escapeHtml(value: unknown): string {
  return toSafeText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildCaseNotificationHtml(params: {
  greetingName: string;
  intro: string;
  ticketId?: string | number | null;
  requesterEmail?: string | null;
  resolverName?: string | null;
  ticketSubject?: string;
  closing: string;
}): string {
  const safeTicketId = toSafeText(params.ticketId, "Sin ID");
  const requesterLine = params.requesterEmail?.trim()
    ? `<p><strong>Solicitante:</strong> ${escapeHtml(params.requesterEmail.trim())}</p>`
    : "";
  const resolverLine = params.resolverName?.trim()
    ? `<p><strong>Resolutor asignado:</strong> ${escapeHtml(params.resolverName.trim())}</p>`
    : "";
  const subjectLine = params.ticketSubject?.trim()
    ? `<p><strong>Asunto:</strong> ${escapeHtml(params.ticketSubject.trim())}</p>`
    : "";

  return `
    <div style="max-width: 620px; margin: 0 auto; font-family: Arial, sans-serif; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #84CC16; color: #ffffff; padding: 18px 24px;">
        <h2 style="margin: 0; font-size: 20px;">Solicitud registrada</h2>
      </div>
      <div style="padding: 24px; color: #374151;">
        <p style="margin-top: 0;">Hola ${escapeHtml(params.greetingName)},</p>
        <p>${escapeHtml(params.intro)}</p>
        <div style="background: #F7FEE7; border-left: 5px solid #84CC16; border-radius: 8px; padding: 16px; margin-top: 16px;">
          <p><strong>ID del Caso:</strong> ${escapeHtml(safeTicketId)}</p>
          ${subjectLine}
          ${requesterLine}
          ${resolverLine}
        </div>
        <p style="margin-top: 20px; margin-bottom: 0;">${escapeHtml(params.closing)}</p>
      </div>
    </div>
  `;
}

async function graphFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Graph request failed (${response.status}) ${path}: ${errorText}`);
  }

  if (response.status === 202 || response.status === 204) {
    return undefined as T;
  }

  return await response.json() as T;
}

export async function getGraphAccessToken(
  config: ProcessEmailsConfig,
): Promise<string> {
  const tokenUrl =
    `https://login.microsoftonline.com/${config.msTenantId}/oauth2/v2.0/token`;

  const response = await fetch(tokenUrl, {
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
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Unable to obtain Graph token (${response.status}): ${errorText}`,
    );
  }

  const payload = await response.json() as GraphTokenResponse;
  if (!payload.access_token) {
    throw new Error("Graph token response did not include access_token");
  }

  return payload.access_token;
}

export async function listUnreadMessages(
  accessToken: string,
  config: ProcessEmailsConfig,
): Promise<GraphMessage[]> {
  const select = [
    "id",
    "subject",
    "body",
    "bodyPreview",
    "from",
    "sender",
    "internetMessageId",
    "conversationId",
    "isRead",
    "receivedDateTime",
  ].join(",");

  const query = new URLSearchParams({
    "$top": String(config.maxMessages),
    "$filter": "isRead eq false",
    "$orderby": "receivedDateTime asc",
    "$select": select,
  });

  const folderPath = config.sourceFolderId
    ? `/users/${encodeURIComponent(config.mailboxUser)}/mailFolders/${
      encodeURIComponent(config.sourceFolderId)
    }/messages`
    : `/users/${encodeURIComponent(config.mailboxUser)}/mailFolders/inbox/messages`;

  const response = await graphFetch<GraphListResponse<GraphMessage>>(
    accessToken,
    `${folderPath}?${query.toString()}`,
  );

  return response.value ?? [];
}

export async function listMessageAttachments(
  accessToken: string,
  config: ProcessEmailsConfig,
  messageId: string,
): Promise<GraphAttachment[]> {
  const query = new URLSearchParams({
    "$top": "100",
    "$select":
      "id,name,contentType,size,isInline,contentId,contentBytes,@odata.type",
  });

  const response = await graphFetch<GraphListResponse<GraphAttachment>>(
    accessToken,
    `/users/${encodeURIComponent(config.mailboxUser)}/messages/${
      encodeURIComponent(messageId)
    }/attachments?${query.toString()}`,
  );

  return response.value ?? [];
}

export async function markMessageAsRead(
  accessToken: string,
  config: ProcessEmailsConfig,
  messageId: string,
): Promise<void> {
  await graphFetch<void>(
    accessToken,
    `/users/${encodeURIComponent(config.mailboxUser)}/messages/${
      encodeURIComponent(messageId)
    }`,
    {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    },
  );
}

export async function moveMessage(
  accessToken: string,
  config: ProcessEmailsConfig,
  messageId: string,
  destinationFolderId: string,
): Promise<void> {
  await graphFetch<void>(
    accessToken,
    `/users/${encodeURIComponent(config.mailboxUser)}/messages/${
      encodeURIComponent(messageId)
    }/move`,
    {
      method: "POST",
      body: JSON.stringify({ destinationId: destinationFolderId }),
    },
  );
}

export async function sendAutoReply(
  accessToken: string,
  config: ProcessEmailsConfig,
  messageId: string,
  ticketId: string,
): Promise<void> {
  await graphFetch<void>(
    accessToken,
    `/users/listo@estudiodemoda.com.co/messages/${
      encodeURIComponent(messageId)
    }/reply`,
    {
      method: "POST",
      body: JSON.stringify({
        comment: `Tu solicitud fue registrada con el ticket ${ticketId}.`,
      }),
    },
  );
}

export async function sendCaseCreationReply(
  accessToken: string,
  config: ProcessEmailsConfig,
  params: {
    messageId: string;
    ticketId: string;
    requesterName?: string | null;
    requesterEmail?: string | null;
    resolverName?: string | null;
    ticketSubject?: string;
  },
): Promise<void> {
  const draft = await graphFetch<{ id: string }>(
    accessToken,
    `/users/listo@estudiodemoda.com.co/messages/${
      encodeURIComponent(params.messageId)
    }/createReply`,
    {
      method: "POST",
    },
  );

  const html = buildCaseNotificationHtml({
    greetingName: params.requesterName?.trim() || "equipo",
    intro: "Tu solicitud ha sido registrada exitosamente y ya fue asignada para su gestión.",
    ticketId: params.ticketId,
    requesterEmail: params.requesterEmail ?? null,
    resolverName: params.resolverName ?? null,
    ticketSubject: params.ticketSubject,
    closing: "Te estaremos notificando cualquier novedad sobre el caso.",
  });

  await graphFetch<void>(
    accessToken,
    `/users/listo@estudiodemoda.com.co/messages/${
      encodeURIComponent(draft.id)
    }`,
    {
      method: "PATCH",
      body: JSON.stringify({
        body: {
          contentType: "HTML",
          content: html,
        },
      }),
    },
  );

  await graphFetch<void>(
    accessToken,
    `/users/listo@estudiodemoda.com.co/messages/${
      encodeURIComponent(draft.id)
    }/send`,
    {
      method: "POST",
    },
  );
}

export async function sendResolverNotification(
  accessToken: string,
  config: ProcessEmailsConfig,
  params: {
    resolverEmail: string;
    resolverName?: string | null;
    ticketId?: string | number | null;
    ticketSubject?: string;
    requesterEmail?: string | null;
  },
): Promise<void> {
  const safeResolverEmail = params.resolverEmail.trim();
  const safeTicketId = toSafeText(params.ticketId, "Sin ID");
  if (!safeResolverEmail) {
    throw new Error("Resolver email is required to send notification");
  }

  const html = buildCaseNotificationHtml({
    greetingName: params.resolverName?.trim() || "equipo",
    intro: "Se te asignó un nuevo caso para su gestión.",
    ticketId: safeTicketId,
    requesterEmail: params.requesterEmail ?? null,
    resolverName: params.resolverName ?? null,
    ticketSubject: params.ticketSubject,
    closing: "Inicia la gestión lo más rápido posible.",
  });

  await graphFetch<void>(
    accessToken,
    `/users/listo@estudiodemoda.com.co/sendMail`,
    {
      method: "POST",
      body: JSON.stringify({
        message: {
          subject: `Nuevo caso asignado - ${safeTicketId}`,
          body: {
            contentType: "HTML",
            content: html,
          },
          toRecipients: [
            {
              emailAddress: {
                address: safeResolverEmail,
              },
            },
          ],
        },
        saveToSentItems: true,
      }),
    },
  );
}

export async function listSharePointUsers(
  accessToken: string,
  config: ProcessEmailsConfig,
): Promise<SharePointListItem[]> {
  const query = new URLSearchParams({
    "$expand": "fields",
    "$top": "200",
  });

  const response = await graphFetch<GraphListResponse<SharePointListItem>>(
    accessToken,
    `/sites/${encodeURIComponent(config.sharepointSiteId)}/lists/${
      encodeURIComponent(config.sharepointUsersListId)
    }/items?${query.toString()}`,
  );

  return response.value ?? [];
}

export async function updateSharePointUserFields(
  accessToken: string,
  config: ProcessEmailsConfig,
  itemId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  await graphFetch<void>(
    accessToken,
    `/sites/${encodeURIComponent(config.sharepointSiteId)}/lists/${
      encodeURIComponent(config.sharepointUsersListId)
    }/items/${encodeURIComponent(itemId)}/fields`,
    {
      method: "PATCH",
      body: JSON.stringify(fields),
    },
  );
}
