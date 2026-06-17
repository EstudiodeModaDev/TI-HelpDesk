export type Log = {
    Id?: string | number;
    Id_caso: string | number; //Id caso
    Descripcion: string;
    Tipo_de_accion: string;
    Actor: string;
    CorreoActor: string;
    Created?: string | Date | null;
};