import * as React from "react";
import Select, { components, type GroupBase } from "react-select";
import { Items, type CargarA, type TipoCompra } from "../../../Models/Compras";
import type { UserOptionEx } from "../../NuevoTicket/NuevoTicketForm";
import { useFranquicias } from "../../../Funcionalidades/Franquicias";
import { useWorkers } from "../../../Funcionalidades/Workers";
import { useCentroCostos, useCO, useCompras } from "../../../Funcionalidades/Compras";
import "./Compras.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { COOption } from "../../../Models/CO";
import type { CCOption } from "../../../Models/CentroCostos";

const Motivos = ["Cambio por daño", "Renovación de equipo", "Renovación de licencia"] as const;

/** --- Props --- */
type Props = {submitting?: boolean; onClick: (valor: boolean) => void};

/** --- Filtro simple para react-select --- */
function userFilter(option: { label: string; value: string }, rawInput: string): boolean {
  const q = rawInput.trim().toLowerCase();
  if (!q) return true;
  return option.label.toLowerCase().includes(q) || (option.value ?? "").toLowerCase().includes(q);
}

/** --- Opción custom para react-select (puedes decorarla más si quieres) --- */
const Option = (props: any) => (
  <components.Option {...props}>
    <span>{props.data.label}</span>
  </components.Option>
);

export default function CompraFormulario({submitting = false, onClick}: Props) {

  const { Franquicias, CentroCostos, CentroOperativo, Compras, Tickets, Logs, Usuarios } = useGraphServices();
  const { franqOptions, loading: loadingFranq, error: franqError } = useFranquicias(Franquicias as any);
  const { workersOptions, loadingWorkers, error: usersError } = useWorkers({ onlyEnabled: true,});
  const { ccOptions, loading: loadingCC, error: ccError } = useCentroCostos(CentroCostos as any);
  const { COOptions, loading: loadingCO, UNOptions} = useCO(CentroOperativo as any);
  const { setField, setMarcaPct,  handleSubmit, setState, zeroMarcas, MARCAS, errors, totalPct, state, } = useCompras(Compras, Tickets, Logs, Usuarios);

  const combinedOptions: UserOptionEx[] = React.useMemo(() => {
    const map = new Map<string, UserOptionEx>();
    for (const o of [...workersOptions, ...franqOptions]) {
      const key = (o.value || "").toLowerCase();
      if (!map.has(key)) map.set(key, o);
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [workersOptions, franqOptions]);

  const selectedSolicitante = React.useMemo<UserOptionEx | null>(() => {
    if (!state.solicitadoPor) return null;
    return combinedOptions.find(o => o.label === state.solicitadoPor) ?? null;
  }, [combinedOptions, state.solicitadoPor]);

  /** Si vuelve a CO, resetea % */
  React.useEffect(() => {
    if (state.cargarA === "CO")
      setState((s) => ({ ...s, marcasPct: { ...zeroMarcas() } }));
  }, [state.cargarA]);

  return (
    <div className="compra-wrap" >
      <h2>{"Registro de Compras"}</h2>
      <form className="fc-grid" onSubmit={(e) => { handleSubmit(e)}}>
        {/* Tipo */}
        <div className="fc-field">
          <label>Tipo</label>
          <select className="fc-control" value={state.tipoCompra} onChange={(e) => setField("tipoCompra", e.target.value as TipoCompra)}>
            <option value="Producto">Producto</option>
            <option value="Servicio">Servicio</option>
            <option value="Alquiler">Alquiler</option>
            <option value="Contrato">Contrato</option>
          </select>
        </div>

        {/* Solicitante */}
        <div className="fc-field">
          <label>Solicitante</label>
          <Select<UserOptionEx, false, GroupBase<UserOptionEx>>
            classNamePrefix="rs"
            className="rs-override"
            options={combinedOptions}
            placeholder={(loadingWorkers || loadingFranq) ? "Cargando opciones…" : (usersError || franqError) ? "Error cargando opciones" : "Buscar solicitante…"}
            isDisabled={submitting || loadingWorkers || loadingFranq}
            isLoading={loadingWorkers || loadingFranq}
            value={selectedSolicitante}
            onChange={(opt) => {setField("solicitadoPor", opt?.label ?? ""); setField("CorreoSolicitante", opt?.email ?? "")}}
            filterOption={(o, input) => userFilter({ label: o.label, value: String(o.value ?? "") }, input)}
            components={{ Option }}
            isClearable
          />
        </div>

        {/* Fecha */}
        <div className="fc-field">
          <label>Fecha de solicitud</label>
          <input type="date" className="control" value={state.fechaSolicitud} onChange={(e) => setField("fechaSolicitud", e.target.value)}  />
          {errors.fechaSolicitud && <small className="error">{errors.fechaSolicitud}</small>}
        </div>

        {/*Tipificacion*/}
        <div className="fc-field">
          <label>Tipo de Item</label>
          <select name="Items" value={state.codigoItem} onChange={(e) => {const codigo = e.target.value;
                                                                    setField("codigoItem", codigo); 
                                                                    const item = Items.find(i => String(i.codigo) === String(codigo));
                                                                    setField("DescItem", item?.descripcion ?? "")
                                                                    console.log("item ", item)
                                                                    }} required>
            <option value="">Seleccionar código</option>
              {Items.map((op) => (
                <option key={op.codigo} value={op.codigo}>
                  {op.codigo} - {op.descripcion}
                </option>
                ))}
          </select>
        </div>

        {/* Producto/Servicio/Alquiler */}
        <div className="fc-field">
          <label>
            {state.tipoCompra === "Producto" ? "Producto" : state.tipoCompra === "Servicio" ? "Servicio" : "Alquiler"}
          </label>
          <input className="fc-control" value={state.productoServicio} onChange={(e) => setField("productoServicio", e.target.value)} placeholder={`Nombre de ${state.tipoCompra.toLowerCase()}`}/>
          {errors.productoServicio && <small className="error">{errors.productoServicio}</small>}
        </div>

        {/* CO (Centros Operativos) - react-select */}
        <div className="fc-field">
          <label>CO</label>
          <Select<COOption, false>
            classNamePrefix="rs"
            className="rs-override"
            options={COOptions}
            placeholder={loadingCO ? "Cargando CO..." : "Buscar CO..."}
            value={state.co}
            onChange={(opt) => {setField("co", opt ?? null); setField("noCO", opt?.value!)}}
            isDisabled={submitting || loadingCO}
            isLoading={loadingCO}
            filterOption={userFilter as any}
            components={{ Option: Option as any }}
            noOptionsMessage={() => (loadingCO ? "Error cargando CO" : "Sin coincidencias")}
            isClearable
          />
          {errors.co && <small className="error">{errors.co}</small>}
        </div>

        {/* UN */}
        <div className="fc-field">
          <label>UN</label>
          <select className="fc-control" value={state.un} onChange={(e) => setField("un", e.target.value)}>
            <option value="">Seleccione UN</option>
            {UNOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.un && <small className="error">{errors.un}</small>}
        </div>

        {/* C. Costo (react-select) */}
        <div className="fc-field">
          <label>C. Costo</label>
          <Select<CCOption, false>
            classNamePrefix="rs"
            className="rs-override"
            options={ccOptions}
            placeholder={loadingCC ? "Cargando Centros de costos..." : "Buscar Centro de costos..."}
            value={state.ccosto}
            onChange={(opt) => setField("ccosto", opt ?? null)}
            isDisabled={submitting || loadingCC}
            isLoading={loadingCC}
            filterOption={userFilter as any}
            components={{ Option: Option as any }}
            noOptionsMessage={() => (loadingCC ? "Error cargando Centros de costos" : "Sin coincidencias")}
            isClearable
          />
          {errors.ccosto && <small className="error">{errors.ccosto}</small>}
          {ccError && <small className="error">{ccError}</small>}
        </div>

        {/* Motivo */}
        <div className="fc-field">
          <label>Motivo</label>
          <select className="control" value={state.motivo} onChange={(e) => setField("motivo", e.target.value)}>
            <option value="">Seleccione motivo</option>
            {Motivos.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {errors.un && <small className="error">{errors.un}</small>}
        </div>

        {/* Cargar a */}
        <div className="fc-field">
          <label>Cargar a</label>
          <select className="fc-control" value={state.cargarA} onChange={(e) => setField("cargarA", e.target.value as CargarA)}>
            <option value="CO">CO</option>
            <option value="Marca">Marca</option>
          </select>
        </div>

        {/* Distribución marcas*/}
        {state.cargarA !== "CO" ? (
          <div className="col-span-full">
            <div className="box">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Distribución por Marca (%)</span>
                <span className="text-sm">Total: <b>{totalPct}%</b></span>
              </div>
              <div className="brands-grid">
                {MARCAS.map((m) => (
                  <div key={m} className="field">
                    <label className="label">{m}</label>
                    <input
                      type="number" min={0} max={100} step="1"
                      className="control"
                      value={state.marcasPct[m]}
                      onChange={(e) =>
                        setMarcaPct(m, Math.max(0, Math.min(100, Number(e.target.value))))
                      }
                    />
                  </div>
                ))}
              </div>
              {errors.marcasPct && <small className="error">{errors.marcasPct}</small>}
            </div>
          </div>
        ): <div></div>}

        {/* No. CO */}
        {state.cargarA === "CO" ? (
          <div className="fc-field">
            <label className="label">No. CO</label>
            <input className="control" value={state.co?.value} placeholder="Ej. 12345"/>
          </div>) : <div></div>}

        {/* Acciones */}
        <div className="col-span-full flex items-center justify-end gap-2 pt-2">
          <button type="reset" className="btn btn-sm"
            onClick={() => setState((s) => ({
              ...s,
              productoServicio: "",
              solicitadoPor: "",
              fechaSolicitud: "",
              dispositivo: "",
              noCO: "",
              pesoTotal: undefined,
              marcasPct: { ...zeroMarcas() },
              co: null,
              ccosto: null,
              un: ""
            }))}
          >
            Limpiar
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
            Guardar
          </button>
        </div>
      </form>
      <button type="button" className="btn-secondary" onClick={() => onClick(true)}>📄 Ver compras registradas</button>
    </div>
  );
}
