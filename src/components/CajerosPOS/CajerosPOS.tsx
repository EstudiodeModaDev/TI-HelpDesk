import "./CajerosPOS.css"; // importa el css que nos diste
import { useCajerosPOS } from "../../Funcionalidades/CajerosPos";
import type { TicketsService } from "../../Services/Tickets.service";
import Select, { type SingleValue } from "react-select";
import type { LogService } from "../../Services/Log.service";

type Props = {
  services: {
    Tickets?: TicketsService;
    Logs: LogService
  };
};

type Option = { value: string; label: string, email?: string };

const companiaOptions: Option[] = [
  { value: "1", label: "Estudio de Moda S.A." },
  { value: "11", label: "DH Retail" },
  { value: "9", label: "Denim Head" },
];

export default function CajerosPOSForm({ services }: Props) {
  const { state, setField, errors, submitting, handleSubmit } = useCajerosPOS(services);

  return (
    <div className="cajeros-pos">
      <h2>Creación de usuario POS</h2>

      <form   onSubmit={(e) => {handleSubmit(e);}} noValidate>

        <div className="cp-fila">
          <div className="cp-campo">
            <label>Solicitante</label>
            <input type="text" value={state.solicitante} onChange={(e) => setField("solicitante", e.target.value)}/>
          </div>
          <div className="cp-campo">
            <label>Correo solicitante</label>
            <input type="text" value={state.CorreoTercero} onChange={(e) => setField("CorreoTercero", e.target.value)}/>
          </div>
        </div>

        {/* Fila 2: Cédula y CO */}
        <div className="cp-fila">
          <div className="cp-campo">
            <label>Cédula</label>
            <input type="text" value={state.Cedula} onChange={(e) => setField("Cedula", e.target.value)} placeholder="Documento del usuario"/>
            { (errors as any).Cedula && (
              <small style={{ color: "#b91c1c" }}>{(errors as any).Cedula}</small>
            )}
          </div>

          <div className="cp-campo">
            <label>CO</label>
            <input type="text" value={state.CO} onChange={(e) => setField("CO", e.target.value)} placeholder="Centro Operativo / Código"/>
            { (errors as any).CO && (
              <small style={{ color: "#b91c1c" }}>{(errors as any).CO}</small>
            )}
          </div>
        </div>

        {/* Fila 3: Compañía y Usuario POS */}

        <div className="cp-fila">
          <div className="cp-campo">
            <label>Compañía</label>
            <Select<Option, false>
              options={companiaOptions}
              placeholder="Selecciona"
              value={companiaOptions.find(o => o.value === state.Compañia) ?? null}
              onChange={(opt: SingleValue<Option>) =>
                setField("Compañia", opt?.value ?? "")
              }
              classNamePrefix="rs"
               isClearable
                        />

            {(errors as any).Compañia && (
              <small style={{ color: "#b91c1c" }}>
                {(errors as any).Compañia}
              </small>
            )}
          </div>
        </div>

        {/* Acción */}
        <div style={{ marginTop: 10 }}>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Procesando…" : "Crear usuario POS"}
          </button>
        </div>
      </form>
    </div>
  );
}


//TODO: Aplicar un paso mas, recibe en el correo de listo x correo, eso lo mueve a una carpeta ultimos 2 digitos de la cedula de la persoan fue como se creo el usuario 
// (Primera inicial nombre 1 y2, apellido 2 ultimos digitos de la cedula) y envia correo con los datos a la persona