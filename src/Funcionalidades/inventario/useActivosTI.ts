import * as React from "react";
import type {
  ActivoTI,
  ActualizarActivoDTO,
  CrearActivoDTO,
  ActivoTIErrors,
} from "../../Models/ActivoTI";
import { validarActivoTI } from "../../Models/ActivoTI";
import type { ActivosTIRepository } from "../../repositories/ActivosTIRepository/ActivosTIRepository";
import type { FilterActivosTI } from "../../repositories/ActivosTIRepository/ActivosTIRepository";

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
        return true;
      } catch (loadError: any) {
        setError(loadError?.message ?? "Error cargando los activos");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [ActivosSvc],
  );
  const saveActivo = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isValid = validateForm();
      if (!isValid) {
        return false;
      }
      const result = selectedActivo
        ? await ActivosSvc.updateActivo(
            selectedActivo.id,
            form as ActualizarActivoDTO,
          )
        : await ActivosSvc.createActivo(form as CrearActivoDTO);
      if (!result.status) {
        setError(result.message ?? "Error guardando el activo");
        return false;
      }
      await loadActivos();
      resetForm();
      return true;
    } catch (saveError: any) {
      setError(saveError?.message ?? "Error guardando el activo");
      return false;
    } finally {
      setLoading(false);
    }
  }, [ActivosSvc, form, selectedActivo, validateForm, loadActivos, resetForm]);
  const selectActivo = React.useCallback((activo: ActivoTI) => {
    setSelectedActivo(activo);
    setForm({
      codigo_inventario: activo.codigo_inventario,
      categoria: activo.categoria,
      tipo: activo.tipo,
      subtipo: activo.subtipo,
      marca: activo.marca,
      modelo: activo.modelo,
      numero_serie: activo.numero_serie,
      fecha_ingreso: activo.fecha_ingreso,
      proveedor: activo.proveedor,
      estado: activo.estado,
      ubicacion_tipo: activo.ubicacion_tipo,
      tienda_id: activo.tienda_id,
      usuario_asignado_id: activo.usuario_asignado_id,
      fecha_fin_garantia: activo.fecha_fin_garantia,
      notas: activo.notas,
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
  };
}
