import type { EstadoActivo } from "../../Models/ActivosTIMovimientos";
import * as React from "react";
import type {
  ActivoTI,
  ActualizarActivoDTO,
  // CategoriaActivo,
  CrearActivoDTO,
  Ubicacion_Tipo,
  ActivoTIErrors,
} from "../../Models/ActivoTI";
import { validarActivoTI } from "../../Models/ActivoTI";
import type { ActivosTIRepository } from "../../repositories/ActivosTIRepository/ActivosTIRepository";
import type { FilterActivosTI } from "../../repositories/ActivosTIRepository/ActivosTIRepository";
import { capitalCase } from 'change-case';
import toast from "react-hot-toast";

const DEFAULT_PAGE_SIZE = 10;

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

type UseActivosTIParams = {
  ActivosSvc: ActivosTIRepository;
};
export function useActivosTI({ ActivosSvc }: UseActivosTIParams) {
  const [activos, setActivos] = React.useState<ActivoTI[]>([]);
  const [form, setForm] = React.useState<Partial<CrearActivoDTO>>({});
  const [formErrors, setFormErrors] = React.useState<ActivoTIErrors>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedActivo, setSelectedActivo] = React.useState<ActivoTI | null>(
    null,
  );

  const [search, setSearch] = React.useState("");
  // const [categoriaFiltro, setCategoriaFiltro] = React.useState<
  //   CategoriaActivo | ""
  // >("");
  const [estadoFiltro, setEstadoFiltro] = React.useState<EstadoActivo | "">("");
  const [ubicacionFiltro, setUbicacionFiltro] = React.useState<
    Ubicacion_Tipo | ""
  >("");
  const [pageIndex, setPageIndex] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = React.useState(0);
  const [hasNext, setHasNext] = React.useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const setField = React.useCallback(
    <K extends keyof CrearActivoDTO>(key: K, value: CrearActivoDTO[K]) => {
      setForm((currentForm) => ({
        ...currentForm,
        [key]: value,
      }));
    },
    [],
  );

  const resetForm = React.useCallback(() => {
    setForm({});
    setFormErrors({});
    setSelectedActivo(null);
  }, []);

  const validateForm = React.useCallback(() => {
    const errors = validarActivoTI(form);

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  }, [form]);

  const loadActivos = React.useCallback(
    async (filter?: FilterActivosTI) => {
      setLoading(true);
      setError(null);

      try {
        const result = await ActivosSvc.loadActivos(filter);
        if (!result.status) {
          setError(result.message ?? "Error cargando los activos");
          return false;
        }
        setActivos(result.data ?? []);
        setTotal(result.total ?? result.data?.length ?? 0);
        setHasNext(result.hasNext ?? false);
        return true;
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Error cargando los activos",
        );
        setActivos([]);
        setTotal(0);
        setHasNext(false);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [ActivosSvc],
  );

  const buildFilter = React.useCallback(
    (): FilterActivosTI => ({
      // categoria: categoriaFiltro || undefined,
      estado: estadoFiltro || undefined,
      ubicacion_tipo: ubicacionFiltro || undefined,
      search: debouncedSearch.trim() || undefined,
      pageIndex,
      pageSize,
      paginated: true,
    }),
    [
      // categoriaFiltro,
      estadoFiltro,
      ubicacionFiltro,
      debouncedSearch,
      pageIndex,
      pageSize,
    ],
  );

  const saveActivo = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isValid = validateForm();
      if (!isValid) {
        return false;
      }
      // No se permiten dos activos con el mismo serial
      const serial = form.numero_serie?.trim() ?? "";
      const existente = await ActivosSvc.getActivoBySerial(serial);
      if (!existente.status) {
        const message = existente.message ?? "No se pudo validar el serial";
        setError(message);
        toast.error(message);
        return false;
      }
      if (existente.data && existente.data.id !== selectedActivo?.id) {
        setFormErrors((prev) => ({
          ...prev,
          numero_serie: `Ya existe un activo con este serial (código ${existente.data!.codigo_inventario})`,
        }));
        toast.error("Ya existe un activo con este serial");
        return false;
      }
      const result = selectedActivo
        ? await ActivosSvc.updateActivo(
            selectedActivo.id,
            {...form, tipo: capitalCase(form.tipo ?? ""), marca: capitalCase(form.marca ?? "")} as ActualizarActivoDTO,
          )
        : await ActivosSvc.createActivo({
            ...form,
            tipo: capitalCase(form.tipo ?? ""),
            marca: capitalCase(form.marca ?? ""),
            estado: "Disponible",
          } as CrearActivoDTO);
      if (!result.status) {
        const message = result.message ?? "Error guardando el activo";
        setError(message);
        toast.error(message);
        return false;
      }
      await loadActivos(buildFilter());
      toast.success(`Activo ${selectedActivo ? "actualizado" : "creado"} correctamente`);
      resetForm();
      return true;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Error guardando el activo";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    ActivosSvc,
    form,
    selectedActivo,
    validateForm,
    loadActivos,
    buildFilter,
    resetForm,
  ]);

  const loadAll = React.useCallback(
    () => loadActivos(buildFilter()),
    [loadActivos, buildFilter],
  );

  const criteriaKey = React.useMemo(
    () =>
      JSON.stringify({
        // categoriaFiltro,
        estadoFiltro,
        ubicacionFiltro,
        pageSize,
        search: debouncedSearch.trim(),
      }),
    [estadoFiltro, ubicacionFiltro, pageSize, debouncedSearch],
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
  const selectActivo = React.useCallback((activo: ActivoTI) => {
    setSelectedActivo(activo);
    setForm({
      codigo_inventario: activo.codigo_inventario,
      // categoria: activo.categoria,
      tipo: activo.tipo,
      marca: activo.marca,
      modelo: activo.modelo,
      numero_serie: activo.numero_serie,
      fecha_ingreso: activo.fecha_ingreso,
      estado: activo.estado,
      ubicacion_tipo: activo.ubicacion_tipo,
      nombre_usuario: activo.nombre_usuario,
      correo_usuario: activo.correo_usuario,
    });
    setFormErrors({});
    setError(null);
  }, []);

  return {
    activos,
    form,
    formErrors,
    loading,
    error,
    selectedActivo,

    setField,
    resetForm,
    validateForm,
    loadActivos,
    saveActivo,
    selectActivo,

    search,
    setSearch,
    // categoriaFiltro,
    // setCategoriaFiltro,
    estadoFiltro,
    setEstadoFiltro,
    ubicacionFiltro,
    setUbicacionFiltro,
    pageIndex,
    pageSize,
    setPageSize,
    total,
    hasNext,
    nextPage,
    prevPage,
    loadAll,
  };
}
