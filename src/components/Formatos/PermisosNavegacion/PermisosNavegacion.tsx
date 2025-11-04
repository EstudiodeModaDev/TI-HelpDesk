import * as React from "react";
import { usePermisosNavegacion } from "../../../Funcionalidades/Formatos";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { TicketsService } from "../../../Services/Tickets.service";
import "./PermisosNavegacion.css";
import type { FilaPermisoNav } from "../../../Models/Formatos";

const COLS = [
  { key: "Youtube",    label: "YouTube" },
  { key: "Facebook",   label: "Facebook" },
  { key: "Twitter",    label: "Twitter" },
  { key: "Instagram",  label: "Instagram" },
  { key: "Whatsapp",   label: "WhatsApp" },
  { key: "Wetransfer", label: "Wetransfer" },
  { key: "Pinterest",  label: "Pinterest" },
  { key: "Google Anatytics", label: "Google\nAnalytics" }, // ojo al nombre exacto
  { key: "Google Drive",     label: "Google\nDrive" },
] as const satisfies ReadonlyArray<{ key: keyof FilaPermisoNav; label: string }>;

type ToggleKey = (typeof COLS)[number]["key"];

export default function PermisosNavegacion() {
  const { Tickets: TicketsSvc } =
    (useGraphServices() as ReturnType<typeof useGraphServices> & { Tickets: TicketsService });
  const {filas, sending, error, addFila, removeFila, setCampo, submit,} = usePermisosNavegacion(TicketsSvc);

  function setCampoNav<K extends ToggleKey>(id: string, key: K, value: boolean) {
    setCampo(id, key as K, value as FilaPermisoNav[K]);
  }

  const toggle = React.useCallback(
    (id: string, key: ToggleKey) => {
      const fila = filas.find((x) => x.id === id);
      const current = Boolean(fila?.[key]);
      setCampoNav(id, key, !current);
    },
    [filas]
  );

  return (
    <section className="pn-scope">
      <form className="pn-card" onSubmit={submit} noValidate>
        <h2 className="pn-title">Permisos de navegación</h2>

        <div className="pn-table" role="table">
          <div className="pn-header" role="row">
            <div className="pn-cell" role="columnheader">Empleado</div>
            <div className="pn-cell" role="columnheader">Jefe / Quien autoriza</div>
            {COLS.map((c) => (
              <div key={c.key} className="pn-cell pn-cell--center" role="columnheader">
                {c.label.split("\n").map((l, i) => (
                  <span key={i} className="pn-nowrap">{l}</span>
                ))}
              </div>
            ))}
            <div className="pn-cell" role="columnheader">Otro (Link de la página)</div>
            <div className="pn-cell pn-cell--acciones" role="columnheader"> </div>
          </div>

          {filas.map((f) => (
            <div className="pn-row" role="row" key={f.id}>
              <div className="pn-cell" role="cell">
                <input className="pn-input" value={f.Empleado} onChange={(e) => setCampo(f.id, "Empleado", e.target.value as any)} placeholder=""/>
              </div>

              <div className="pn-cell" role="cell">
                <input className="pn-input" value={f["Jefe / Quien autoriza"]} onChange={(e) => setCampo(f.id, "Jefe / Quien autoriza", e.target.value as any)} placeholder="Jefe / Quien autoriza"/>
              </div>

              {COLS.map((c) => (
                <div key={c.key} className="pn-cell pn-cell--center" role="cell">
                  <input type="checkbox" checked={Boolean(f[c.key])} onChange={() => toggle(f.id, c.key)}/>
                </div>
              ))}

              <div className="pn-cell" role="cell">
                <input className="pn-input" value={f["Otro (Link de la pagina )"] as any} onChange={(e) => setCampo(f.id, "Otro (Link de la pagina )" as any, e.target.value as any)} placeholder="https://…"/>
              </div>

              <div className="pn-cell pn-cell--acciones" role="cell">
                <button type="button" className="pn-btn pn-btn--ghost" onClick={() => removeFila(f.id)} disabled={filas.length === 1} title={filas.length === 1 ? "Debe quedar al menos una fila" : "Eliminar fila"}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="pn-error">{error}</div>}

        <div className="pn-actions">
          <button type="button" className="pn-btn" onClick={() => addFila()}>
            Agregar fila
          </button>
          <button type="submit" className="pn-btn pn-btn--primary" disabled={sending}>
            {sending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </section>
  );
}
