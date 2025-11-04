import * as React from "react";
import "./ResumenActividad.css";
import type { Tarea } from "../../../Models/Tareas";
import { toDate } from "../../../utils/Date";

type Props = {
  title?: string;
  percent: number;
  tasks: Tarea[];
  taskThisMonth: number;
  locale?: string;
  accentColor?: string;
  ringSize?: number;
};

export default function ActivityStatusCard({title = "Estado de actividad", percent, tasks, taskThisMonth, locale = "es-CO", accentColor, ringSize = 140,}: Props) {

  const safePercent = Math.ceil(Math.max(0, Math.min(100, Number(percent) || 0)));
  const stroke = 10;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - safePercent / 100);

  // Formateador de fechas
  const fmt = new Intl.DateTimeFormat(locale, {day: "2-digit", month: "short", year: "numeric", });

  return (
    <section className="as-card" aria-label={title} style={accentColor ? ({ ["--as-accent" as any]: accentColor } as React.CSSProperties) : undefined}>
      {/* ===== Encabezado ===== */}
      <h2 className="as-title">{title}</h2>

      {/* ===== Indicador circular accesible ===== */}
      <div className="as-ring" role="img" aria-label={`Progreso ${safePercent}%`}>
        <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} className="as-ring-svg">
          {/* pista */}
          <circle className="as-ring-track" cx={ringSize / 2} cy={ringSize / 2} r={radius} strokeWidth={stroke}/>
          {/* progreso */}
          <circle className="as-ring-progress" cx={ringSize / 2} cy={ringSize / 2} r={radius} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={dashOffset}/>  </svg>
        <div className="as-ring-center" aria-hidden="true">
          <span className="as-ring-value">{safePercent}</span>
          <span className="as-ring-unit">%</span>
        </div>
      </div>

      {/* ===== Próximas tareas ===== */}
      <div className="as-section">
        <h3 className="as-subtitle">Próximas tareas</h3>
        <ul className="as-tasklist">
          {tasks.slice(0, 3).map((t, i) => {
            const date = toDate(t.Fechadesolicitud ?? "");
            // Split “25 may. 2024” estilo corto
            const [day, rest] = fmt.formatToParts(date!).reduce<[string, string]>(
              (acc, p) => {
                if (p.type === "day") acc[0] = p.value;
                else if (p.type === "month" || p.type === "literal" || p.type === "year")
                  acc[1] += p.value;
                return acc;
              },
              ["", ""]
            );
            return (
              <li className="as-task" key={i}>
                <div className="as-task-title">{t.Title}</div>
                <div className="as-task-date">
                  <span className="as-task-day">{day}</span>
                  <span className="as-task-rest">{rest.trim()}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ===== Pie / frecuencia ===== */}
      <footer className="as-footer" aria-label="Frecuencia objetivo">
        <strong className="as-footer-value">{taskThisMonth}</strong>
        <span className="as-footer-text">tareas este mes</span>
      </footer>
    </section>
  );
}
