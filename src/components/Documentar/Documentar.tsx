import "./Documentar.css";
import type { FranquiciasService } from "../../Services/Franquicias.service";
import { useGraphServices } from "../../graph/GrapServicesContext";
import { UsuariosSPService } from "../../Services/Usuarios.Service";
import type { TicketsService } from "../../Services/Tickets.service";
import RichTextBase64 from "../RichTextBase64/RichTextBase64";
import type { LogService } from "../../Services/Log.service";
import { useAuth } from "../../auth/authContext";
import type { Ticket } from "../../Models/Tickets";
import { useDocumentarTicket } from "../../Funcionalidades/Documentar";
import { usePlantillas } from "../../Funcionalidades/Plantillas";
import type { PlantillasService } from "../../Services/Plantillas.service";
import React from "react";
import EscalamientoInternet from "./EscalamientoProveedor/Escalamiento";
import InfoActaEntrega from "./ActaEntrega/InformacionCaso/InfoActa";
import type { ComprasService } from "../../Services/Compras.service";

export default function Documentar({ ticket, tipo, onDone }: { ticket: Ticket; tipo: "solucion" | "seguimiento"; onDone: () => void | Promise<void>}) {
  const { Tickets: TicketsSvc, Logs: LogsSvc, Plantillas: PlantillasSvc, Compras} =
    (useGraphServices() as ReturnType<typeof useGraphServices> & {
      Franquicias: FranquiciasService;
      Usuarios: UsuariosSPService;
      Tickets: TicketsService;
      Logs: LogService;
      Plantillas: PlantillasService;
      ComprasSvc: ComprasService
    });

  const { account } = useAuth();
  const { state, errors, submitting, setField, handleSubmit } = useDocumentarTicket({ Tickets: TicketsSvc, Logs: LogsSvc, ComprasSvc: Compras });

  // ⬇️ usamos también loading/error por si quieres feedback
  const { ListaPlantillas, loading: loadingPlantillas, error: errorPlantillas } = usePlantillas(PlantillasSvc);

  const [plantillaId, setPlantillaId] = React.useState<string>("");
  const [showEscalar, setShowEscalar] = React.useState<boolean>(false)
  const [showActaEntrega, setShowActaEntrega] = React.useState<boolean>(false)

  const onSelectPlantilla = (id: string) => {
    setPlantillaId(id);
    const p = (ListaPlantillas ?? []).find(pl => pl.Id === id);
    if (!p) return;
    // Asumimos que CamposPlantilla trae HTML listo para el editor
    setField("documentacion", p.CamposPlantilla ?? "");
  };

  return (
    <div className="documentar-form documentar-form--edge">
      <h2 className="documentar-title">
        {showEscalar ? "Escalamiento internet"  : showActaEntrega
          ? "Nueva acta de entrega": null}
      </h2>

      {/* === SOLO DOCUMENTACIÓN CUANDO showEscalar = false === */}
      {!showEscalar && !showActaEntrega ? (
        <form className="documentar-grid">
          {/* Selector de plantilla */}
          <div className="documentar-field documentar-col-2 platilla-field">
            <label className="documentar-label platilla-label" htmlFor="plantilla">Usar plantilla</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select id="plantilla" className="documentar-input platilla-input" value={plantillaId} onChange={(e) => onSelectPlantilla(e.target.value)} disabled={submitting || loadingPlantillas || !ListaPlantillas?.length}>
                <option value="">{loadingPlantillas ? "Cargando plantillas..." : "— Selecciona una plantilla —"}</option>
                {(ListaPlantillas ?? []).map(p => (
                  <option key={p.Id} value={p.Id}>{p.Title}</option>
                ))}
              </select>
              {errorPlantillas && <small className="error">{errorPlantillas}</small>}
            </div>
          </div>

          {/* Documentación */}
          <div className="documentar-field documentar-col-2">
            <label className="documentar-label">Descripción de {tipo}</label>
            <RichTextBase64 value={state.documentacion} onChange={(html) => setField("documentacion", html)} placeholder="Describe el problema y pega capturas (Ctrl+V)…"/>
            {errors.documentacion && <small className="error">{errors.documentacion}</small>}
          </div>

          {/* Archivo */}
          <div className="documentar-field documentar-col-2">
            <label className="documentar-label" htmlFor="archivo">Adjuntar archivo</label>
             <input id="archivo" type="file" onChange={(e) => setField("archivo", e.target.files?.[0] ?? null)} disabled={submitting} className="documentar-input"/>
            {errors.archivo && <small className="error">{errors.archivo}</small>}
          </div>

          {/* Acciones (esquinas) */}
            <div className="documentar-actions documentar-col-2">
              <button type="button" disabled={submitting} className="btn-save btn-primary" onClick={async   (e) => { 
                                                                                                   await handleSubmit(e, tipo, ticket, account!);  
                                                                                                    await onDone(); 
                                                                                                  }}>
                {submitting ? "Enviando..." : "Guardar documentación"}
              </button>

              {/* Escalar: esquina inferior izquierda (secundario) */}
              <button type="button" disabled={submitting} className="btn btn-secondary" onClick={() => setShowEscalar(true)}>
                Escalar a proveedor de internet
              </button>

              {/* Acta: misma esquina, pero un poco más arriba para no montarse */}
              <button type="button" disabled={submitting} className="btn btn-secondary" onClick={() => setShowActaEntrega(true)}>
                Generar Acta de Entrega
              </button>
            </div>
          </form>
      ) : (
        <>
          {/* === SOLO ESCALAMIENTO CUANDO showEscalar = true === */}

          {showEscalar && <EscalamientoInternet ticket={ticket} />}
          {showActaEntrega && <InfoActaEntrega ticket={ticket}/>}

        </>
      )}
    </div>
  );
}
