# Documentación de módulos — TI-HelpDesk

Este índice organiza la documentación técnica del proyecto por capa arquitectónica. Cada archivo cubre: descripción general, archivos que componen el módulo, funciones/constantes clave, flujo del módulo, dependencias y oportunidades de mejora.

**Arquitectura general:** `components` (UI React) → `Funcionalidades` (lógica de negocio/hooks) → `Services` / `repositories` (acceso a datos) → SharePoint (vía `graph/GraphRest.ts` + MSAL) o Supabase (Postgres + Storage + Edge Functions). `Models` define los tipos/DTOs compartidos por todas las capas.

## Arranque de la aplicación

- [app-bootstrap.md](app-bootstrap.md) — Providers raíz (MSAL, React Query, repositorios, Graph), navegación por estado y configuración de Vite.

## Lógica de negocio (`src/Funcionalidades`)

- [tickets.md](tickets.md) — Ciclo de vida completo del ticket: creación, asignación, escalamiento, recategorización, adjuntos, log, relaciones y hooks de React. El módulo más grande y crítico del sistema.
- [access.md](access.md) — Franquicias, miembros de grupo y trabajadores (control de acceso).
- [funcionalidades-auth.md](funcionalidades-auth.md) — Tema visual (claro/oscuro) y perfil de usuario.
- [comments.md](comments.md) — Comentarios/menciones tipo "Solvi" sobre tickets.
- [content.md](content.md) — Anuncios y plantillas de contenido.
- [forms.md](forms.md) — Formatos/formularios de TI.
- [dashboard-funcionalidades.md](dashboard-funcionalidades.md) — Lógica de indicadores y disponibilidad de agentes (incl. integración con Teams).
- [loans-funcionalidades.md](loans-funcionalidades.md) — Lógica de préstamos de equipos.
- [activos.md](activos.md) — Activos TI: catálogo, bitácora de movimientos,asignacion de usuarios, préstamo/devolución de activos y vínculo con tickets.
- [operations.md](operations.md) — Cajeros POS, información de tienda, inventario y proveedores de internet.
- [shared-funcionalidades.md](shared-funcionalidades.md) — Cliente de Power Automate (Flow) y subida de archivos a Supabase.
- [tasks-funcionalidades.md](tasks-funcionalidades.md) — Tareas y ausencias del equipo.
- [timeCounter.md](timeCounter.md) — Contador de tiempo/sesión de trabajo (start/pause/stop/heartbeat).

## Acceso a datos

- [models.md](models.md) — Tipos/DTOs compartidos (43 archivos) que representan las entidades de SharePoint y Supabase en toda la app.
- [services.md](services.md) — Capa de wrappers CRUD contra listas de SharePoint y Supabase (~40 archivos con un patrón muy repetitivo).
- [repositories.md](repositories.md) — Patrón repositorio que abstrae el origen de datos (SharePoint vs Supabase) por entidad, en migración activa.
- [graph.md](graph.md) — Cliente REST genérico hacia Microsoft Graph y su contexto de inyección en React.
- [auth-app.md](auth-app.md) — Configuración de MSAL, `AuthContext` y flujo de login/logout.
- [utils.md](utils.md) — Utilidades transversales (fechas, texto, números, roles, menciones, ANS).

## Componentes de UI (`src/components`)

- [components-tickets.md](components-tickets.md) — Listado, detalle y modales de gestión de tickets.
- [components-dashboard.md](components-dashboard.md) — Dashboards general, detallado, disponibilidad y reportes.
- [components-documentar.md](components-documentar.md) — Documentación de casos, actas de entrega y escalamiento a proveedor.
- [components-formatos.md](components-formatos.md) — Formularios de seguridad de red, ERP, permisos de navegación y servicios de TI.
- [components-loans.md](components-loans.md) — Préstamo de equipos, pruebas de dispositivo, historial y devoluciones.
- [components-activos.md](components-activos.md) — Catálogo, detalle, ficha de seguimiento, alta y asignación de activos.
- [components-tareas.md](components-tareas.md) — Tareas, ausencias, seguimiento y contador de tiempo.
- [components-usuarios-acceso.md](components-usuarios-acceso.md) — Gestión de usuarios, acceso/franquicias y login.
- [components-operativos.md](components-operativos.md) — Cajeros POS, información de tienda/proveedores, inventario y tips.
- [components-storage.md](components-storage.md) — Estimación de almacenamiento de bibliotecas y listas de SharePoint.
- [components-shared.md](components-shared.md) — Componentes de UI genéricos reutilizables (confirmación de borrado, toggle, truncado, renderizador de HTML, rich text).

## Edge Functions (Supabase / Deno)

- [edge-monitor-ticket-expirations.md](edge-monitor-ticket-expirations.md) — Monitoreo y alertas de vencimiento de SLA de tickets.
- [edge-obtener-disponibilidad.md](edge-obtener-disponibilidad.md) — Disponibilidad de agentes hoy y vía Microsoft Teams Shifts.
- [edge-process-emails.md](edge-process-emails.md) — Creación de tickets a partir de correos entrantes.
- [edge-sync-holidays-sharepoint.md](edge-sync-holidays-sharepoint.md) — Sincronización de festivos y de listas genéricas de SharePoint hacia Supabase.

## Hallazgos transversales más relevantes

Estos temas aparecen repetidos en varios módulos y son los de mayor impacto si se decide priorizar una limpieza:

- **Código muerto confirmado por ausencia de importadores**: `CalcularMinutos.ts`, `ticketMappers.ts`, `ticketPayloads.ts`, `ticketRelation.ts`, `ticketValidators.ts`, `ticketsFilters.ts` (ver [tickets.md](tickets.md)); `RecordatoriosService`, `ReFacturasService`, `CentrosFacturaService`, `UserService` (ver [services.md](services.md)); `LogiButton.tsx` (ver [components-usuarios-acceso.md](components-usuarios-acceso.md)).
- **Duplicación de componentes/lógica**: `AgregarFranquicias.tsx` existe idéntico en `Acceso/` y `Usuarios/` ([components-usuarios-acceso.md](components-usuarios-acceso.md)); patrón CRUD repetido casi al carácter en ~30 archivos de `Services` ([services.md](services.md)); lógica de autenticación con Graph repetida en varias Edge Functions.
- **Credenciales/URLs sensibles hardcodeadas**: client ID/tenant de Azure AD en `msal.ts` ([auth-app.md](auth-app.md)); URLs de Power Automate con firma SAS embebida en varios archivos de `Funcionalidades` y `Formatos.tsx`.
- **Fuentes de verdad duplicadas o divergentes**: SLA (`horasPorANS`) definido en un lugar pero usado con otros valores en otro ([tickets.md](tickets.md)); dos modelos paralelos de Ticket/Log para SharePoint vs Supabase ([models.md](models.md)); dos fuentes distintas de festivos colombianos ([edge-sync-holidays-sharepoint.md](edge-sync-holidays-sharepoint.md)).
- **Sanitización inconsistente de HTML**: `Renderizador.tsx` sanitiza con DOMPurify correctamente, pero `Formatos.tsx` usa `dangerouslySetInnerHTML` sin sanitizar ([components-shared.md](components-shared.md), [components-formatos.md](components-formatos.md)).
- **Ausencia total de pruebas automatizadas** en todas las capas revisadas.
