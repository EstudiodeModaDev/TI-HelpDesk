export type PazSalvos = {
    Id?: string;
    Cedula?: string;
    Nombre?: string;
    Empresa?: string;
    Cargo?: string;
    CO?: string;
    Jefe?: string;
    Fechadeingreso?: string;
    Fechadesalida?: string;
    Title?: string; //Estado
    CorreoJefe?: string;
    Correos?: string;
    Solicitante?: string;
    Consecutivo?: string;
};

export type PazSalvosErrors = Partial<Record<keyof PazSalvos, string>>;