import * as React from "react";
import { useAuth } from "../auth/authContext";
import { GraphRest } from "./GraphRest";

// === Servicios HD (Helpdesk) ===
import { SociedadesService } from "../Services/Sociedades.service";
import { ProveedoresService } from "../Services/Proveedores.service";
import { PlantillasService } from "../Services/Plantillas.service";
import { InternetService } from "../Services/Internet.service";
import { CasosHijosRequeridosService } from "../Services/CasosHijosRequeridos.service";
import { ActasdeentregaService } from "../Services/Actasdeentrega.service";
import { AnunciosService } from "../Services/Anuncios.service";
import { ArticulosService } from "../Services/Articulos.service";
import { UsuariosSPService } from "../Services/Usuarios.Service";
import { LogService } from "../Services/Log.service";
import { TicketsService } from "../Services/Tickets.service";
import { CategoriasService } from "../Services/Categorias.service";
import { FranquiciasService } from "../Services/Franquicias.service";
import { SubCategoriasService } from "../Services/SubCategorias.Service";
import { InternetTiendasService } from "../Services/InternetTiendas.service";
import { FacturasService } from "../Services/Facturas.service";
import { ItemFacturaService } from "../Services/ItemsFacturas.service";
import { ProveedoresFacturaService } from "../Services/ProveedoresFacturas.service";
import { ItemService } from "../Services/Items.service";
import { CentroCostosService } from "../Services/CentroCostos.service";
import { COService } from "../Services/COCostos.service";
import { ComprasService } from "../Services/Compras.service";
import { TareasService } from "../Services/Tareas.service";
import { InventarioService } from "../Services/Inventario.service";
import { DistribucionFacturaService } from "../Services/DistribucionFactura.service";

// === Servicio TEST (Paz y salvos) ===
import { PazSalvosService } from "../Services/PazSalvos.service";
import { TipsService } from "../Services/Tips.service";
import { AusenciaService } from "../Services/Ausencia.service";
import { SharePointStorageService } from "../Services/sharepointStorage.service";
import { DispositivosService } from "../Services/dispositivos.service";
import { PrestamosService } from "../Services/prestamos.service";
import { PruebasPrestamoService } from "../Services/pruebasPrestamo.service";
import { PruebasService } from "../Services/pruebas.service";
import { PruebasDispositivoService } from "../Services/PruebasDispositivo.service";

/* ================== Tipos de config ================== */
export type SiteConfig = {
  hostname: string;
  sitePath: string; // Debe iniciar con '/'
};

export type UnifiedConfig = {
  hd: SiteConfig;    // sitio principal (HD)
  test: SiteConfig;  // sitio de pruebas (Paz y salvos)
  lists: {
    // HD
    Sociedades: string;
    Proveedores: string;
    Plantillas: string;
    Internet: string;
    CasosHijosRequeridos: string;
    ActasEntrega: string;
    Anuncios: string;
    Articulos: string;
    Usuarios: string;
    Logs: string;
    Tickets: string;
    Categorias: string;
    Franquicias: string;
    SubCategorias: string;
    InternetTiendas: string;
    Facturas: string;
    ItemFactura: string;
    ProveedoresFactura: string;
    Item: string;
    CentroCostos: string;
    CentroOperativo: string;
    Compras: string;
    Tareas: string;
    Inventario: string;
    DistribucionFactura: string;
    TipsInicio: string;
    Ausencias: string;
    dispositivos: string;
    prestamos: string;
    pruebas: string;
    pruebasPrestamo: string;  
    pruebasDispositivo: string;

    // TEST
    PazYSalvos: string;
  };
};

/* ================== Tipos del contexto ================== */
export type GraphServices = {
  graph: GraphRest;

  // HD
  Sociedades: SociedadesService;
  Proveedores: ProveedoresService;
  Plantillas: PlantillasService;
  Internet: InternetService;
  CasosHijosRequeridos: CasosHijosRequeridosService;
  ActasEntrega: ActasdeentregaService;
  Anuncios: AnunciosService;
  Articulos: ArticulosService;
  Usuarios: UsuariosSPService;
  Logs: LogService;
  Tickets: TicketsService;
  Categorias: CategoriasService;
  Franquicias: FranquiciasService;
  SubCategorias: SubCategoriasService;
  InternetTiendas: InternetTiendasService;
  Facturas: FacturasService;
  ItemFactura: ItemFacturaService;
  ProveedoresFactura: ProveedoresFacturaService;
  Item: ItemService;
  CentroCostos: CentroCostosService;
  CentroOperativo: COService;
  Compras: ComprasService;
  Tareas: TareasService;
  Inventario: InventarioService;
  DistribucionFactura: DistribucionFacturaService;
  TipsInicio: TipsService;
  Ausencias: AusenciaService  
  Storage: SharePointStorageService;
  dispositivos: DispositivosService;
  prestamos: PrestamosService;
  pruebas: PruebasService
  pruebasPrestamo: PruebasPrestamoService;
  pruebasDispositivo: PruebasDispositivoService

  // TEST
  PazYSalvos: PazSalvosService;
};

/* ================== Contexto ================== */
const GraphServicesContext = React.createContext<GraphServices | null>(null);

/* ================== Default config (puedes cambiar paths) ================== */
const DEFAULT_CONFIG: UnifiedConfig = {
  hd: {
    hostname: "estudiodemoda.sharepoint.com",
    sitePath: "/sites/TransformacionDigital/IN/HD",
  },
  test: {
    hostname: "estudiodemoda.sharepoint.com",
    sitePath: "/sites/TransformacionDigital/IN/Test",
  },
  lists: {
    // HD
    Sociedades: "Sociedades",
    Proveedores: "Proveedores de internet",
    Plantillas: "Plantillas",
    Internet: "Internet",
    CasosHijosRequeridos: "Casos hijos requeridos",
    ActasEntrega: "Actas de entrega",
    Anuncios: "Anuncios",
    Articulos: "Articulos",
    Usuarios: "Usuarios",
    Logs: "Log",
    Tickets: "Tickets",
    Categorias: "Categorias",
    Franquicias: "Franquicias",
    SubCategorias: "SubCategorias",
    InternetTiendas: "Internet Tiendas",
    Facturas: "Facturas",
    ItemFactura: "ItemsFactura",
    ProveedoresFactura: "ProveedoresFactura",
    Item: "ItemsDescripcion",
    CentroCostos: "CentroCostos",
    CentroOperativo: "CentrosOperativos",
    Compras: "Compras",
    Tareas: "Recordatorios",
    Inventario: "Inventario",
    DistribucionFactura: "DistribucionFactura",
    TipsInicio: "TipsInicio",
    Ausencias: "Ausencias",
    dispositivos: "Prestamos - Dispositivos",
    prestamos: "Prestamos - Prestamos",
    pruebas: "Prestamos - Pruebas",
    pruebasPrestamo: "Prestamos - Pruebas prestamo",
    pruebasDispositivo: "Prestamos - PruebasDispostivo",

    // TEST
    PazYSalvos: "Paz y salvos",
  },
};

/* ================== Provider ================== */
type ProviderProps = {
  children: React.ReactNode;
  config?: Partial<UnifiedConfig>;
};

export const GraphServicesProvider: React.FC<ProviderProps> = ({ children, config }) => {
  const { getToken } = useAuth();

  // Mergeo de config
  const cfg: UnifiedConfig = React.useMemo(() => {
    const base = DEFAULT_CONFIG;

    const normPath = (p: string) => (p.startsWith("/") ? p : `/${p}`);

    const hd: SiteConfig = {
      hostname: config?.hd?.hostname ?? base.hd.hostname,
      sitePath: normPath(config?.hd?.sitePath ?? base.hd.sitePath),
    };

    const test: SiteConfig = {
      hostname: config?.test?.hostname ?? base.test.hostname,
      sitePath: normPath(config?.test?.sitePath ?? base.test.sitePath),
    };

    const lists = { ...base.lists, ...(config?.lists ?? {}) };

    return { hd, test, lists };
  }, [config]);

  // Cliente Graph
  const graph = React.useMemo(() => new GraphRest(getToken), [getToken]);

  // Instanciar servicios (HD usando cfg.hd, PazYSalvos usando cfg.test)
  const services = React.useMemo<GraphServices>(() => {
    const { hd, test, lists } = cfg;

    // HD
    const Sociedades           = new SociedadesService(graph, hd.hostname,  hd.sitePath,  lists.Sociedades);
    const Proveedores          = new ProveedoresService(graph, hd.hostname, hd.sitePath,  lists.Proveedores);
    const Plantillas           = new PlantillasService(graph, hd.hostname,  hd.sitePath,  lists.Plantillas);
    const Internet             = new InternetService(graph, hd.hostname,    hd.sitePath,  lists.Internet);
    const CasosHijosRequeridos = new CasosHijosRequeridosService(graph, hd.hostname, hd.sitePath, lists.CasosHijosRequeridos);
    const ActasEntrega         = new ActasdeentregaService(graph, hd.hostname, hd.sitePath, lists.ActasEntrega);
    const Anuncios             = new AnunciosService(graph, hd.hostname,   hd.sitePath,  lists.Anuncios);
    const Articulos            = new ArticulosService(graph, hd.hostname,  hd.sitePath,  lists.Articulos);
    const Usuarios             = new UsuariosSPService(graph, hd.hostname, hd.sitePath,  lists.Usuarios);
    const Logs                 = new LogService(graph, hd.hostname,        hd.sitePath,  lists.Logs);
    const Tickets              = new TicketsService(graph, hd.hostname,    hd.sitePath,  lists.Tickets);
    const Categorias           = new CategoriasService(graph, hd.hostname, hd.sitePath,  lists.Categorias);
    const Franquicias          = new FranquiciasService(graph, hd.hostname, hd.sitePath, lists.Franquicias);
    const SubCategorias        = new SubCategoriasService(graph, hd.hostname, hd.sitePath, lists.SubCategorias);
    const InternetTiendas      = new InternetTiendasService(graph, hd.hostname, hd.sitePath, lists.InternetTiendas);
    const Facturas             = new FacturasService(graph, hd.hostname,   hd.sitePath,  lists.Facturas);
    const ItemFactura          = new ItemFacturaService(graph, hd.hostname, hd.sitePath,  lists.ItemFactura);
    const ProveedoresFactura   = new ProveedoresFacturaService(graph, hd.hostname, hd.sitePath, lists.ProveedoresFactura);
    const Item                 = new ItemService(graph, hd.hostname,       hd.sitePath,  lists.Item);
    const CentroCostos         = new CentroCostosService(graph, hd.hostname, hd.sitePath, lists.CentroCostos);
    const CentroOperativo      = new COService(graph, hd.hostname,         hd.sitePath,  lists.CentroOperativo);
    const Compras              = new ComprasService(graph, hd.hostname,    hd.sitePath,  lists.Compras);
    const Tareas               = new TareasService(graph, hd.hostname,     hd.sitePath,  lists.Tareas);
    const Inventario           = new InventarioService(graph, hd.hostname, hd.sitePath,  lists.Inventario);
    const DistribucionFactura  = new DistribucionFacturaService(graph, hd.hostname, hd.sitePath, lists.DistribucionFactura);
    const TipsInicio           = new TipsService(graph, hd.hostname, hd.sitePath, lists.TipsInicio);
    const Ausencias            = new AusenciaService(graph, hd.hostname, hd.sitePath, lists.Ausencias)
    const Storage              = new SharePointStorageService(graph);
    const dispositivos         = new DispositivosService(graph, hd.hostname, hd.sitePath, lists.dispositivos);
    const prestamos            = new PrestamosService(graph, hd.hostname, hd.sitePath, lists.prestamos);
    const pruebas              = new PruebasService(graph, hd.hostname, hd.sitePath, lists.pruebas);
    const pruebasPrestamo      = new PruebasPrestamoService(graph, hd.hostname, hd.sitePath, lists.pruebasPrestamo);
    const pruebasDispositivo  = new PruebasDispositivoService(graph, hd.hostname, hd.sitePath, lists.pruebasDispositivo)

    // TEST
    const PazYSalvos           = new PazSalvosService(graph, test.hostname, test.sitePath, lists.PazYSalvos);

    return {
      graph, Storage,
      Sociedades, Proveedores, Plantillas, Internet, CasosHijosRequeridos, ActasEntrega, Anuncios, Articulos, Usuarios, Logs, Tickets, Categorias, Franquicias, SubCategorias,
      InternetTiendas, Facturas, ItemFactura, ProveedoresFactura, Item, CentroCostos, CentroOperativo, Compras, Tareas, Inventario, DistribucionFactura, TipsInicio, Ausencias,
      dispositivos, prestamos, pruebas, pruebasPrestamo, pruebasDispositivo,
      // TEST
      PazYSalvos,
    };
  }, [graph, cfg]);

  return (
    <GraphServicesContext.Provider value={services}>
      {children}
    </GraphServicesContext.Provider>
  );
};

/* ================== Hook de consumo ================== */
export function useGraphServices(): GraphServices {
  const ctx = React.useContext(GraphServicesContext);
  if (!ctx) throw new Error("useGraphServices debe usarse dentro de <GraphServicesProvider>.");
  return ctx;
}
