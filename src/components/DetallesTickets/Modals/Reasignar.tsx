import Select, {
  components,
  type OptionProps,
  type FilterOptionOption
} from "react-select";
import "./ModalsStyles.css";
import type { UserOption } from "../../../Models/Commons";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import { useUsuarios } from "../../../Funcionalidades/Usuarios";
import { UsuariosSPService } from "../../../Services/Usuarios.Service";
import { useReasignarTicket } from "../../../Funcionalidades/Reasignar";
import type { Ticket } from "../../../Models/Tickets";
import type { LogService } from "../../../Services/Log.service";
import { norm } from "../../../utils/Commons";

type UserOptionEx = UserOption & {
  source?: "Empleado" | "Franquicia";
  email?: string;
  jobTitle?: string;
};

export default function Reasignar({ ticket }: { ticket: Ticket }) {
  const { Usuarios: UsuariosSPServiceSvc, Logs: LogSvc } =
    (useGraphServices() as ReturnType<typeof useGraphServices> & {
      Logs: LogService;
      Usuarios: UsuariosSPService;
    });

  const { state, errors, submitting, setField, handleReasignar } =
    useReasignarTicket({ Usuarios: UsuariosSPServiceSvc, Logs: LogSvc }, ticket);

  const { UseruserOptions, loading, error } = useUsuarios(UsuariosSPServiceSvc!);

  // filtro insensible a acentos
  const userFilter = (option: FilterOptionOption<UserOptionEx>, raw: string) => {
    const q = norm(raw);
    if (!q) return true;
    const label = option?.label ?? "";
    const data = option?.data as UserOptionEx | undefined;
    const email = data?.email ?? "";
    const job = data?.jobTitle ?? "";
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
            {data.email && <span className="rs-opt__meta">{data.email}</span>}
            {data.jobTitle && <span className="rs-opt__meta">{data.jobTitle}</span>}
          </div>
          {data.source && <span className="rs-opt__tag">{data.source}</span>}
        </div>
      </components.Option>
    );
  };

  const selectId = "select-resolutor";
  const noteId = "reasignacion-nota";
  const nota = state.Nota ?? "";
  const maxLen = 500;

  return (
    <div className="dta-form">
      <h2 className="dta-title">Reasignar Ticket</h2>

      <form onSubmit={handleReasignar} noValidate className="tf-grid">
        {/* Resolutor */}
        <div className="dta-field">
          <label className="dta-label" htmlFor={selectId}>Nuevo Resolutor</label>
          <Select<UserOptionEx, false>
            inputId={selectId}
            options={UseruserOptions as UserOptionEx[]}
            placeholder={loading ? "Cargando usuarios…" : "Buscar resolutor…"}
            value={state.resolutor as UserOptionEx | null}
            onChange={(opt) => setField("resolutor", opt ?? null)}
            classNamePrefix="rs"
            isDisabled={submitting || loading}
            isLoading={loading}
            loadingMessage={() => "Cargando…"}
            filterOption={userFilter}
            components={{ Option }}
            noOptionsMessage={() => (error ? "Error cargando usuarios" : "Sin coincidencias")}
            isClearable
            aria-invalid={Boolean(errors.resolutor) || undefined}
          />
          {errors.resolutor && <small className="error">{errors.resolutor}</small>}
        </div>

        {/* Nota (razón de la reasignación) */}
        <div className="dta-field">
          <label className="rf-label" htmlFor={noteId}>Nota (razón de la reasignación)</label>
          <textarea id={noteId} className="dta-textarea" placeholder="Explica brevemente por qué reasignas este ticket…" value={nota} maxLength={maxLen} onChange={(e) => setField("Nota", e.target.value)} rows={4} disabled={submitting}/>
          <div className="dta-help" id={`${noteId}-help`}>Esta nota se enviará junto con la reasignación.</div>
          <div className="dta-counter" id={`${noteId}-counter`}> {nota.length}/{maxLen} </div>
          {errors.Nota && <small className="error">{errors.Nota}</small>}
        </div>

        {/* Submit */}
        <div className="dta-actions rf-col-2">
          <button type="submit" disabled={submitting || loading} className="btn-primary">
            {submitting ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>
      </form>
    </div>
  );
}