import * as React from "react";
import { useGraphServices } from "../../graph/GrapServicesContext";
import { useTickets } from "../../Funcionalidades/Tickets";

type Props = { currentId: number | string;
  onCancel: () => void;
  userMail: string;
  isAdmin: boolean;
};

export default function RelacionadorMasiva({onCancel, userMail, isAdmin}: Props) {
  const { Tickets } = useGraphServices();
  const {state, setField, sendFileToFlow} = useTickets(Tickets, userMail, isAdmin);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/Plantilla Masiva Sin Padre.xlsx"; // ruta dentro de public
    link.download = "PlantillaApertura.xlsx";          // nombre con el que se guarda
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div className="relc">
      <div className="relc-row">

        {/* Combobox de tickets */}
        <div className="relc-field relc-field--grow" ref={wrapRef}>
            <div className="relc-combobox" role="combobox" aria-haspopup="listbox" aria-owns="relc-listbox">
                <div className="relc-field">
                    <label htmlFor="archivo" className="relc-label">Cargar Excel de tickets</label>
                    <input id="archivo" type="file" className="relc-native" accept=".xlsx,.xls" onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (!f) { setField("archivo", null); return; }
                        const MAX_MB = 10;
                        if (f.size > MAX_MB * 1024 * 1024) {
                            alert(`Archivo demasiado grande (> ${MAX_MB}MB).`);
                            e.currentTarget.value = ""; // limpia el input
                            return;
                        }
                        setField("archivo", f);
                    }}/>

                {/* Botón para limpiar selección (opcional) */}
                {state.archivo && (
                    <button type="button" className="relc-link" onClick={() => {
                    setField("archivo", null);
                    (document.getElementById("archivo") as HTMLInputElement | null)!.value = "";
                    }}>
                    Quitar archivo
                    </button>
                )}
                </div>
            </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="relc-actions">
        <button type="button" className="btn btn-circle btn-secondary" onClick={onCancel} title="Cancelar" aria-label="Cancelar">
          ×
        </button>
        <button type="button" className="btn btn-circle btn-primary" 
          onClick={async (e) => {
            e.preventDefault();           
            try {
                if (!state.archivo) {
                  alert("Selecciona un archivo .xlsx antes de enviar.");
                  return;
                }
                await sendFileToFlow(state.archivo);
                alert("Archivo enviado al flujo correctamente."); 
                onCancel()   
          } catch (err: any) {
            console.error(err);
            alert(err?.message ?? "Ocurrió un error en la acción.");
          }
        }} title="Confirmar" aria-label="Confirmar">
                ✓
        </button>
        <button type="button" className="btn btn-terciary btnxs" onClick={() => handleDownload()}> Descargar plantilla</button>
      </div>
    </div>
  );
}
