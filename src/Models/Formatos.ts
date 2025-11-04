export type OpcionSolicitud =
  | "Solicitud de servicios de TI"
  | "FR Admin seguridad unidad de red"
  | "FR Administrador seguridad ERP"
  | "Permisos de navegacion";

//Modelo de Servicios TI
export type TipoContratacion = "Directo" | "Temporal" | "Practicante" | "Tercero";
export type TipoEquipo = "Escritorio" | "Portátil" | "Sin equipo";
export type ExtensionTelefonica =
  | "No aplica"
  | "Extensión fija"
  | "Extensión IP"
  | "Solicitud nueva"
  | "Traslado";

export type PermisoRed = "Lectura" | "Escritura" | "Lectura y escritura";

  //Modelo solicitud de permisos de red
export interface FilaSolicitudRed {
  id: string;       
  carpeta1: string;
  subcarpeta1: string;
  subcarpeta2: string;
  personas: string;    
  permiso: PermisoRed | "";
  observaciones: string;
}

export type State = {
  filas: FilaSolicitudRed[];
  sending: boolean;
  error?: string;
};

export type Action =
  | { type: "ADD"; initial?: Partial<Omit<FilaSolicitudRed, "id">> }
  | { type: "REMOVE"; id: string }
  | { type: "SET"; id: string; key: keyof FilaSolicitudRed; value: FilaSolicitudRed[keyof FilaSolicitudRed] }
  | { type: "RESET" }
  | { type: "SENDING"; value: boolean }
  | { type: "ERROR"; message: string | null };

  //Modelo seguridad de reERP
export interface FilaSolicitudERP {
  id: string;       
  nombreperfil: string;
  metodogeneral: string;
  metodoespecifico: string;
  permisoespecifico: string;
  usuarioNombre: string;
  usuarioMail: string;
  observaciones: string;
}

export type Servicios = {
  correo: boolean;
  office: boolean;
  erp: boolean;
  pedidos: boolean;
  adminpos: boolean;
  posprincipal: boolean;
  impresoras: boolean;
  generictransfer: boolean;
};

export type SolicitudUsuario = {
  solicitadoPor: string;
  correoSolicitadoPor: string;
  contratacion: string;
  nombre: string;
  apellidos: string;
  cedula: string;
  contacto: string;
  cargo: string;
  direccion: string;
  gerencia: string;
  jefatura: string;
  centroCostos: string;
  centroOperativo: string;
  ciudad: string;
  fechaIngreso: string; // "yyyy-mm-dd"
  tipoEquipo: string;
  extensionTelefonica: string;
  servicios: Servicios;
  observaciones: string; 
};

export type SolicitudUsuarioErrors = Partial<Record<keyof SolicitudUsuario, string>>;

export interface FilaPermisoNav {
  id: string;
  Empleado: string,
  "Jefe / Quien autoriza": string,
  Youtube: boolean,
  Facebook: boolean,
  Twitter: boolean,
  Instagram: boolean,
  Whatsapp: boolean,
  Pinterest: boolean,
  "Google Anatytics": boolean,
  "Google Drive": boolean,
  Wetransfer: boolean,
  "Otro (Link de la pagina )": string
}
