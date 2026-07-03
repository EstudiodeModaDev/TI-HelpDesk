import * as React from "react";
import Select, { type SingleValue } from "react-select";
import "./ModalsStyles.css";
import { useGraphServices } from "../../../graph/GrapServicesContext";
import { useRecategorizarTicket } from "../../../Funcionalidades/Tickets/Recategorizar";
import type { Ticket } from "../../../Models/Tickets";
import { norm } from "../../../utils/Commons";
import type { TreeOption } from "../../NuevoTicket/NuevoTicketForm";
import { useAuth } from "../../../auth/authContext";
import { useRepositories } from "../../../repositories/repositoriesContext";

export default function Recategorizar({ ticket, onDone}: { ticket: Ticket, onDone: () => void }) {
  const {tickets, logs, ans} = useRepositories()
  const {Categorias, SubCategorias, Articulos, } = useGraphServices() as ReturnType<typeof useGraphServices>;
  const {state, errors, submitting, categorias, subcategoriasAll, articulosAll, loadingCatalogos, setField, handleRecategorizar,} = useRecategorizarTicket({ Categorias, SubCategorias, Articulos, Tickets: tickets!, Ans: ans }, ticket);
  const {account} = useAuth()
  const [categoriasProps, setCategoriasProps] = React.useState<{catId: number | null, subId: number | null, artId: number | null}>({artId: null, catId: null, subId: null})
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
          artId: a.ID ?? "",
          catTitle,
          subTitle,
          artTitle,
        },
      } as TreeOption;
    }).sort((x, y) => x.label.localeCompare(y.label));
  }, [categorias, subcategoriasAll, articulosAll]);

  const treeValue: TreeOption | null = React.useMemo(() => {
    if (!state.articulo && !state.articuloId) return null;

    const normArt = norm(state.articulo || "");
    const normCat = norm(state.categoria || "");
    const normSub = norm(state.subcategoria || "");

    const artId = String(state.articuloId ?? "");

    return (
      treeOptions.find(o =>
        (artId && String(o.meta.artId) === artId) ||
        (
          norm(o.meta.artTitle) === normArt &&
          norm(o.meta.catTitle) === normCat &&
          norm(o.meta.subTitle) === normSub
        )
      ) ?? null
    );
  }, [state.articulo, state.articuloId, state.categoria, state.subcategoria, treeOptions]);

  const onTreeChange = (opt: SingleValue<TreeOption>) => {
    if (!opt) {
      setField("categoria", "");
      setField("subcategoria", "");
      setField("articulo", "");
      setField("articuloId", "");
      return;
    }

    const { catTitle, subTitle, artTitle, artId } = opt.meta;

    // Títulos en tu estado global
    setField("categoria", catTitle);
    setField("subcategoria", subTitle);
    setField("articulo", artTitle);
    setField("articuloId", String(artId));
    setCategoriasProps({artId: Number(opt.meta.artId), catId: Number(opt.meta.catId), subId: Number(opt.meta.subId)})
  };

  const handleConfirm = async (e: React.FormEvent) => {
    const canContinue = await handleRecategorizar(e, {artId: categoriasProps.artId, catId: categoriasProps.catId, subId: categoriasProps.subId});

    if (!canContinue) return;

    const newCategoriaBuilt = [state.categoria, state.subcategoria, state.articulo]
      .filter(Boolean)
      .join(" > ");

    await logs?.createLog({
      seguimientos_solvi_actor: account?.name ?? "", 
      seguimientos_solvi_correo_actor: account?.username ?? "", 
      seguimientos_solvi_descripcion: "El resolutor cambió la categoría del ticket a: " + newCategoriaBuilt,
      seguimientos_solvi_tipo_de_accion: "Recategorización",
      seguimientos_solvi_id_ticket: Number(ticket.ID ?? ""),
      seguimientos_solvi_action_date: new Date()
    });
  };

  const disabledCats = submitting || loadingCatalogos;

  return (
    <div className="dta-form">
      <h2 className="dta-title">Recategorizar Ticket</h2>

      <form onSubmit={(e) => {handleConfirm(e); onDone()}} noValidate className="dta-grid">

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
                  isClearable
                  filterOption={(option, input) => {
                    if (!input) return true;

                    const q = norm(input).toLowerCase();
                    const { catTitle, subTitle, artTitle } = option.data.meta;

                    return (
                      norm(option.label).toLowerCase().includes(q) ||
                      norm(catTitle).toLowerCase().includes(q) ||
                      norm(subTitle).toLowerCase().includes(q) ||
                      norm(artTitle).toLowerCase().includes(q)
                    );
                  }}
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
