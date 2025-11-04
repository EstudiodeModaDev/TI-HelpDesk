import * as React from "react";
import "./PazSalvo.css"
import PazYSalvos from "./ListaPazSalvos/Lista";
import FormularioPazSalvo from "./FormularioPazSalvos/Formulario";

export default function PazySalvosMode() {
  const [mode, setMode] = React.useState("lista");

  return (
    <div className="pz-page">

      <div className="pz-toolbar">
        <div className="pz-toolbar__right">
          <select  id="orden" className="pz-select" value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Modo">
            <option value="lista">Paz y salvos a responder</option>
            <option value="formulario">Solicitar Paz y Salvo</option>
          </select>
        </div>
      </div>

      {mode === "lista" ? <PazYSalvos /> : <FormularioPazSalvo/>}

    </div>
  );
}
