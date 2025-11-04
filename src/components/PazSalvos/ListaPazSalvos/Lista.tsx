import * as React from "react";
import "./Lista.css";

type Row = {consecutivo: number; nombre: string; cedula: string; fechaIngreso: string; fechaRetiro?: string; cargo: string; empresa: string; jefe: string; co: string; finalizada: boolean;};

const MOCK: Row[] = [
  // ejemplo vacío; conecta tus datos reales aquí
];

export default function PazYSalvos() {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [desde, setDesde] = React.useState(todayISO);
  const [hasta, setHasta] = React.useState(todayISO);
  const [anio, setAnio] = React.useState<string>("");
  const [q, setQ] = React.useState("");

  const years = React.useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => String(y - i));
  }, []);

  const rows = React.useMemo(() => {
    return MOCK.filter(r => {
      const byYear = anio ? (r.fechaIngreso?.startsWith(anio) || r.fechaRetiro?.startsWith(anio)) : true;
      const byText =
        !q ||
        [r.nombre, r.cedula, r.cargo, r.empresa, r.jefe, r.co]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase());
      const d1 = desde ? new Date(desde) : null;
      const d2 = hasta ? new Date(hasta) : null;
      const f = r.fechaIngreso ? new Date(r.fechaIngreso) : null;
      const inRange = !d1 || !d2 || !f ? true : f >= d1 && f <= d2;
      return byYear && byText && inRange;
    });
  }, [anio, q, desde, hasta]);

  return (
    <section className="pz-page">
    
      {/* Filtros */}
      <form className="pz-filters" onSubmit={(e) => e.preventDefault()}>
        <label className="pz-field">
          <span>Desde</span>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>

        <label className="pz-field">
          <span>Hasta</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>

        <label className="pz-field pz-field--sm">
          <span>Filtro por año</span>
          <select value={anio} onChange={(e) => setAnio(e.target.value)}>
            <option value="">Todos</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>

        <div className="pz-search">
          <input type="search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
        </div>
      </form>

      {/* Tabla */}
      <div className="pz-tableWrap">
        <table className="pz-table">
          <thead>
            <tr>
              <th>Consecutivo <span className="pz-sort">↑</span></th>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Fecha Ingreso</th>
              <th>Fecha de retiro</th>
              <th>Cargo</th>
              <th>Empresa</th>
              <th>Jefe directo</th>
              <th>CO</th>
              <th>Finalizada</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="pz-empty">Sin registros</td>
              </tr>
            )}
            {rows.map(r => (
              <tr key={r.consecutivo}>
                <td>{r.consecutivo}</td>
                <td>{r.nombre}</td>
                <td>{r.cedula}</td>
                <td>{r.fechaIngreso || "–"}</td>
                <td>{r.fechaRetiro || "–"}</td>
                <td>{r.cargo}</td>
                <td>{r.empresa}</td>
                <td>{r.jefe}</td>
                <td>{r.co}</td>
                <td>
                  <span className={`pz-dot ${r.finalizada ? "is-ok" : "is-bad"}`} aria-label={r.finalizada ? "Finalizada" : "Pendiente"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
