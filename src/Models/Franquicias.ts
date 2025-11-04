export type Franquicias = {
    Id?: string;
    Title: string; //Nombre de la franquicia
    Ciudad: string;
    Correo: string;
    Direccion: string;
    Jefe_x0020_de_x0020_zona: string; 
    Celular: string;
};

  export type FormFranquinciasError = Partial<Record<keyof Franquicias, string>>;