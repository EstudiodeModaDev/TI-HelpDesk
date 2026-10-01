import * as React from "react";
import type {
  ActivoTicket,
  CrearActivoTicketDTO,
} from "../../Models/ActivoTicket";
import type { ActivoTicketRepository } from "../../repositories/ActivoTicket/ActivoTicketRepository";
import type { FilterActivoTicket } from "../../repositories/ActivoTicket/ActivoTicketRepository";

type UseActivoTicketParams = {
  ActivosTicketSvc: ActivoTicketRepository;
};
export function useActivoTicket({ ActivosTicketSvc }: UseActivoTicketParams) {
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState<Partial<CrearActivoTicketDTO>>({});
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>(
    {},
  );
  const [error, setError] = React.useState<string | null>(null);
  const [activoticket, setActivoTicket] = React.useState<ActivoTicket[]>([]);

  const setField = React.useCallback(
    <K extends keyof CrearActivoTicketDTO>(
      key: K,
      value: CrearActivoTicketDTO[K],
    ) => {
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
  }, []);

  const validateForm = React.useCallback(() => {
    const errors: Record<string, string> = {};

    if (!form.activo_id) errors.activo_id = "El activo es requerido";
    if (!form.ticket_id) errors.ticket_id = "El ticket es requerido";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const loadActivoTicket = React.useCallback(
    async (filter?: FilterActivoTicket) => {
      setLoading(true);
      setError(null);

      try {
        const result = await ActivosTicketSvc.loadActivoTicket(filter);
        if (!result.status) {
          setError(result.message ?? "Error cargando los vinculos");
          setActivoTicket([]);
          return false;
        }
        setActivoTicket(result.data ?? []);

        return true;
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Error cargando los activos",
        );
        setActivoTicket([]);

        return false;
      } finally {
        setLoading(false);
      }
    },
    [ActivosTicketSvc],
  );

  return {
    activoticket,
    error,
    loading,

    form,
    formErrors,
    setField,
    resetForm,
    validateForm,

    loadActivoTicket,
  };
}
