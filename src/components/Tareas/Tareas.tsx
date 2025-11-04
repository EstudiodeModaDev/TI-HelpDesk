import FormTarea from "./TareasForm/TareasForm";
import ListaTareas from "../Tareas/TareasRegistradas/TareasRegistradas";
import "./TareasPage.css"
import ActivityStatusCard from "./ResumenActividad/ResumenActividad";
import { useGraphServices } from "../../graph/GrapServicesContext";
import type { TareasService } from "../../Services/Tareas.service";
import { useTareas } from "../../Funcionalidades/Tareas";

export default function TareasPage() {

  const {Tareas} = (useGraphServices() as ReturnType<typeof useGraphServices> & {
    Tareas: TareasService
  });
  const { monthlyItems, percentaje, cantidadTareas } = useTareas(Tareas);
  return (
    <div className="tareas-page">
      <FormTarea />
      <ListaTareas/>
      <ActivityStatusCard percent={percentaje} tasks={monthlyItems} taskThisMonth={cantidadTareas}/>
    </div>
  );
}
