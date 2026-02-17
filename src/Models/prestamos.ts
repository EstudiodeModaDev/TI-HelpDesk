export type dispositivos = {
    Id?: string
    Title: string;
    Referencia: string;
    Serial: string;
    Estado: string; 
}

export type prestamos = {
    Id?: string
    Title: string;
    Id_dispositivo: string;
    FechaPrestamo: string;
    FechaDevolucion: string | null;
    UsuarioRecibe: string;
    Estado: string;   
    IdTicket: string; 
    nombreSolicitante: string
}

export type pruebasDefinidas = {
    Id?: string
    Title: string;
    Estado: string
}

export type pruebasPrestamo = {
    Id?: string
    Title: string
    IdPrestamo: string;
    Aprobado: string;
    Observaciones: string;
    Fase: string;
}

export type dispositivosErrors = Partial<Record<keyof dispositivos, string>>;
export type prestamosErrors = Partial<Record<keyof prestamos, string>>;