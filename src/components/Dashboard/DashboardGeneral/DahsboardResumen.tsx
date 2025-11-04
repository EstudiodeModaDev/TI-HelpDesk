import React from "react";
import { useDashboard } from "../../../Funcionalidades/Dashboard";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { TicketsService } from "../../../Services/Tickets.service";
import "./Dashboard.css"

type Resolutor = { nombre: string; porcentaje: number; total: number };
type Fuente = { label: string; total: number };

const resolutores: Resolutor[] = [
  { nombre: "Andres Godoy", porcentaje: 0, total: 0 },
  { nombre: "Cesar Sanchez", porcentaje: 0, total: 0 },
  { nombre: "Elizabeth Tapias", porcentaje: 0, total: 0 },
  { nombre: "Juan David Chavarria", porcentaje: 0, total: 0 },
  { nombre: "Linea Interna de servicios", porcentaje: 0, total: 0 },
];

const fuentes: Fuente[] = [
  { label: "Aplicativo", total: 0 },
  { label: "Correo", total: 0 },
  { label: "Disponibilidad", total: 0 },
  { label: "Teams", total: 0 },
  { label: "En persona", total: 0 },
  { label: "WhatsApp", total: 0 },
];

export default function DashboardResumen() {
  //const totalCasos = 0;
  const cumplimiento = 0; 
  const { Tickets } = useGraphServices() as ReturnType<typeof useGraphServices> & {TicketService: TicketsService;};
  const {totalCasos, obtenerTotal} = useDashboard(Tickets);
  
  React.useEffect(() => {                           
    obtenerTotal("resumen");
  }, []);    

  return (
    <section className="dash">
      {/* Columna izquierda */}
      <aside className="dash-left">
        <div className="kpi-total">
          <Donut value={100} size={180} stroke={10} ring="#2563eb" />
          <div className="kpi-total__text">
            <div className="big">{totalCasos}</div>
            <div className="sub">Casos en total</div>
          </div>
        </div>

        <ul className="bullets">
          <li>A tiempo</li>
          <li>Fuera de tiempo</li>
          <li>En curso</li>
        </ul>

        <div className="panel">
          <h4>Porcentaje de cumplimiento</h4>
          <div className="gauge">
            <Gauge value={cumplimiento} />
            <div className="gauge__labels">
              <span>0,00%</span>
              <span>100,00%</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="hint">Top 5 categorías</div>
          <div className="placeholder" />
        </div>
      </aside>

      {/* Columna central */}
      <main className="dash-center">
        <header className="center-head">
          <h3>Total Casos por Categoria</h3>
          <div className="filters">
            <input className="date" type="date" />
            <select className="mini">
              <option>ID</option>
              <option>Asunto</option>
            </select>
          </div>
        </header>

        <div className="chart-area placeholder" />

        <section className="resolutores">
          <h4>Resolutores</h4>
          <ul className="res-list">
            {resolutores.map((r) => (
              <li key={r.nombre} className="res-item">
                <div className="res-left">
                  <SmallDonut value={r.porcentaje} />
                  <div className="res-meta">
                    <div className="res-name">{r.nombre}</div>
                    <div className="res-sub">0.00%</div>
                  </div>
                </div>
                <div className="res-right">
                  <div className="res-total">{totalCasos}</div>
                  <div className="res-caption">Total Casos</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* Columna derecha */}
      <aside className="dash-right">
        <h4>Fuentes de solicitud</h4>
        <div className="fuentes-row">
          {fuentes.map((f) => (
            <div key={f.label} className="fuente">
              <div className="fuente-count">(En blanco)</div>
              <div className="fuente-label">{f.label}</div>
            </div>
          ))}
        </div>

        <section className="panel">
          <h4>Cumplimiento diario</h4>
          <div className="y-scale">
            <span>1,0</span>
            <span>0,9</span>
            <span>0,8</span>
            <span>0,7</span>
            <span>0,6</span>
          </div>
          <div className="linechart placeholder" />
        </section>
      </aside>
    </section>
  );
}

/* ====== Mini componentes SVG ====== */
function Donut({ value, size = 160, stroke = 12, ring = "#0ea5e9" }: { value: number; size?: number; stroke?: number; ring?: string }) {
  const R = (size - stroke) / 2;
  const C = 2 * Math.PI * R;
  const off = C * (1 - Math.max(0, Math.min(1, value)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut">
      <circle cx={size / 2} cy={size / 2} r={R} stroke="#1f2937" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={R} stroke={ring} strokeWidth={stroke} fill="none" strokeDasharray={C} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

function SmallDonut({ value }: { value: number }) {
  const size = 64, stroke = 8;
  const R = (size - stroke) / 2;
  const C = 2 * Math.PI * R;
  const off = C * (1 - Math.max(0, Math.min(1, value)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut small">
      <circle cx={size / 2} cy={size / 2} r={R} stroke="#374151" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={R} stroke="#ef4444" strokeWidth={stroke} fill="none" strokeDasharray={C} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dy="4" textAnchor="middle" className="donut-txt">0.00%</text>
    </svg>
  );
}

function Gauge({ value }: { value: number }) {
  // Semicírculo 180°
  const size = 200, stroke = 20;
  const R = (size - stroke) / 2;
  const C = Math.PI * R;
  const v = Math.max(0, Math.min(1, value));
  const off = C * (1 - v);
  return (
    <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`} className="gauge-svg">
      <path d={`M ${stroke/2} ${size/2} A ${R} ${R} 0 0 1 ${size-stroke/2} ${size/2}`} stroke="#374151" strokeWidth={stroke} fill="none" />
      <path d={`M ${stroke/2} ${size/2} A ${R} ${R} 0 0 1 ${size-stroke/2} ${size/2}`} stroke="#22c55e" strokeWidth={stroke} fill="none" strokeDasharray={C} strokeDashoffset={off} />
      <text x="50%" y="70%" textAnchor="middle" className="gauge-txt">(En blanco)</text>
    </svg>
  );
}
