export type Inventario = {
    Id?: string;
    Title?: string; //Dispositivo
    Marca?: string;
    Serial?: string;
    Referencia?: string;
    ResponsableEntrada?: string;
    DiscoCap?: string;
    DiscoTec?: string;
    MemoriaCap?: string;
    MemoriaTec?: string;
    FechaEntrada?: string;
    CasoEntrada?: string;
    ResponsableSalida?: string;
    CasoSalida?: string;
    Estado?: string;
    UbicacionAnterior?: String;
    UbicacionActual?: string;
    Categoria?: string //Propiedad
    AsignadoA?: string;
    PrestadoA?: string;
    Comprometido?: string;
    Compania?: string;
    ControlActivos?: string;
    Proveedor?: string; 
};

export type InventarioErrors = Partial<Record<keyof Inventario, string>>;