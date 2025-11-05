import * as React from "react";
import bg from "../../../assets/FondoNews.png"; 

type EdmNewsContentProps = {
  title?: string;
  html?: string; // si viene de usuario, sanitiza antes
  inset?: { top?: string | number; right?: string | number; bottom?: string | number; left?: string | number };
};

type PosterEdmNewsProps = {
  width?: number | string; // ej: 360 o "100%"
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
  rangeText?: string; // opcional: texto arriba (ej: "se mostrará entre nov 05 y nov 06")
};

function EdmNewsContent({title = "", html = "", inset = { top: 120, right: 16, bottom: 72, left: 16 },}: EdmNewsContentProps) {
  const toCss = (v?: string | number) => (typeof v === "number" ? `${v}px` : v ?? "0");
  const style: React.CSSProperties = {position: "absolute", top: toCss(inset.top), right: toCss(inset.right), bottom: toCss(inset.bottom), left: toCss(inset.left), background: "#fff",
    borderRadius: 10, boxShadow: "0 0 15px rgba(0,0,0,.25)", padding: 12, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Segoe UI', Inter, ui-sans-serif, system-ui, -apple-system, Roboto, Arial, sans-serif",
  };

  return (
    <section style={style} aria-label="Contenido del anuncio">
      {title ? (
        <h3 style={{ margin: "0 0 8px 0", textAlign: "center", fontWeight: 700, fontSize: 18, color: "#111" }}>
          {title}
        </h3>
      ) : null}
      <div style={{ overflow: "auto", fontSize: 14, lineHeight: 1.45, color: "#222", paddingRight: 6 }} dangerouslySetInnerHTML={{ __html: html }}/>
    </section>
  );
}

export function PosterEdmNews({ width = 360, title = "", html = "", inset }: PosterEdmNewsProps) {
  const w = typeof width === "number" ? `${width}px` : width;

  return (
    <div style={{width: w, aspectRatio: "9 / 16", position: "relative", borderRadius: 10, backgroundImage: `url(${bg})`, backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat", boxShadow: "0 10px 30px rgba(0,0,0,.18)",}} aria-label="Poster EDM">
      <EdmNewsContent title={title} html={html} inset={inset} />
      <style>{`
        @media (max-width: 360px){
          [aria-label="Contenido del anuncio"] h3{ font-size:16px }
          [aria-label="Contenido del anuncio"] div{ font-size:13px }
        }
      `}</style>
    </div>
  );
}

export default function EdmNewsModal({open, title = "", html = "", width = 360, inset, confirmText = "Confirmar", cancelText = "Cancelar", onConfirm, onCancel, confirmDisabled = false, loadingConfirm = false,rangeText,}: EdmNewsModalProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = React.useRef<HTMLButtonElement | null>(null);

  // Enfoca el botón confirmar al abrir
  React.useEffect(() => {
    if (open) {
      confirmBtnRef.current?.focus();
    }
  }, [open]);

  // Teclado: Esc = cancelar
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
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
      <div style={{
          width: "min(92vw, 560px)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
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
              fontFamily: "'Segoe UI', Inter, ui-sans-serif, system-ui, -apple-system, Roboto, Arial, sans-serif",
              fontWeight: 600,
            }}>
            {rangeText}
          </div>
        ) : null}

        {/* Poster centrado */}
        <PosterEdmNews width={width} title={title} html={html} inset={inset} />

        {/* Action bar */}
        <div style={{
            display: "flex",
            gap: 10,
            width: "100%",
            justifyContent: "center",
            marginTop: 4,
            fontFamily: "'Segoe UI', Inter, ui-sans-serif, system-ui, -apple-system, Roboto, Arial, sans-serif",
          }}>
          <button type="button" onClick={() => onCancel()} style={{
                                                        padding: "10px 16px",
                                                        borderRadius: 8,
                                                        border: "1px solid #e5e7eb",
                                                        background: "#fff",
                                                        color: "#111827",
                                                        cursor: "pointer",
                                                        minWidth: 120,
                                                        }}>
            {cancelText}
          </button>

          <button type="button" ref={confirmBtnRef} onClick={onConfirm} disabled={confirmDisabled || loadingConfirm} style={{
                                                                                                                        padding: "10px 16px",
                                                                                                                        borderRadius: 8,
                                                                                                                        border: "1px solid #1d4ed8",
                                                                                                                        background: "#1d4ed8",
                                                                                                                        color: "#fff",
                                                                                                                        cursor: confirmDisabled || loadingConfirm ? "not-allowed" : "pointer",
                                                                                                                        opacity: confirmDisabled || loadingConfirm ? 0.7 : 1,
                                                                                                                        minWidth: 120,
                                                                                                                        }}>
            {loadingConfirm ? "Confirmando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
