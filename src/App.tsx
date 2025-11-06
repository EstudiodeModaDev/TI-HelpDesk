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
  { id: "home", label: "Home", icon: <img src={HomeIcon} alt="" className="sb-icon" />, to: <DashBoardPage />, roles: ["Administrador", "Tecnico"], autocollapse: true },
  { id: "ticketform", label: "Nuevo Ticket", icon: <img src={addIcon} alt="" className="sb-icon" />, to: () => <NuevoTicketForm />, roles: ["Administrador", "Tecnico"] },
  { id: "ticketform_user", label: "Nuevo Ticket", icon: <img src={addIcon} alt="" className="sb-icon" />, to: <NuevoTicketUsuarioForm />, roles: ["Usuario"] },
  { id: "ticketTable", label: "Ver Tickets", icon: <img src={seeTickets} alt="" className="sb-icon" />, to: <TablaTickets />, autocollapse: true },
  { id: "task", label: "Tareas", icon: <img src={tareasIcon} alt="" className="sb-icon" />, to: <TareasPage />, roles: ["Administrador", "Tecnico"], autocollapse: true },
  { id: "formatos", label: "Formatos", icon: <img src={filesIcon} alt="" className="sb-icon" />, to: <Formatos />, roles: ["Administrador"] },
  { id: "info", label: "Información", icon: <img src={infoIcon} alt="" className="sb-icon" />, to: <InfoPage />, roles: ["Administrador", "Tecnico"] },
  { id: "admin", label: "Administración", icon: <img src={settingsIcon} className="sb-icon" />, roles: ["Administrador", "Tecnico"], children: [
      { id: "anuncios", label: "Anuncios", to: <CrearAnuncio />, roles: ["Administrador", "Tecnico"], icon: <img src={newsIcon} className="sb-icon" /> },
      { id: "plantillas", label: "Plantillas", icon: <img src={templateIcon} className="sb-icon" />, to: <CrearPlantilla />, roles: ["Administrador", "Tecnico"] },
      { id: "usuarios", label: "Usuarios", icon: <img src={usersIcon} className="sb-icon" />, to: <UsuariosPanel />, roles: ["Administrador"] },
    ],
  },
  {id: "acciones", label: "Acciones", icon: <img src={ActionsIcon} className="sb-icon" />, roles: ["Administrador", "Tecnico", "Jefe de zona"], children: [
      {id: "siesa", label: "Siesa", roles: ["Administrador", "Tecnico", "Jefe de zona"], icon: <img src={siesaIcon} className="sb-icon" />, children: [
          {id: "cajpos", label: "Cajeros POS", icon: <img src={cajerosIcon} className="sb-icon" />, to: (rctx: RenderCtx) => rctx.services ? <CajerosPOSForm services={{ Tickets: rctx.services.Tickets, Logs: rctx.services.Logs }} /> : <div>Cargando servicios…</div>, roles: ["Administrador", "Tecnico", "Jefe de zona"],},
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
   Header superior simple
   ============================================================ */

function HeaderBar(props: { onPrimaryAction?: { label: string; onClick: () => void; disabled?: boolean } | null }) {
  const { onPrimaryAction } = props;
  return (
    <header className="headerRow">
      <div className="header-inner">
        <div className="brand">
          <h1>SOLVI - Tu solución empieza aqui</h1>
        </div>
        <div className="userCluster">
          <div className="avatar">?</div>
          {onPrimaryAction && (
            <button className="btn-logout" onClick={onPrimaryAction.onClick} disabled={onPrimaryAction.disabled} aria-busy={onPrimaryAction.disabled}>
              {onPrimaryAction.label}
            </button>
          )}
        </div>
      </div>
    </header>
  );
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

  const actionLabel = !ready ? "Cargando…" : loadingAuth ? (isLogged ? "Cerrando…" : "Abriendo Microsoft…") : isLogged ? "Cerrar sesión" : "Iniciar sesión";

  // estado no logueado: solo header con botón de acción
  if (!ready || !isLogged) {
    return (
      <div className="page layout">
        <HeaderBar onPrimaryAction={{ label: actionLabel, onClick: handleAuthClick, disabled: !ready || loadingAuth }} />
        <section className="page-view">
          <WelcomeSolvi />
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
  const { role } = useUserRole(user!.mail);
  const services = useGraphServices() as { Tickets: TicketsService; Usuarios: UsuariosSPService; Logs: LogService, Anuncios: AnunciosService } & Record<string, any>;

  const navCtx = React.useMemo<NavContext>(() => {
    const safeRole: string = role === "Administrador" || role === "Tecnico" || role === "Usuario" ? (role as string) : "Usuario";
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
  React.useEffect(() => {
    if (!findById(navs, selected)) setSelected(firstLeafId(navs));
  }, [navs, selected]);

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
          <div className="page page--fluid center-all">{element}</div>
        </div>
      </main>

      {/* Modal de anuncio del día */}
      {adOpen && adItem && (
        <EdmNewsModal open={adOpen} title={pickTitle(adItem)} html={pickHtml(adItem)} inset={{ top: 120, right: 16, bottom: 72, left: 16 }} width={360} confirmText="Entendido" cancelText="Cerrar" onConfirm={() => setAdOpen(false)} onCancel={() => setAdOpen(false)}/>
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
