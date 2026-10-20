import Select, { components, type FilterOptionOption, type OptionProps } from "react-select";
import "./ModalsStyles.css";
import "./Reasignar.css";
import type { Ticket } from "../../../Models/Tickets";
import { norm } from "../../../utils/Commons";
import { useRepositories } from "../../../repositories/repositoriesContext";
import { useReasignarTicket, type ResolutorOption } from "../../../Funcionalidades/Tickets/Reasignar";

type ReasignarProps = {
  ticket: Ticket;
  onCancel: () => void;
  onDone: () => void;
};

const isDisponible = (o?: ResolutorOption | null) =>
  String(o?.disponible ?? "").trim().toLowerCase() === "disponible";

// filtro insensible a acentos
const resolutorFilter = (option: FilterOptionOption<ResolutorOption>, raw: string) => {
  const q = norm(raw);
  if (!q) return true;
  const d = option.data;
  return norm(`${d.label} ${d.email ?? ""} ${d.jobTitle ?? ""}`).includes(q);
};

const Option = (props: OptionProps<ResolutorOption, false>) => {
  const { data, label } = props;
  return (
    <components.Option {...props}>
      <div className="ra-opt">
        <div className="ra-opt__text">
          <span className="ra-opt__title">{label}</span>
          {data.email && <span className="ra-opt__meta">{data.email}</span>}
          <span className="ra-opt__meta">
            {data.jobTitle ? `${data.jobTitle} · ` : ""}{data.casos ?? 0} casos asignados
          </span>
        </div>
        {data.disponible && (
          <span className={`ra-badge ${isDisponible(data) ? "ra-badge--ok" : "ra-badge--off"}`}>{data.disponible}</span>
        )}
      </div>
    </components.Option>
  );
};

export default function Reasignar({ ticket, onCancel, onDone }: ReasignarProps) {
  const { tickets, usuarios, logs } = useRepositories();

  const {
    state, setField, errors, submitting, isCerrado,
    resolutores, loadingResolutores, errorResolutores, handleReasignar,
  } = useReasignarTicket({ Tickets: tickets!, Usuarios: usuarios!, Logs: logs }, ticket, onDone);

  const nuevo = state.resolutor as ResolutorOption | null;
  const disabled = submitting || isCerrado;

  return (
    <div className="ra-card">
      <div className="ra-head">
        <span className="ra-icon" aria-hidden="true">⇄</span>
        <div>
          <h2 className="ra-title">Reasignar ticket #{ticket.ID}</h2>
          <p className="ra-subtitle">
            El cambio se aplica de inmediato y se notifica por correo al nuevo resolutor y al solicitante.
          </p>
        </div>
      </div>

      {isCerrado && <div className="ra-alert">Este ticket está cerrado y no puede reasignarse.</div>}

      {/* Resumen del cambio */}
      <div className="ra-swap">
        <div className="ra-person">
          <span className="ra-person__label">Resolutor actual</span>
          <span className="ra-person__name">{ticket.Nombreresolutor || "Sin asignar"}</span>
          {ticket.Correoresolutor && <span className="ra-person__mail">{ticket.Correoresolutor}</span>}
        </div>
        <span className="ra-arrow" aria-hidden="true">→</span>
        <div className={`ra-person ${nuevo ? "ra-person--new" : "ra-person--empty"}`}>
          <span className="ra-person__label">Nuevo resolutor</span>
          <span className="ra-person__name">{nuevo?.label ?? "Por seleccionar"}</span>
          {nuevo?.email && <span className="ra-person__mail">{nuevo.email}</span>}
        </div>
      </div>

      <form className="ra-form" onSubmit={handleReasignar} noValidate>
        <div className="ra-field">
          <label className="ra-label" htmlFor="ra-resolutor">Nuevo resolutor</label>
          <Select<ResolutorOption, false>
            inputId="ra-resolutor"
            options={resolutores.filter((r) => r.disponible === "Disponible" && r.jobTitle !== "developer")}
            placeholder={loadingResolutores ? "Cargando resolutores…" : "Buscar por nombre o correo…"}
            value={nuevo}
            onChange={(opt) => setField("resolutor", opt ?? null)}
            classNamePrefix="rs"
            isDisabled={disabled || loadingResolutores}
            isLoading={loadingResolutores}
            loadingMessage={() => "Cargando…"}
            filterOption={resolutorFilter}
            components={{ Option }}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            menuPlacement="auto"
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 10000 }) }}
            noOptionsMessage={() => (errorResolutores ? "Error cargando resolutores" : "Sin coincidencias")}
            isClearable
            aria-invalid={Boolean(errors.resolutor) || undefined}
          />
          {nuevo && !isDisponible(nuevo) && nuevo.disponible && (
            <span className="ra-hint">Este resolutor figura como "{nuevo.disponible}". La reasignación se hará de todas formas.</span>
          )}
          <span className="ra-error">{errors.resolutor}</span>
        </div>

        {errors.general && <div className="ra-alert">{errors.general}</div>}

        <div className="ra-actions">
          <button type="button" className="btn btn-secondary-final" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary-final" disabled={disabled || loadingResolutores}>
            {submitting ? "Reasignando…" : "Reasignar ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
