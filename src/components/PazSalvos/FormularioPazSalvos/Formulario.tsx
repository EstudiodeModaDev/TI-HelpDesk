import * as React from "react";
import "./Formulario.css";
import type { PazSalvosService } from "../../../Services/PazSalvos.service";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { UsuariosSPService } from "../../../Services/Usuarios.Service";
import type { TicketsService } from "../../../Services/Tickets.service";
import type { LogService } from "../../../Services/Log.service";
import { usePazSalvos } from "../../../Funcionalidades/PazSalvos";
import Select, { components, type SingleValue, type OptionProps } from "react-select";
import type { UserOptionEx } from "../../NuevoTicket/NuevoTicketForm";
import { useWorkers } from "../../../Funcionalidades/Workers";

type Aprobador = { correo: string; nombre: string };
type UsuarioLite = { Correo: string; Nombre: string };

export default function FormularioPazSalvo() {
  const { Usuarios, Tickets, Logs, PazYSalvos } = useGraphServices() as ReturnType<typeof useGraphServices> & {
    Usuarios: UsuariosSPService;
    Tickets: TicketsService;
    Log: LogService;
    PazYSalvos: PazSalvosService;
  };
  const { state, setField, handleSubmit } = usePazSalvos({LogSvc: Logs, PazYSalvos: PazYSalvos, TicketSvc: Tickets, Usuarios: Usuarios,});
  const [colCorreosSeleccionado, setColCorreosSeleccionado] = React.useState<Aprobador[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioLite[]>([]); // si mantienes la lista manual                // si mantienes la lista manual
  const { workersOptions, loadingWorkers, error: usersError } = useWorkers({ onlyEnabled: true });
  const [selectedWorker, setSelectedWorker] = React.useState<UserOptionEx | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Si ya usas workersOptions, esta lista manual podría no ser necesaria.
        const sample: UsuarioLite[] = [
          { Correo: "ana@acme.com", Nombre: "Ana Ruiz" },
          { Correo: "luis@acme.com", Nombre: "Luis Soto" },
          { Correo: "maria@acme.com", Nombre: "María Pérez" },
        ];
        if (alive) setUsuarios(sample);
        console.log(usuarios)
      } catch (e) {
        console.error("Error cargando usuarios:", e);
        if (alive) setUsuarios([]);
      }
    })();
    return () => { alive = false; };
  }, [Usuarios]);

  const toCorreosConcat = React.useCallback((arr: Aprobador[]) => {
    return arr.length ? arr.map(a => a.correo).join("; ") + "; " : "";
  }, []);

  const collectAprobador = React.useCallback((item: { Correo: string; Nombre?: string }) => {
    if (!item?.Correo) return;
    setColCorreosSeleccionado(prev => {
      const yaExiste = prev.some(p => p.correo.toLowerCase() === item.Correo.toLowerCase());
      const next = yaExiste ? prev : [...prev, { correo: item.Correo, nombre: item.Nombre ?? "" }];
      setField("Correos", toCorreosConcat(next));
      return next;
    });
  }, [setField, toCorreosConcat]);

  const removeAprobador = React.useCallback((correo: string) => {
    setColCorreosSeleccionado(prev => {
      const next = prev.filter(p => p.correo.toLowerCase() !== (correo ?? "").toLowerCase());
      setField("Correos", toCorreosConcat(next));
      return next;
    });
  }, [setField, toCorreosConcat]);

  const clearAprobadores = React.useCallback(() => {
    setColCorreosSeleccionado([]);
    setField("Correos", "");
  }, [setField]);

  const onChangeCorreos = React.useCallback((val: string) => {
    setField("Correos", val);
  }, [setField]);

  const Option = (props: OptionProps<UserOptionEx, false>) => {
    const email = props.data.email ?? props.data.value;
    const name = (props.data as any).name ?? props.data.label;
    return (
      <components.Option {...props}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600 }}>{name}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{email}</span>
        </div>
      </components.Option>
    );
  };

  const handleSelectAprobador = (opt: SingleValue<UserOptionEx>) => {
    if (!opt) {
      setSelectedWorker(null);
      return;
    }
    const email = opt.email ?? opt.value;
    const name = (opt as any).name ?? opt.label;
    collectAprobador({ Correo: email, Nombre: name });
    // Limpia la selección para poder añadir más de uno rápido
    setSelectedWorker(null);
  };

  return (
    <section className="cr-page">
      <form className="cr-form" onSubmit={(e) => handleSubmit(e)} noValidate>
        {/* ====== Sección: Datos del correo ====== */}
        <h2 className="cr-sectionTitle">DATOS DEL CORREO</h2>

        <div className="cr-field cr-field--full">
          <label className="cr-label">
            <span className="req">*</span> Aprobadores seleccionados
            <span className="help" aria-label="Correos que deben aprobar">ⓘ</span>
          </label>

          {/* Input con EXACTO resultado de Concat(...) */}
          <input className="cr-input" placeholder="Ej: ana@estudiodemoda.com.co; " value={state.Correos ?? ""} onChange={(e) => onChangeCorreos(e.target.value)}/>

          {/* Chips (visual y edición rápida) */}
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

        {/* ====== React-Select para buscar personas y agregarlas ====== */}
        <div className="cr-field cr-field--full">
          <label className="cr-label">Buscar personas</label>
          <Select<UserOptionEx, false>
            classNamePrefix="rs"
            placeholder={loadingWorkers ? "Cargando opciones…" : "Busca por nombre o correo…"}
            isLoading={loadingWorkers}
            isClearable
            options={workersOptions}
            components={{ Option }}
            value={selectedWorker}
            onChange={handleSelectAprobador}
            noOptionsMessage={() => (usersError ? "Error cargando opciones" : "Sin coincidencias")}
          />
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
