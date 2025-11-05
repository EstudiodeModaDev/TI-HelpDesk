import * as React from "react";
import bg from "../assets/FondoNews.png"; // ajusta el relativo si este archivo está en otra carpeta

type EdmNewsContentProps = {
  title?: string;
  html?: string; // HTML confiable; si viene de usuario, sanitiza antes
  inset?: { top?: string | number; right?: string | number; bottom?: string | number; left?: string | number };
};

function EdmNewsContent({ title = "", html = "", inset = { top: 92, right: 16, bottom: 72, left: 16 } }: EdmNewsContentProps) {
  const toCss = (v?: string | number) => (typeof v === "number" ? `${v}px` : v ?? "0");
  const style: React.CSSProperties = {
    position: "absolute",
    top: toCss(inset.top),
    right: toCss(inset.right),
    bottom: toCss(inset.bottom),
    left: toCss(inset.left),
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 0 15px rgba(0,0,0,.25)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Inter, ui-sans-serif, system-ui, -apple-system, Roboto, Arial, sans-serif",
  };

  return (
    <section style={style} aria-label="Contenido del anuncio">
      {title ? (
        <h3 style={{ margin: "0 0 8px 0", textAlign: "center", fontWeight: 700, fontSize: 18, color: "#111" }}>{title}</h3>
      ) : null}
      <div
        style={{ overflow: "auto", fontSize: 14, lineHeight: 1.45, color: "#222", paddingRight: 6 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

type PosterEdmNewsProps = {
  width?: number | string;           // ancho del poster (ej: 360, "100%")
  title?: string;
  html?: string;
  inset?: EdmNewsContentProps["inset"];
};

export default function PosterEdmNews({ width = 360, title = "", html = "", inset }: PosterEdmNewsProps) {
  const w = typeof width === "number" ? `${width}px` : width;

  return (
    <div
      style={{
        width: w,
        aspectRatio: "9 / 16",
        margin: "0 auto",
        position: "relative",
        borderRadius: 10,
        backgroundImage: `url(${bg})`,          // <-- fondo en la MISMA ruta de este archivo
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        boxShadow: "0 10px 30px rgba(0,0,0,.18)",
      }}
      aria-label="Poster EDM"
    >
      <EdmNewsContent title={title} html={html} inset={inset} />
      {/* estilos globales mínimos embebidos (evita CSS externo) */}
      <style>{`
        @media (max-width: 360px){
          [aria-label="Contenido del anuncio"] h3{ font-size:16px }
          [aria-label="Contenido del anuncio"] div{ font-size:13px }
        }
      `}</style>
    </div>
  );
}
