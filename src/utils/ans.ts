// src/utils/ans.ts
import { addMinutes, isSaturday, isSunday } from "date-fns";
import { TZDate } from "@date-fns/tz";
import type { Holiday } from "../Models/Holiday";
import type { ANSRepository } from "../repositories/AnsRepository/AnsRepository";
export type ANSLevel = 'ANS 1' | 'ANS 2' | 'ANS 3' | 'ANS 4' | 'ANS 5' | '';

const TIMEZONE = "America/Bogota";
const WORK_START = 7;  // 7:00 am
const WORK_END = 17;   // 5:00 pm


const toYMD = (d: Date) => {
  const dd = new Date(d);
  dd.setHours(12, 0, 0, 0);
  const y = dd.getFullYear();
  const m = String(dd.getMonth() + 1).padStart(2, "0");
  const day = String(dd.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Toma una cadena que puede venir como ISO y devuelve "YYYY-MM-DD"
const sliceYMD = (s?: string) => (s ? s.slice(0, 10) : "");

// ¿La fecha es feriado?
export const isHoliday = (date: Date, holidays: Holiday[]) => {
  const ymd = toYMD(date);
  return holidays.some(h =>
    sliceYMD(h.date) === ymd
  );
};


/**
 * Calcula fecha de solución respetando días hábiles 7am–5pm y festivos.
 * Devuelve una TZDate (hora local de Bogotá).
 */
export function calcularFechaSolucion(
  apertura: Date,
  horasAns: number,
  holidays: Holiday[]
): TZDate {
  let restante = horasAns * 60; 
  let actual = new TZDate(apertura, TIMEZONE); // trabajar siempre en Bogotá

  while (restante > 0) {
    let hora = actual.getHours();

    // Si es fin de semana o festivo → saltar al próximo día hábil 7am
    if (isSaturday(actual) || isSunday(actual) || isHoliday(actual, holidays)) {
      actual = new TZDate(
        new TZDate(
          actual.getFullYear(),
          actual.getMonth(),
          actual.getDate() + 1,
          WORK_START,
          0,
          0,
          TIMEZONE
        ),
        TIMEZONE
      );
      continue;
    }

    // Antes de 7am → saltar a 7am
    if (hora < WORK_START) {
      actual = new TZDate(
        actual.getFullYear(),
        actual.getMonth(),
        actual.getDate(),
        WORK_START,
        0,
        0,
        TIMEZONE
      );
      continue;
    }

    // Después de 5pm → saltar al siguiente día 7am
    if (hora >= WORK_END) {
      actual = new TZDate(
        actual.getFullYear(),
        actual.getMonth(),
        actual.getDate() + 1,
        WORK_START,
        0,
        0,
        TIMEZONE
      );
      continue;
    }

    // Minutos disponibles hasta fin de jornada
    const minutosHastaFin =
      (WORK_END - hora) * 60 - actual.getMinutes();
    const aConsumir = Math.min(restante, minutosHastaFin);

    actual = new TZDate(addMinutes(actual, aConsumir), TIMEZONE);
    restante -= aConsumir;

    // Si aún queda, mover a siguiente día 7am
    if (restante > 0) {
      actual = new TZDate(
        actual.getFullYear(),
        actual.getMonth(),
        actual.getDate() + 1,
        WORK_START,
        0,
        0,
        TIMEZONE
      );
    }
  }

  console.log("Fecha de solucion ", actual)
  return actual;
}

/** Normaliza: quita tildes/diacríticos, lowercase y trim. */
export const norm = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/** Determina el ANS por palabras clave/exclusiones. */

export async function calculoANS(ansProps: {catId: number | null, subId: number | null, art: number | null}, ansService: ANSRepository): Promise<string> {
  const {catId, subId, art} = ansProps

  if(!catId || !subId || !art){
    return "ANS 3"
  }

  const response = await ansService.loadANS({id_categoria: catId, id_sub_categoria: subId, id_articulo: art})
  
  if(!response.status){
    return "ANS 3"
  }

  return response.data.Title
}

/** (Opcional) Mapa de horas por ANS para reuso. */
export const HORAS_POR_ANS: Record<Exclude<ANSLevel, ''>, number> = {
  'ANS 1': 4,
  'ANS 2': 8,
  'ANS 3': 16,
  'ANS 4': 112,
  'ANS 5': 480,
};