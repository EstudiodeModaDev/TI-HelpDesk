import * as React from "react";
import Select from "react-select";
import type { ticketOption } from "../../../../Models/Tickets";
import { useTickets } from "../../../../Funcionalidades/Tickets/hooks/useTickets";
import { useGraphServices } from "../../../../graph/GrapServicesContext";
import { useRepositories } from "../../../../repositories/repositoriesContext";
import "./RelacionadorInline.css";

export type TicketLite = { ID: number | string; Title: string };
type Mode = "padre" | "hijo" | "masiva";

type Props = {
  currentId: number | string;
  onCancel: () => void;
  reload: () => void;
  userMail: string;
  role: string;
};

export default function RelacionadorInline({
  currentId,
  onCancel,
  reload,
  userMail,
  role,
}: Props) {
  const [mode, setMode] = React.useState<Mode>("padre");
  const [tickets, setTickets] = React.useState<ticketOption[]>([]);
  const { graph } = useGraphServices();
  const { tickets: ticketSvc } = useRepositories();
  const { toTicketOptions, state, setField, handleCreateRelation, uploadMasiva,} = useTickets({ graph, TicketsSvc: ticketSvc!, userMail, role });

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const options = await toTicketOptions();
        if (alive) setTickets(options);
      } catch (error) {
        console.error("Error cargando tickets para relacionar:", error);
      }
    })();

    return () => {
      alive = false;
    };
  }, [toTicketOptions]);

  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div className="relc">
      <div className="relc-row">
        <label className="relc-field">
          <span className="relc-field__label">Relacion</span>
          <select className="relc-native" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="padre">Padre de</option>
            <option value="hijo">Hijo de</option>
            <option value="masiva">Masiva</option>
          </select>
        </label>

        <div className="relc-field relc-field--grow" ref={wrapRef}>
          <div className="relc-combobox" role="combobox" aria-haspopup="listbox" aria-owns="relc-listbox">
            {mode === "padre" || mode === "hijo" ? (
              <div className="relc-field">
                <label className="relc-label">Ticket</label>
                <Select<ticketOption, false>
                  options={tickets}
                  placeholder="Buscar ticket"
                  value={state.TicketRelacionar}
                  onChange={(opt) => setField("TicketRelacionar", opt ?? null)}
                  classNamePrefix="rs"
                  isClearable
                />
              </div>
            ) : (
              <div className="relc-field">
                <label htmlFor="archivo" className="relc-label">
                  Cargar Excel de tickets
                </label>
                <input
                  id="archivo"
                  type="file"
                  className="relc-native"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (!file) {
                      setField("archivo", null);
                      return;
                    }

                    const maxMb = 10;
                    if (file.size > maxMb * 1024 * 1024) {
                      alert(`Archivo demasiado grande (> ${maxMb}MB).`);
                      e.currentTarget.value = "";
                      return;
                    }

                    setField("archivo", file);
                  }}
                />

                {state.archivo && (
                  <button
                    type="button"
                    className="relc-link"
                    onClick={() => {
                      setField("archivo", null);
                      const input = document.getElementById("archivo") as HTMLInputElement | null;
                      if (input) input.value = "";
                    }}
                  >
                    Quitar archivo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relc-actions">
        <button
          type="button"
          className="btn btn-circle btn-secondary"
          onClick={onCancel}
          title="Cancelar"
          aria-label="Cancelar"
        >
          x
        </button>
        <button
          type="button"
          className="btn btn-circle btn-primary"
          onClick={async (e) => {
            e.preventDefault();

            try {
              if (mode === "masiva") {
                if (!state.archivo) {
                  alert("Selecciona un archivo .xlsx antes de continuar.");
                  return;
                }

                await uploadMasiva(state.archivo,);
                await reload();
                onCancel();
                return;
              }

              const related = state.TicketRelacionar?.value ?? "";
              if (!related) {
                alert("Elige un ticket a relacionar.");
                return;
              }

              const ok = await handleCreateRelation(currentId, related, mode);
              if (!ok) return;

              await reload();
              onCancel();
            } catch (error: any) {
              console.error(error);
              alert(error?.message ?? "Ocurrio un error en la accion.");
            }
          }}
          title="Confirmar"
          aria-label="Confirmar"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
