import React from "react";
import type { DateRange } from "../../Models/Filtros";
import type { Ticket } from "../../Models/Tickets";
import type { TopCategoria } from "../../Models/Dashboard";
import type { TicketsRepository, filterTickets } from "../../repositories/TicketsRepository/TicketRepository";
import { getXMonthsBackRange, parseDateFlex, toGraphDateTime } from "../../utils/Date";

export type SemanaDisponibilidad = {
  label: string;
  total: number;
  minutosPromedio: number;
};

export type ResolutorDisponibilidadAgg = {
  nombre: string;
  correo: string;
  totalTickets: number;
  minutosPromedio: number;
  minutosNocturnos: number;
  minutosDominicales: number;
  minutosFestivos: number;
  porcentajeDelTotal: number;
};

type DashboardDisponibilidadState = {
  totalTickets: number;
  totalMinutos: number;
  promedioMinutos: number;
  promedioHoras: number;
  minutosNocturnos: number;
  minutosDominicales: number;
  minutosFestivos: number;
};

const EMPTY_METRICS: DashboardDisponibilidadState = {
  totalTickets: 0,
  totalMinutos: 0,
  promedioMinutos: 0,
  promedioHoras: 0,
  minutosNocturnos: 0,
  minutosDominicales: 0,
  minutosFestivos: 0,
};

function parseTicketDate(value?: string | Date | null): Date | null {
  return parseDateFlex(value ?? null);
}

function diffMinutes(start?: string | Date | null, end?: string | Date | null): number {
  const inicio = parseTicketDate(start);
  const fin = parseTicketDate(end);
  if (!inicio || !fin || fin <= inicio) return 0;
  return Math.round((fin.getTime() - inicio.getTime()) / 60000);
}

function getTicketTotalMinutes(ticket: Ticket): number {
  const stored = Number(ticket.MinutosTotales ?? 0);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return diffMinutes(ticket.FechaApertura, ticket.FechaCierreReal);
}

function pickResolutorIdentity(ticket: Ticket): { correo: string; nombre: string } {
  const correo = String(ticket.Correoresolutor ?? "").trim().toLowerCase();
  const nombre = String(ticket.Nombreresolutor ?? "").trim();

  if (correo) {
    return {
      correo,
      nombre: nombre || correo.split("@")[0] || "(Sin resolutor)",
    };
  }

  if (nombre) {
    return {
      correo: "",
      nombre,
    };
  }

  return {
    correo: "",
    nombre: "(Sin resolutor)",
  };
}

function getIsoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekLabel(ticket: Ticket): string {
  const cierre = parseTicketDate(ticket.FechaCierreReal);
  const apertura = parseTicketDate(ticket.FechaApertura);
  const base = cierre ?? apertura;
  return base ? getIsoWeekKey(base) : "Sin semana";
}

function sumTicketMetrics(tickets: Ticket[]): DashboardDisponibilidadState {
  if (!tickets.length) return EMPTY_METRICS;

  const totalMinutos = tickets.reduce((acc, ticket) => acc + getTicketTotalMinutes(ticket), 0);
  const minutosNocturnos = tickets.reduce((acc, ticket) => acc + Number(ticket.MinutosNocturnos ?? 0), 0);
  const minutosDominicales = tickets.reduce((acc, ticket) => acc + Number(ticket.MinutosDominicales ?? 0), 0);
  const minutosFestivos = tickets.reduce((acc, ticket) => acc + Number(ticket.MinutosFestivos ?? 0), 0);
  const totalTickets = tickets.length;
  const promedioMinutos = totalTickets ? totalMinutos / totalTickets : 0;

  console.log(tickets)

  return {
    totalTickets,
    totalMinutos,
    promedioMinutos,
    promedioHoras: promedioMinutos / 60,
    minutosNocturnos,
    minutosDominicales,
    minutosFestivos,
  };
}

function aggregateWeeks(tickets: Ticket[]): SemanaDisponibilidad[] {
  const grouped = new Map<string, { total: number; totalMinutos: number }>();

  for (const ticket of tickets) {
    const key = getWeekLabel(ticket);
    const current = grouped.get(key) ?? { total: 0, totalMinutos: 0 };
    current.total += 1;
    current.totalMinutos += getTicketTotalMinutes(ticket);
    grouped.set(key, current);
  }

  return Array.from(grouped, ([label, data]) => ({
    label,
    total: data.total,
    minutosPromedio: data.total ? data.totalMinutos / data.total : 0,
  })).sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
}

function aggregateResolutores(tickets: Ticket[]): ResolutorDisponibilidadAgg[] {
  const total = tickets.length;
  const grouped = new Map<string, {
    nombre: string;
    correo: string;
    totalTickets: number;
    totalMinutos: number;
    minutosNocturnos: number;
    minutosDominicales: number;
    minutosFestivos: number;
  }>();

  for (const ticket of tickets) {
    const resolutor = pickResolutorIdentity(ticket);
    const key = resolutor.correo || resolutor.nombre.toLowerCase();
    const entry = grouped.get(key) ?? {
      nombre: resolutor.nombre,
      correo: resolutor.correo,
      totalTickets: 0,
      totalMinutos: 0,
      minutosNocturnos: 0,
      minutosDominicales: 0,
      minutosFestivos: 0,
    };

    entry.totalTickets += 1;
    entry.totalMinutos += getTicketTotalMinutes(ticket);
    entry.minutosNocturnos += Number(ticket.MinutosNocturnos ?? 0);
    entry.minutosDominicales += Number(ticket.MinutosDominicales ?? 0);
    entry.minutosFestivos += Number(ticket.MinutosFestivos ?? 0);

    grouped.set(key, entry);
  }

  return Array.from(grouped.values())
    .map((entry) => ({
      nombre: entry.nombre,
      correo: entry.correo,
      totalTickets: entry.totalTickets,
      minutosPromedio: entry.totalTickets ? entry.totalMinutos / entry.totalTickets : 0,
      minutosNocturnos: entry.minutosNocturnos,
      minutosDominicales: entry.minutosDominicales,
      minutosFestivos: entry.minutosFestivos,
      porcentajeDelTotal: total ? entry.totalTickets / total : 0,
    }))
    .sort((a, b) => b.totalTickets - a.totalTickets || a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
}

function buildRangeFilter(range: DateRange): filterTickets {
  return {
    range: {
      from: toGraphDateTime(range.from) ?? range.from,
      to: toGraphDateTime(range.to) ?? range.to,
    },
    fuente: "Disponibilidad"
  };
}

export function useDashboardDisponibilidad(TicketsSvc: TicketsRepository) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange>(getXMonthsBackRange({ MonthQuantity: 1 }));

  const [selectedFuente, setSelectedFuente] = React.useState<string>("all");
  const [selectedResolutor, setSelectedResolutor] = React.useState<string>("all");
  const [selectedSemana, setSelectedSemana] = React.useState<string>("all");

  const [ticketsDisponibilidad, setTicketsDisponibilidad] = React.useState<Ticket[]>([]);
  const [totalTickets, setTotalTickets] = React.useState<number>(0);
  const [totalMinutos, setTotalMinutos] = React.useState<number>(0);
  const [promedioMinutos, setPromedioMinutos] = React.useState<number>(0);
  const [promedioHoras, setPromedioHoras] = React.useState<number>(0);
  const [minutosNocturnos, setMinutosNocturnos] = React.useState<number>(0);
  const [minutosDominicales, setMinutosDominicales] = React.useState<number>(0);
  const [minutosFestivos, setMinutosFestivos] = React.useState<number>(0);
  const [resolutores, setResolutores] = React.useState<ResolutorDisponibilidadAgg[]>([]);
  const [semanas, setSemanas] = React.useState<SemanaDisponibilidad[]>([]);
  const [topResolutores, setTopResolutores] = React.useState<TopCategoria[]>([]);

  const loadDashboardDisponibilidad = React.useCallback(async (): Promise<Ticket[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await TicketsSvc.loadTickets(buildRangeFilter(range));
      const tickets = Array.isArray(response?.data) ? response.data : [];

      setTicketsDisponibilidad(tickets);
      return tickets;
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar métricas de disponibilidad");
      setTicketsDisponibilidad([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [TicketsSvc, range]);

  React.useEffect(() => {
    void loadDashboardDisponibilidad();
  }, [loadDashboardDisponibilidad]);

  React.useEffect(() => {
    const metrics = sumTicketMetrics(ticketsDisponibilidad);
    setTotalTickets(metrics.totalTickets);
    setTotalMinutos(metrics.totalMinutos);
    setPromedioMinutos(metrics.promedioMinutos);
    setPromedioHoras(metrics.promedioHoras);
    setMinutosNocturnos(metrics.minutosNocturnos);
    setMinutosDominicales(metrics.minutosDominicales);
    setMinutosFestivos(metrics.minutosFestivos);
    setResolutores(aggregateResolutores(ticketsDisponibilidad));
    setSemanas(aggregateWeeks(ticketsDisponibilidad));
    setTopResolutores(
      aggregateResolutores(ticketsDisponibilidad)
        .slice(0, 5)
        .map((item) => ({ nombre: item.nombre, total: item.totalTickets }))
    );
  }, [ticketsDisponibilidad, ticketsDisponibilidad]);

  React.useEffect(() => {
    const metrics = sumTicketMetrics(ticketsDisponibilidad);
    setTotalTickets(metrics.totalTickets);
    setTotalMinutos(metrics.totalMinutos);
    setPromedioMinutos(metrics.promedioMinutos);
    setPromedioHoras(metrics.promedioHoras);
    setMinutosNocturnos(metrics.minutosNocturnos);
    setMinutosDominicales(metrics.minutosDominicales);
    setMinutosFestivos(metrics.minutosFestivos);
    setResolutores(aggregateResolutores(ticketsDisponibilidad));
    setSemanas(aggregateWeeks(ticketsDisponibilidad));
    setTopResolutores(
      aggregateResolutores(ticketsDisponibilidad)
        .slice(0, 5)
        .map((item) => ({ nombre: item.nombre, total: item.totalTickets }))
    );
  }, [ticketsDisponibilidad, ticketsDisponibilidad]);

  const resolutorOptions = React.useMemo(
    () =>
      aggregateResolutores(ticketsDisponibilidad).map((item) => ({
        label: item.nombre,
        value: item.correo || item.nombre,
      })),
    [ticketsDisponibilidad]
  );

  const semanaOptions = React.useMemo(
    () => aggregateWeeks(ticketsDisponibilidad).map((item) => item.label),
    [ticketsDisponibilidad]
  );

  const resetFilters = React.useCallback(() => {
    setSelectedFuente("all");
    setSelectedResolutor("all");
    setSelectedSemana("all");
  }, []);

  return {
    loading,
    error,
    range,
    setRange,
    loadDashboardDisponibilidad,
    resetFilters,

    selectedFuente,
    setSelectedFuente,
    selectedResolutor,
    setSelectedResolutor,
    selectedSemana,
    setSelectedSemana,

    ticketsDisponibilidad,
    totalTickets,
    totalMinutos,
    promedioMinutos,
    promedioHoras,
    minutosNocturnos,
    minutosDominicales,
    minutosFestivos,
    resolutores,
    semanas,
    topResolutores,
    resolutorOptions,
    semanaOptions,
  };
}
