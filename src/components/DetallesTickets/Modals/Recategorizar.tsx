import * as React from "react";
import Select, { type SingleValue } from "react-select";
import "./ModalsStyles.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { TicketsService } from "../../../Services/Tickets.service";
import { useRecategorizarTicket } from "../../../Funcionalidades/Recategorizar";
import type { Ticket } from "../../../Models/Tickets";
import { norm } from "../../../utils/Commons";

type CategoriaItem = { ID: string | number; Title: string };

export default function Recategorizar({ ticket, onDone}: { ticket: Ticket, onDone: () => void }) {
  const {
    Categorias,
    SubCategorias,
    Articulos,
    Tickets: TicketsSvc,
  } = useGraphServices() as ReturnType<typeof useGraphServices> & {
    Tickets: TicketsService;
  };

  const {state, errors, submitting, categorias, subcategoriasAll, articulosAll, loadingCatalogos, setField, handleRecategorizar,
    } = useRecategorizarTicket({ Categorias, SubCategorias, Articulos, Tickets: TicketsSvc }, ticket);

  // ====== Filtro genérico (insensible a acentos) para react-select
  const makeFilter = () =>
    (option: { label?: string }, raw: string) => {
      const q = norm(raw);
      if (!q) return true;
      const label = option?.label ?? "";
      return norm(label).includes(q);
  };

  // ====== Estado local de IDs (para encadenar por ID) pero guardando títulos en state global
  const [catId, setCatId] = React.useState<string | number | null>(null);
  const [subcatId, setSubcatId] = React.useState<string | number | null>(null);

  // ====== Opciones para selects (react-select)
  const catOptions = React.useMemo(
    () => categorias.map((c: CategoriaItem) => ({ value: String(c.ID), label: c.Title })),
    [categorias]
  );

  const subcats = React.useMemo(() => {
    if (catId == null) return subcategoriasAll;
    return subcategoriasAll.filter(s => String(s.Id_categoria) === String(catId));
  }, [subcategoriasAll, catId]);

  const subcatOptions = React.useMemo(
    () => subcats.map((s) => ({ value: String(s.ID), label: s.Title })),
    [subcats]
  );

  const arts = React.useMemo(() => {
    if (subcatId != null) {
      return articulosAll.filter(a => String(a.Id_subCategoria) === String(subcatId));
    }
    if (catId != null) {
      const subIds = new Set(
        subcategoriasAll
          .filter(s => String(s.Id_categoria) === String(catId))
          .map(s => String(s.ID))
      );
      return articulosAll.filter(a => subIds.has(String(a.Id_subCategoria)));
    }
    return articulosAll;
  }, [articulosAll, subcategoriasAll, catId, subcatId]);

  const artOptions = React.useMemo(
    () => arts.map((a) => ({ value: String(a.ID), label: a.Title })),
    [arts]
  );

  // ====== Valores seleccionados para react-select (a partir del título en state)
  const catValue = React.useMemo(
    () => (state.categoria ? catOptions.find((o) => o.label === state.categoria) ?? null : null),
    [state.categoria, catOptions]
  );
  const subcatValue = React.useMemo(
    () => (state.subcategoria ? subcatOptions.find((o) => o.label === state.subcategoria) ?? null : null),
    [state.subcategoria, subcatOptions]
  );
  const artValue = React.useMemo(
    () => (state.articulo ? artOptions.find((o) => o.label === state.articulo) ?? null : null),
    [state.articulo, artOptions]
  );

  // ====== Handlers (guardan SOLO título en state y manejan IDs locales)
  const onCategoriaChange = (opt: SingleValue<{ value: string; label: string }>) => {
    setCatId(opt ? opt.value : null);
    setSubcatId(null);
    setField("categoria", opt?.label ?? "");
    setField("subcategoria", "");
    setField("articulo", "");
  };

  const onSubcategoriaChange = (opt: SingleValue<{ value: string; label: string }>) => {
    const subId = opt ? opt.value : null;
    setSubcatId(subId);
    setField("subcategoria", opt?.label ?? "");

    if (subId) {
      const sub = subcategoriasAll.find(s => String(s.ID) === String(subId));
      if (sub) {
        setCatId(sub.Id_categoria);
        const catTitle = categorias.find(c => String(c.ID) === String(sub.Id_categoria))?.Title ?? "";
        setField("categoria", catTitle);
      }
    }
  };

  // Al elegir artículo: setea Subcategoría y Categoría
  const onArticuloChange = (opt: SingleValue<{ value: string; label: string }>) => {
    setField("articulo", opt?.label ?? "");

    const artId = opt?.value;
    if (artId) {
      const art = articulosAll.find(a => String(a.ID) === String(artId));
      if (art) {
        // subcategoría
        setSubcatId(art.Id_subCategoria);
        const sub = subcategoriasAll.find(s => String(s.ID) === String(art.Id_subCategoria));
        if (sub) {
          setField("subcategoria", sub.Title);

          // categoría
          setCatId(sub.Id_categoria);
          const catTitle = categorias.find(c => String(c.ID) === String(sub.Id_categoria))?.Title ?? "";
          setField("categoria", catTitle);
        }
      }
    }
  };

  const disabledCats = submitting || loadingCatalogos;
  const disabledSubs = submitting || loadingCatalogos
  const disabledArts = submitting || loadingCatalogos

  return (
    <div className="dta-form">
      <h2 className="dta-title">Recategorizar Ticket</h2>

      <form onSubmit={(e) => {handleRecategorizar(e); onDone()}} noValidate className="dta-grid">

        {/* Categoría / Subcategoría / Artículo */}
        <div className="dta-field">
          <label className="dta-label">Categoría</label>
          <Select
            classNamePrefix="rs"
            options={catOptions}
            value={catValue}
            onChange={onCategoriaChange}
            isDisabled={disabledCats}
            placeholder={loadingCatalogos ? "Cargando categorías..." : "Seleccione una categoría"}
            filterOption={makeFilter()}
            isClearable
          />
          {errors.categoria && <small className="error">{errors.categoria}</small>}
        </div>

        <div className="dta-field">
          <label className="dta-label">Subcategoría</label>
          <Select
            classNamePrefix="rs"
            options={subcatOptions}
            value={subcatValue}
            onChange={onSubcategoriaChange}
            isDisabled={disabledSubs}
            placeholder={
              catId == null
                ? "Seleccione una categoría primero"
                : loadingCatalogos
                ? "Cargando subcategorías..."
                : "Seleccione una subcategoría"
            }
            filterOption={makeFilter()}
            isClearable
          />
          {errors.subcategoria && <small className="error">{errors.subcategoria}</small>}
        </div>

        <div className="dta-field dta-col-2">
          <label className="dta-label">Artículo</label>
          <Select
            classNamePrefix="rs"
            options={artOptions}
            value={artValue}
            onChange={onArticuloChange}
            isDisabled={disabledArts}
            placeholder={
              subcatId == null
                ? "Seleccione una subcategoría primero"
                : loadingCatalogos
                ? "Cargando artículos..."
                : "Seleccione un artículo"
            }
            filterOption={makeFilter()}
            isClearable
          />
          {/* Si quieres mostrar error de artículo obligatorio, vuelve a validarlo en el hook */}
        </div>
        {/* Submit */}
        <div className="dta-actions dta-col-2">
          <button type="submit" disabled={submitting || loadingCatalogos} className="btn-primary">
            {submitting ? "Enviando..." : "Recategorizar Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}