import { useState } from "react";
import type { InventarioService } from "../Services/Inventario.service";
import type { Inventario, InventarioErrors } from "../Models/Inventario";
import { toISODateFlex } from "../utils/Date";
import { useAuth } from "../auth/authContext";

type Svc = {Inventario: InventarioService}; 

export function useInventario(services: Svc) {
  const {Inventario} = services;
    const EMPTY: Inventario = {
    Title: "",
    Marca: "",
    Serial: "",
    Referencia: "",
    ResponsableEntrada: "",
    DiscoCap: "",
    DiscoTec: "",
    MemoriaCap: "",
    MemoriaTec: "",
    FechaEntrada: toISODateFlex(new Date()),
    CasoEntrada: "",
    ResponsableSalida: "",
    CasoSalida: "",
    Estado: "",
    UbicacionAnterior: "",
    UbicacionActual: "",
    Categoria: "",
    AsignadoA: "",
    PrestadoA: "",
    Comprometido: "",
    Compania: "",
    ControlActivos: "",
    Proveedor: "",
  };
  const [state, setState] = useState<Inventario>({...EMPTY,});
  const [errors, setErrors] = useState<InventarioErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const {account} = useAuth()

  /* ============================
     Helpers de formulario
     ============================ */
  const setField = <K extends keyof Inventario>(k: K, v: Inventario[K]) => setState((s) => ({ ...s, [k]: v }));


  const validate = () => {
    const e: InventarioErrors = {};
    if (!state.Categoria) e.Categoria = "Requerido";
    if (state.Compania) e.Compania = "Requerido";
    if (!state.Marca) e.Marca = "Selecciona una marca";
    if (!state.Proveedor) e.Proveedor = "Requerido";
    if (!state.Referencia) e.Referencia = "Requerido";
    if (!state.Title) e.Title = "Requerido";
    setErrors(e)
    console.table(e)
    return Object.keys(e).length === 0;
  };

  const entradaPorPrimeraVez = async (ticketId: string) => {
    if (!validate()) return;

    setSubmitting(true);
    try {

      const payload: Inventario = {
        Title: state.Title, //Dispositivo
        AsignadoA: state.AsignadoA,
        CasoEntrada: ticketId,
        Categoria: "Nuevo",
        ControlActivos: state.ControlActivos,
        DiscoCap: state.DiscoCap,       
        DiscoTec: state.DiscoTec, 
        Marca: state.Marca,  
        FechaEntrada: toISODateFlex(new Date()),
        MemoriaCap: state.MemoriaCap,
        MemoriaTec: state.MemoriaTec,
        Proveedor: state.Proveedor,
        ResponsableEntrada: account?.name,
        UbicacionActual: "Bodega",
        Serial: state.Serial,
        UbicacionAnterior: "Proveedor"
      };

      let createdId: string | number = "";
      if (!Inventario?.create) {
        console.error("Tickets service no disponible. Verifica el GraphServicesProvider.");
      } else {
        const created = await Inventario.create(payload);

        createdId = created?.Id ?? "";
        console.log("Ticket creado con ID:", createdId);
        setState({...EMPTY})
        setErrors({})
      }
      } finally {
        setSubmitting(false);
      }
    };

  return {
    // estado de formulario
    state,
    setField,
    errors,
    submitting,
    entradaPorPrimeraVez
  };
}

