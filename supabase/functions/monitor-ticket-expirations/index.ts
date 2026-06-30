import "@supabase/functions-js/edge-runtime.d.ts";

import { loadConfig } from "./config.ts";
import {
  getGraphAccessToken,
  sendExpirationEmail,
  sendWarningEmail,
} from "./graph.ts";
import {
  buildExpiredTracking,
  buildWarningTracking,
  createAdminClient,
  createTracking,
  EXPIRED_TRACKING_TYPE,
  fetchOpenTicketsPage,
  hasTrackingEvent,
  updateTicketStatus,
  WARNING_TRACKING_TYPE,
} from "./tickets.ts";
import {
  getCurrentColombiaTime,
  isBusinessHours,
  isHoliday,
  isWeekend,
} from "./time.ts";
import type { ExecutionSummary, Ticket } from "./types.ts";

const OUT_OF_BUSINESS_HOURS = "OUT_OF_BUSINESS_HOURS";
const WEEKEND = "WEEKEND";
const HOLIDAY = "HOLIDAY";
const EXPIRED_STATUS = "Fuera de tiempo";

function createEmptySummary(reason: string | null = null): ExecutionSummary {
  return {
    ok: true,
    processed: 0,
    expired: 0,
    warningsSent: 0,
    skipped: 0,
    errors: [],
    reason,
  };
}

function parseTicketDueDate(value: string | null): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(trimmed);
  const normalized = hasTimeZone
    ? trimmed
    : trimmed.includes("T")
    ? `${trimmed}-05:00`
    : `${trimmed}T00:00:00-05:00`;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getHoursRemaining(now: Date, dueDate: Date): number {
  return (dueDate.getTime() - now.getTime()) / (60 * 60 * 1000);
}

function pushTicketError(
  summary: ExecutionSummary,
  ticket: Ticket,
  reason: string,
): void {
  summary.errors.push(`Ticket ${ticket.ticket_solvi_id}: ${reason}`);
}

async function processExpiredTicket(
  ticket: Ticket,
  dueDate: Date,
  now: Date,
  summary: ExecutionSummary,
  context: {
    accessToken: string;
    config: ReturnType<typeof loadConfig>;
    supabase: ReturnType<typeof createAdminClient>;
    nowIso: string;
  },
): Promise<void> {
  await updateTicketStatus(context.supabase, ticket.ticket_solvi_id, EXPIRED_STATUS);
  console.log("[TICKET_EXPIRED]", {
    ticketId: ticket.ticket_solvi_id,
    dueDate: dueDate.toISOString(),
  });

  await createTracking(
    context.supabase,
    buildExpiredTracking(ticket, context.nowIso),
  );
  console.log("[TRACKING_CREATED]", {
    ticketId: ticket.ticket_solvi_id,
    type: EXPIRED_TRACKING_TYPE,
  });

  await sendExpirationEmail(
    context.accessToken,
    context.config,
    ticket,
    now,
    dueDate,
  );
  console.log("[EMAIL_SENT]", {
    ticketId: ticket.ticket_solvi_id,
    type: "expired",
  });

  summary.expired += 1;
}

async function processWarningTicket(
  ticket: Ticket,
  dueDate: Date,
  hoursRemaining: number,
  summary: ExecutionSummary,
  context: {
    accessToken: string;
    config: ReturnType<typeof loadConfig>;
    supabase: ReturnType<typeof createAdminClient>;
    nowIso: string;
  },
): Promise<void> {

  await sendWarningEmail(
    context.accessToken,
    context.config,
    ticket,
    dueDate,
    hoursRemaining,
  );
  console.log("[EMAIL_SENT]", {
    ticketId: ticket.ticket_solvi_id,
    type: "warning",
  });

  console.log("[TICKET_WARNING]", {
    ticketId: ticket.ticket_solvi_id,
    hoursRemaining,
  });
  summary.warningsSent += 1;
}

async function run(): Promise<ExecutionSummary> {
  const now = getCurrentColombiaTime();
  console.log("[START]", { now: now.isoLocal });

  if (isWeekend(now)) {
    console.log("[WEEKEND]", { now: now.isoLocal });
    return createEmptySummary(WEEKEND);
  }

  if (isHoliday(now)) {
    console.log("[HOLIDAY]", { now: now.isoLocal });
    return createEmptySummary(HOLIDAY);
  }

  if (!isBusinessHours(now)) {
    console.log("[OUT_OF_BUSINESS_HOURS]", { now: now.isoLocal });
    return createEmptySummary(OUT_OF_BUSINESS_HOURS);
  }

  const config = loadConfig();
  const supabase = createAdminClient(config);
  const accessToken = await getGraphAccessToken(config);
  const summary = createEmptySummary();
  const context = {
    accessToken,
    config,
    supabase,
    nowIso: now.utcDate.toISOString(),
  };

  let from = 0;

  while (true) {
    const tickets = await fetchOpenTicketsPage(supabase, config.pageSize, from);
    if (tickets.length === 0) {
      break;
    }

    for (const ticket of tickets) {
      summary.processed += 1;

      try {
        const dueDate = parseTicketDueDate(ticket.ticket_solvi_fechamaxima);
        if (!dueDate) {
          summary.skipped += 1;
          continue;
        }

        const hoursRemaining = getHoursRemaining(now.utcDate, dueDate);

        if (now.utcDate.getTime() > dueDate.getTime()) {
          await processExpiredTicket(
            ticket,
            dueDate,
            now.utcDate,
            summary,
            context,
          );
          continue;
        }

        if (
          hoursRemaining > 0 &&
          hoursRemaining < config.warningThresholdHours
        ) {
          await processWarningTicket(
            ticket,
            dueDate,
            hoursRemaining,
            summary,
            context,
          );
          continue;
        }

        summary.skipped += 1;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.error("[EMAIL_ERROR]", {
          ticketId: ticket.ticket_solvi_id,
          error: reason,
        });
        pushTicketError(summary, ticket, reason);
      }
    }

    if (tickets.length < config.pageSize) {
      break;
    }

    from += config.pageSize;
  }

  console.log("[END]", summary);
  return summary;
}

Deno.serve(async (request) => {
  if (request.method !== "POST" && request.method !== "GET") {
    return Response.json(
      { ok: false, error: "Method not allowed" },
      { status: 405 },
    );
  }

  try {
    const summary = await run();
    return Response.json(summary, {
      status: summary.errors.length === 0 ? 200 : 207,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("monitor-ticket-expirations execution failed", { error: reason });

    return Response.json(
      {
        ok: false,
        processed: 0,
        expired: 0,
        warningsSent: 0,
        skipped: 0,
        errors: [reason],
        reason: "UNHANDLED_ERROR",
      } satisfies ExecutionSummary,
      { status: 500 },
    );
  }
});
