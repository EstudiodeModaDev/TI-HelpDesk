export type ausencia = {
    Id?: string;
    Title: string;
    Fechadeinicio: string;
    Fechayhora: string;
    Descripcion: string
}

export type FormErrors = Partial<Record<keyof ausencia, string>>;