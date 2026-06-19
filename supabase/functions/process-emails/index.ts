import "@supabase/functions-js/edge-runtime.d.ts";

import type { SupabaseClient } from "@supabase/supabase-js";

import { loadConfig } from "./config.ts";
import {
  getGraphAccessToken,
  listMessageAttachments,
  listUnreadMessages,
  markMessageAsRead,
  moveMessage,
  sendAutoReply,
  sendResolverNotification,
} from "./graph.ts";
import { replaceCidSources, sanitizeHtml } from "./html.ts";
import {
  buildResolverAssignment,
  incrementTechnicianCaseCount,
  listAvailableTechnicians,
  selectTechnicianWithLowestCases,
} from "./resolvers.ts";
import {
  createAdminClient,
  uploadInlineAttachment,
  uploadRegularAttachment,
} from "./storage.ts";
import {
  createTicket,
  findExistingTicketId,
  saveTicketFiles,
} from "./tickets.ts";
import type {
  GraphAttachment,
  GraphEmailAddress,
  GraphMessage,
  IncomingEmailAttachment,
  IncomingEmailsRequest,
  IncomingEmailPayload,
  InlineAttachmentUpload,
  ProcessDetail,
  ProcessEmailsConfig,
  ProcessResult,
  RegularAttachmentUpload,
  SharePointTechnician,
  StoredFileRecord,
} from "./types.ts";

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function normalizeContentId(contentId: string): string {
  return contentId.replace(/^<|>$/g, "").trim();
}

function extractInlineAttachments(
  attachments: GraphAttachment[],
): InlineAttachmentUpload[] {
  return attachments
    .filter((attachment) =>
      attachment.isInline === true &&
      !!attachment.contentId &&
      !!attachment.contentBytes &&
      attachment.contentType?.toLowerCase().startsWith("image/")
    )
    .map((attachment) => ({
      attachmentId: attachment.id,
      filename: attachment.name || attachment.contentId || "inline-image",
      contentType: attachment.contentType || "application/octet-stream",
      contentId: normalizeContentId(attachment.contentId!),
      bytes: decodeBase64ToUint8Array(attachment.contentBytes!),
    }));
}

function extractRegularAttachments(
  attachments: GraphAttachment[],
): RegularAttachmentUpload[] {
  return attachments
    .filter((attachment) =>
      attachment.isInline !== true &&
      !!attachment.contentBytes
    )
    .map((attachment) => ({
      attachmentId: attachment.id,
      filename: attachment.name || `attachment-${attachment.id}`,
      contentType: attachment.contentType || "application/octet-stream",
      bytes: decodeBase64ToUint8Array(attachment.contentBytes!),
    }));
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function textToHtml(text: string): string {
  if (!text.trim()) {
    return "<p>(sin contenido)</p>";
  }

  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function buildStorageFolder(message: GraphMessage): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeMessageId = message.id.replace(/[^\w-]+/g, "-").slice(0, 80);
  return `tickets/${date}/${safeMessageId}`;
}

function buildSyntheticMessageId(payload: IncomingEmailPayload): string {
  const candidate = payload.messageId?.trim() ||
    payload.internetMessageId?.trim() ||
    payload.conversationId?.trim();

  if (candidate) {
    return candidate;
  }

  return `webhook-${crypto.randomUUID()}`;
}

function normalizeEmailAddress(
  value: IncomingEmailPayload["from"],
): GraphEmailAddress | undefined {
  if (!value) {
    return undefined;
  }

  const address = value.address?.trim() || value.email?.trim() || undefined;
  const name = value.name?.trim() || undefined;

  if (!address && !name) {
    return undefined;
  }

  return { address, name };
}

function buildMessageFromPayload(payload: IncomingEmailPayload): GraphMessage {
  const from = normalizeEmailAddress(payload.from);
  const sender = normalizeEmailAddress(payload.sender);

  return {
    id: buildSyntheticMessageId(payload),
    subject: payload.subject?.trim() || "Sin asunto",
    body: {
      contentType: payload.bodyType === "text" ? "text" : "html",
      content: payload.body ?? "",
    },
    bodyPreview: payload.bodyPreview ?? undefined,
    from: from ? { emailAddress: from } : undefined,
    internetMessageId: payload.internetMessageId?.trim() || undefined,
    conversationId: payload.conversationId?.trim() || undefined,
    receivedDateTime: payload.receivedDateTime?.trim() || undefined,
  };
}

function buildAttachmentsFromPayload(
  attachments: IncomingEmailAttachment[] | undefined,
): GraphAttachment[] {
  return (attachments ?? []).map((attachment, index) => ({
    id: attachment.id?.trim() || `attachment-${index + 1}`,
    name: attachment.filename?.trim() || attachment.name?.trim() ||
      `attachment-${index + 1}`,
    contentType: attachment.contentType?.trim() || "application/octet-stream",
    isInline: attachment.isInline === true,
    contentId: attachment.contentId?.trim() || undefined,
    contentBytes: attachment.contentBytes?.trim() || undefined,
  }));
}

function extractPayloadFromBody(body: unknown): IncomingEmailPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object");
  }

  const record = body as Record<string, unknown>;
  const nestedMessage = record.message;

  if (nestedMessage && typeof nestedMessage === "object") {
    const messagePayload = nestedMessage as IncomingEmailPayload;
    const topLevelAttachments = Array.isArray(record.attachments)
      ? record.attachments as IncomingEmailAttachment[]
      : undefined;

    return {
      ...messagePayload,
      attachments: messagePayload.attachments ?? topLevelAttachments,
      source: messagePayload.source ?? (
        typeof record.source === "string" ? record.source : undefined
      ),
    };
  }

  return record as IncomingEmailPayload;
}

function extractPayloadListFromBody(body: unknown): IncomingEmailPayload[] {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object");
  }

  const record = body as IncomingEmailsRequest & Record<string, unknown>;
  const listCandidate = Array.isArray(record.emails)
    ? record.emails
    : Array.isArray(record.messages)
    ? record.messages
    : null;

  if (listCandidate) {
    return listCandidate.map((payload) => ({
      ...payload,
      source: payload.source ?? (
        typeof record.source === "string" ? record.source : undefined
      ),
    }));
  }

  return [extractPayloadFromBody(body)];
}

function validateIncomingPayload(payload: IncomingEmailPayload): void {
  const hasSubject = !!payload.subject?.trim();
  const hasBody = !!payload.body?.trim();
  const hasFrom = !!payload.from?.address?.trim() || !!payload.from?.email?.trim() ||
    !!payload.sender?.address?.trim() || !!payload.sender?.email?.trim();

  if (!hasSubject && !hasBody && !hasFrom && !hasAttachments) {
    throw new Error(
      "The email payload is empty. Provide at least subject, body, sender, or attachments.",
    );
  }
}

async function runNonCriticalStep(
  label: string,
  message: GraphMessage,
  step: () => Promise<void>,
): Promise<void> {
  try {
    await step();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`process-emails ${label} warning`, {
      messageId: message.id,
      subject: message.subject,
      error: reason,
    });
  }
}

async function uploadInlineImages(
  supabase: SupabaseClient,
  config: ProcessEmailsConfig,
  storageFolder: string,
  inlineAttachments: InlineAttachmentUpload[],
): Promise<{
  storedFiles: StoredFileRecord[];
  inlineFilesByCid: Map<string, StoredFileRecord>;
}> {
  const storedFiles: StoredFileRecord[] = [];
  const inlineFilesByCid = new Map<string, StoredFileRecord>();

  for (const attachment of inlineAttachments) {
    const storedFile = await uploadInlineAttachment(
      supabase,
      config,
      storageFolder,
      attachment,
    );

    storedFiles.push(storedFile);
    inlineFilesByCid.set(attachment.contentId, storedFile);
  }

  return { storedFiles, inlineFilesByCid };
}

async function uploadRegularAttachments(
  supabase: SupabaseClient,
  config: ProcessEmailsConfig,
  storageFolder: string,
  regularAttachments: RegularAttachmentUpload[],
): Promise<StoredFileRecord[]> {
  const storedFiles: StoredFileRecord[] = [];

  for (const attachment of regularAttachments) {
    const storedFile = await uploadRegularAttachment(
      supabase,
      config,
      storageFolder,
      attachment,
    );
    storedFiles.push(storedFile);
  }

  return storedFiles;
}

async function resolveTechnician(
  accessToken: string,
  config: ProcessEmailsConfig,
  message: GraphMessage,
): Promise<SharePointTechnician> {
  try {
    const technicians = await listAvailableTechnicians(accessToken, config);
    const technician = selectTechnicianWithLowestCases(technicians);

    if (!technician) {
      const reason =
        "No valid technician found in SharePoint. Expected at least one user with Rol = 'Tecnico' and Disponibilidad = 'Disponible'.";
      console.warn("process-emails no technician available", {
        messageId: message.id,
        subject: message.subject,
        error: reason,
      });
      throw new Error(reason);
    }

    return technician;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn("process-emails technician resolution failed", {
      messageId: message.id,
      subject: message.subject,
      error: reason,
    });
    throw new Error(`Unable to assign resolver: ${reason}`);
  }
}

async function processMessage(
  supabase: SupabaseClient,
  config: ProcessEmailsConfig,
  accessToken: string,
  message: GraphMessage,
  attachments: GraphAttachment[] | null = null,
  source = "outlook_graph",
  syncMailboxState = true,
): Promise<ProcessDetail> {
  const existingTicketId = await findExistingTicketId(supabase, message);
  if (existingTicketId) {
    return {
      messageId: message.id,
      subject: message.subject,
      status: "skipped",
      reason: `Message already processed for ticket ${existingTicketId}`,
      ticketId: existingTicketId,
    };
  }

  const resolvedAttachments = attachments ??
    await listMessageAttachments(accessToken, config, message.id);
  const inlineAttachments = extractInlineAttachments(resolvedAttachments);
  const regularAttachments = extractRegularAttachments(resolvedAttachments);
  const storageFolder = buildStorageFolder(message);
  const { storedFiles, inlineFilesByCid } = await uploadInlineImages(
    supabase,
    config,
    storageFolder,
    inlineAttachments,
  );
  const regularStoredFiles = await uploadRegularAttachments(
    supabase,
    config,
    storageFolder,
    regularAttachments,
  );

  const originalHtml = message.body?.contentType === "html"
    ? message.body.content
    : textToHtml(message.body?.content || message.bodyPreview || "");
  const htmlWithResolvedCid = replaceCidSources(originalHtml, inlineFilesByCid);
  const sanitizedHtml = sanitizeHtml(htmlWithResolvedCid);

  const technician = await resolveTechnician(accessToken, config, message);
  const resolver = buildResolverAssignment(technician);

  const ticket = await createTicket(
    supabase,
    message,
    sanitizedHtml,
    storageFolder,
    resolver,
    source,
  );

  await saveTicketFiles(supabase, ticket.id, [
    ...storedFiles,
    ...regularStoredFiles,
  ]);

  await runNonCriticalStep("incrementTechnicianCaseCount", message, async () => {
    await incrementTechnicianCaseCount(accessToken, config, technician);
  });

  if (resolver?.correo_resolutor) {
    await runNonCriticalStep("sendResolverNotification", message, async () => {
      await sendResolverNotification(accessToken, config, {
        resolverEmail: resolver.correo_resolutor,
        resolverName: resolver.nombre_resolutor,
        ticketId: ticket.id,
        ticketSubject: message.subject,
        requesterEmail: message.from?.emailAddress?.address ??
          message.sender?.emailAddress?.address ??
          null,
      });
    });
  }

  if (syncMailboxState && config.sendAutoReply) {
    await runNonCriticalStep("sendAutoReply", message, async () => {
      await sendAutoReply(accessToken, config, message.id, ticket.id);
    });
  }

  if (syncMailboxState) {
    await markMessageAsRead(accessToken, config, message.id);

    if (config.processedFolderId) {
      await moveMessage(accessToken, config, message.id, config.processedFolderId);
    }
  }

  return {
    messageId: message.id,
    subject: message.subject,
    status: "processed",
    ticketId: ticket.id,
    resolver: resolver?.nombre_resolutor ?? null,
  };
}

async function run(): Promise<ProcessResult> {
  const config = loadConfig();
  const supabase = createAdminClient(config);
  const accessToken = await getGraphAccessToken(config);
  const messages = await listUnreadMessages(accessToken, config);
  const result: ProcessResult = {
    ok: true,
    processed: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const message of messages) {
    try {
      const detail = await processMessage(supabase, config, accessToken, message);
      result.details.push(detail);

      if (detail.status === "processed") {
        result.processed += 1;
      } else if (detail.status === "skipped") {
        result.skipped += 1;
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      console.error("process-emails message failed", {
        messageId: message.id,
        subject: message.subject,
        error: reason,
      });

      result.ok = false;
      result.failed += 1;
      result.details.push({
        messageId: message.id,
        subject: message.subject,
        status: "failed",
        reason,
      });
    }
  }

  return result;
}

Deno.serve(async (request) => {
  if (request.method !== "POST" && request.method !== "GET") {
    return Response.json(
      { ok: false, error: "Method not allowed" },
      { status: 405 },
    );
  }

  if (request.method === "GET") {
    return Response.json({
      ok: true,
      mode: "http-endpoint",
      message:
        "Use POST to send one email or a list in { emails: [...] } / { messages: [...] }. Optional body { mode: 'sync-mailbox' } keeps the legacy mailbox sync.",
    });
  }

  try {
    const body = await request.json().catch(() => ({}));

    if (
      body &&
      typeof body === "object" &&
      "mode" in body &&
      (body as Record<string, unknown>).mode === "sync-mailbox"
    ) {
      const result = await run();
      return Response.json(result, {
        status: result.ok ? 200 : 207,
      });
    }

    const config = loadConfig();
    const supabase = createAdminClient(config);
    const accessToken = await getGraphAccessToken(config);
    const payloads = extractPayloadListFromBody(body);
    const result: ProcessResult = {
      ok: true,
      processed: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };

    for (const payload of payloads) {
      try {
        validateIncomingPayload(payload);
        const message = buildMessageFromPayload(payload);
        const attachments = buildAttachmentsFromPayload(payload.attachments);
        const detail = await processMessage(
          supabase,
          config,
          accessToken,
          message,
          attachments,
          payload.source?.trim() || "Correo",
          false,
        );

        result.details.push(detail);

        if (detail.status === "processed") {
          result.processed += 1;
        } else if (detail.status === "skipped") {
          result.skipped += 1;
        } else {
          result.failed += 1;
          result.ok = false;
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        result.ok = false;
        result.failed += 1;
        result.details.push({
          messageId: buildSyntheticMessageId(payload),
          subject: payload.subject,
          status: "failed",
          reason,
        });
      }
    }

    return Response.json(result, {
      status: result.ok ? 200 : 207,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    console.error("process-emails execution failed", { error: reason });

    return Response.json(
      {
        ok: false,
        processed: 0,
        skipped: 0,
        failed: 0,
        details: [],
        error: reason,
      },
      { status: 500 },
    );
  }
});
