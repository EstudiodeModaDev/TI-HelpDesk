import * as React from "react";
import "./MiniSidebar.css";

type Item = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
};

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
    <rect x="13" y="3" width="8" height="5" rx="2" fill="currentColor" />
    <rect x="13" y="10" width="8" height="11" rx="2" fill="currentColor" />
    <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" />
  </svg>
);

const WorkerIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
    <circle cx="12" cy="8" r="4" fill="currentColor" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6v1H4v-1z" fill="currentColor" />
    <path d="M7 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function MiniSidebar() {
  const items: Item[] = [
    { id: "dashboard", label: "DASHBOARD", icon: <DashboardIcon />, active: true },
    { id: "detallado", label: "Detallado", icon: <WorkerIcon /> },
  ];

  return (
    <aside className="msb">
      <div className="msb-track">
        {items.map((it) => (
          <button
            key={it.id}
            className={`msb-item ${it.active ? "is-active" : ""}`}
            title={it.label}
            type="button"
          >
            <div className="msb-item__inner">
              <div className="msb-icon">{it.icon}</div>
              <div className="msb-label">{it.label}</div>
            </div>
          </button>
        ))}
        <div className="msb-spacer" />
      </div>
    </aside>
  );
}
