import * as React from "react";
import "./SolicitudPendientesForm.css";
import RichTextBase64 from "../../RichTextBase64/RichTextBase64";

type Archivo = { id: string; nombre: string; file: File };

type Props = {
  onSubmit?: (payload: {
    area: string;
    estado: string;
    archivos: Archivo[];
  }) => void;
  onCancel?: () => void;
};

export default function SolicitudPendientesForm({ onSubmit, onCancel }: Props) {
  const [area, setArea] = React.useState("");
  const [estado, setEstado] = React.useState("");
  const [archivos, setArchivos] = React.useState<Archivo[]>([]);
  // ===== Archivos =====
  const onArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const toAdd = files.map((f) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2)}`,
      nombre: f.name,
      file: f,
    }));
    setArchivos((prev) => [...prev, ...toAdd]);
    e.currentTarget.value = ""; // reset
  };

  const removeArchivo = (id: string) => {
    setArchivos((prev) => prev.filter((a) => a.id !== id));
  };

  // ===== Submit =====
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ area, estado, archivos });
  };

  return (
    <section className="sp-page">
      <form className="sp-form" onSubmit={handleSubmit} noValidate>
        {/* Fila: Área / Estado */}
        <div className="sp-row">
          <div className="sp-field">
            <label className="sp-label">Area</label>
            <input className="sp-input" placeholder="" value={area} onChange={(e) => setArea(e.target.value)}/>
          </div>

          <div className="sp-field">
            <label className="sp-label">Estado</label>
            <select className="sp-input" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Buscar elementos</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        {/* Motivo (Editor) */}
        <div className="sp-field sp-field--full">
            <RichTextBase64 value={""} onChange={(html) => console.log(html)} placeholder="Describe la situación..."/>
        </div>

        {/* Datos adjuntos */}
        <div className="sp-field sp-field--full">
          <h3 className="sp-subtitle">Datos adjuntos</h3>
          <div className="sp-attachments">
            <div className="sp-attachments-body">
              {archivos.length === 0 ? (
                <div className="sp-empty">No hay nada adjunto.</div>
              ) : (
                <ul className="sp-files">
                  {archivos.map((a) => (
                    <li key={a.id} className="sp-file">
                      <span className="sp-file-icon">📎</span>
                      <span className="sp-file-name">{a.nombre}</span>
                      <button type="button" className="sp-file-remove" onClick={() => removeArchivo(a.id)}>
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label className="sp-upload">
              <span className="sp-upload-icon">📎</span>
              <span>Adjuntar un archivo</span>
              <input type="file" multiple onChange={onArchivoChange} />
            </label>
          </div>
        </div>

        {/* Acciones */}
        <footer className="sp-actions">
          <button type="button" className="sp-btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="sp-btn-primary">
            Enviar
          </button>
        </footer>
      </form>
    </section>
  );
}
