import React from "react";
import "./TareasForm.css";
import Select, {
  components,
  type OptionProps,
  type FilterOptionOption,
} from "react-select";

import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { TareasService } from "../../../Services/Tareas.service";
import { useTareas } from "../../../Funcionalidades/Tareas";
import { useWorkers } from "../../../Funcionalidades/Workers";
import { useFranquicias } from "../../../Funcionalidades/Franquicias";
import type { UserOptionEx } from "../../NuevoTicket/NuevoTicketForm";
import { norm } from "../../../utils/Commons";

export default function FormTarea() {
  const { Tareas, Franquicias: FranquiciasSvc } = useGraphServices() as ReturnType<typeof useGraphServices> & {
      Tareas: TareasService;
    };
  const { handleSubmit, errors, setField, state, reloadAll } = useTareas(Tareas);
  const {workersOptions, loadingWorkers, error: usersError, } = useWorkers({ onlyEnabled: true });
  const { franqOptions, loading: loadingFranq, error: franqError,} = useFranquicias(FranquiciasSvc);

  // Deduplicación y orden
  const combinedOptions: UserOptionEx[] = React.useMemo(() => {
    const map = new Map<string, UserOptionEx>();
    for (const o of [...workersOptions, ...franqOptions]) {
      const keyRaw = (o as any)?.email || o.value || o.label;
      const key = String(keyRaw ?? "").toLowerCase();
      if (!map.has(key)) map.set(key, o);
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [workersOptions, franqOptions]);

  const userFilter: ((option: FilterOptionOption<UserOptionEx>, rawInput: string) => boolean) = (option, raw) => {
    const q = norm(raw ?? "");
    if (!q) return true;
    const label = option.label ?? "";
    const data = option.data;
    const email = (data as any)?.email ?? "";
    const job = (data as any)?.jobTitle ?? "";
    const haystack = norm(`${label} ${email} ${job}`);
    return haystack.includes(q);
  };

  const Option = (props: OptionProps<UserOptionEx, false>) => {
    const { data, label } = props;
    return (
      <components.Option {...props}>
        <div className="rs-opt">
          <div className="rs-opt__text">
            <span className="rs-opt__title">{label}</span>
            {(data as any).email && (
              <span className="rs-opt__meta">{(data as any).email}</span>
            )}
            {(data as any).jobTitle && (
              <span className="rs-opt__meta">{(data as any).jobTitle}</span>
            )}
          </div>
          {data.source && <span className="rs-opt__tag">{data.source}</span>}
        </div>
      </components.Option>
    );
  };

  const loadingSelect = loadingWorkers || loadingFranq;
  const selectError = usersError || franqError;

  return (
    <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
      <h2 id="ft_title" className="ft-title">Nueva Tarea</h2>

      <form className="ft-form" onSubmit={(e) => {handleSubmit(e); reloadAll()}} noValidate>
        {/* Asunto */}
        <div className="ft-field">
          <label className="ft-label" htmlFor="titulo">Asunto *</label>
          <input id="titulo" name="titulo" type="text" placeholder="Ingrese el asunto del recordatorio (100 caracteres max)" value={state.titulo} onChange={(e) => setField("titulo", e.target.value)} autoComplete="off" required aria-required="true" aria-describedby={errors.titulo ? "err-titulo" : undefined} maxLength={100}/>
          <small id="err-titulo"> {state.titulo.length}/100</small>
          {errors.titulo && (
            <small id="err-titulo" className="error">
              {errors.titulo}
            </small>
          )}
        </div>

        <div className="ft-field">
          <label className="ft-label" htmlFor="descripcion">Descripcion *</label>
          <input id="descripcion" name="descripcion" type="text" placeholder="Ingrese una Nota (300 caracteres max)" value={state.Nota} onChange={(e) => setField("Nota", e.target.value)} autoComplete="off" required aria-required="true" aria-describedby={errors.titulo ? "err-Nota" : undefined} maxLength={300}/>
          <small id="err-titulo"> {state.Nota.length}/300</small>
        </div>

        {/* Solicitante */}
        <div className="ft-field">
          <label className="ft-label" htmlFor="solicitante">Solicitante</label>
          <Select<UserOptionEx, false>
            inputId="solicitante"
            options={combinedOptions}
            placeholder={loadingSelect ? "Cargando opciones…" : "Buscar solicitante…"}
            value={(state.solicitante as UserOptionEx | null) ?? null}
            onChange={(opt) => setField("solicitante", opt ?? null)}
            classNamePrefix="rs"
            isDisabled={loadingSelect}
            isLoading={loadingSelect}
            filterOption={userFilter}
            getOptionValue={(o) => String(o.value ?? (o as any).email ?? o.label)}
            getOptionLabel={(o) => o.label}
            components={{ Option }}
            noOptionsMessage={() =>
              selectError ? "Error cargando opciones" : "Sin coincidencias"
            }
            isClearable
          />
          {errors.solicitante && (
            <small className="error">{errors.solicitante}</small>
          )}
        </div>

      <div className="ft-field">
          <label className="ft-label" htmlFor="encargado">Encargado</label>
          <Select<UserOptionEx, false>
            inputId="encargado"
            options={combinedOptions}
            placeholder={loadingSelect ? "Cargando opciones…" : "Buscar solicitante…"}
            value={(state.Encargado as UserOptionEx | null) ?? null}
            onChange={(opt) => setField("Encargado", opt ?? null)}
            classNamePrefix="rs"
            isDisabled={loadingSelect}
            isLoading={loadingSelect}
            filterOption={userFilter}
            getOptionValue={(o) => String(o.value ?? (o as any).email ?? o.label)}
            getOptionLabel={(o) => o.label}
            components={{ Option }}
            noOptionsMessage={() =>
              selectError ? "Error cargando opciones" : "Sin coincidencias"
            }
            isClearable
          />
          {errors.solicitante && (
            <small className="error">{errors.solicitante}</small>
          )}
        </div>

        {/* Fecha del evento */}
        <fieldset className="ft-fieldset">
          <legend className="ft-legend">Programación del evento</legend>

          <div className="ft-field">
            <label className="ft-label" htmlFor="fecha">Fecha del evento</label>
            <input id="fecha" name="fecha" type="date" value={state.fecha || ""} onChange={(e) => setField("fecha", e.target.value)}/>
          </div>

          <div className="ft-field">
            <label className="ft-label" htmlFor="hora">Hora</label>
            <input id="hora" name="hora" type="time" value={state.hora} onChange={(e) => setField("hora", e.target.value)}/>
          </div>
        </fieldset>

        {/* Días para el recordatorio */}
        <div className="ft-field">
          <label className="ft-label" htmlFor="dias">
            Días para el recordatorio
          </label>
          <select id="dias" name="diasRecordatorio" value={state.diasRecordatorio} onChange={(e) => setField("diasRecordatorio", Number(e.target.value))}>
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
            <option value={7}>7</option>
            <option value={8}>8</option>
          </select>
          {errors.diasRecordatorio && (
            <small className="error">{errors.diasRecordatorio}</small>
          )}
        </div>

        {/* Acciones */}
        <div className="ft-actions">
          <button type="submit" className="ft-btn btn-primary">Crear tarea</button>
        </div>
      </form>
    </section>
  );
}
