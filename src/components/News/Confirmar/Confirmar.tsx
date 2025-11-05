import * as React from "react";
import "./Confirmas.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { AnunciosService } from "../../../Services/Anuncios.service";
import { useAnuncio } from "../../../Funcionalidades/News";

type EdmNewsContentProps = {
  title: string;
  html: string;
  inset?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
  "aria-label"?: string;
};


export default function EdmNewsContent({title = "", html = "", inset = { top: 90, right: 18, bottom: 70, left: 18 }, "aria-label": ariaLabel = "Contenido del anuncio",}: EdmNewsContentProps) {
  const { Anuncios } = useGraphServices() as { Anuncios: AnunciosService };
  const { handleSubmit } = useAnuncio({AnunciosSvc: Anuncios})
  const toCss = (v?: string | number) =>
    typeof v === "number" ? `${v}px` : v ?? "0";

  const style: React.CSSProperties = {
    top: toCss(inset.top),
    right: toCss(inset.right),
    bottom: toCss(inset.bottom),
    left: toCss(inset.left),
  };

  return (
    <section className="edm-content-box" style={style} aria-label={ariaLabel}>
        {title ? <h3 className="edm-content-title">{title}</h3> : null}
        <div className="edm-content-html" dangerouslySetInnerHTML={{ __html: html }}/>
        <button onClick={(e) => handleSubmit(e)}>Confirmar</button>
    </section>
  );
}
