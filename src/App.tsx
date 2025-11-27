import * as React from "react";
import "./App.css";
import NuevoTicketForm from "./components/NuevoTicket/NuevoTicketForm";
import NuevoTicketUsuarioForm from "./components/NuevoTicketUsuario/NuevoTicketFormUsuario";
import TablaTickets from "./components/Tickets/Tickets";
import TareasPage from "./components/Tareas/Tareas";
import Formatos from "./components/Formatos/Formatos";
import InfoPage from "./components/Info/Informacion";
import CrearPlantilla from "./components/NuevaPlantilla/NuevaPlantilla";
import UsuariosPanel from "./components/Usuarios/Usuarios";
import CajerosPOSForm from "./components/CajerosPOS/CajerosPOS";
import ComprasPage from "./components/Compras/ComprasPage";
import RegistroFactura from "./components/RegistroFactura/RegistroFactura";
import type { User } from "./Models/User";
import { AuthProvider, useAuth } from "./auth/authContext";
import { useUserRole } from "./Funcionalidades/Usuarios";
import { GraphServicesProvider, useGraphServices } from "./graph/GrapServicesContext";
import type { TicketsService } from "./Services/Tickets.service";
import type { UsuariosSPService } from "./Services/Usuarios.Service";
import type { LogService } from "./Services/Log.service";
import HomeIcon from "./assets/home.svg";
import addIcon from "./assets/add.svg";
import seeTickets from "./assets/tickets.svg";
import tareasIcon from "./assets/tareas.svg";
import filesIcon from "./assets/file.svg";
import infoIcon from "./assets/info.svg";
import settingsIcon from "./assets/settings.svg";
import templateIcon from "./assets/template.svg";
import PazySalvosMode from "./components/PazSalvos/PazYSalvo";
import WelcomeSolvi from "./components/Welcome/Welcome";
import DashBoardPage from "./components/Dashboard/DashboardPage";
import CrearAnuncio from "./components/News/News";
import newsIcon from "./assets/news.svg";
import EdmNewsModal from "./components/News/Confirmar/Confirmar";
import usersIcon from "./assets/users.svg"
import ActionsIcon from "./assets/actions.svg"
import siesaIcon from "./assets/siesa.png"
import cajerosIcon from "./assets/cajeros.svg"
import type { AnunciosService } from "./Services/Anuncios.service";
import { logout } from "./auth/msal";
import AnnouncementsTable from "./components/TipsTable/TipsTable";
import { useTheme } from "./Funcionalidades/Theme";
import TeamsEventForm from "./components/Ausencia/Ausencia";
//import { norm } from "./utils/Commons";
//import UsuariosApp from "./components/Usuarios copy/Acceso";

/* ============================================================
   Tipos de navegación y contexto de visibilidad
   ============================================================ */

type RenderCtx = { services?: { Tickets: TicketsService; Usuarios: UsuariosSPService; Logs: LogService } };

type Services = { Tickets: TicketsService; Usuarios: UsuariosSPService; Logs: LogService };

export type MenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  to?: React.ReactNode | ((ctx: RenderCtx) => React.ReactNode);
  children?: MenuItem[];
  roles?: string[];
  flags?: string[];
  when?: (ctx: NavContext) => boolean;
  /** Si true, al seleccionarlo el sidebar se colapsa automáticamente */
  autocollapse?: boolean;
};

export type NavContext = {
  role: string;
  flags?: Set<string>;
  hasService?: (k: keyof Services) => boolean;
};

/* ============================================================
   Árbol único de navegación con reglas de visibilidad
   ============================================================ */

const NAV: MenuItem[] = [
  { id: "home", label: "Home", icon: <img src={HomeIcon} alt="" className="sb-icon" />, to: <DashBoardPage />, roles: ["Administrador", "Tecnico", "Listo"], autocollapse: true },
  { id: "ticketform", label: "Nuevo Ticket", icon: <img src={addIcon} alt="" className="sb-icon" />, to: () => <NuevoTicketForm />, roles: ["Administrador", "Tecnico", "Listo"] },
  { id: "ticketform_user", label: "Nuevo Ticket", icon: <img src={addIcon} alt="" className="sb-icon" />, to: <NuevoTicketUsuarioForm />, roles: ["Usuario", "Jefe de zona", "Listo"] },
  { id: "ticketTable", label: "Ver Tickets", icon: <img src={seeTickets} alt="" className="sb-icon" />, to: <TablaTickets />, autocollapse: true },
  { id: "task", label: "Tareas", icon: <img src={tareasIcon} alt="" className="sb-icon" />, to: <TareasPage />, roles: ["Administrador", "Tecnico", "Listo"], autocollapse: true },
  { id: "formatos", label: "Formatos", icon: <img src={filesIcon} alt="" className="sb-icon" />, to: <Formatos />, roles: ["Administrador", "Listo"] },
  { id: "info", label: "Información", icon: <img src={infoIcon} alt="" className="sb-icon" />, to: <InfoPage />, roles: ["Administrador", "Tecnico", "Listo"] },
  { id: "admin", label: "Administración", icon: <img src={settingsIcon} className="sb-icon" />, roles: ["Administrador", "Tecnico", "Listo"], children: [
      { id: "anuncios", label: "Anuncios", to: <CrearAnuncio />, roles: ["Administrador", "Tecnico"], icon: <img src={newsIcon} className="sb-icon" /> },
      { id: "plantillas", label: "Plantillas", icon: <img src={templateIcon} className="sb-icon" />, to: <CrearPlantilla />, roles: ["Administrador", "Tecnico", "Listo"] },
      { id: "usuarios", label: "Usuarios", icon: <img src={usersIcon} className="sb-icon" />, to: <UsuariosPanel />, roles: ["Administrador"] },
     // { id: "acceso", label: "Acceso", to: <UsuariosApp />, roles: ["Administrador", "Tecnico"] },
      { id: "tips", label: "Tips", icon: <img src={infoIcon} className="sb-icon" />, to: <AnnouncementsTable />, roles: ["Administrador", "Tecnico", "Listo"] },
    ],
  },
  {id: "acciones", label: "Acciones", icon: <img src={ActionsIcon} className="sb-icon" />, roles: ["Administrador", "Tecnico", "Jefe de zona", "Listo"], children: [
      {id: "siesa", label: "Siesa", roles: ["Administrador", "Tecnico", "Jefe de zona", "Listo"], icon: <img src={siesaIcon} className="sb-icon" />, children: [
          {id: "cajpos", label: "Cajeros POS", icon: <img src={cajerosIcon} className="sb-icon" />, to: (rctx: RenderCtx) => rctx.services ? <CajerosPOSForm services={{ Tickets: rctx.services.Tickets, Logs: rctx.services.Logs }} /> : <div>Cargando servicios…</div>, roles: ["Administrador", "Tecnico", "Jefe de zona", "Listo"],},
        ],
      },
      {id: "cesar", label: "Cesar", roles: ["Administrador"], children: [
          { id: "compras", label: "Compras", to: <ComprasPage />, roles: ["Administrador"] },
          { id: "facturas", label: "Facturas", to: <RegistroFactura />, roles: ["Administrador"] },
          { id: "paz", label: "Paz y Salvos", to: <PazySalvosMode />, roles: ["Administrador"] },
        ],
      },
    ],
  },
];

/* ============================================================
   Utilidades de árbol: filtrado, búsqueda y primera hoja
   ============================================================ */

// Aplica reglas de visibilidad a un nodo
function isVisible(node: MenuItem, ctx: NavContext): boolean {
  if (node.roles && !node.roles.includes(ctx.role)) return false;
  if (node.flags && node.flags.some((f) => !ctx.flags?.has(f))) return false;
  if (node.when && !node.when(ctx)) return false;
  return true;
}

// Devuelve el árbol filtrado (oculta carpetas sin hijos visibles)
function filterNavTree(nodes: readonly MenuItem[], ctx: NavContext): MenuItem[] {
  return nodes
    .map((n) => {
      const children = n.children ? filterNavTree(n.children, ctx) : undefined;
      const self = isVisible(n, ctx);
      if (children && children.length === 0 && !self) return null;
      if (!self && !children) return null;
      return { ...n, children };
    })
    .filter(Boolean) as MenuItem[];
}

// Primer leaf para selección inicial
function firstLeafId(nodes: readonly MenuItem[]): string {
  const pick = (n: MenuItem): string => (n.children?.length ? pick(n.children[0]) : n.id);
  return nodes.length ? pick(nodes[0]) : "";
}

// Busca un ítem por id
function findById(nodes: readonly MenuItem[], id: string): MenuItem | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = findById(n.children, id);
      if (hit) return hit;
    }
  }
  return undefined;
}

/* ============================================================
   Sidebar con árbol recursivo y apertura de carpetas
   ============================================================ */

function Sidebar(props: {navs: readonly MenuItem[]; selected: string; onSelect: (k: string) => void; user: User; role: string; collapsed?: boolean; onToggle?: () => void;}) {
  const { navs, selected, onSelect, user, role, collapsed = false, onToggle } = props;
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const next: Record<string, boolean> = {};
    const walk = (nodes: readonly MenuItem[], path: string[] = []) => {
      nodes.forEach((n) => {
        const p = [...path, n.id];
        if (n.id === selected) p.slice(0, -1).forEach((id) => (next[id] = true));
        if (n.children?.length) walk(n.children, p);
      });
    };
    walk(navs);
    setOpen((prev) => ({ ...prev, ...next }));
  }, [selected, navs]);

  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  const renderTree = (nodes: readonly MenuItem[], depth = 0) => (
    <ul className="sb-ul">
      {nodes.map((n) => {
        const hasChildren = !!n.children?.length;
        const expanded = !!open[n.id];
        const pad = 10 + depth * 14;

        if (hasChildren) {
          return (
            <li key={n.id} className="sb-li">
              <button
                className={`sideItem sideItem--folder ${collapsed ? "is-compact" : ""}`}
                style={{ paddingLeft: collapsed ? 12 : pad }}
                onClick={() => (collapsed ? onSelect(n.id) : toggle(n.id))}
                aria-expanded={!collapsed && expanded}
                title={n.label}
              >
                {!collapsed && <span className={`caret ${expanded ? "rot" : ""}`}>▸</span>}
                <span className="sb-icon-wrap" aria-hidden>
                  {n.icon ?? null}
                </span>
                {!collapsed && <span className="sideItem__label">{n.label}</span>}
              </button>
              {!collapsed && expanded && renderTree(n.children!, depth + 1)}
            </li>
          );
        }

        const active = selected === n.id;
        return (
          <li key={n.id} className="sb-li">
            <button
              className={`sideItem sideItem--leaf ${active ? "sideItem--active" : ""} ${collapsed ? "is-compact" : ""}`}
              style={{ paddingLeft: collapsed ? 12 : pad + 18 }}
              onClick={() => onSelect(n.id)}
              aria-current={active ? "page" : undefined}
              title={n.label}
            >
              <span className="sideItem__icon" aria-hidden="true">
                {n.icon ?? "•"}
              </span>
              {!collapsed && <span className="sideItem__label">{n.label}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`} aria-label="Navegación principal">
      <div className="sidebar__header">
        <div className="sb-brand">
          {!collapsed && (
            <>
              <span className="sb-logo" aria-hidden="true">
                🛠️
              </span>
              <span className="sb-title">Soporte Técnico</span>
            </>
          )}
        </div>
        <button className="sb-toggle" onClick={onToggle} aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}>
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="sidebar__nav" role="navigation">
        {renderTree(navs)}
      </nav>

      <div className="sidebar__footer">
        <div className="sb-prof__avatar" title={user?.displayName || "Usuario"}>
          {user?.displayName ? user.displayName[0] : "U"}
        </div>
        {!collapsed && (
          <div className="sb-prof__info">
            <div className="sb-prof__mail">{user?.mail || "usuario@empresa.com"}</div>
            <div className="sb-prof__mail" aria-hidden="true">
              {role}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ============================================================
   Shell: controla autenticación básica y muestra LoggedApp
   ============================================================ */

function Shell() {
  const { ready, account, signIn, signOut } = useAuth();
  const [loadingAuth, setLoadingAuth] = React.useState(false);

  // mapea la cuenta MSAL a tipo User para el header
  const user: User = account ? { displayName: account.name ?? account.username ?? "Usuario", mail: account.username ?? "", jobTitle: "" } : null;

  const isLogged = Boolean(account);

  const handleAuthClick = async () => {
    if (!ready || loadingAuth) return;
    setLoadingAuth(true);
    try {
      if (isLogged) await signOut();
      else await signIn("popup");
    } finally {
      setLoadingAuth(false);
    }
  };

  // estado no logueado: solo header con botón de acción
  if (!ready || !isLogged) {
    return (
      <div className="page layout">
        <section className="page-view">
          <WelcomeSolvi onLogin={handleAuthClick}/>
        </section>
      </div>
    );
  }

  // estado logueado
  return <LoggedApp user={user as User} />;
}

/* ============================================================
   LoggedApp: calcula árbol visible y renderiza el contenido
   ============================================================ */

function LoggedApp({ user }: { user: User }) {
  const { role, changeUser } = useUserRole(user!.mail);
  const services = useGraphServices() as { Tickets: TicketsService; Usuarios: UsuariosSPService; Logs: LogService, Anuncios: AnunciosService } & Record<string, any>;
  const { theme, toggle } = useTheme();

  const navCtx = React.useMemo<NavContext>(() => {
    const safeRole: string = role === "Administrador" || role === "Tecnico" || role === "Jefe de zona" || role === "Usuario" ? (role as string) : "Usuario";
    return {
      role: safeRole,
      flags: new Set<string>([]),
      hasService: (k) => {
        if (k === "Usuarios") return Boolean(services?.Usuarios);
        if (k === "Tickets") return Boolean(services?.Tickets);
        if (k === "Logs") return Boolean(services?.Logs);
        return false;
      },
    };
  }, [role, services]);

  const navs = React.useMemo(() => filterNavTree(NAV, navCtx), [navCtx]);

  const [selected, setSelected] = React.useState<string>(() => firstLeafId(navs));
  const [ausencia, setAusencia] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!findById(navs, selected)) setSelected(firstLeafId(navs));
  }, [navs, selected]);

  {/*<button onClick={() => {console.log(norm("NUÑEZ"))}}>PRUEBA NORMALIZACION</button>*/}

  const item = React.useMemo(() => findById(navs, selected), [navs, selected]);
  const element = React.useMemo(() => {
    if (!item) return null;
    if (typeof item.to === "function") {
      return (item.to as (ctx: RenderCtx) => React.ReactNode)({ services });
    }
    return item.to ?? null;
  }, [item, services]);

  // === NEW: sidebar plegable (con persistencia simple)
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem("sb-collapsed") === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("sb-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  const handleSelect = React.useCallback(
    (id: string) => {
      setSelected(id);
      const it = findById(navs, id);
      if (!it) return;

      // regla: si el ítem tiene autocollapse, colapsa.
      // (Opcional) Solo en pantallas pequeñas:
      const isNarrow = typeof window !== "undefined" && window.innerWidth < 1100;

      if (it.autocollapse && (isNarrow || true /* quita esto si quieres sólo en móvil */)) {
        setCollapsed(true);
        try {
          localStorage.setItem("sb-collapsed", "1");
        } catch {}
      }
    },
    [navs]
  );

  const [adOpen, setAdOpen] = React.useState(false);
  const [adItem, setAdItem] = React.useState<any>(null);

  // key por día para no repetir el modal en la sesión actual
  const getTodayKey = () => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `ad-shown-${y}-${m}-${d}`;
  };

  // pickers de campos comunes
  const pickHtml = (row: any): string => {
    const f = row?.fields ?? row ?? {};
    return f.Cuerpo ?? f.ContenidoHtml ?? f.Contenido ?? f.Descripcion ?? f.Description ?? "";
  };
  const pickTitle = (row: any): string => {
    const f = row?.fields ?? row ?? {};
    return f.TituloAnuncio ?? f.Titulo ?? f.Heading ?? "Anuncio";
  };

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (!services.Anuncios) return;

        const key = getTodayKey();
        if (sessionStorage.getItem(key) === "1") return;

        // Ventana del día de hoy en UTC (cubre columnas date-only y DateTime)
        const t = new Date();
        const y = t.getUTCFullYear();
        const m = String(t.getUTCMonth() + 1).padStart(2, "0");
        const d = String(t.getUTCDate()).padStart(2, "0");
        const startIso = `${y}-${m}-${d}T00:00:00Z`;
        const endIso = `${y}-${m}-${d}T23:59:59Z`;

        // Hoy ∈ [fechaInicio, fechaFinal]
        const filter = `(fields/Fechadeinicio le '${endIso}') and (fields/Fechafinal ge '${startIso}')`;

        // Pide el MÁS ANTIGUO (fechaInicio asc)
        const res = await services.Anuncios.getAll({filter, orderby: "fields/Fechadeinicio asc", top: 1,});

        const items: any[] = Array.isArray(res) ? res : res?.items ?? [];
        if (!items.length) return;

        const winner = items[0];
        if (!cancel && winner) {
          setAdItem(winner);
          setAdOpen(true);
          sessionStorage.setItem(key, "1");
        }
      } catch {
        alert("Error al obtener el anuncio")
      }
    })();
    return () => {
      cancel = true;
    };
  }, [services.Anuncios]);

  return (
    <div className={`page layout layout--withSidebar ${collapsed ? "is-collapsed" : ""}`}>
      <Sidebar navs={navs} selected={selected} onSelect={handleSelect} user={user} role={role} collapsed={collapsed} onToggle={toggleCollapsed} />
      <main className="content content--withSidebar">
        <div className="page-viewport">
            <div className="content-toolbar" role="toolbar" aria-label="Acciones de vista">
              <button className="btn btn-transparent-final btn-s" onClick={toggle} aria-label={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`} aria-pressed={theme === "dark"} title={theme === "dark" ? "Modo oscuro activado" : "Modo claro activado"}>
                <span className="" aria-hidden="true">
                  {theme === "dark" ? "🌙" : "☀️"}
                </span>
              </button>
              {(role === "Tecnico" || role === "Administrador") && 
                <button className="btn btn-transparent-final btn-m" onClick={() => setAusencia(!ausencia)} aria-label="Cambiar de rol">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 1024 1025">
                    <path fill="#000000" d="M512 1025q-104 0-199-40.5t-163.5-109T40.5 712T0 513t40.5-199t109-163.5T313 41T512 0t199 41t163.5 109.5t109 163.5t40.5 199t-40.5 199t-109 163.5t-163.5 109t-199 40.5zm0-896q-104 0-192.5 51t-140 139.5t-51.5 193t51.5 193t140 140T512 897t192.5-51.5t140-140t51.5-193t-51.5-193t-140-139.5T512 129zm192 224L573 530q-5 20-22 33.5T512 577q-21 0-38-13t-23-32L256 289v-32h32l225 181l159-117h32v32z"/>
                  </svg>
                </button>
              }
              {(user?.mail === "cesanchez@estudiodemoda.com.co" || user?.mail === "dpalacios@estudiodemoda.com.co") &&
                <button className="btn btn-transparent-final btn-m" onClick={() => changeUser()} aria-label="Cambiar de rol">
                  <span>Cambiar de rol</span>
                </button>
              }
              <button className="btn btn-transparent-final btn-s" onClick={() => logout()} aria-label="Cerrar sesión">
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M10 17l-1.4-1.4 3.6-3.6-3.6-3.6L10 7l5 5-5 5zM4 19h8v2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8v2H4v14z" fill="currentColor"/>
                </svg>
                <span>Salir</span>
              </button>
            </div>
            <div className="page page--fluid">{element}</div>
        </div>

        {ausencia && (
          <TeamsEventForm onDiscard={() => setAusencia(false)}></TeamsEventForm>
        )}
      </main>

      {/* Modal de anuncio del día */}
      {adOpen && adItem && (
        <EdmNewsModal open={adOpen} title={pickTitle(adItem)} html={pickHtml(adItem)} inset={{ top: 120, right: 16, bottom: 72, left: 16 }} width={360} confirmText="Entendido" onConfirm={() => setAdOpen(false)} onCancel={() => setAdOpen(false)}/>
      )}
    </div>
  );
}
/* ============================================================
   App root y gate de servicios
   ============================================================ */

export default function App() {
  return (
    <AuthProvider>
      <GraphServicesGate>
        <Shell />
      </GraphServicesGate>
    </AuthProvider>
  );
}

// Provee GraphServices solo si hay sesión iniciada
function GraphServicesGate({ children }: { children: React.ReactNode }) {
  const { ready, account } = useAuth();
  if (!ready || !account) return <>{children}</>;
  return <GraphServicesProvider>{children}</GraphServicesProvider>;
}
