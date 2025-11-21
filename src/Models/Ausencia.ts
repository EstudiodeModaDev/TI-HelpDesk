export type ausencia = {
    Id?: string;
    Title: string;
    Fechadeinicio: string;
    Fechayhora: string;
    Descripcion: string;
    NombreSolicitante: string
}

export type AusenciaErrors = Partial<Record<keyof ausencia, string>>;