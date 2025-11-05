export type Anuncio = {
    Id?: string;
    Title: string;
    Fechadeinicio: string;
    Fechafinal: string;
    TituloAnuncio: string;
    Cuerpo: string;
};

export type AnuncioErrors = Partial<Record<keyof Anuncio, string>>;