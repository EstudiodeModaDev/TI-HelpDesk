import type { UserOption } from "./Commons";

export type Ticket = {
  ID?: string;
  Nombreresolutor?: string;
  Solicitante?: string;
  AsuntoTicket?: string; //Asunto
  FechaApertura?: string; // "dd/mm/yyyy hh:mm"
  FechaMaxima?: string;   // "dd/mm/yyyy hh:mm"
  FechaCierreReal?: Date | null
  Estadodesolicitud?: string;
  Observador?: string;
  Descripcion?: string;
  Categoria?: string;
  SubCategoria?: string;
  Articulo?: string;
  Fuente?: string;
  Correoresolutor?: string;
  CorreoSolicitante?: string;
  IdCasoPadre?: string;
  ANS?: string;
  CorreoObservador?: string;
  MinutosNocturnos?: number;
  MinutosDominicales?: number;
  MinutosFestivos?: number
  MinutosTotales?: number

};

export type FormRecategorizarState = {
  categoria: string;
  subcategoria: string;
  articulo: string;
  articuloId: string;
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

export type TicketsError = Partial<Record<keyof Ticket, string>>;

export type ANS = {
  Id?: string
  Title: string //ANS
  id_categoria: number;
  id_subcategoria: number;
  id_articulo: number
}
