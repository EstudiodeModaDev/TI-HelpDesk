import * as React from "react";
import { useState, useEffect } from "react";
import { calcularFechaSolucion, calculoANS } from "../utils/ans";
import { fetchHolidays } from "../Services/Festivos";
import type { FormErrors } from "../Models/nuevoTicket";
import type { Articulo, Categoria, Subcategoria } from "../Models/Categorias";
import type { TZDate } from "@date-fns/tz";
import type { TicketsService } from "../Services/Tickets.service";
import { toGraphDateTime /* o toUtcIso */ } from "../utils/Date";
import type { Holiday } from "festivos-colombianos";
import type { FormRecategorizarState, Ticket } from "../Models/Tickets";
import { first } from "./NuevoTicket";
import { FlowClient } from "./FlowClient";
import type { FlowToUser } from "../Models/FlujosPA";

type Svc = {
  Categorias: { getAll: (opts?: any) => Promise<any[]> };
  SubCategorias: { getAll: (opts?: any) => Promise<any[]> };
  Articulos: { getAll: (opts?: any) => Promise<any[]> };
  Tickets?: TicketsService;
};

export function useRecategorizarTicket(services: Svc, ticket: Ticket) {
  const { Categorias, SubCategorias, Articulos, Tickets } = services;

  const [state, setState] = useState<FormRecategorizarState>({
    categoria: "",
    subcategoria: "",
    articulo: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [articulosAll, setArticulosAll] = useState<Articulo[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [fechaSolucion, setFechaSolucion] = useState<Date | null>(null); // inicia en null

  // Catálogos
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoadingCatalogos(true);
        setErrorCatalogos(null);

        const [catsRaw, subsRaw, artsRaw] = await Promise.all([
          Categorias.getAll({ orderby: "fields/Title asc" }),
          SubCategorias.getAll({ orderby: "fields/Title asc", top: 5000 }),
          Articulos.getAll({ orderby: "fields/Title asc", top: 5000 }),
        ]);
        if (cancel) return;

        const cats: Categoria[] = (catsRaw ?? []).map((r: any) => ({
          ID: String(first(r.ID, r.Id, r.id)),
          Title: String(first(r.Title, "No mapeado")),
        }));

        const subs: Subcategoria[] = (subsRaw ?? []).map((r: any) => ({
          ID: String(first(r.ID, r.Id, r.id)),
          Title: String(first(r.Title, "No mapeado")),
          Id_categoria: String(first(r.Id_categoria, "")),
        }));

        const arts: Articulo[] = (artsRaw ?? []).map((r: any) => ({
          ID: String(first(r.ID, r.Id, r.id)),
          Title: String(first(r.Title, "")),
          Id_subCategoria: String(first(r.Id_Subcategoria, r.Id_subcategoria, "")),
        }));

        setCategorias(cats);
        setSubcategorias(subs);
        setArticulosAll(arts);
      } catch (e: any) {
        if (!cancel) setErrorCatalogos(e?.message ?? "Error cargando catálogos");
      } finally {
        if (!cancel) setLoadingCatalogos(false);
      }
    })();
    return () => { cancel = true; };
  }, [Categorias, SubCategorias, Articulos]);

  // Festivos
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const hs = await fetchHolidays();
        if (!cancel) setHolidays(hs);
      } catch (e) {
        if (!cancel) console.error("Error festivos:", e);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // setField: usar el tipo correcto del state de este hook
  const setField = <K extends keyof FormRecategorizarState>(k: K, v: FormRecategorizarState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: FormErrors = {};
    if (!state.categoria) e.categoria = "Seleccione una categoría";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const notifyFlow = React.useMemo(
    () =>
      new FlowClient(
        "https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a21d66d127ff43d7a940369623f0b27d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0ptZLGTXbYtVNKdmIvLdYPhw1Wcqb869N3AOZUf2OH4"
      ),
    []
  );

  const handleRecategorizar = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (!validate()) return false;

    setSubmitting(true);
    try {
      const apertura = ticket.FechaApertura ? new Date(ticket.FechaApertura) : new Date();

      const horasPorANS: Record<string, number> = {
        "ANS 1": 2,
        "ANS 2": 4,
        "ANS 3": 8,
        "ANS 4": 56,
        "ANS 5": 240,
      };

      const ans = calculoANS(state.categoria, state.subcategoria, state.articulo);
      const horasAns = horasPorANS[ans] ?? 0;

      let solucionTZ: TZDate | null = null;
      if (horasAns > 0) {
        solucionTZ = calcularFechaSolucion(apertura, horasAns, holidays); 
      }

      // Convierte TZDate -> Date normal
      const solucionDate = solucionTZ ? new Date(solucionTZ as unknown as string) : null;
      setFechaSolucion(solucionDate);
      const tiempoSolISO = solucionDate ? toGraphDateTime(solucionDate) : null;
      const payloadUpdate: Partial<Ticket> = {
        Categoria: state.categoria,
        SubCategoria: state.subcategoria,
        SubSubCategoria: state.articulo,
        ANS: ans,
        ...(tiempoSolISO ? { TiempoSolucion: tiempoSolISO } : {}), // solo si existe
      };

      if (!Tickets?.update) {
        console.error("Tickets service no disponible. Verifica el GraphServicesProvider.");
        return false
      } else {
        const updated = await Tickets.update(String(ticket.ID), payloadUpdate);
        console.log("Ticket actualizado:", updated);

        const fechaSolTexto = solucionDate ? solucionDate.toLocaleString() : "No aplica";
        const solicitanteEmail = ticket.CorreoSolicitante;
        const solicitanteName = ticket.Solicitante;

        if (solicitanteEmail) {
          const title = `Actualización del caso - ${ticket.ID}`;
          const message = `
            <p>
              ¡Hola ${solicitanteName ?? ""}!<br><br>
              Te informamos que tu caso ha sido <strong>actualizado de categoría</strong>. A continuación, los detalles:<br><br>
              <strong>ID del Caso:</strong> ${ticket.ID}<br>
              <strong>Asunto del caso:</strong> ${ticket.Title ?? "—"}<br>
              <strong>Categoría anterior:</strong> ${ticket.Categoria ?? "—"} > ${ticket.SubCategoria ?? "—"} > ${ticket.SubSubCategoria ?? "—"}<br>
              <strong>Nueva categoría:</strong> ${state.categoria || "—"} > ${state.subcategoria || "—"} > ${state.articulo || "—"}<br>
              <strong>ANS aplicable:</strong> ${ans || "—"}<br>
              <strong>Nueva fecha máxima de solución:</strong> ${fechaSolTexto}<br>
              <strong>Resolutor asignado:</strong> ${ticket.Nombreresolutor ?? "—"}<br><br>
              Seguimos trabajando en tu requerimiento y te mantendremos informado ante cualquier novedad.<br><br>
              Este es un mensaje automático, por favor no respondas.
            </p>
          `.trim();

          try {
            await notifyFlow.invoke<FlowToUser, any>({
              recipient: solicitanteEmail, 
              title,
              message,
              mail: true,
            });
          } catch (err) {
            console.error("[Flow] Error enviando a resolutor:", err);
            return false
          }
        }

        // Limpiar formulario
        setState({ categoria: "", subcategoria: "", articulo: "" });
        setErrors({});
        return true
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    state,
    setField,
    errors,
    submitting,
    fechaSolucion,
    categorias,
    subcategoriasAll: subcategorias,
    articulosAll,
    loadingCatalogos,
    errorCatalogos,
    handleRecategorizar,
  };
}
