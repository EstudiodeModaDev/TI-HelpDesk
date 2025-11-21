import React, { useState } from "react";
import "./Ausencia.css";
import { useGraphServices } from "../../graph/GrapServicesContext";
import type { AusenciaService } from "../../Services/Ausencia.service";
import { useAusencias } from "../../Funcionalidades/Ausencias";
import { toIsoFromDateTime } from "../../utils/Date";

export interface EventFormValues {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

type Props = {
  isOpen?: boolean; // si no lo mandas, asume true
  onSave?: (values: EventFormValues) => void;
  onDiscard?: () => void;
  onClose?: () => void; // cerrar modal (click fuera, descartAR, etc.)
};

const todayISO = new Date().toISOString().slice(0, 10);

const TeamsEventForm: React.FC<Props> = ({isOpen = true, onDiscard, onClose,}) => {
  const {Ausencias} = (useGraphServices() as ReturnType<typeof useGraphServices> & {Ausencias: AusenciaService;});
  const { state, errors, submitting, setField, handleSubmit } = useAusencias({Ausencias: Ausencias });
  
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [values, setValues] = useState<EventFormValues>({
    startDate: todayISO,
    startTime: currentTime, // ⬅️ hora actual
    endDate: todayISO,
    endTime: currentTime,   // ⬅️ hora actual
  });


  const buildRange = () => {
    const startDateTimeISO = toIsoFromDateTime(values.startDate, values.startTime);
    const endDateTimeISO   = toIsoFromDateTime(values.endDate, values.endTime);

    setField("Fechadeinicio", startDateTimeISO);
    setField("Fechayhora", endDateTimeISO)
  };

  if (!isOpen) return null;

  const handleChange = (field: keyof EventFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleDiscard = () => {
    onDiscard?.();
    onClose?.();
  };

  const handleBackdropClick = () => {
    onClose?.();
  };

  const stopPropagation: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="cal-modal-backdrop" onClick={handleBackdropClick}>
      <div className="cal-modal" onClick={stopPropagation}>
        <form className="cal-card">
          {/* Header */}
          <header className="cal-header">
            <div className="cal-header__left">
              <span className="cal-header__dot" />
              <span className="cal-header__title">Reportar ausencia</span>
            </div>

            <div className="cal-header__actions">
              <button type="button" className="btn btn-secondary-final btn-xs" onClick={handleDiscard}>
                Descartar
              </button>
              <button type="submit" className="btn btn-primary-final btn-xs" onClick={(e) => {buildRange(); handleSubmit(e)}}>
                {submitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="cal-body">
            {/* Título */}
            <div className="cal-field">
                <label className="cal-label">Motivo de la ausencia</label>
                <input className="cal-input cal-input--title" type="text" placeholder="Escriba un motivo de la ausencia" value={state.Descripcion} onChange={(e) => setField("Descripcion", e.target.value)}/>
                <small>{errors.Descripcion}</small>
            </div>

            {/* Fecha/hora inicio */}
            <div className="cal-field">
              <label className="cal-label">Inicio</label>
              <div className="cal-datetime-row">
                <input className="cal-input cal-input--date" type="date" value={values.startDate} onChange={handleChange("startDate")}/>
                <input className="cal-input cal-input--time" type="time" value={values.startTime} onChange={handleChange("startTime")}  />
              </div>
              <small className="error">{errors.Fechadeinicio}</small>
            </div>

            {/* Fecha/hora fin */}
            <div className="cal-field">
              <label className="cal-label">Finaliza</label>
              <div className="cal-datetime-row">
                <input className="cal-input cal-input--date" type="date" value={values.endDate} onChange={handleChange("endDate")}/>
                <input className="cal-input cal-input--time" type="time" value={values.endTime} onChange={handleChange("endTime")}/>
                
              </div>
              <small className="error">{errors.Fechayhora}</small>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamsEventForm;
