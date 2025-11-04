import type { UserOption } from "./Commons";

export type Ticket = {
  ID?: string;
  Nombreresolutor?: string;
  IdResolutor?: string;
  Solicitante?: string;
  Title?: string; //Asunto
  FechaApertura?: string; // "dd/mm/yyyy hh:mm"
  TiempoSolucion?: string;   // "dd/mm/yyyy hh:mm"
  Estadodesolicitud?: string;
  Observador?: string;
  Descripcion?: string;
  Categoria?: string;
  SubCategoria?: string;
  SubSubCategoria?: string;
  Fuente?: string;
  CorreoResolutor?: string;
  CorreoSolicitante?: string;
  IdCasoPadre?: string;
  ANS?: string;
  CorreoObservador?: string;
};

export type FormRecategorizarState = {
  categoria: string;
  subcategoria: string;
  articulo: string;
};

export type FormReasignarState = {
    resolutor: UserOption | null;
    Nota: string
}

export type FormObservadorState = {
    observador: UserOption | null;
}

export type ticketOption = {
  value: string;      //Id Ticket
  label: string;      //Nombre del ticket
};

export type AttachmentLite = {
  id: string;                     // id opaco del adjunto (suele ser el nombre de archivo, pero trátalo como opaco)
  name: string;                   // nombre del archivo
  size: number;                   // bytes
  contentType?: string;
  lastModifiedDateTime?: string;
  downloadPath: string;     
};

// Para filtros locales
export type SortDir = 'asc' | 'desc';
export type SortField = 'id' | 'FechaApertura' | 'TiempoSolucion' | 'Title' | 'resolutor';