import * as React from "react";
import "./Formulario.css";
import type { PazSalvosService } from "../../../Services/PazSalvos.service";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { UsuariosSPService } from "../../../Services/Usuarios.Service";
import type { TicketsService } from "../../../Services/Tickets.service";
import type { LogService } from "../../../Services/Log.service";
import { usePazSalvos } from "../../../Funcionalidades/PazSalvos";

type Aprobador = { correo: string; nombre: string };
type UsuarioLite = { Correo: string; Nombre: string };

export default function FormularioPazSalvo() {
  const { Usuarios, Tickets, Logs, PazYSalvos } = useGraphServices() as ReturnType<typeof useGraphServices> & {
    Usuarios: UsuariosSPService;
    Tickets: TicketsService;
    Log: LogService;
    PazYSalvos: PazSalvosService
  };
  const { state, setField, handleSubmit } = usePazSalvos({LogSvc: Logs, PazYSalvos: PazYSalvos, TicketSvc: Tickets, Usuarios: Usuarios});
  const [colCorreosSeleccionado, setColCorreosSeleccionado] = React.useState<Aprobador[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioLite[]>([]);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Reemplaza por tu fetch real usando `Usuarios`
        const sample: UsuarioLite[] = [
          { Correo: "ana@acme.com", Nombre: "Ana Ruiz" },
          { Correo: "luis@acme.com", Nombre: "Luis Soto" },
          { Correo: "maria@acme.com", Nombre: "María Pérez" },
        ];
        if (alive) setUsuarios(sample);
      } catch (e) {
        console.error("Error cargando usuarios:", e);
        if (alive) setUsuarios([]);
      }
    })();
    return () => { alive = false; };
  }, [Usuarios]);

  // === Helper: Concat(colCorreosSeleccionado; Correo & "; ") ===
  const toCorreosConcat = React.useCallback((arr: Aprobador[]) => {
    // mismo comportamiento: "mail1; mail2; mail3; " con espacio luego del ;
    return arr.length ? arr.map(a => a.correo).join("; ") + "; " : "";
  }, []);

  // === Collect ===
  const collectAprobador = React.useCallback((item: { Correo: string; Nombre?: string }) => {
    if (!item?.Correo) return;
    setColCorreosSeleccionado(prev => {
      const yaExiste = prev.some(p => p.correo.toLowerCase() === item.Correo.toLowerCase());
      const next = yaExiste ? prev : [...prev, { correo: item.Correo, nombre: item.Nombre ?? "" }];
      // Set(varCorreosEnviar; Concat(...));  y poner en state.Correos
      setField("Correos", toCorreosConcat(next));
      return next;
    });
  }, [setField, toCorreosConcat]);

  // === Remove ===
  const removeAprobador = React.useCallback((correo: string) => {
    setColCorreosSeleccionado(prev => {
      const next = prev.filter(p => p.correo.toLowerCase() !== (correo ?? "").toLowerCase());
      setField("Correos", toCorreosConcat(next));
      return next;
    });
  }, [setField, toCorreosConcat]);

  // === Clear ===
  const clearAprobadores = React.useCallback(() => {
    setColCorreosSeleccionado([]);
    setField("Correos", ""); // Concat([]) -> ""
  }, [setField]);

  // Si editan manualmente el input Correos, lo respetamos (no forzamos chips)
  // (Si quisieras parsear y sincronizar chips desde el input, aquí harías el split)
  const onChangeCorreos = React.useCallback((val: string) => {
    setField("Correos", val);
  }, [setField]);

  // Filtrado de usuarios
  const usuariosFiltrados = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) => u.Correo.toLowerCase().includes(q) || (u.Nombre || "").toLowerCase().includes(q)
    );
  }, [usuarios, search]);

  return (
    <section className="cr-page">
      <form className="cr-form" onSubmit={(e) => handleSubmit(e)} noValidate>
        {/* ====== Sección: Datos del correo ====== */}
        <h2 className="cr-sectionTitle">DATOS DEL CORREO</h2>

        <div className="cr-field cr-field--full">
          <label className="cr-label">
            <span className="req">*</span> Aprobadores
            <span className="help" aria-label="Correos que deben aprobar">ⓘ</span>
          </label>

          {/* Este input contiene EXACTAMENTE el resultado de Concat(...) */}
          <input className="cr-input" placeholder="Ej: ana@estudiodemoda.com.co" value={state.Correos ?? ""} onChange={(e) => onChangeCorreos(e.target.value)}/>

          {/* Chips solo como visual/edición rápida */}
          {colCorreosSeleccionado.length > 0 && (
            <div className="cr-chips-wrap">
              {colCorreosSeleccionado.map((p) => (
                <span key={p.correo} className="cr-chip" title={p.nombre || p.correo}>
                  {p.nombre ? `${p.nombre} · ${p.correo}` : p.correo}
                  <button type="button" className="cr-chip-x" onClick={() => removeAprobador(p.correo)} aria-label={`Quitar ${p.correo}`}>
                    ×
                  </button>
                </span>
              ))}
              <button type="button" className="cr-chip-clear" onClick={clearAprobadores}>
                Limpiar
              </button>
            </div>
          )}
        </div>

        {/* Lista para simular ThisItem y usar collectAprobador */}
        <div className="cr-field cr-field--full">
          <label className="cr-label">Buscar personas</label>
          <input className="cr-input" placeholder="Filtra por nombre o correo" value={search} onChange={(e) => setSearch(e.target.value)}/>
          <ul className="cr-list">
            {usuariosFiltrados.map((u) => (
              <li key={u.Correo} className="cr-list-item">
                <div className="cr-list-col">
                  <div className="cr-list-name">{u.Nombre}</div>
                  <div className="cr-list-mail">{u.Correo}</div>
                </div>
                <button type="button" className="cr-mini" onClick={() => {collectAprobador(u); alert(colCorreosSeleccionado)}} aria-label={`Agregar ${u.Correo}`}>
                  Agregar
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ====== Sección: Empleado ====== */}
        <h2 className="cr-sectionTitle">DATOS DEL EMPLEADO (RETIRADO)</h2>

        <div className="cr-grid">
          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> Fecha de retiro</label>
            <input type="date" className="cr-input" value={state.Fechadesalida ?? ""} onChange={(e) => setField("Fechadesalida", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> Fecha de ingreso</label>
            <input type="date" className="cr-input" value={state.Fechadeingreso ?? ""} onChange={(e) => setField("Fechadeingreso", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> Jefe directo</label>
            <select className="cr-input" value={state.Jefe ?? ""} onChange={(e) => setField("Jefe", e.target.value)}>
              <option value="">Buscar elementos</option>
              <option value="j1">Jefe 1</option>
              <option value="j2">Jefe 2</option>
            </select>
          </div>

          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> CO</label>
            <input className="cr-input" value={state.CO ?? ""} onChange={(e) => setField("CO", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> Empresa</label>
            <input className="cr-input" value={state.Empresa ?? ""} onChange={(e) => setField("Empresa", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> Nombre</label>
            <input className="cr-input" value={state.Nombre ?? ""} onChange={(e) => setField("Nombre", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label">Cargo</label>
            <input className="cr-input" value={state.Cargo ?? ""} onChange={(e) => setField("Cargo", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label">Cédula (Tercero)</label>
            <input className="cr-input" value={state.Cedula ?? ""} onChange={(e) => setField("Cedula", e.target.value)}/>
          </div>
        </div>

        <footer className="cr-actions">
          <button type="button" className="cr-secondary">← Volver</button>
          <button type="submit" className="cr-primary">Enviar</button>
        </footer>
      </form>
    </section>
  );
}
