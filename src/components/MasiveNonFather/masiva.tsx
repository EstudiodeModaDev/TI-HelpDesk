import * as React from "react";
import { useTickets } from "../../Funcionalidades/Tickets/hooks/useTickets";
import { useGraphServices } from "../../graph/GrapServicesContext";
import { useRepositories } from "../../repositories/repositoriesContext";

type Props = {
  currentId: number | string;
  onCancel: () => void;
  userMail: string;
  role: string;
};

export default function RelacionadorMasiva({ onCancel, userMail, role }: Props) {
  const { graph } = useGraphServices();
  const { tickets } = useRepositories();
  const { state, setField, uploadMasiva } = useTickets({
    graph,
    role,
    TicketsSvc: tickets!,
    userMail,
  });

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/Plantilla Masiva.xlsx";
    link.download = "PlantillaApertura.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div className="relc">
      <div className="relc-row">
        <div className="relc-field relc-field--grow" ref={wrapRef}>
          <div className="relc-combobox" role="combobox" aria-haspopup="listbox" aria-owns="relc-listbox">
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
              if (!state.archivo) {
                alert("Selecciona un archivo .xlsx antes de continuar.");
                return;
              }

              await uploadMasiva(state.archivo);
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
        <button type="button" className="btn btn-terciary btnxs" onClick={handleDownload}>
          Descargar plantilla
        </button>
      </div>
    </div>
  );
}
