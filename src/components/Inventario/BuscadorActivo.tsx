// src/components/Inventario/BuscadorActivo.tsx
import React from "react";
import AsyncSelect from "react-select/async";
import { useRepositories } from "../../repositories/repositoriesContext";
import type { ActivoTI } from "../../Models/ActivoTI";

// Opción de react-select: guarda el activo completo
type ActivoOption = { value: string; label: string; activo: ActivoTI };

const PAGE_SIZE = 10; // Limita el resultado para no saturar

const toActivoOption = (a: ActivoTI): ActivoOption => ({
  value: a.id,
  label: [a.codigo_inventario, a.tipo, a.marca, a.modelo, a.numero_serie]
    .filter(Boolean)
    .join(" · "),
  activo: a,
});

type BaseProps = {
  inputId?: string;
  placeholder?: string;
  isDisabled?: boolean;
};

// Un solo activo (Asignar, Ficha)
type SimpleProps = BaseProps & {
  isMulti?: false;
  value?: ActivoTI | null;
  onChange: (activo: ActivoTI | null) => void;
};

// Varios activos (Nuevo ticket)
type MultiProps = BaseProps & {
  isMulti: true;
  value: ActivoTI[];
  onChange: (activos: ActivoTI[]) => void;
};

export type BuscadorActivoProps = SimpleProps | MultiProps;

// Buscador de activos compartido: solo hay que llamarlo.
export const BuscadorActivo: React.FC<BuscadorActivoProps> = (props) => {
  const { activosTI } = useRepositories();
  const [error, setError] = React.useState<string | null>(null);

  const buscarActivos = React.useCallback(
    async (texto: string): Promise<ActivoOption[]> => {
      const res = await activosTI!.loadActivos({
        search: texto,
        paginated: true,
        pageSize: PAGE_SIZE,
      });
      if (!res.status) {
        setError(res.message ?? "Error cargando los activos");
        return [];
      }
      setError(null);
      return res.data.map(toActivoOption);
    },
    [activosTI],
  );

  const comunes = {
    inputId: props.inputId ?? "buscador_activo_id",
    cacheOptions: true,
    defaultOptions: true,
    loadOptions: buscarActivos,
    isDisabled: props.isDisabled,
    placeholder:
      props.placeholder ?? "Buscar por código, serial, tipo, marca o modelo…",
    noOptionsMessage: ({ inputValue }: { inputValue: string }) =>
      error ??
      (inputValue ? "No se encontraron activos" : "Escribe para buscar"),
    loadingMessage: () => "Buscando...",
    classNamePrefix: "rs",
  };

  if (props.isMulti) {
    const { value, onChange } = props;
    return (
      <AsyncSelect<ActivoOption, true>
        {...comunes}
        isMulti
        value={value.map(toActivoOption)}
        onChange={(opts) => onChange(opts.map((o) => o.activo))}
      />
    );
  }

  const { value, onChange } = props;
  return (
    <AsyncSelect<ActivoOption, false>
      {...comunes}
      isClearable
      value={value ? toActivoOption(value) : null}
      onChange={(opt) => onChange(opt?.activo ?? null)}
    />
  );
};
