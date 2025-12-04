import * as React from "react";
import Select, { type SingleValue } from "react-select";
import "./ModalsStyles.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import type { TicketsService } from "../../../Services/Tickets.service";
import { useRecategorizarTicket } from "../../../Funcionalidades/Recategorizar";
import type { Ticket } from "../../../Models/Tickets";
import { norm } from "../../../utils/Commons";
import type { TreeOption } from "../../NuevoTicket/NuevoTicketForm";

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

    const normArt = norm(state.articulo || "");
    const normCat = norm(state.categoria || "");
    const normSub = norm(state.subcategoria || "");

    return (
      treeOptions.find(o =>
        norm(o.meta.artTitle) === normArt &&
        norm(o.meta.catTitle) === normCat &&
        norm(o.meta.subTitle) === normSub
      ) ?? null
    );
  }, [state.articulo, state.categoria, state.subcategoria, treeOptions]);

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
    <div className="dta-form">
      <h2 className="dta-title">Recategorizar Ticket</h2>

      <form onSubmit={(e) => {handleRecategorizar(e); onDone()}} noValidate className="dta-grid">

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
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
                styles={{
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999,   // por encima del modal
                  }),
                }}
                />
              {errors.categoria && <small className="error">{errors.categoria}</small>}
            </div>
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