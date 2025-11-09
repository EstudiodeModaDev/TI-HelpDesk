import * as React from "react";
import "./Welcome.css";
import { useTips } from "../../Funcionalidades/Anuncementes";
import securityIcon from "../../assets/security.svg"
import infoIcon from "../../assets/infoTip.svg"
import type { TipUI } from "../../Models/Tips";

export type SolviAuthLandingProps = {
  onLogin: () => void;                  // handler del botón
  productName?: string;                 // texto grande (por defecto SOLVI)
  announcements?: TipUI[];       // tarjetas informativas del panel izquierdo
  footer?: React.ReactNode;             // pie de página del panel derecho
};

export default function SolviAuthLanding({onLogin, productName = "SOLVI", footer,}: SolviAuthLandingProps) {
  const { tipsUI, obtenerTipsLogOut} = useTips();
    React.useEffect(() => {
        obtenerTipsLogOut();
    }, [obtenerTipsLogOut]);

  return (
    <section className="solvi-auth" aria-label="Página de inicio de sesión">
      {/* Panel izquierdo: branding + avisos */}
      <aside className="solvi-left" aria-label="Información de la plataforma">
        <div className="solvi-left__inner">
          <h1 className="brand" aria-label={productName}>{productName}</h1>
          <p className="tagline">Plataforma de soporte y seguimiento de incidencias. Eficiencia, trazabilidad y foco en el usuario.</p>

          <div className="cards">
            {tipsUI.map((a, i) => (
              <article className="card" key={i} role="note" aria-label={a.title}>
                <div className="card__icon" aria-hidden><img src={defaultIcon(a.TipoAnuncio)} alt="" /></div>
                <div className="card__body">
                  <div className="card__title">{a.title}</div>
                  {a.subtitle && <div className="card__subtitle">{a.subtitle}</div>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </aside>

      {/* Panel derecho: CTA de login */}
      <main className="solvi-right">
        <div className="solvi-right__inner">
          <div className="welcome">
            <span className="kicker">Bienvenido</span>
            <h2 className="title">Iniciar sesión</h2>
            <p className="subtitle">Usa tus credenciales corporativas</p>
          </div>

          <button className="btn-primary" onClick={onLogin} aria-label="Iniciar sesión">
            Iniciar sesión
          </button>

          <div className="footer">{footer ?? <>© {new Date().getFullYear()} {productName}</>}</div>
        </div>
      </main>
    </section>
  );
}

function defaultIcon(tipo: string){
  switch (tipo) {
    case "Seguridad":
      return securityIcon;
    case "Información":
      return infoIcon;
    default:
      return infoIcon; // fallback
  }
}
