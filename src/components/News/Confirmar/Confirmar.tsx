import * as React from "react";
import bg from "../../../assets/FondoNews.png";

/* ================================
   Tipos
   ================================ */
type EdmNewsContentProps = {
  title?: string;
  html?: string; // si viene de usuario, sanitiza antes
  inset?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
};

type PosterEdmNewsProps = {
  width?: number | string; // 360 o "100%"
  title?: string;
  html?: string;
  inset?: EdmNewsContentProps["inset"];
};

type EdmNewsModalProps = {
  open: boolean;
  title?: string;
  html?: string;
  width?: number | string;
  inset?: EdmNewsContentProps["inset"];
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: (viaUser?: boolean) => void;
  confirmDisabled?: boolean;
  loadingConfirm?: boolean;
  rangeText?: string; // texto opcional arriba (rango/nota)
};

const toCss = (v?: string | number) => typeof v === "number" ? `${v}px` : v ?? "0";

/* ================================
   Contenido blanco (calza dentro del póster)
   ================================ */
function EdmNewsContent({title = "", html = "", inset = { top: 120, right: 16, bottom: 72, left: 16 },}: EdmNewsContentProps) {
  const style: React.CSSProperties = {
                                      position: "absolute",
                                      top: toCss(inset.top),
                                      right: toCss(inset.right),
                                      bottom: toCss(inset.bottom),
                                      left: toCss(inset.left),
                                      background: "#fff",
                                      borderRadius: 16,
                                      boxShadow: "0 12px 30px rgba(0,0,0,.25)",
                                      padding: 12,
                                      display: "flex",
                                      flexDirection: "column",
                                      overflow: "hidden", // el scroll vive en el div interno
                                      fontFamily: "'Segoe UI', Inter, ui-sans-serif, system-ui, -apple-system, Roboto, Arial, sans-serif",
                                    };

  return (
    <section style={style} aria-label="Contenido del anuncio">
      {title ? (
        <h3 style={{
              margin: "0 0 8px 0",
              textAlign: "center",
              fontWeight: 800,
              fontSize: 18,
              color: "#111",
              flex: "0 0 auto",
            }}>
          {title}
        </h3>
      ) : null}

      <div dangerouslySetInnerHTML={{ __html: html }} style={{
            flex: "1 1 auto",
            minHeight: 0, 
            overflow: "auto",
            fontSize: 14,
            lineHeight: 1.45,
            color: "#222",
            paddingRight: 6, 
          }}/>
    </section>
  );
}

/* ================================
   Póster (fondo con 9:16)
   ================================ */
export function PosterEdmNews({width = 360, title = "", html = "", inset,}: PosterEdmNewsProps) {
  const w = typeof width === "number" ? `${width}px` : width;

  return (
    <div aria-label="Poster EDM" style={{
        width: w,
        aspectRatio: "9 / 16",
        position: "relative",
        borderRadius: 16,
        backgroundImage: `url(${bg})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        boxShadow: "0 10px 30px rgba(0,0,0,.18)",
        overflow: "hidden",
      }}>
      <EdmNewsContent title={title} html={html} inset={inset} />

      {/* Ajustes de tipografía en móviles muy estrechos */}
      <style>{`
        @media (max-width: 360px){
          [aria-label="Contenido del anuncio"] h3{ font-size:16px }
          [aria-label="Contenido del anuncio"] div{ font-size:13px }
        }
      `}</style>
    </div>
  );
}

/* ================================
   Modal (overlay + póster + acciones)
   ================================ */
export default function EdmNewsModal({open, title = "", html = "", width = 360, inset, confirmText = "Confirmar", cancelText = "", onConfirm, onCancel, confirmDisabled = false, loadingConfirm = false, rangeText,}: EdmNewsModalProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = React.useRef<HTMLButtonElement | null>(null);

  // Enfoca el botón confirmar al abrir
  React.useEffect(() => {
    if (open) confirmBtnRef.current?.focus();
  }, [open]);

  // Teclado: Esc = cancelar
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel(true);
    }
  };

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Vista previa del anuncio" ref={dialogRef} onKeyDown={onKeyDown} style={{
                                                                                                                            position: "fixed",
                                                                                                                            inset: 0,
                                                                                                                            zIndex: 9999,
                                                                                                                            display: "grid",
                                                                                                                            placeItems: "center",
                                                                                                                            padding: 16,
                                                                                                                            background: "rgba(17,24,39,.6)", // overlay
                                                                                                                            backdropFilter: "blur(2px)",
                                                                                                                          }}>
      {/* Contenedor que puede scrollear en alturas pequeñas */}
      <div style={{
            width: "min(92vw, 560px)",
            maxHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            overflow: "auto", // si no cabe todo, este hace scroll
            paddingBottom:
              "calc(env(safe-area-inset-bottom, 0px) + 6px)", // respeta “notch”
          }}>
        {/* Texto superior opcional */}
        {rangeText ? (
          <div style={{
              color: "#111",
              background: "#f7f7f7",
              borderRadius: 8,
              padding: "8px 12px",
              width: "100%",
              textAlign: "center",
              fontFamily:
                "'Segoe UI', Inter, ui-sans-serif, system-ui, -apple-system, Roboto, Arial, sans-serif",
              fontWeight: 600,
            }}>
            {rangeText}
          </div>
        ) : null}

        {/* Poster centrado */}
        <PosterEdmNews width={width} title={title} html={html} inset={inset} />

        {/* Action bar sticky: siempre visible aún con scroll */}
        <div style={{
              position: "sticky",
              bottom: 0,
              insetInline: 0,
              display: "flex",
              gap: 10,
              width: "100%",
              justifyContent: "center",
              marginTop: 4,
              paddingTop: 8,
              paddingBottom: 6,
              backdropFilter: "blur(2px)",
              fontFamily: "'Segoe UI', Inter, ui-sans-serif, system-ui, -apple-system, Roboto, Arial, sans-serif",
            }}>

          {cancelText ? <button type="button" onClick={() => onCancel(true)} style={{
                                                                                padding: "10px 16px",
                                                                                borderRadius: 8,
                                                                                border: "1px solid #e5e7eb",
                                                                                background: "#fff",
                                                                                color: "#111827",
                                                                                cursor: "pointer",
                                                                                minWidth: 120,
                                                                              }}>
            {cancelText}
          </button> : null}
          <button type="button" ref={confirmBtnRef} onClick={onConfirm} disabled={confirmDisabled || loadingConfirm} style={{
                                                                                                                      padding: "10px 16px",
                                                                                                                      borderRadius: 8,
                                                                                                                      border: "1px solid #1d4ed8",
                                                                                                                      background: "#1d4ed8",
                                                                                                                      color: "#fff",
                                                                                                                      cursor:
                                                                                                                        confirmDisabled || loadingConfirm ? "not-allowed" : "pointer",
                                                                                                                      opacity: confirmDisabled || loadingConfirm ? 0.7 : 1,
                                                                                                                      minWidth: 120,
                                                                                                                      boxShadow: "0 6px 16px rgba(29,78,216,.25)",
                                                                                                                      fontWeight: 700,}}>
            {loadingConfirm ? "Confirmando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
