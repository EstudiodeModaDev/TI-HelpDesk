# Componentes de Activos

## Descripción general

Este grupo cubre la lista principal de activos (`Catalogo/CatalogosActivos.tsx`), el detalle completo de un activo (`Catalogo/ModalDetalleActivo.tsx`), el formulario de registro individual de activos y el de asignar/reasignar usuarios, creando así un historial de movimientos en la ficha del activo (`FichaActivo.tsx`). En conjunto forman el flujo completo: crear activo → listar/buscar → ver detalle → asignar/prestar/devolver → abrir ficha del activo.

## Archivos

| Archivo                           | Qué renderiza/hace                                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Catalogo/CatalogosActivos.tsx`   | Tabla paginada y ordenable con filtros de texto libre (código, serial, tipo, marca o modelo) y de estado (disponible, asignado, préstamo); muestra la información más relevante de cada activo (estado, código, tipo, marca, modelo).                                                                                                     |
| `Catalogo/ModalDetalleActivo.tsx` | Detalle completo del activo: ubicación, usuario asignado, fecha de creación, tipo y número de serie; incluye dos botones, "Asignar usuario" y "Ver seguimiento" (`FichaActivo`), que redirigen directamente a sus páginas.                                                                                                                |
| `FichaActivo.tsx`                 | Bitácora de todos los movimientos de un activo: buscador de activos individuales, historial completo del equipo (fecha, usuarios, tickets, tickets asociados, estados, responsables, comentarios), filtros por estado y de texto libre, y botón para devolver un equipo que se encuentre en préstamo.                                     |
| `BuscadorActivo.tsx`              | Buscador de activos compartido, listo para reutilizar; se usa en `NuevoTicketForm`, `FichaActivo` y `ModalAsignarActivo`. Limita los resultados a 10 activos (`PAGE_SIZE`) para no saturar y, en tickets, admite `isMulti` para seleccionar varios activos.                                                                               |
| `ModalAltaActivo.tsx`             | Formulario completo de registro de un nuevo activo: ubicación, fecha de ingreso, código, número de serie, tipo, marca y modelo.                                                                                                                                                                                                           |
| `ModalAsignarActivo.tsx`          | Formulario simplificado para asignar un activo (seleccionar usuario y ubicación), cambiar su estado o generar un préstamo (solo seleccionar usuario). Usa `BuscadorActivo` para elegir el activo o se abre desde `ModalDetalleActivo`; genera automáticamente el movimiento en `FichaActivo` y el cambio de estado en `CatalogosActivos`. |

## Funciones y constantes clave

### Catalogo/CatalogosActivos.tsx

- Hook de Funcionalidades: `useActivosTI` (`Funcionalidades/inventario/useActivosTI`), que trae la lista de activos ya filtrada y paginada desde el servidor (`activos`, `loading`, `error`, `search`, `estadoFiltro`, `pageIndex`, `pageSize`, `total`, `hasNext`, `nextPage`, `prevPage`, `loadAll`); el repositorio `activosTI` se obtiene con `useRepositories`.
- Estado local: `activoAsignar` (activo que se va a asignar), `activoFicha` (activo cuya bitácora se abre) y `activoDetalle` (activo que se ve en el modal de detalle); según cuál tenga valor, se renderiza `ModalAsignarActivo`, `FichaActivo` o `ModalDetalleActivo` en lugar de la tabla.
- Handlers: `handleCerrarAsignar` (cierra el formulario de asignación sin guardar) y `handleAsignado` (cierra el formulario y llama `loadAll()` para refrescar la tabla con el nuevo estado del activo).
- Valores calculados: `totalPages`, `rangeStart` y `rangeEnd` para mostrar "x–y de z" en el pie de la tabla.
- Constantes UI: tamaños de página `PAGE_SIZE = [10, 20, 50, 100]`, opciones de estado `ESTADOS_ACTIVO` (`Models/ActivosTIMovimientos`) y `colorEstadoActivo` (`Funcionalidades/inventario/utils/ActivosColors`) para pintar el badge de estado.

### Catalogo/ModalDetalleActivo.tsx

- Es un "dumb component": recibe el activo y los callbacks por props y no consume hooks de Funcionalidades.
- Usa `UBICACIONES_ACTIVO` y `ESTADOS_ACTIVO` para traducir los valores guardados a etiquetas legibles, `colorEstadoActivo` para el color del estado y `toISODateFlex` (`utils/Date`) para formatear la fecha de creación.

### FichaActivo.tsx

- Hooks de Funcionalidades: `useActivoMovimientos` (`Funcionalidades/inventario/useActivoMovimientos`) carga el historial de movimientos del activo con búsqueda, filtro por tipo de evento (`tipoEventoFiltro`), paginación y ordenamiento (`sorts`/`toggleSort`); su `loadAll` se renombra como `recargarMovimientos`. `useActivoTicket` (`Funcionalidades/inventario/useActivoTickets`) trae las incidencias (tickets asociados al activo). `useActivoPrestamo` (`Funcionalidades/inventario/useActivoPrestamo`) expone `devolverPrestamoActivo` para registrar la devolución.
- Servicios: `useRepositories` (`movimientosTI`, `activotickets`, `activosTI`) y `useGraphServices` (servicio `prestamos` de SharePoint).
- Estado local: `elegido` (activo escogido en el buscador cuando la ficha se abre sin activo), `activo` (activo mostrado, se actualiza tras una devolución), `prestamosActivo` (historial de préstamos del equipo) y los estados de la devolución: `devolviendo` (muestra el formulario), `buenEstado`, `comentarioDevolucion`, `guardandoDevolucion` y `errorDevolucion`.
- Efectos: al cambiar `activoId` carga las incidencias con `loadActivoTicket`; también carga los préstamos desde Graph filtrando por `Id_dispositivo`.
- Valores derivados: `prestamoActual` (el préstamo que coincide con `activo.prestamo_activo_id`) y `puedeDevolver` (solo si el activo está `en_prestamo` y tiene un préstamo vigente).
- Handlers: `cancelarDevolucion` (cierra y limpia el formulario de devolución) y `confirmarDevolucion` (llama `devolverPrestamoActivo` y vuelve a consultar el activo con `getActivoById` para mostrar su nuevo estado).

### BuscadorActivo.tsx

- Servicios: `useRepositories` (`activosTI`); el select es `AsyncSelect` de `react-select/async`, que busca mientras el usuario escribe.
- Función clave: `buscarActivos` (memoizada con `useCallback`) consulta `activosTI.loadActivos` con el texto escrito y devuelve las opciones; si falla, guarda el mensaje en `error` y lo muestra como "sin opciones".
- Estado local: `error` (mensaje de error de la última búsqueda).
- Constantes: `PAGE_SIZE = 10` para limitar los resultados y no saturar la lista.
- Props: `SimpleProps` para seleccionar un solo activo (usado en `ModalAsignarActivo` y `FichaActivo`) y `MultiProps` (`isMulti`) para seleccionar varios (usado en `NuevoTicketForm`).

### ModalAltaActivo.tsx

- Hook de Funcionalidades: `useActivosTI`, del que solo usa la parte de formulario (`form`, `formErrors`, `error`, `loading`, `setField`, `saveActivo`, `resetForm`).
- Handler: `handleSubmit` evita el envío por defecto y llama `saveActivo()`; si guarda bien, el hook deja el formulario vacío para registrar otro activo.
- Constantes UI: `UBICACIONES_ACTIVO` para el select de ubicación.
- El componente exportado se llama `ModalAltaActivos` (en plural), aunque el archivo está en singular.

### ModalAsignarActivo.tsx

- Exporta `ModalAsignarActivo`, que internamente renderiza `AsignarActivoForm` (el formulario real).
- Hooks de Funcionalidades: `useActivoMovimientos` (`form`, `setField`, `saveMovimiento`) para registrar el movimiento en la bitácora; `useWorkers({ onlyEnabled: true })` y `useFranquicias` para las listas de usuarios destino; `usePrestamos` (`Funcionalidades/loans/prestamos`) para crear el préstamo (ticket + registro en la lista de préstamos + correo), el mismo hook que usaba la antigua página de Préstamos, hoy comentada en el menú y en desuso; y `useActivoPrestamo` (`iniciarPrestamoActivo`) para marcar el activo como prestado.
- Servicios: `useAuth` (cuenta logueada, que queda como responsable) y `useGraphServices` (servicio de franquicias).
- Estado local: `elegido` (activo escogido en el buscador), `errorActivo` (mensaje de error del formulario), `responsable`, `usuarioDestino`, `tipoMovimiento` (`"asignacion"` por defecto o `"prestamo"`) y `guardando`.
- Valores derivados: `esPrestamo` (el usuario eligió préstamo), `esReasignacion` (el activo ya estaba asignado, cambia el título a "Reasignar activo") y `enPrestamo` (el activo está prestado y no se puede mover).
- `useMemo`: `listaUsuariosDestino` une empleados y franquicias, quita duplicados por correo y los ordena alfabéticamente.
- Efectos: al cambiar el activo precarga en el formulario la ubicación, el estado anterior, el usuario de origen e `Id_dispositivo`; al tener la cuenta logueada llena los datos del responsable.
- Handlers: `handleSubmit` bloquea el envío si el activo está en préstamo, deriva a `registrarPrestamo` si es un préstamo y, si no, guarda el movimiento (`saveMovimiento`) y actualiza el activo (`updateActivo`) solo con lo que cambió (estado, ubicación o usuario). `registrarPrestamo` crea el préstamo, actualiza el activo y envía la notificación por correo.

## Flujo del módulo

1. El usuario entra desde el menú "Activos" (`App.tsx`), que tiene cuatro opciones: "Catálogo de activos" (`CatalogosActivos`), "Nuevo Activo" (`ModalAltaActivos`), "Asignación" (`ModalAsignarActivo`) y "Ficha de seguimiento" (`FichaActivo`).
2. El registro de un nuevo activo se hace en `ModalAltaActivos`: se llena la información del equipo y `saveActivo()` lo guarda; el formulario queda limpio para otro registro y el activo aparece en el catálogo.
3. En `CatalogosActivos` el usuario filtra por texto libre o por estado y pagina la tabla (server-side vía `useActivosTI`).
4. Al hacer click en "Ver detalle" de un activo se llena `activoDetalle` y se abre `ModalDetalleActivo` como overlay sobre la tabla (se cierra con el botón o haciendo click afuera).
5. Desde el detalle hay dos botones: "Asignar usuario" (`onAsignar`) llena `activoAsignar` y el catálogo renderiza `ModalAsignarActivo` en lugar de la tabla; "Ver seguimiento" (`onVerSeguimiento`) llena `activoFicha` y el catálogo renderiza `FichaActivo`.
6. En `ModalAsignarActivo` el usuario elige el usuario destino, la ubicación o el nuevo estado, o marca el movimiento como préstamo. Al enviar, `handleSubmit`: bloquea el envío si el activo ya está en préstamo; si es préstamo, usa `registrarPrestamo` (crea el ticket y el préstamo, marca el activo como prestado y envía el correo); si no, guarda el movimiento en la bitácora (`saveMovimiento`) y actualiza el activo (`updateActivo`) con lo que cambió.
7. Al guardar, `onSaved` llama a `handleAsignado` en `CatalogosActivos`, que cierra el formulario y ejecuta `loadAll()` para refrescar la tabla con el nuevo estado del activo.
8. En `FichaActivo` el usuario ve el historial de movimientos, las incidencias (tickets asociados) y los préstamos del equipo. Si el activo está `en_prestamo`, puede devolverlo: `confirmarDevolucion` llama a `devolverPrestamoActivo` y vuelve a consultar el activo (`getActivoById`) para mostrar su nuevo estado.
9. Cuando "Asignación" o "Ficha de seguimiento" se abren desde el menú (sin activo), primero muestran `BuscadorActivo` para escoger el equipo; al elegirlo se muestra el formulario o la ficha de ese activo.
10. Desde Tickets, `NuevoTicketForm` usa `BuscadorActivo` con `isMulti` para asociar uno o varios activos al ticket; esos tickets aparecen después como incidencias en `FichaActivo`.

Navegación entre componentes: props y estado local, sin rutas ni Context de UI. `CatalogosActivos` decide qué pantalla mostrar según cuál de `activoAsignar`, `activoFicha` o `activoDetalle` tenga valor, y los hijos avisan con callbacks (`onClose`, `onSaved`, `onAsignar`, `onVerSeguimiento`). `ModalAsignarActivo` usa `key={actual?.id}` para reiniciar el formulario cada vez que cambia el activo elegido. Los únicos contextos usados son de infraestructura (`RepositoriesContext`, `GraphServicesContext`, `AuthContext`).

## Dependencias

| Componente             | Funcionalidades / Models                                                                                                                                                                                                                                                                                                                                              | Librerías externas   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| CatalogosActivos.tsx   | `Funcionalidades/inventario/useActivosTI`, `Funcionalidades/inventario/utils/ActivosColors`, `Models/ActivoTI`, `Models/ActivosTIMovimientos`, `repositories/repositoriesContext`                                                                                                                                                                                     | React                |
| ModalDetalleActivo.tsx | `Funcionalidades/inventario/utils/ActivosColors`, `Models/ActivoTI`, `Models/ActivosTIMovimientos`, `utils/Date`                                                                                                                                                                                                                                                      | —                    |
| FichaActivo.tsx        | `Funcionalidades/inventario/useActivoMovimientos`, `Funcionalidades/inventario/useActivoTickets`, `Funcionalidades/inventario/useActivoPrestamo`, `Funcionalidades/inventario/utils/ActivosColors`, `Models/ActivoTI`, `Models/ActivosTIMovimientos`, `Models/prestamos`, `repositories/repositoriesContext`, `graph/GrapServicesContext`, `utils/Date`               | `lucide-react`       |
| BuscadorActivo.tsx     | `Models/ActivoTI`, `repositories/repositoriesContext`                                                                                                                                                                                                                                                                                                                 | `react-select/async` |
| ModalAltaActivo.tsx    | `Funcionalidades/inventario/useActivosTI`, `Models/ActivoTI`, `repositories/repositoriesContext`                                                                                                                                                                                                                                                                      | —                    |
| ModalAsignarActivo.tsx | `Funcionalidades/inventario/useActivoMovimientos`, `Funcionalidades/inventario/useActivoPrestamo`, `Funcionalidades/access/Workers`, `Funcionalidades/access/Franquicias`, `Funcionalidades/loans/prestamos`, `Models/ActivosTIMovimientos`, `Models/Commons`, `Models/Usuarios`, `repositories/repositoriesContext`, `graph/GrapServicesContext`, `auth/authContext` | `react-select`       |
| Común                  | `BuscadorActivo` (reutilizado en `FichaActivo`, `ModalAsignarActivo` y `NuevoTicketForm`), `colorEstadoActivo`, `ESTADOS_ACTIVO`, `UBICACIONES_ACTIVO`                                                                                                                                                                                                                | —                    |

## Oportunidades de mejora

- **Decisiones tomadas con datos viejos**: `ModalAsignarActivo` decide si el activo está en préstamo (`enPrestamo`) o ya asignado (`esReasignacion`) con el objeto `activo` que se cargó al abrir la tabla, no con su estado real al momento de guardar. Si dos técnicos abren el mismo equipo al tiempo, ambos pueden asignarlo o prestarlo, y el último que guarda "gana" sin aviso. Antes de guardar se debería volver a consultar el activo (`getActivoById`) o validar el estado en la base de datos.
- **La ficha no se refresca completa después de devolver**: `confirmarDevolucion` (`FichaActivo.tsx`) recarga el activo y los movimientos, pero no la lista de préstamos (`prestamosActivo`), que solo se carga al abrir la ficha. Después de devolver un equipo, el historial de préstamos sigue mostrando el préstamo como abierto hasta que el usuario sale y vuelve a entrar.
- **Lógica de negocio dentro del componente**: `handleSubmit` de `ModalAsignarActivo.tsx` decide qué campos del activo cambiar (estado, ubicación, usuario, limpiarlo si queda disponible) y llama directo a `activosTI.updateActivo`. Esa regla no se puede reutilizar ni probar sin montar el formulario. Además, el objeto que se envía repite la condición `tieneDestino` dos veces, señal de que la lógica creció a base de parches. Debería vivir en `useActivoMovimientos` o en un hook nuevo de `Funcionalidades/inventario`, como ya pasa con `saveActivo` en el alta.
- **Errores que el usuario no ve**: en `FichaActivo.tsx`, si falla la carga del historial de préstamos, y en `ModalAsignarActivo.tsx`, si falla el correo de aviso del préstamo, solo se escribe un `console.error`. El usuario ve la pantalla como si todo estuviera bien (por ejemplo, un historial de préstamos vacío) sin saber que hubo un error. Sería mejor mostrar un aviso (`react-hot-toast`, que ya se usa en tickets).
- **Componentes grandes con muchas responsabilidades**: `FichaActivo.tsx` (≈525 líneas) mezcla buscador, historial de movimientos, incidencias, préstamos y el formulario de devolución; `ModalAsignarActivo.tsx` (≈500 líneas) mezcla asignación, reasignación, cambio de estado y préstamo. Separar la devolución en un `<DevolucionActivo/>` y el préstamo en su propio hook haría cada archivo más fácil de leer y probar.
- **Detalles menores de orden**: `ModalAltaActivo.tsx` y `ModalAsignarActivo.tsx` se llaman "Modal" pero son páginas completas; el archivo `ModalAltaActivo.tsx` exporta `ModalAltaActivos` (en plural); el label `" Nuevo Activo"` tiene un espacio al inicio; hay colores fijos (`#dc2626`, varios en `FichaActivo.css`) en lugar de las variables de `index.css`; y el `useEffect` que precarga el formulario de asignación no declara `setField`/`setPrestamoField` en sus dependencias.
