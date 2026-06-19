import type { ColombiaNow } from "./types.ts";

const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function createShiftedDate(date: Date): Date {
  return new Date(date.getTime() + COLOMBIA_OFFSET_MS);
}

function buildDateFromShiftedParts(
  year: number,
  month: number,
  day: number,
): Date {
  return new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
}

function moveToNextMonday(date: Date): Date {
  const weekday = date.getUTCDay();
  if (weekday === 1) {
    return date;
  }

  const daysToAdd = weekday === 0 ? 1 : 8 - weekday;
  const moved = new Date(date);
  moved.setUTCDate(moved.getUTCDate() + daysToAdd);
  return moved;
}

function calculateEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function getColombiaHolidaySet(year: number): Set<string> {
  const holidays = new Set<string>();

  const fixedHolidays = [
    [1, 1],
    [5, 1],
    [7, 20],
    [8, 7],
    [12, 8],
    [12, 25],
  ];

  for (const [month, day] of fixedHolidays) {
    holidays.add(toDateKey(year, month, day));
  }

  const emilianiHolidays = [
    [1, 6],
    [3, 19],
    [6, 29],
    [8, 15],
    [10, 12],
    [11, 1],
    [11, 11],
  ];

  for (const [month, day] of emilianiHolidays) {
    const moved = moveToNextMonday(buildDateFromShiftedParts(year, month, day));
    holidays.add(
      toDateKey(
        moved.getUTCFullYear(),
        moved.getUTCMonth() + 1,
        moved.getUTCDate(),
      ),
    );
  }

  const easterSunday = calculateEasterSunday(year);
  const holyThursday = addDays(easterSunday, -3);
  const goodFriday = addDays(easterSunday, -2);
  const ascension = moveToNextMonday(addDays(easterSunday, 43));
  const corpusChristi = moveToNextMonday(addDays(easterSunday, 64));
  const sacredHeart = moveToNextMonday(addDays(easterSunday, 71));

  for (
    const holiday of [
      holyThursday,
      goodFriday,
      ascension,
      corpusChristi,
      sacredHeart,
    ]
  ) {
    holidays.add(
      toDateKey(
        holiday.getUTCFullYear(),
        holiday.getUTCMonth() + 1,
        holiday.getUTCDate(),
      ),
    );
  }

  return holidays;
}

export function getCurrentColombiaTime(date = new Date()): ColombiaNow {
  const shifted = createShiftedDate(date);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const hour = shifted.getUTCHours();
  const minute = shifted.getUTCMinutes();
  const second = shifted.getUTCSeconds();
  const weekday = shifted.getUTCDay();
  const dateKey = toDateKey(year, month, day);

  return {
    utcDate: date,
    localDate: shifted,
    year,
    month,
    day,
    hour,
    minute,
    second,
    weekday,
    isoLocal:
      `${dateKey}T${pad(hour)}:${pad(minute)}:${pad(second)}-05:00`,
    dateKey,
  };
}

export function isWeekend(now: ColombiaNow): boolean {
  return now.weekday === 0 || now.weekday === 6;
}

export function isHoliday(now: ColombiaNow): boolean {
  return getColombiaHolidaySet(now.year).has(now.dateKey);
}

export function isBusinessHours(now: ColombiaNow): boolean {
  const currentSeconds = (now.hour * 60 * 60) + (now.minute * 60) + now.second;
  const startSeconds = 7 * 60 * 60;
  const endSeconds = 17 * 60 * 60;
  return currentSeconds >= startSeconds && currentSeconds <= endSeconds;
}

export function formatDateTimeInColombia(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
