import * as React from "react";
import type {
  ActivoMovimiento,
  CrearActivoMovimientoDTO,
  EstadoActivo,
  MovimientoErrors,
} from "../../Models/ActivosTIMovimientos";
import { ValidarMovimiento } from "../../Models/ActivosTIMovimientos";
import type {
  FilterActivosMovimiento,
  MovimientosTIRepository,
} from "../../repositories/MovimientoTIRepository/MovimientosTIRepository";

const DEFAULT_PAGE_SIZE = 10;

export type MovimientoSortField =
  | "fecha_evento"
  | "estado_nuevo"
  | "responsable_nombre";
export type MovimientoSortDir = "asc" | "desc";
export type MovimientoSort = {
  field: MovimientoSortField;
  dir: MovimientoSortDir;
};

const DEFAULT_SORTS: MovimientoSort[] = [
  { field: "fecha_evento", dir: "desc" },
];

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

type UseActivoMovimientosParams = {
  MovimientosSvc: MovimientosTIRepository;
  activoId?: string;
};

export function useActivoMovimientos({
  MovimientosSvc,
  activoId,
}: UseActivoMovimientosParams) {
  const [movimientos, setMovimientos] = React.useState<ActivoMovimiento[]>([]);

  const [form, setForm] = React.useState<Partial<CrearActivoMovimientoDTO>>({
    activo_id: activoId,
  });
  const [formErrors, setFormErrors] = React.useState<MovimientoErrors>({});

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [tipoEventoFiltro, setTipoEventoFiltro] = React.useState<
    EstadoActivo | ""
  >("");

  const [pageIndex, setPageIndex] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = React.useState(0);
  const [hasNext, setHasNext] = React.useState(false);
  const [sorts, setSorts] = React.useState<MovimientoSort[]>(DEFAULT_SORTS);

  const debouncedSearch = useDebouncedValue(search);
  const primarySort = sorts[0] ?? DEFAULT_SORTS[0];

  const setField = React.useCallback(
    <K extends keyof CrearActivoMovimientoDTO>(
      key: K,
      value: CrearActivoMovimientoDTO[K],
    ) => {
      setForm((currentForm) => ({
        ...currentForm,
        [key]: value,
      }));
    },
    [],
  );

  const resetForm = React.useCallback(() => {
    setForm({ activo_id: activoId }); // Mantenemos siempre el activoId pre-cargado
    setFormErrors({});
  }, [activoId]);

  const validateForm = React.useCallback(() => {
    const errors = ValidarMovimiento(form);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const loadMovimientos = React.useCallback(
    async (filter?: FilterActivosMovimiento) => {
      setLoading(true);
      setError(null);

      try {
        const result = await MovimientosSvc.loadMovimientos(filter);
        if (!result.status) {
          setError(
            result.message ?? "Error cargando la bitácora de movimientos",
          );
          return false;
        }
        setMovimientos(result.data ?? []);
        setTotal(result.total ?? result.data?.length ?? 0);
        setHasNext(result.hasNext ?? false);
        return true;
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Error cargando la bitácora",
        );
        setMovimientos([]);
        setTotal(0);
        setHasNext(false);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [MovimientosSvc],
  );

  const buildFilter = React.useCallback(
    (): FilterActivosMovimiento => ({
      activo_id: activoId,
      estado_nuevo: tipoEventoFiltro || undefined,
      search: debouncedSearch.trim() || undefined,
      pageIndex,
      pageSize,
      paginated: true,
      sortField: primarySort.field,
      sortDir: primarySort.dir,
    }),
    [
      activoId,
      tipoEventoFiltro,
      debouncedSearch,
      pageIndex,
      pageSize,
      primarySort.field,
      primarySort.dir,
    ],
  );

  const toggleSort = React.useCallback(
    (field: MovimientoSortField, additive = false) => {
      setSorts((previousSorts) => {
        const index = previousSorts.findIndex((sort) => sort.field === field);

        if (!additive) {
          if (index >= 0) {
            const dir = previousSorts[index].dir === "desc" ? "asc" : "desc";
            return [{ field, dir }];
          }
          return [{ field, dir: "asc" }];
        }

        if (index >= 0) {
          const nextSorts = [...previousSorts];
          nextSorts[index] = {
            field,
            dir: nextSorts[index].dir === "desc" ? "asc" : "desc",
          };
          return nextSorts;
        }

        return [...previousSorts, { field, dir: "asc" }];
      });
    },
    [],
  );

  const loadAll = React.useCallback(
    () => loadMovimientos(buildFilter()),
    [loadMovimientos, buildFilter],
  );

  const saveMovimiento = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isValid = validateForm();
      if (!isValid) {
        return false;
      }

      const result = await MovimientosSvc.createMovimientos(
        form as CrearActivoMovimientoDTO,
      );

      if (!result.status) {
        setError(
          result.message ?? "Error registrando el movimiento en la bitácora",
        );
        return false;
      }

      await loadAll();
      resetForm();
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Error registrando el movimiento",
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [MovimientosSvc, form, validateForm, loadAll, resetForm]);

  const criteriaKey = React.useMemo(
    () =>
      JSON.stringify({
        activoId,
        tipoEventoFiltro,
        pageSize,
        search: debouncedSearch.trim(),
        sortField: primarySort.field,
        sortDir: primarySort.dir,
      }),
    [
      activoId,
      tipoEventoFiltro,
      pageSize,
      debouncedSearch,
      primarySort.field,
      primarySort.dir,
    ],
  );

  const previousCriteriaRef = React.useRef(criteriaKey);

  React.useEffect(() => {
    const criteriaChanged = previousCriteriaRef.current !== criteriaKey;
    previousCriteriaRef.current = criteriaKey;

    if (criteriaChanged && pageIndex !== 1) {
      setPageIndex(1);
      return;
    }

    loadAll();
  }, [criteriaKey, pageIndex, loadAll]);

  const nextPage = React.useCallback(() => {
    if (!hasNext) return;
    setPageIndex((currentPage) => currentPage + 1);
  }, [hasNext]);

  const prevPage = React.useCallback(() => {
    setPageIndex((currentPage) => Math.max(1, currentPage - 1));
  }, []);

  return {
    movimientos,
    form,
    formErrors,
    loading,
    error,

    setField,
    resetForm,
    validateForm,
    loadMovimientos,
    saveMovimiento,

    search,
    setSearch,
    tipoEventoFiltro,
    setTipoEventoFiltro,
    pageIndex,
    pageSize,
    setPageSize,
    total,
    hasNext,
    nextPage,
    prevPage,
    loadAll,
    sorts,
    toggleSort,
  };
}
