export type Tip = {
    Id?: string;
    Title: string;
    Subtitulo: string;
    Activa: boolean;
    TipoAnuncio: string
}

export type TipFlowResponse = {
  announcements?: { value?: Tip[] };
};

export type TipUI = {title: string; subtitle: string; TipoAnuncio: string}