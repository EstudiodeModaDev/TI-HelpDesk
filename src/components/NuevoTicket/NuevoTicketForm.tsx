import * as React from "react";
import Select, { components, type OptionProps, type SingleValue } from "react-select";
import "../NuevoTicketUsuario/NuevoTicketForm.css";
import { useFranquicias } from "../../Funcionalidades/Franquicias";
import type { FranquiciasService } from "../../Services/Franquicias.service";3
import type { UserOption } from "../../Models/Commons";
import { useGraphServices } from "../../graph/GrapServicesContext";
import { useNuevoTicketForm } from "../../Funcionalidades/NuevoTicket";
import { useWorkers } from "../../Funcionalidades/Workers";
import { useUsuarios } from "../../Funcionalidades/Usuarios";
import { UsuariosSPService } from "../../Services/Usuarios.Service";
import type { TicketsService } from "../../Services/Tickets.service";
import RichTextBase64 from "../RichTextBase64/RichTextBase64";
import type { LogService } from "../../Services/Log.service";
import { norm } from "../../utils/Commons";

export type UserOptionEx = UserOption & { source?: "Empleado" | "Franquicia" };
type TreeOption = {
  value: string;              
  label: string;              
  meta: {
    catId: string | number;
    subId: string | number;
    catTitle: string;
    subTitle: string;
    artTitle: string;
  };
};

export default function NuevoTicketForm() {
  const {Categorias, SubCategorias, Articulos, Franquicias: FranquiciasSvc, Usuarios: UsuariosSPServiceSvc, Tickets: TicketsSvc, Logs: LogsSvc} = useGraphServices() as ReturnType<typeof useGraphServices> & {
    Franquicias: FranquiciasService;
    Usuarios: UsuariosSPService;
    Tickets: TicketsService;
    Logs: LogService
  };
  const {state, errors, submitting, categorias, subcategoriasAll, articulosAll, loadingCatalogos, setField, handleSubmit,} = useNuevoTicketForm({ Categorias, SubCategorias, Articulos, Tickets: TicketsSvc, Usuarios: UsuariosSPServiceSvc, Logs: LogsSvc});
  const { franqOptions, loading: loadingFranq, error: franqError } = useFranquicias(FranquiciasSvc!);
  const { workersOptions, loadingWorkers, error: usersError } = useWorkers({
    onlyEnabled: true,
  });
  const { UseruserOptions, loading, error } = useUsuarios(UsuariosSPServiceSvc!);

  // ====== Combinar usuarios con franquicias
  const combinedOptions: UserOptionEx[] = React.useMemo(() => {
    const map = new Map<string, UserOptionEx>();
    for (const o of [...workersOptions, ...franqOptions]) {
      const key = (o.value || "").toLowerCase();
      if (!map.has(key)) map.set(key, o);
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [workersOptions, franqOptions]);

  const treeOptions: TreeOption[] = React.useMemo(() => {
    if (!categorias.length || !subcategoriasAll.length || !articulosAll.length) return [];
    const subById = new Map(subcategoriasAll.map(s => [String(s.ID), s]));
    const catById = new Map(categorias.map(c => [String(c.ID), c]));

    return articulosAll.map(a => {
      const sub = subById.get(String(a.Id_subCategoria));
      const cat = sub ? catById.get(String(sub.Id_categoria)) : undefined;

      const catTitle = cat?.Title ?? "(Sin categoría)";
      const subTitle = sub?.Title ?? "(Sin subcategoría)";
      const artTitle = a.Title ?? "(Artículo)";

      return {
        value: String(a.ID),
        label: `${catTitle} > ${subTitle} > ${artTitle}`,
        meta: {
          catId: sub?.Id_categoria ?? "",
          subId: a.Id_subCategoria ?? "",
          catTitle,
          subTitle,
          artTitle,
        },
      } as TreeOption;
    }).sort((x, y) => x.label.localeCompare(y.label));
  }, [categorias, subcategoriasAll, articulosAll]);

  const treeValue: TreeOption | null = React.useMemo(() => {
    if (!state.articulo) return null;
    // Match por el título del artículo al final del path
    const normEnd = norm(state.articulo);
    return (
      treeOptions.find(o => norm(o.meta.artTitle) === normEnd) ??
      null
    );
  }, [state.articulo, treeOptions]);

  const userFilter = (option: any, raw: string) => {
    const q = norm(raw);
    if (!q) return true;
    const label = option?.label ?? "";
    const data = option?.data as UserOptionEx | undefined;
    const email = (data as any)?.email ?? "";
    const job = (data as any)?.jobTitle ?? "";
    const haystack = norm(`${label} ${email} ${job}`);
    return haystack.includes(q);
  };

  const Option = (props: OptionProps<UserOptionEx, false>) => {
    const { data, label } = props;
    return (
      <components.Option {...props}>
        <div className="rs-opt">
          <div className="rs-opt__text">
            <span className="rs-opt__title">{label}</span>
            {(data as any).email && <span className="rs-opt__meta">{(data as any).email}</span>}
            {(data as any).jobTitle && <span className="rs-opt__meta">{(data as any).jobTitle}</span>}
          </div>
          {data.source && <span className="rs-opt__tag">{data.source}</span>}
        </div>
      </components.Option>
    );
  };

  // ====== Handlers (guardan SOLO título en state y manejan IDs locales)
  const onTreeChange = (opt: SingleValue<TreeOption>) => {
    if (!opt) {
      setField("categoria", "");
      setField("subcategoria", "");
      setField("articulo", "");
      return;
    }

    const { catTitle, subTitle, artTitle } = opt.meta;

    // Títulos en tu estado global
    setField("categoria", catTitle);
    setField("subcategoria", subTitle);
    setField("articulo", artTitle);
  };

  const disabledCats = submitting || loadingCatalogos;

  return (
    <div className="ticket-form" data-force-light>
      <h2 className="tf-title">Nuevo Ticket</h2>

      <form onSubmit={(e) => {e.preventDefault(); handleSubmit}} noValidate className="tf-grid">
          {/* Solicitante */}
          <div className="tf-field">
            <label className="tf-label">Solicitante</label>
            <Select<UserOptionEx, false>
              options={combinedOptions}
              placeholder={loadingWorkers || loadingFranq ? "Cargando opciones…" : "Buscar solicitante…"}
              value={state.solicitante as UserOptionEx | null}
              onChange={(opt) => setField("solicitante", opt ?? null)}
              classNamePrefix="rs"
              isDisabled={submitting || loadingWorkers || loadingFranq}
              isLoading={loadingWorkers || loadingFranq}
              filterOption={userFilter}
              components={{ Option }}
              noOptionsMessage={() => (usersError || franqError ? "Error cargando opciones" : "Sin coincidencias")}
              isClearable
            />
            {errors.solicitante && <small className="error">{errors.solicitante}</small>}
          </div>

          {/* Resolutor */}
          <div className="tf-field">
            <label className="tf-label">Resolutor</label>
            <Select<UserOption, false>
              options={UseruserOptions}
              placeholder={loading ? "Cargando usuarios…" : "Buscar resolutor…"}
              value={state.resolutor}
              onChange={(opt) => setField("resolutor", opt ?? null)}
              classNamePrefix="rs"
              isDisabled={submitting || loading}
              isLoading={loading}
              filterOption={userFilter as any}
              components={{ Option: Option as any }}
              noOptionsMessage={() => (error ? "Error cargando usuarios" : "Sin coincidencias")}
              isClearable
            />
            {errors.resolutor && <small className="error">{errors.resolutor}</small>}
          </div>

          {/* Fecha de apertura (opcional) */}
          <div className="tf-field tf-col-2">
            <label className="tf-checkbox">
              <input type="checkbox" checked={state.usarFechaApertura} onChange={(ev) => setField("usarFechaApertura", ev.target.checked)} disabled={submitting}/>
              <span>Escoger fecha de apertura</span>
            </label>
          </div>

          {state.usarFechaApertura && (
            <div className="tf-field tf-col-2">
              <label className="tf-label" htmlFor="fechaApertura">Fecha de apertura</label>
              <input id="fechaApertura" type="date" value={state.fechaApertura ?? ""} onChange={(e) => setField("fechaApertura", e.target.value || null)} disabled={submitting} className="tf-input"/>
              {errors.fechaApertura && <small className="error">{errors.fechaApertura}</small>}
            </div>
          )}

          {/* Fuente */}
          <div className="tf-field tf-col-2">
            <label className="tf-label" htmlFor="fuente">Fuente Solicitante</label>
            <select id="fuente" value={state.fuente} onChange={(e) => setField("fuente", e.target.value as typeof state.fuente)} disabled={submitting} className="tf-input">
              <option value="">Seleccione una fuente</option>
              <option value="Correo">Correo</option>
              <option value="Disponibilidad">Disponibilidad</option>
              <option value="Teams">Teams</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="En persona">Presencial</option>
            </select>
            {errors.fuente && <small className="error">{errors.fuente}</small>}
          </div>

          {/* Motivo */}
          <div className="tf-field tf-col-2">
            <label className="tf-label" htmlFor="motivo">Asunto</label>
            <input id="motivo" type="text" placeholder="Ingrese el motivo" value={state.motivo} onChange={(e) => setField("motivo", e.target.value)} disabled={submitting} className="tf-input"/>
            {errors.motivo && <small className="error">{errors.motivo}</small>}
          </div>

          {/* Descripción */}
          <div className={`tf-field tf-col-2 ${errors.descripcion ? "has-error" : ""}`}>
            <label className="tf-label">Descripción</label>

            <div className="rtb-box">
              <RichTextBase64 value={state.descripcion} onChange={(html) => setField("descripcion", html)} placeholder="Describe el problema y pega capturas (Ctrl+V)..."/>
            </div>

            {errors.descripcion && <small className="error">{errors.descripcion}</small>}
          </div>

          {/* Categoría / Subcategoría / Artículo */}
          <div className="tf-row tf-row--cats tf-col-2"> 
            <div className="tf-field">
              <label className="tf-label">Categoría</label>
              <Select<TreeOption, false>
                classNamePrefix="rs"
                placeholder={loadingCatalogos ? "Cargando catálogo..." : "Buscar categoría/sub/artículo…"}
                options={treeOptions}
                value={treeValue}
                onChange={onTreeChange}
                isDisabled={disabledCats}
                filterOption={(candidate, input) => {
                  return norm(candidate.label).includes(norm(input));
                }}
                isClearable
              />
              {errors.categoria && <small className="error">{errors.categoria}</small>}
            </div>
          </div>

          {/* Archivo */}
          <div className="tf-field tf-col-2">
            <label className="tf-label" htmlFor="archivo">Adjuntar archivo</label>
            <input
              id="archivo"
              type="file"
              onChange={(e) => setField("archivo", e.target.files?.[0] ?? null)}
              disabled={submitting}
              className="tf-input"
            />
          </div>

          {/* Submit */}
          <div className="tf-actions tf-col-2">
            <button type="submit" disabled={submitting || loadingCatalogos} className="tf-submit">
              {submitting ? "Enviando..." : "Enviar Ticket"}
            </button>
          </div>
        </form>
      </div>
  );
}
