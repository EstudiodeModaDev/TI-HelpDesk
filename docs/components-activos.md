# Componentes de Activos

## Descripción general

Este grupo cubre la lista principal de activos (`Catalogo/CatalogosActivos.tsx`), el detalle completo de un activo (`Catalogo/ModalDetalleActivo.tsx`), los formularios de registro de activos (individual y masivo por Excel) y el de asignar/reasignar usuarios, creando así un historial de movimientos en la ficha del activo (`FichaActivo.tsx`). En conjunto forman el flujo completo: crear activo → listar/buscar → ver detalle → asignar/prestar/devolver → abrir ficha del activo.

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

### CatalogoActivos.tsx

-Hooks de Funcionalidades:
`useActivosTI`(`Funcionalidades/inventario/useActivosTI`)y `useRepositories`(para ActivoTI), `colorEstadoActivo`/utils/ActivosColors.
-Estado Local: `activoAsignar`,`activoFicha` y `activoDetalle`.Según cuál tenga valor, se muestra `ModalAsignarActivo`, `FichaActivo` o `ModalDetalleActivo` en lugar de la tabla.
-Handlers: `handleCerrarAsignar` y `handleAsignado` (cierra el modal y llama loadAll() para refrescar).
-Constantes: `PAGE_SIZE = [10, 20, 50, 100], ESTADOS_ACTIVO y colorEstadoActivo (Funcionalidades/inventario/utils/ActivosColors)`
.

### `Catalogo/ModalDetalleActivo.tsx`.

-No usa ningun hook de Funcionalidades todo le llega por props.Es el equivalente a los componentes de tickets llamas "dumb components".
-Usa: UBICACIONES_ACTIVO, ESTADOS_ACTIVO,colorEstadoActivo y toISODateFlex(utils/Date).

### FichaActivo.tsx

-Hook de Funcionalidades: `useActivoMovimientos`usa movimientos,busqueda, tipoEventoFiltro, paginación, sorts/toggleSort y loadAll(renombrado recargarMovimientos), `useActivoPrestamos + devolverPrestamoActivo` y `useGraphServices`.
-Estado Local:elegido y activo: activo actual.
`prestamosActivo`: historial de préstamos.
Devolución: devolviendo, `buenEstado`, `comentarioDevolucion`, guardandoDevolucion y errorDevolucion.

-Estado Local:
-elegido y activo: activo actual.
-prestamosActivo: historial de préstamos.
-Devolución: devolviendo, buenEstado, comentarioDevolucion, guardandoDevolucion y errorDevolucion.
Efectos:
Carga las incidencias `(loadActivoTicket)`al cambiar activoId.
Carga los préstamos desde Graph filtrando por `Id_dispositivo.`
Derivado: prestamoActual = el préstamo que coincide con `activo.prestamo_activo_id`

### BuscadorActivo.tsx

-Hook de Funcionalidades:
`useRepositories`, usa AsynSelect de react select/async.
Funcion de BuscarActivos memorizada con useCallback.
constante: De PAGE_SIZE=10 para limitar los resultados de la busqueda.
Props: SimpleProps por si es un solo activo, como se hace en asiganar y Ficha activo y `MultiProps` que es para selector de varios activos como lo es en Nuevo ticket.

### ModalAltaActivo.tsx

-Hooks de Funcionalidades: `useActivosTI` de aqui usamos (form, formErrors, error, loading,setField, saveActivo,resetForm), `useRepositories`.

- Handler: HandleSubmit llama a saveActivo, si guarda bien un activo limpia el formulario para otro registro.
  -Constantes: UBICACIONES_ACTIVO.

### ModalAsignarActivo.

Exporta `ModalAsignarActivo`, que internamente usa el componente AsignarActivoForm.
Hooks:
`useActivoMovimientos`: form, setField y saveMovimiento.
`useWorkers`({ onlyEnabled: true }) y `useFranquicias:` las listas de usuarios.
`usePrestamos`(Funcionalidades/loans/prestamos): reutiliza el mismo flujo de la página de Préstamos (ticket + registro + correo).
`useActivoPrestamo:` iniciarPrestamoActivo.
useAuth y useGraphServices.
Estado local: elegido, errorActivo, responsable, usuarioDestino, tipoMovimiento ("asignacion" por defecto) y guardando.
Derivados: esPrestamo, esReasignacion y enPrestamo, calculados según el estado del activo.
useMemo: listaUsuariosDestino une empleados y franquicias, quita duplicados por correo y ordena alfabéticamente.
Efectos:
Al cambiar el activo, precarga en el formulario la ubicación, el estado anterior, el usuario de origen y Id_dispositivo.
Llena el responsable con la cuenta logueada (account).
Handler: handleSubmit.
