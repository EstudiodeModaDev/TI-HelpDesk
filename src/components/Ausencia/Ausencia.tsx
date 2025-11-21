import React, { useState } from "react";
import "./Ausencia.css";

export interface EventFormValues {
  title: string;
  requiredAttendees: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  location: string;
  description: string;
}

type Props = {
  isOpen?: boolean; // si no lo mandas, asume true
  onSave?: (values: EventFormValues) => void;
  onDiscard?: () => void;
  onClose?: () => void; // cerrar modal (click fuera, descartAR, etc.)
};

const todayISO = new Date().toISOString().slice(0, 10);

const TeamsEventForm: React.FC<Props> = ({isOpen = true, onSave, onDiscard, onClose,}) => {
  const [values, setValues] = useState<EventFormValues>({
    title: "",
    requiredAttendees: "",
    startDate: todayISO,
    startTime: "17:30",
    endDate: todayISO,
    endTime: "18:00",
    allDay: false,
    location: "",
    description: "",
  });

  if (!isOpen) return null;

  const handleChange =
    (field: keyof EventFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(values);
    onClose?.();
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
        <form className="cal-card" onSubmit={handleSave}>
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
              <button type="submit" className="btn btn-primary-final btn-xs">
                Guardar
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="cal-body">
            {/* Título */}
            <div className="cal-field">
                <label className="cal-label">Motivo de la ausencia</label>
                <input className="cal-input cal-input--title" type="text" placeholder="Escriba un motivo de la ausencia" value={values.title} onChange={handleChange("title")}/>
            </div>

            {/* Fecha/hora inicio */}
            <div className="cal-field">
              <label className="cal-label">Inicio</label>
              <div className="cal-datetime-row">
                <input className="cal-input cal-input--date" type="date" value={values.startDate} onChange={handleChange("startDate")}/>
                <input className="cal-input cal-input--time" type="time" value={values.startTime} onChange={handleChange("startTime")} disabled={values.allDay} />
              </div>
            </div>

            {/* Fecha/hora fin */}
            <div className="cal-field">
              <label className="cal-label">Finaliza</label>
              <div className="cal-datetime-row">
                <input className="cal-input cal-input--date" type="date" value={values.endDate} onChange={handleChange("endDate")}/>
                <input className="cal-input cal-input--time" type="time" value={values.endTime} onChange={handleChange("endTime")} disabled={values.allDay}/>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamsEventForm;
