import React from "react";
import { useDashboard } from "../../../Funcionalidades/Dashboard";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { TicketsService } from "../../../Services/Tickets.service";
import "./Dashboard.css";

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

// ===== util: formatea "2,1 mil" / "0,2 mil" =====
function formatShort(n: number) {
  if (n >= 1000) {
    const k = Math.round((n / 1000) * 10) / 10; // 1 decimal
    return `${k.toLocaleString("es-CO")} mil`;
  }
  return n.toLocaleString("es-CO");
}

// ======= leyenda con barras dinámicas =======
function StatusBars({total, at, late, inprog,}: {total: number; at: number; late: number; inprog: number;}) {
  const pct = (v: number) => (total > 0 ? Math.max(0, Math.min(100, (v / total) * 100)) : 0);

  const rows = [
    { color: "#10b981", label: "A tiempo", value: at, width: pct(at) },
    { color: "#ef4444", label: "Fuera de tiempo", value: late, width: pct(late) },
    { color: "#06b6d4", label: "En curso", value: inprog, width: pct(inprog) },
  ];

  return (
    <ul className="bullets bullets--barred">
      {rows.map((r) => (
        <li key={r.label} className="bullet-row">
          <span className="bullet-dot" style={{ backgroundColor: r.color }} />
          <span className="bullet-label">{r.label}</span>
          <div className="bullet-bar">
            <div className="bullet-fill" style={{ width: `${r.width}%`, backgroundColor: r.color }} />
          </div>
          <span className="bullet-val">{formatShort(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardResumen() {
  const { Tickets } = useGraphServices() as ReturnType<typeof useGraphServices> & {
    TicketService: TicketsService;
  };
  const { totalCasos, totalEnCurso, totalFinalizados, totalFueraTiempo, obtenerTotal } = useDashboard(Tickets);
  const [cumplimiento, setCumplimiento] = React.useState(0);

  // carga inicial
  React.useEffect(() => {
    obtenerTotal("resumen");
    void cargarDistribucion();
  }, []); 

  // ===== carga distribución por estado
  const cargarDistribucion = React.useCallback(async () => {
    try {
      // Ideal: si tu Tickets service tiene un método de conteo por filtro, úsalo.
      // Aquí hacemos un getAllPlane() y “mapeamos” el estado.
      const all = await (Tickets as any).getAllPlane?.() ?? [];
      // Detecta el campo de estado más probable
      const getEstado = (it: any): string => {
        return (
          it?.EstadoANS ||
          it?.Estadodesolicitud ||
          it?.Estado ||
          it?.fields?.EstadoANS ||
          it?.fields?.Estadodesolicitud ||
          ""
        );
      };

      let at = 0, late = 0, prog = 0;
      for (const it of all) {
        const e = (getEstado(it) || "").toString().toLowerCase().trim();
        if (e.includes("tiempo") && e.includes("fuera")) late++;
        else if (e.includes("curso") || e.includes("proceso") || e.includes("abierto")) prog++;
        else if (e.includes("tiempo") || e.includes("cumplido") || e.includes("dentro")) at++;
        // si no calza en nada, puedes decidir sumarlo a "En curso" o ignorarlo
      }

      // “cumplimiento” sencillo: a_tiempo / (a_tiempo + fuera_de_tiempo)
      const denom = at + late;
      const comp = denom > 0 ? at / denom : 0;
      setCumplimiento(comp);
    } catch (e) {
      console.error("Error cargando distribución:", e);
      setCumplimiento(0);
    }
  }, [Tickets]);

  return (
    <section className="dash">
      {/* Columna izquierda */}
      <aside className="dash-left">
        <div className="kpi-total">
          <Donut value={1} size={180} stroke={10} ring="#22c55e" />
          <div className="kpi-total__text">
            <div className="big">{totalCasos}</div>
            <div className="sub">Casos en total</div>
          </div>
        </div>

        {/* Barras dinámicas */}
        <StatusBars total={totalCasos} at={totalFinalizados} late={totalFueraTiempo} inprog={totalEnCurso} />

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
function Donut({
  value,
  size = 160,
  stroke = 12,
  ring = "#0ea5e9",
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  ring?: string;
}) {
  const v = Math.max(0, Math.min(1, value));
  const R = (size - stroke) / 2;
  const C = 2 * Math.PI * R;
  const off = C * (1 - v);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut">
      <circle cx={size / 2} cy={size / 2} r={R} stroke="#1f2937" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={R}
        stroke={ring}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={C}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function SmallDonut({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  const size = 64,
    stroke = 8;
  const R = (size - stroke) / 2;
  const C = 2 * Math.PI * R;
  const off = C * (1 - v);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut small">
      <circle cx={size / 2} cy={size / 2} r={R} stroke="#374151" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={R}
        stroke="#ef4444"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={C}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dy="4" textAnchor="middle" className="donut-txt">
        {(v * 100).toFixed(2)}%
      </text>
    </svg>
  );
}

function Gauge({ value }: { value: number }) {
  // Semicírculo 180°
  const v = Math.max(0, Math.min(1, value));
  const size = 200,
    stroke = 20;
  const R = (size - stroke) / 2;
  const C = Math.PI * R;
  const off = C * (1 - v);
  return (
    <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`} className="gauge-svg">
      <path
        d={`M ${stroke / 2} ${size / 2} A ${R} ${R} 0 0 1 ${size - stroke / 2} ${size / 2}`}
        stroke="#374151"
        strokeWidth={stroke}
        fill="none"
      />
      <path
        d={`M ${stroke / 2} ${size / 2} A ${R} ${R} 0 0 1 ${size - stroke / 2} ${size / 2}`}
        stroke="#22c55e"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={C}
        strokeDashoffset={off}
      />
      <text x="50%" y="70%" textAnchor="middle" className="gauge-txt">
        {(v * 100).toFixed(2)}%
      </text>
    </svg>
  );
}
