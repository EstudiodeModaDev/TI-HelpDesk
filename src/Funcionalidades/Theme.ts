// Funcionalidades/Theme.ts
import * as React from "react";
type Theme = "light" | "dark";

export function useTheme() {
  const getPreferred = (): Theme => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("theme")) as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
    return "dark"; // por defecto oscuro, como tus tokens base
  };

  const [theme, setTheme] = React.useState<Theme>(() => getPreferred());

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.setAttribute("data-theme", "light"); // <— clave
    else root.removeAttribute("data-theme");                         // dark = tokens base
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}
