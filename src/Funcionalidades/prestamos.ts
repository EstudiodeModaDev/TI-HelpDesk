import * as React from "react";
import type { GetAllOpts, PageResult } from "../Models/Commons";
import { useGraphServices } from "../graph/GrapServicesContext";
import type { dispositivos, dispositivosErrors, prestamos, prestamosErrors, pruebasDefinidas, pruebasPrestamo } from "../Models/prestamos";
import { toISODateFlex, toISODateTimeFlex } from "../utils/Date";
import { useAuth } from "../auth/authContext";
import { FlowClient } from "./FlowClient";
import type { FlowToUser } from "../Models/FlujosPA";

export function usePrestamos() {
  const {prestamos, Tickets, Logs} = useGraphServices()
  const {dispositivosById} = useDispositivos()
  const [rows, setRows] = React.useState<prestamos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [estado, setEstado] = React.useState<string>("Activo");
  const [search, setSearch] = React.useState<string>("");
  const [state, setState] = React.useState<prestamos>({Estado: "Activo", FechaDevolucion: null, FechaPrestamo: toISODateFlex(new Date()), Id_dispositivo: "", UsuarioRecibe: "", Title: "", IdTicket: "", nombreSolicitante: ""});
  const setField = <K extends keyof prestamos>(k: K, v: prestamos[K]) => setState((s) => ({ ...s, [k]: v })); 
  const [errors, setErrors] = React.useState<prestamosErrors>({});
  const {account} = useAuth()
  const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a21d66d127ff43d7a940369623f0b27d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0ptZLGTXbYtVNKdmIvLdYPhw1Wcqb869N3AOZUf2OH4")
  
  const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if(estado && estado !== "all") filters.push(`fields/Estado eq '${estado}'`);

    return {
      filter: filters.join(" and "),
      orderby: "fields/Created asc", 
    };
  }, [estado,]);

  const validate = () => {
    const e: prestamosErrors = {};
    if (!state.Id_dispositivo) e.Id_dispositivo = "Ingrese la referencia del dispositivo";
    if (!state.Title) e.Title = "Seleccione el solicitante del préstamo";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (): Promise<{continue: boolean, created: prestamos | null}> => {
    if (!validate()) {
      alert("Por favor rellene todos los campos")
      return {continue: false, created: null};
    };

    setSubmitting(true);
    try {
      const ticket =await Tickets.create({
        Title: "Prestamo de equipo: " + state.Title, ANS: "N/A", 
        Categoria: "Otros", 
        Descripcion: `Préstamo del dispositivo con ID ${state.Id_dispositivo} a ${state.Title} el día ${state.FechaPrestamo}.`, 
        CorreoSolicitante: state.Title,
        Correoresolutor: account?.username,
        Estadodesolicitud: "En Atención",
        FechaApertura: toISODateFlex(new Date()),
        Fuente: "Aplicativo",
        Nombreresolutor: account?.name,
        Solicitante: state.nombreSolicitante,
        SubCategoria: "Prestamo/Instalacion",
        SubSubCategoria: "Préstamo otros"
      });
      await Logs.create({Actor: "Sistema", Descripcion: `Se ha creado el ticket ${ticket.ID} para el préstamo de equipo.`, Tipo_de_accion: "Creacion",  Title: ticket.ID ?? "", CorreoActor: ""})
      const payload: prestamos = {
        Title: state.Title!,
        Id_dispositivo: state.Id_dispositivo!,
        Estado: "Activo",
        FechaPrestamo: state.FechaPrestamo!,
        IdTicket: ticket.ID ?? "",
        FechaDevolucion: null,
        UsuarioRecibe: "",
        nombreSolicitante: state.nombreSolicitante!,

      }
      const prestamo = await prestamos.create(payload);

      alert("Prestamo creado exitosamente");
      setState({Estado: "Activo", FechaDevolucion: null, FechaPrestamo: toISODateFlex(new Date()), Id_dispositivo: "", IdTicket: "", UsuarioRecibe: "", Title: "", nombreSolicitante: ""});
      load();
      return {continue: true, created: prestamo};
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      return {continue: false, created: null}
    }  
  };

  const notify = async (prestamo: prestamos, dispositivos: dispositivos[]): Promise<void> => {
    const dispositivo = dispositivos.find(d => d.Id === prestamo.Id_dispositivo);
    const message = `
      <p>
        ¡Hola ${prestamo.nombreSolicitante ?? ""}!<br><br>

        Se ha registrado un préstamo a tu nombre con la siguiente información:<br><br>

        <strong>Dispositivo prestado:</strong> ${dispositivo?.Title} ${dispositivo?.Referencia ?? ""}<br><br>

        Por favor, recuerda devolver el dispositivo a la brevedad y en el mejor estado posible.<br><br>

        Este es un mensaje automático, por favor no respondas.
      </p>`.trim();
    await notifyFlow.invoke<FlowToUser, any>({recipient: prestamo.Title, title: "Notificación de prestamo", message, mail: true})
  }

  const notifyEstado = async (prestamo: prestamos, dispositivos: dispositivos[], estado: string): Promise<void> => {
    const dispositivo = dispositivos.find(d => d.Id === prestamo.Id_dispositivo);
    const message = `
      <p>
        ¡Hola ${prestamo.nombreSolicitante ?? ""}!<br><br>

        Se hemos registrado que ha finalizado el siguiente prestamo a su nombre:<br><br>

        <strong>Dispositivo prestado:</strong>  ${dispositivo?.Referencia ?? ""}<br><br>
        <strong>Estado de devolucion:</strong> ${estado}<br><br>

        ${estado.toLocaleLowerCase() === "mal estado" ? 
          "Lamentablemente el dispositivo no fue devuelto en buen estado. Nos pondremos en contacto contigo para informarte sobre los próximos pasos a seguir." : 
          "Gracias por devolver el dispositivo en buen estado. Si necesitas realizar otro préstamo, no dudes en contactarnos."}<br><br>

        Este es un mensaje automático, por favor no respondas.
      </p>`.trim();
    await notifyFlow.invoke<FlowToUser, any>({recipient: prestamo.Title, title: "Notificación de prestamo", message, mail: true})
  }

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const all: any[] = [];
      let nextLink: string | undefined = undefined;

      do {
        const res: PageResult<prestamos> = nextLink ? await prestamos.getByNextLink(nextLink)         : await prestamos.getAll(buildFilter());     

        all.push(...(res.items ?? []));
        nextLink = res.nextLink ? res.nextLink : "";
      } while (nextLink);

      setRows(all);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando logs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [buildFilter, prestamos]);

  const loadDeviceLoans = React.useCallback(async (idDevice: string): Promise<prestamos[]> => {
    setLoading(true);
    setError(null);

    try {
      const all: prestamos[] = [];
      let nextLink: string | undefined = undefined;

      do {
        const res: PageResult<prestamos> = nextLink ? await prestamos.getByNextLink(nextLink) : await prestamos.getAll({filter: `fields/Id_dispositivo eq '${idDevice}'`});     

        all.push(...(res.items ?? []));
        nextLink = res.nextLink ? res.nextLink : "";
      } while (nextLink);

      return all
    } catch (e: any) {
      setError(e?.message ?? "Error cargando logs");
      return []
    } finally {
      setLoading(false);
    }
  }, [buildFilter, prestamos]);

  const reload = React.useCallback(() => {
    load();
  }, [load]);

  const finalizeLoan = async (loan: prestamos, continuar: boolean) => {
    try {
      await prestamos.update(loan.Id!, {Estado: "Cerrado", FechaDevolucion: toISODateTimeFlex(new Date()), UsuarioRecibe: account?.name ?? ""});
      await Tickets.update(loan.IdTicket, {Estadodesolicitud: "Cerrado", TiempoSolucion: toISODateFlex(new Date()),});
      if(continuar) {
        await Logs.create({Actor: "Sistema", Descripcion: `Se ha cerrado el ticket ${loan.IdTicket} asociado al préstamo de equipo. <br><br> El equipo se entrego en buen estado`, Tipo_de_accion: "Cierre",  Title: loan.IdTicket ?? "", CorreoActor: ""})
      } else {
        await Logs.create({Actor: "Sistema", Descripcion: `Se ha cerrado el ticket ${loan.IdTicket} asociado al préstamo de equipo. <br><br> El equipo se entrego en mal estado, se seguira el proceso de responsabilización`, Tipo_de_accion: "Cierre",  Title: loan.IdTicket ?? "", CorreoActor: ""})
      }
    } catch (err) {
      console.error("Error finalizando préstamo:", err);
    }
  }

  const visibleRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || q.length < 3) return rows;

    return rows.filter(p => {
      const d = dispositivosById.get(p.Id_dispositivo);

      return (
        p.Title?.toLowerCase().includes(q) ||
        p.nombreSolicitante?.toLowerCase().includes(q) ||
        (d?.Referencia ?? "").toLowerCase().includes(q) ||
        (d?.Serial ?? "").toLowerCase().includes(q) ||
        (d?.Title)?.toLowerCase().includes(q)
      );
    });
  }, [rows, search, dispositivosById]);
  

  React.useEffect(() => { load(); }, [load]);


  return {
    loadDeviceLoans, visibleRows, rows, loading, error, load, reload, estado, setEstado, search, setSearch, handleSubmit, errors, submitting, setField, state, notify, finalizeLoan, notifyEstado
  };
}

export function useDispositivos() {
  const {dispositivos} = useGraphServices()
  const [rows, setRows] = React.useState<dispositivos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [estado, setEstado] = React.useState<string>("all");
  const [search, setSearch] = React.useState<string>("");
  const [errors, setErrors] = React.useState<dispositivosErrors>({});
  const [state, setState] = React.useState<dispositivos>({Title: "", Referencia: "", Serial: "", Estado: "Disponible"});
  const setField = <K extends keyof dispositivos>(k: K, v: dispositivos[K]) => setState((s) => ({ ...s, [k]: v }));

  const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    //if(estado && estado !== "all") filters.push(`fields/Estado eq '${estado}'`);
    if(search) filters.push(`startswith(fields/Title, '${search}') or startswith(fields/Referencia, '${search}') or startswith(fields/Serial, '${search}')`);


    return {
      filter: filters.join(" and "),
      orderby: "fields/Created asc", 
    };
  }, [estado, search]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const all: any[] = [];
      let nextLink: string | undefined = undefined;

      do {
        const res: PageResult<dispositivos> = nextLink ? await dispositivos.getByNextLink(nextLink) : await dispositivos.getAll(buildFilter());     

        all.push(...(res.items ?? []));
        nextLink = res.nextLink ? res.nextLink : "";
        console.log(all)
      } while (nextLink);

      setRows(all);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando logs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [buildFilter, dispositivos]);

  const validate = () => {
    const e: dispositivosErrors = {};
    if (!state.Referencia) e.Referencia = "Ingrese la referencia del dispositivo";
    if (!state.Serial) e.Serial = "Ingrese el número de serie del dispositivo";
    if (!state.Title) e.Title = "Ingrese la marca del dispositivo";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      alert("Por favor rellene todos los campos")
      return;
    };

    setSubmitting(true);
    try {
      const payload: dispositivos = {
        Title: state.Title!,
        Referencia: state.Referencia!,
        Serial: state.Serial!,
        Estado: state.Estado || "Disponible",
      };

      await dispositivos.create(payload);

      alert("Dispositivo agregado exitosamente");
      setState({Title: "", Referencia: "", Serial: "", Estado: "Disponible"});
      load();
    } catch (err) {
      console.error("Error en handleSubmit:", err);
    } 
  };

  const borrowDevice = React.useCallback(async (deviceId: string) => {
    setLoading(true);
    setError(null);

    try {
      await dispositivos.update(deviceId, {Estado: "Prestado"});
    } catch (e: any) {
      setError(e?.message ?? "Error cargando logs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [buildFilter]);

  const deviceReturn = React.useCallback(async (deviceId: string, estado: boolean) => {
    setLoading(true);
    setError(null);

    try {
      await dispositivos.update(deviceId, {Estado: estado ? "Disponible" : "Malo"});
    } catch (e: any) {
      setError(e?.message ?? "Error cambiando el estado del dispositivo");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [buildFilter]);

  const editDevice = async () => {
    if (!validate()) {
      alert("Por favor rellene todos los campos")
      return;
    };

    setSubmitting(true);
    try {
      const payload: dispositivos = {
        Title: state.Title!,
        Referencia: state.Referencia!,
        Serial: state.Serial!,
        Estado: state.Estado || "Disponible",
      };

      await dispositivos.update(state.Id!, payload);

      alert("Dispositivo editado exitosamente");
      setState({Title: "", Referencia: "", Serial: "", Estado: "Disponible"});
      load();
    } catch (err) {
      console.error("Error en handleSubmit:", err);
    } 
  };

  const reload = React.useCallback(() => {
    load();
  }, [load]);

  React.useEffect(() => { load(); }, [load]);


  const dispositivosById = React.useMemo(() => {
    const m = new Map<string, dispositivos>();
    for (const d of rows) m.set(d?.Id ?? "", d);
    return m;
  }, [rows]);

  return {
    dispositivosById, rows, loading, error, load, reload, estado, setEstado, search, setSearch, handleSubmit, errors, state, setState, submitting, setField, borrowDevice, deviceReturn, editDevice
  };
}

export function usePruebas() {
  const {pruebas, pruebasPrestamo} = useGraphServices()
  const [pruebasPrestamoRows, setPruebasPrestamoRows] = React.useState<pruebasPrestamo[]>([]);
  const [pruebasRows, setPruebasRows] = React.useState<pruebasDefinidas[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<string, string>>({});
  const [state, setState] = React.useState<pruebasDefinidas>({Title: "", Estado: "Activo"});
  const setField = <K extends keyof dispositivos>(k: K, v: dispositivos[K]) => setState((s) => ({ ...s, [k]: v }));

  const onDraftChange = React.useCallback((testId: string, next: string) => {
    if (!testId) return;
    setDraft(prev => ({ ...prev, [testId]: next }));
  }, []);

  const loadPruebas = React.useCallback(async (): Promise<pruebasDefinidas[]> => {
    setLoading(true);

    try {
      const all: any[] = [];
      let nextLink: string | undefined = undefined;

      do {
        const res: PageResult<pruebasDefinidas> = nextLink ? await pruebas.getByNextLink(nextLink) : await pruebas.getAll({filter: `fields/Estado eq 'Activo'`, orderby: "fields/Created asc"});     

        all.push(...(res.items ?? []));
        nextLink = res.nextLink ? res.nextLink : "";
        console.log(all)
      } while (nextLink);
      return all;
    } catch (e: any) {

      return [];
    } finally {
      setLoading(false);
    }
  }, [pruebas]);

  const createAllPruebas = async (prestamoId: string) => {
    setSubmitting(true);
    const pruebasLoaded = await loadPruebas();
    try {
      if(pruebasLoaded.length === 0) return

      pruebasLoaded.forEach(async p => {
        const payload = {
          Title: p.Title,
          IdPrestamo: prestamoId,
          Aprobado: "Pendiente",
          Observaciones: "",
        }
        await pruebasPrestamo.create({...payload, Fase: "Devolucion"});
        await pruebasPrestamo.create({...payload, Fase: "Entrega"});
      });
    } catch (err) {
      console.error("Error en handleSubmit:", err);
    } 
  };

  const loadAllPruebas = React.useCallback(async () => {
    setLoading(true);

    try {
      const all: any[] = [];
      let nextLink: string | undefined = undefined;

      do {
        const res: PageResult<pruebasDefinidas> = nextLink ? await pruebas.getByNextLink(nextLink) : await pruebas.getAll();     

        all.push(...(res.items ?? []));
        nextLink = res.nextLink ? res.nextLink : "";
        console.log(all)
      } while (nextLink);

      setPruebasRows(all);
      return all;
    } catch (e: any) {
      setPruebasRows([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [pruebas]);

  const loadPruebasPrestamo = React.useCallback(async (Id: string, fase: "Entrega" | "Devolucion" | "Ambas"): Promise<pruebasPrestamo[]> => {
    setLoading(true);

    const fetchByFase = async (faseSingle: "Entrega" | "Devolucion") => {
      const all: pruebasPrestamo[] = [];
      let nextLink: string | undefined = undefined;

      do {
        const res: PageResult<pruebasPrestamo> = nextLink ? await pruebasPrestamo.getByNextLink(nextLink) : await pruebasPrestamo.getAll({filter: `fields/IdPrestamo eq '${Id}' and fields/Fase eq '${faseSingle}'`, });

        all.push(...(res.items ?? []));
        nextLink = res.nextLink ? res.nextLink : "";
      } while (nextLink);

      return all;
    };

    try {
      let rows: pruebasPrestamo[] = [];

      if (fase === "Ambas") {
        const [entrega, devolucion] = await Promise.all([
          fetchByFase("Entrega"),
          fetchByFase("Devolucion"),
        ]);

        // ✅ merge sin duplicados por Id
        const map = new Map<string, pruebasPrestamo>();
        [...entrega, ...devolucion].forEach((t) => {
          const key = String(t.Id ?? "");
          if (key) map.set(key, t);
        });

        rows = Array.from(map.values());
      } else {
        rows = await fetchByFase(fase);
      }

      setPruebasPrestamoRows(rows);
      return rows;
    } catch (e: any) {
      setPruebasPrestamoRows([]);
      return [];
    } finally {
      setLoading(false);
    }
  },[pruebasPrestamo]);

  const pendingChanges = React.useMemo(() => {
    const currentById = new Map(pruebasPrestamoRows.map(t => [t.Id ?? "", t.Aprobado]));
    return Object.entries(draft).filter(([id, next]) => currentById.get(id) !== next);
  }, [draft, pruebasPrestamoRows]);

  const handleFinalize = async (loan: prestamos): Promise<boolean> => {
    if (pendingChanges.length === 0) return false; // “solo se ejecuta al guardar cambios”

    await Promise.all(
      pendingChanges.map(([id, next]) =>
        pruebasPrestamo.update(id, { Aprobado: next })
      )
    );

    await loadPruebasPrestamo(String(loan.Id), "Devolucion");
    setDraft({});

    const hasNoExitosa = pendingChanges.some(([, next]) =>
      next.trim().toLowerCase() === "rechazado"
    );

    return !hasNoExitosa; 
  };


  const handleSubmit = async () => {
    if (!state.Title) {
      alert("Por favor rellene todos los campos")
      return;
    };

    setSubmitting(true);
    try {
      const payload: pruebasDefinidas = {
        Title: state.Title!,
        Estado: state.Estado || "Activo",
      };

      await pruebas.create(payload);

      alert("Prueba agregada exitosamente");
      setState({Title: "",  Estado: "Activo"});
      loadAllPruebas()
    } catch (err) {
      console.error("Error en handleSubmit:", err);
    } 
  };

  const editTest = async () => {
    if (!state.Title) {
      alert("Por favor rellene todos los campos")
      return;
    };

    setSubmitting(true);
    try {
      const payload: pruebasDefinidas = {
        Title: state.Title!,
        Estado: state.Estado || "Activo",
      };

      await pruebas.update(state.Id!, payload);

      alert("Prueba editada exitosamente");
      setState({Title: "",  Estado: "Activo"});
      loadAllPruebas();
    } catch (err) {
      console.error("Error en handleSubmit:", err);
    } 
  };


  return {
    handleSubmit, editTest, state, setState, setField, loading, submitting, createAllPruebas, pruebasRows, pruebasPrestamoRows, loadPruebasPrestamo, draft, onDraftChange, handleFinalize, pendingChanges, setDraft, loadAllPruebas
  };
}
