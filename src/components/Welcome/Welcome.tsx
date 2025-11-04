import "./Welcome.css";

export default function WelcomeSolvi() {
  return (
    <section className="ws-hero">
      <div className="ws-container">
        <h1 className="ws-title">
          Bienvenido a <span className="ws-brand">Solvi</span>
        </h1>
        <p className="ws-subtitle">
          Inicia sesión para encontrar tu solución
        </p>

        <div className="ws-actions">
          <button className="ws-ghost" onClick={() => window.open("mailto:listo@estudiodemoda.com", "_blank")}>
            ¿Necesitas ayuda?
          </button>
        </div>
      </div>

      {/* Decoración sutil */}
      <div className="ws-bubble ws-b1" aria-hidden />
      <div className="ws-bubble ws-b2" aria-hidden />
      <div className="ws-bubble ws-b3" aria-hidden />
    </section>
  );
}
