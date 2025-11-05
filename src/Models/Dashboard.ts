export type Usuario = {
    name: string;
    mail: string;
    total: number;
};

export type ResolutorAgg = { nombre: string; correo: string; total: number, porcentaje: number };

export type TopCategoria = {
  nombre: string;      // nombre de la categoría
  total: number;       // cantidad de casos en esa categoría
};
