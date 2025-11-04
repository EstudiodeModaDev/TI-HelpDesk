import * as React from "react";
import "./Formulario.css";

export default function FormularioPazSalvo() {
  const [form, setForm] = React.useState({
    aprobadores: "",
    otrosAprobadores: "",
    fechaRetiro: "",
    fechaIngreso: "",
    jefe: "",
    co: "",
    empresa: "",
    nombre: "",
    cargo: "",
    cedula: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: enviar datos
    console.log(form);
  };

  return (
    <section className="cr-page">
      <form className="cr-form" onSubmit={onSubmit} noValidate>
        {/* ====== Sección: Datos del correo ====== */}
        <h2 className="cr-sectionTitle">DATOS DEL CORREO</h2>

        <div className="cr-field cr-field--full">
          <label className="cr-label">
            <span className="req">*</span> Aprobadores
            <span className="help" aria-label="Correos que deben aprobar">ⓘ</span>
          </label>
          <input className="cr-input" placeholder="Buscar correos" value={form.aprobadores} onChange={(e) => set("aprobadores", e.target.value)}/>
        </div>

        <div className="cr-field cr-field--full">
          <label className="cr-label">
            Otros Aprobadores
            <span className="help" aria-label="Aprobadores opcionales">ⓘ</span>
          </label>
          <input className="cr-input" placeholder="Buscar correos" value={form.otrosAprobadores} onChange={(e) => set("otrosAprobadores", e.target.value)}/>
        </div>

        {/* ====== Sección: Empleado ====== */}
        <h2 className="cr-sectionTitle">DATOS DEL EMPLEADO (RETIRADO)</h2>

        <div className="cr-grid">
          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> Fecha de retiro</label>
            <input type="date" className="cr-input" value={form.fechaRetiro} onChange={(e) => set("fechaRetiro", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> Fecha de ingreso</label>
            <input type="date" className="cr-input" value={form.fechaIngreso} onChange={(e) => set("fechaIngreso", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> Jefe directo</label>
            <select className="cr-input" value={form.jefe} onChange={(e) => set("jefe", e.target.value)}>
              <option value="">Buscar elementos</option>
              <option value="j1">Jefe 1</option>
              <option value="j2">Jefe 2</option>
            </select>
          </div>

          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> CO</label>
            <input className="cr-input" value={form.co} onChange={(e) => set("co", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> Empresa</label>
            <input className="cr-input" value={form.empresa} onChange={(e) => set("empresa", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label"><span className="req">*</span> Nombre</label>
            <input className="cr-input" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
          </div>

          <div className="cr-field">
            <label className="cr-label">Cargo</label>
            <input className="cr-input" value={form.cargo} onChange={(e) => set("cargo", e.target.value)}/>
          </div>

          <div className="cr-field">
            <label className="cr-label">Cédula (Tercero)</label>
            <input className="cr-input" value={form.cedula} onChange={(e) => set("cedula", e.target.value)}/>
          </div>
        </div>

        <footer className="cr-actions">
          <button type="button" className="cr-secondary">← Volver</button>
          <button type="submit" className="cr-primary">Enviar</button>
        </footer>
      </form>
    </section>
  );
}
