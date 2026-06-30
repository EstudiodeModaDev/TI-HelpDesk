import { parseDateFlex } from "../../../utils/Date";
import { fetchHolidays } from "../../../Services/Festivos";
import type { Holiday } from "../../../Models/Holiday";

type ResultadoMinutos = {
  nocturnos: number;
  dominicales: number;
  festivos: number;
  total: number;
};

const MS_MIN = 60000;

function minutosEntre(inicio: Date, fin: Date): number {
  return Math.max(0, Math.round((fin.getTime() - inicio.getTime()) / MS_MIN));
}

function inicioDelDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function finDelDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
}

function maxDate(a: Date, b: Date): Date {
  return a > b ? a : b;
}

function minDate(a: Date, b: Date): Date {
  return a < b ? a : b;
}

function intersectar(aInicio: Date, aFin: Date, bInicio: Date, bFin: Date): number {
  const inicio = maxDate(aInicio, bInicio);
  const fin = minDate(aFin, bFin);
  return inicio < fin ? minutosEntre(inicio, fin) : 0;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildHolidaySet(holidays: Holiday[]): Set<string> {
  return new Set(
    holidays.flatMap((h) => [h.date, h.date].filter(Boolean).map((v) => String(v).slice(0, 10)))
  );
}

export async function calcularMinutos(fechaApertura: string | Date,): Promise<ResultadoMinutos> {
  const fechaCierreReal = new Date()
  const inicio = parseDateFlex(fechaApertura) ?? new Date(fechaApertura);
  const fin = parseDateFlex(fechaCierreReal) ?? new Date(fechaCierreReal);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || fin <= inicio) {
    return { nocturnos: 0, dominicales: 0, festivos: 0, total: 0 };
  }

  const holidays = await fetchHolidays();
  const festivosSet = buildHolidaySet(holidays);

  let cursor = new Date(inicio);
  let nocturnos = 0;
  let dominicales = 0;
  let festivos = 0;

  while (cursor < fin) {
    const dayStart = inicioDelDia(cursor);
    const dayEnd = finDelDia(cursor);

    const tramoInicio = maxDate(cursor, inicio);
    const tramoFin = minDate(dayEnd, fin);

    const minutosTramo = minutosEntre(tramoInicio, tramoFin);
    const esDomingo = dayStart.getDay() === 0;
    const esFestivo = festivosSet.has(toYmd(dayStart));

    if (esDomingo) dominicales += minutosTramo;
    if (esFestivo) festivos += minutosTramo;

    const inicioNocturno = new Date(dayStart);
    inicioNocturno.setHours(19, 0, 0, 0);

    const finNocturno = new Date(dayEnd);

    nocturnos += intersectar(tramoInicio, tramoFin, inicioNocturno, finNocturno);

    cursor = dayEnd;
  }

  return {
    nocturnos,
    dominicales,
    festivos,
    total: minutosEntre(inicio, fin),
  };
}