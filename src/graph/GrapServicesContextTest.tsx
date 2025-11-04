import * as React from 'react';
import { useAuth } from '../auth/authContext'; // asegúrate del case correcto
import { GraphRest } from './GraphRest';
import { PazSalvosService } from '../Services/PazSalvos.service';


// ================== Tipos ==================
export type GraphSiteConfig = {
  hostname: string;          
  sitePath: string;         
  lists: {
    PazYSalvos: string;        
  };
};

export type GraphServices = {
  graph: GraphRest;
  PazYSalvos: PazSalvosService;
};

// ================== Contexto ==================
const GraphServicesContext = React.createContext<GraphServices | null>(null);

// ================== Provider ==================
type ProviderProps = {
  children: React.ReactNode;
  config?: Partial<GraphSiteConfig>;
};

const DEFAULT_CONFIG: GraphSiteConfig = {
  hostname: 'estudiodemoda.sharepoint.com',
  sitePath: '/sites/TransformacionDigital/IN/Test',
  lists: {
    PazYSalvos: 'Paz y salvos',
  },
};

export const GraphServicesProvider: React.FC<ProviderProps> = ({ children, config }) => {
  const { getToken } = useAuth();

  // Mergear config
  const cfg: GraphSiteConfig = React.useMemo(() => {
    const base = DEFAULT_CONFIG;
    const sitePath = (config?.sitePath ?? base.sitePath);
    return {
      hostname: config?.hostname ?? base.hostname,
      sitePath: sitePath.startsWith('/') ? sitePath : `/${sitePath}`,
      lists: {
        PazYSalvos:     config?.lists?.PazYSalvos     ?? base.lists.PazYSalvos,
      },
    };
  }, [config]);

  // Cliente Graph REST (usa getToken del AuthContext/MSAL)
  const graph = React.useMemo(() => {
    return new GraphRest(getToken);
  }, [getToken]);

  // Instancias de servicios (memo)
  const services = React.useMemo<GraphServices>(() => {
    const { hostname, sitePath, lists } = cfg;
    const PazYSalvos              = new PazSalvosService(graph, hostname, sitePath, lists.PazYSalvos);
    return {graph, PazYSalvos};
  }, [graph, cfg]);

  return (
    <GraphServicesContext.Provider value={services}>
      {children}
    </GraphServicesContext.Provider>
  );
};

// ================== Hook de consumo ==================
export function useGraphServicesTest(): GraphServices {
  const ctx = React.useContext(GraphServicesContext);
  if (!ctx) throw new Error('useGraphServices debe usarse dentro de <GraphServicesProvider>.');
  return ctx;
}
