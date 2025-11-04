export const toNumberFromEsCO = (formatted: string) => Number(formatted.replace(/\./g, "").replace(",", "."));

// Convierte cadenas en número, aceptando ".", "," y miles estilo es-CO
const toNumberEs = (v: unknown): number => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return isFinite(n) ? n : 0;
};

// Formatea en es-CO (puntos de miles, coma decimal)
export const formatPesosEsCO = (value: number | string, decimals = 2) => {
  const n = typeof value === "number" ? value : toNumberEs(value);
  // si no hay parte decimal, no obligues dos decimales
  const hasDecimals = Math.abs(n % 1) > 0;
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: hasDecimals ? decimals : 0,
    maximumFractionDigits: decimals,
  }).format(n);
};

