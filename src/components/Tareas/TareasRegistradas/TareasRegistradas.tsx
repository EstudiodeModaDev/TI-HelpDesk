import { useTareas } from "../../../Funcionalidades/Tareas";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { TareasService } from "../../../Services/Tareas.service";
import { toISODateTimeFlex } from "../../../utils/Date";
import { useConfirm } from "../../ModalDelete/ConfirmProvider";
import "./TareasRegistradas.css";

type Props = {
  onOpen: () => void;
};

export default function ListaTareas({onOpen}: Props) {
  const { Tareas } = useGraphServices() as ReturnType<typeof useGraphServices> & { Tareas: TareasService };
  const { rows, setFilterMode, filterMode, deleteTask, iniciarTarea, finalizarTarea,} = useTareas(Tareas);
  const confirm = useConfirm();
  async function handleDelete(t: { Id: string; Title?: string }) {
    const ok = await confirm({
      title: "Eliminar tarea",
      message: (
        <>
          ¿Seguro que deseas eliminar <b>{t.Title ?? "esta tarea"}</b>?<br />
          <small>Esta acción no se puede deshacer.</small>
        </>
      ),
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      destructive: true,
    });
    if (!ok) return;

    await deleteTask(t.Id);
    // await reloadAll?.(); // innecesario si deleteTask ya recarga
    setFilterMode((prev: typeof filterMode) => prev); // opcional, fuerza efecto si dependes del filtro
  }

  return (
    <div className="lt-scope">
      <section className="lt-card">
        <header className="lt-header">
          <nav className="lt-tabs" aria-label="Filtros de tareas" role="tablist">
            <button className={`lt-tab ${filterMode === "Pendientes" ? "is-active" : ""}`} role="tab" aria-selected={filterMode === "Pendientes"} onClick={() => setFilterMode("Pendientes")}>
              Pendientes
            </button>
            <button className={`lt-tab ${filterMode === "Iniciadas" ? "is-active" : ""}`} role="tab" aria-selected={filterMode === "Iniciadas"} onClick={() => setFilterMode("Iniciadas")}>
              Iniciadas
            </button>
            <button className={`lt-tab ${filterMode === "Finalizadas" ? "is-active" : ""}`} role="tab" aria-selected={filterMode === "Finalizadas"} onClick={() => setFilterMode("Finalizadas")}>
              Finalizadas
            </button>
            <a className="btn btn-circle btn-circle--sm" onClick={onOpen} aria-label="Nueva tarea">+</a>
          </nav>
          <h2 className="lt-title">Mis Tareas</h2>
        </header>

        <div className="lt-list" role="list">
          {rows.map((t) => (
            <article key={t.Id} className="lt-item" role="listitem">
              <div className="lt-item__head">
                <h3 className="lt-item__title">{t.Title}</h3>
                <span className={`lt-badge ${String(t.Estado ?? "").toLowerCase().replace(/\s+/g, "-")}`} title={t.Estado ?? ""} aria-label={`Estado: ${t.Estado ?? "—"}`} >
                    {t.Estado ?? "—"}
                </span>
              </div>

              <ul className="lt-meta">
                <li><strong>Nota:</strong> {t.Nota}</li>
                <li><strong>Responsable:</strong> {t.Reportadapor}</li>
                <li><strong>Solicitada por:</strong> {t.Quienlasolicita}</li>
                {t.Fechadesolicitud && (
                  <li>
                    <strong>Fecha solicitada:</strong> {toISODateTimeFlex(t.Fechadesolicitud)}
                  </li>
                )}
              </ul>

              <div className="lt-actions">
                {!t.Estado.startsWith("Finalizado") && (
                  t.Estado === "pendiente" ? (
                    <button type="button" className="lt-link" onClick={(e) => {e.stopPropagation(); iniciarTarea(String(t.Id ?? ""));}} aria-label={`Marcar como iniciada el recordatorio ${t?.Id ?? ""}`}>
                      Marcar como iniciada
                    </button>
                  ) : (
                    <button type="button" className="lt-link" onClick={(e) => { e.stopPropagation(); finalizarTarea({Id: String(t.Id ?? ""), Fechadesolicitud: t.Fechadesolicitud ?? "",});}} aria-label={`Marcar como finalizada el recordatorio ${t?.Id ?? ""}`}>
                      Marcar como finalizada
                    </button>
                  )
                )}

                <button className="lt-link danger" type="button" onClick={() => handleDelete({ Id: String(t.Id ?? ""), Title: t.Title })} aria-label={`Eliminar tarea ${t.Title ?? ""}`}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}