import type { UserOption } from "./Commons";

export type NuevaTarea = {
  titulo: string;
  solicitante?: UserOption | null;
  fecha?: string; // yyyy-mm-dd
  hora?: string;  // hh:mm
  diasRecordatorio: number;
  Nota: string
  Encargado: UserOption | null;
};

export type Tarea = {
  Id?: string;
  Title: string;
  Reportadapor: string;
  Quienlasolicita: string;
  Fechadesolicitud?: string | Date;
  Fechadelanota?: string | Date;
  ReportadaporCorreo: string;
  Estado: string;
  Cantidaddediasalarma: number;
  Nota: string
};

export type TareasError = Partial<Record<keyof NuevaTarea, string>>;

export type FilterMode = 'Pendientes' | 'Iniciadas' | 'Finalizadas';