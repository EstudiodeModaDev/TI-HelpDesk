// src/components/Formatos/Formatos.tsx
import { useState } from "react";
import "./Formatos.css";
import SolicitudUsuarioForm from "./ServiciosTI/ServiciosTI";
import SolicitudesRed from "./Seguridad de red/SeguridadRed";
import SolicitudERP from "./SeguridadERP/SeguridadERP";
import PermisosNavegacion from "./PermisosNavegacion/PermisosNavegacion";
import type { OpcionSolicitud } from "../../Models/Formatos";

const OPCIONES: OpcionSolicitud[] = ["Solicitud de servicios de TI", "FR Admin seguridad unidad de red", "FR Administrador seguridad ERP", "Permisos de navegacion",] as const;

const TYC_BY_OPCION: Record<OpcionSolicitud, string> = {
  "Solicitud de servicios de TI": `
    <p>Importante:</p>
    <ul>
      <li>La solicitud debe realizarse como minimo con 8 días hábiles de anticipación.</li>
      <li>En caso de que se requiera la compra del equipo u otro implemento el tiempo de entrega está sujeto a disponibilidad por parte del proveedor.</li>
      <li>La solicitud debe ser realizada por el jefe inmediato o responsable del área.</li>
      <li>Marcar únicamente los ítems requeridos para las funciones que va a desempeñar el usuario.</li>
    </ul>
    <p><strong>NOTA: </strong>Favor diligenciar el formato en su totalidad (nombres y apellidos completos). Esto con el fin de evitar reprocesos solicitando la información faltante.</p>
  `,
  "FR Admin seguridad unidad de red": `
    <p>Recuerda:</p>
        <ul>
          <li>El equipo de TI tiene un total de 8 horas HABILES para responder y solucionar su solicitud.</li>
          <li>En el campo persona debe escoger la persona que requiere el permiso.</li>
          <li>En el campo permiso debe especificar si requiere un permiso de lectura o de escritura sobre la carpeta.</li>
          <li>En el campo observaciones debe indicar alguna observaciones si lo requiere.</li>
          <li>La solicitud debe ser realizada por el jefe inmediato o responsable del área.</li>
        </ul>
    <p><strong>NOTA: </strong>Favor diligenciar el formato en su totalidad (nombres y apellidos completos). Esto con el fin de evitar reprocesos solicitando la información faltante.</p>
  `,
  "FR Administrador seguridad ERP": `
    <p>Recuerda:</p>
        <ul>
          <li>El equipo de TI tiene un total de 8 horas HABILES para responder y solucionar su solicitud.</li>
          <li>En el campo persona debe escoger la persona que requiere el permiso.</li>
          <li>En el campo permiso debe especificar si requiere un permiso de lectura o de escritura sobre la carpeta.</li>
          <li>En el campo observaciones debe indicar alguna observaciones si lo requiere.</li>
          <li>La solicitud debe ser realizada por el jefe inmediato o responsable del área.</li>
        </ul>
    <p><strong>NOTA: </strong> Favor diligenciar el formato en su totalidad (nombres y apellidos completos). Esto con el fin de evitar reprocesos solicitando la información faltante.</p>
  `,
  "Permisos de navegacion": `
    <p>Recuerda:</p>
        <ul>
          <li>El equipo de TI tiene un total de 8 horas HABILES para responder y solucionar su solicitud.</li>
          <li>Por favor marque los sitios a los que el usuario requiere acceso.</li>
          <li>Si requiere acceso a otro sitio web escriba la URL.</li>
          <li>La solicitud debe ser realizada por el jefe inmediato o responsable del área.</li>
        </ul>
    <p><strong>NOTA: </strong> Favor diligenciar el formato en su totalidad (nombres y apellidos completos). Esto con el fin de evitar reprocesos solicitando la información faltante.</p>
  `,
};

export default function Formatos() {
  const [opcion, setOpcion] = useState<OpcionSolicitud | null>("Solicitud de servicios de TI");
  const [acepta, setAcepta] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  const confirmar = () => {
    if (opcion && acepta) setConfirmado(true);
  };

  // Enrutamiento al formulario según la opción elegida
  if (confirmado && opcion) {
    if (opcion === "Solicitud de servicios de TI") {
      return <SolicitudUsuarioForm />;
    }

    if (opcion === "FR Admin seguridad unidad de red") {
      return <SolicitudesRed />;
    }

    if (opcion === "FR Administrador seguridad ERP") {
      return <SolicitudERP  />;
    }

    if (opcion === "Permisos de navegacion") {
      return <PermisosNavegacion/>;
    }
  }

  // Pantalla inicial: selector + TyC
  return (
    <section className="tg-card tg-scope">
      <label className="tg-label" htmlFor="tg_select">Tipo de solicitud</label>

      <select
        id="tg_select"
        className="tg-select"
        value={opcion ?? ""}
        onChange={(e) => {
          setOpcion((e.target.value || null) as OpcionSolicitud | null);
          setAcepta(false);
          setConfirmado(false);
        }}
      >
        <option value="">Selecciona una opción…</option>
        {OPCIONES.map((op) => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>

      {opcion && (
        <div className="tg-terms">
          <h3>Términos y condiciones</h3>

          {/* Aquí se pintan los TyC según la opción seleccionada */}
          <div
            className="tg-terms-text"
            dangerouslySetInnerHTML={{ __html: TYC_BY_OPCION[opcion] }}
          />

          <label className="tg-check">
            <input
              type="checkbox"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
            />
            <span>Acepto los términos y condiciones</span>
          </label>

          <div className="tg-actions">
            <button className="tg-btn-primary" onClick={confirmar} disabled={!acepta}>
              Continuar
            </button>
            <button
              className="tg-btn-ghost"
              type="button"
              onClick={() => {
                setOpcion(null);
                setAcepta(false);
                setConfirmado(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
