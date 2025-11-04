import type { SolicitudUsuario } from "./Formatos";

export type FormStateCajeros = {
    solicitante: string;
    usuario: string;
    Cedula: string;
    CO: string;
    CorreoTercero: string;
    Compañia: string
};

export type FormErrorsCajeros = Partial<Record<keyof FormStateCajeros, string>>;

export type FlowToUser = {
  recipient: string;            
  message: string;
  title?: string;
  mail: boolean
};

export type conectorFacturas = {
  InitialDate: string;
  FinalDate: string;
  user: string;
}

export type AdjuntoPayload = {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  contentBase: string; // o contentBase64 si prefieres ese nombre
};

export type Escalamiento = {
  proveedor: string,
  identificador: string,
  tienda: string,
  ciudad: string,
  empresa: string,
  nit: string,
  centroComercial: string,
  local: string,
  nombre: string,
  apellidos: string,
  cedula: string,
  telefono: string,
  descripcion: string,
  adjuntos: AdjuntoPayload[],
  para: string
}

export type FlowToSP = {
  Usuario: string;            
  Cedula: string;
  CorreoTercero: string;
  Compañia: number;
  CO: string
};

export type FlowToReasign = {
  IDCandidato: number;            
  Nota: string;
  IDCaso: number;
  IDSolicitante: number;
};

export type MasiveFlow = {
  file: {
    name: string
    contentType: string
    contentBase64: string
  };
}

export type SoliictudServiciosFlow = {
  User: string;
  userEmail: string;
  Datos: SolicitudUsuario 
}