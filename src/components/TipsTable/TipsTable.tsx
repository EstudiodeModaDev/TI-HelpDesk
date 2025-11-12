import * as React from "react";
import "./TipsTable.css";
import { useGraphServices } from "../../graph/GrapServicesContext";
import { useTips } from "../../Funcionalidades/Anuncementes";
import AnnouncementModal from "./ModalAgregar/ModalAgregar";

export default function AnnouncementsTable() {
    const [query, setQuery] = React.useState("");
    const [tipo, setTipo] = React.useState<string>("todos");
    const [modalAgregar, setModalAgregar] = React.useState<boolean>(false);
    const { TipsInicio } = useGraphServices();
    const {tips, loading, loadTips, onToggle} = useTips(TipsInicio);

    React.useEffect(() => {
        loadTips();
    }, [loadTips]);

    const tipos = React.useMemo(() => {
        const s = new Set<string>();
        tips.forEach(r => { if (r.TipoAnuncio) s.add(r.TipoAnuncio); });
        return ["todos", ...Array.from(s).sort((a,b)=>a.localeCompare(b))];
    }, [tips]);

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        return tips.filter(r => {
        const okTipo = tipo === "todos" || (r.TipoAnuncio ?? "").toLowerCase() === tipo.toLowerCase();
        const txt = `${r.Title} ${r.Subtitulo ?? ""} ${r.TipoAnuncio ?? ""}`.toLowerCase();
        const okQuery = !q || txt.includes(q);
        return okTipo && okQuery;
        });
    }, [tips, query, tipo]);

  return (
    <section className="ann-page">
      <div className="ann-toolbar">
        <input className="ann-input" placeholder="Buscar (título, subtítulo, tipo)" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar anuncios"/>
        <select className="ann-select" value={tipo} onChange={(e)=>setTipo(e.target.value)} aria-label="Filtrar por tipo">
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" className="icon-btn" title="Agregar" aria-label="Agregar usuario" onClick={() => setModalAgregar(true)}>
          +
        </button>
      </div>

      <div className="ann-table-wrap" role="region" aria-label="Anuncios" tabIndex={0}>
        <table className="ann-table">
          <thead>
            <tr>
              <th style={{width: '52px'}}>#</th>
              <th>Título</th>
              <th>Subtítulo</th>
              <th style={{width: '160px'}}>Tipo</th>
              <th style={{width: '120px'}}>Activo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="ann-empty">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="ann-empty">Sin resultados</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.Id}>
                  <td className="ann-id">{r.Id}</td>
                  <td>
                    <button className="ann-link" aria-label={`Abrir ${r.Title}`}>
                      {r.Title}
                    </button>
                  </td>
                  <td className="ann-sub">{r.Subtitulo ?? ""}</td>
                  <td className="ann-tipo">
                    <span className={`badge badge--${slug(r.TipoAnuncio ?? 'NA')}`}>{r.TipoAnuncio ?? "—"}</span>
                  </td>
                  <td>
                    <label className="switch">
                      <input type="checkbox" checked={r.Activa} onChange={()=> onToggle(String(r.Id))} aria-label={`Activo para ${r.Title}`}/>
                      <span className="slider" />
                    </label>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <>
          <AnnouncementModal open={modalAgregar} onCancel={() => setModalAgregar(false)} tipos={["Seguridad", "Lanzamiento", "Tip"]}/>
        </>

      </div>
    </section>
  );
}

function slug(s: string){
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-');
}
