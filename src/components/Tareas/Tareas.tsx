import FormTarea from "./TareasForm/TareasForm";
import ListaTareas from "../Tareas/TareasRegistradas/TareasRegistradas";
import "./TareasPage.css"
import ActivityStatusCard from "./ResumenActividad/ResumenActividad";
import { useGraphServices } from "../../graph/GrapServicesContext";
import type { TareasService } from "../../Services/Tareas.service";
import { useTareas } from "../../Funcionalidades/Tareas";
import React from "react";

export default function TareasPage() {

  const {Tareas} = (useGraphServices() as ReturnType<typeof useGraphServices> & {Tareas: TareasService});
  const { monthlyItems, percentaje, cantidadTareas } = useTareas(Tareas);
  const [open, setOpen] = React.useState<boolean>(false);
  return (
    <div className="tareas-page">

      <div className="fila-1">
      <ListaTareas onOpen={() => setOpen(true)}/>
      <ActivityStatusCard percent={percentaje} tasks={monthlyItems} taskThisMonth={cantidadTareas}/>
      </div>

      <FormTareaModal open={open} onClose={() => setOpen(false)}/>
    </div>
  );
}


type FormTareaModalProps = {
  open: boolean;
  onClose: () => void;
};

export function FormTareaModal({ open, onClose }: FormTareaModalProps) {
  if (!open) return null;

  return (
    <div className="ft-modal is-open" role="dialog" aria-modal="true" aria-labelledby="ft_title">
      <div className="ft-modal__backdrop" onClick={onClose} />

      <div className="ft-modal__dialog">
        <button type="button" className="ft-modal__close" aria-label="Cerrar" onClick={onClose} >
          ×
        </button>
        <FormTarea />
      </div>
    </div>
  );
}
