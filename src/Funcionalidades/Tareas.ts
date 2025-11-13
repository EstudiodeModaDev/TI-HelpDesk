import React from "react";
import type { TareasService } from "../Services/Tareas.service";
import type { FilterMode, NuevaTarea, Tarea, TareasError } from "../Models/Tareas";
import type { GetAllOpts } from "../Models/Commons";
import { useAuth } from "../auth/authContext";

/* ==== Helpers de fecha ==== */

// Devuelve "YYYY-MM-DD" (para columnas de solo fecha en SharePoint)
const toISODateOnly = (dateStr: string) => dateStr; // <input type="date"> ya da "YYYY-MM-DD"

// Combina fecha local + hora local y devuelve ISO (para columnas fecha+hora)
function combineLocalDateTime(dateStr: string, timeStr: string) {
  const [h, m] = (timeStr || "00:00").split(":").map(Number);
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

// Normaliza Date a 00:00 local (replica Today() de Power Apps)
function localDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Parsea ISO/Date
function toDate(v?: string | Date | null): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const dt = new Date(v);
  return isNaN(+dt) ? null : dt;
}

// patch uniforme para cualquier servicio
async function patchTarea(TareaSvc: any, id: string, data: Partial<Tarea>) {
  if (typeof TareaSvc.update === "function") return TareaSvc.update(id, data);
  if (typeof TareaSvc.patch === "function") return TareaSvc.patch(id, data);
  if (typeof TareaSvc.set === "function") return TareaSvc.set(id, data);
  throw new Error("TareasService no expone update/patch/set()");
}

export function useTareas(TareaSvc: TareasService) {
  const [rows, setRows] = React.useState<Tarea[]>([]);
  const [monthlyItems, setMonthlyItems] = React.useState<Tarea[]>([]);
  const [cantidadTareas, setCantidadTareas] = React.useState<number>(0);
  const [percentaje, setPercentaje] = React.useState<number>(0)
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filterMode, setFilterMode] = React.useState<FilterMode>("Pendientes");
  const [state, setState] = React.useState<NuevaTarea>({
    diasRecordatorio: 2,
    titulo: "",
    fecha: "",
    hora: "",
    solicitante: null,
    Nota: "",
    Encargado: null
  });
  const [errors, setErrors] = React.useState<TareasError>({});

  const { account } = useAuth();

  const buildFilter = React.useCallback((): GetAllOpts => {
    const f: string[] = [];
    const q = (s: string) => s.replace(/'/g, "''");

    if (filterMode === "Pendientes") {
      f.push(`fields/Estado eq '${q("Pendiente")}'`);
    } else if (filterMode === "Iniciadas") {
      f.push(`fields/Estado eq '${q("Iniciada")}'`);
    } else if (filterMode === "Finalizadas") {
      f.push(`startswith(fields/Estado,'${q("Finalizada")}')`);
    }

    return {
      filter: f.join(" and "),
      orderby: "fields/Fechadesolicitud desc",
      top: 1000,
    };
  }, [filterMode]);

  const loadTasks = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await TareaSvc.getAll(buildFilter());
      setRows(items);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tareas");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [TareaSvc, buildFilter]);

  
  const loadMonthTask = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Rango: [start, end)
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const startIso = start.toISOString().split(".")[0] + "Z";
      const endIso   = end.toISOString().split(".")[0] + "Z";

      const rango = `(fields/Fechadesolicitud ge '${startIso}' and fields/Fechadesolicitud lt '${endIso}')`;

      const filterPendInit =
        `(fields/Estado eq 'Pendiente' or fields/Estado eq 'Iniciada') and ${rango}`;

      // Usa startswith si tienes variantes de “Finalizada”
      const filterFinalizadas = `startswith(fields/Estado,'Finalizada') and ${rango}`;

      const filterAll = rango;

      // Paraleliza
      const [itemsPendientes, itemsFinalizadas, allItems] = await Promise.all([
        TareaSvc.getAll({ filter: filterPendInit }),
        TareaSvc.getAll({ filter: filterFinalizadas }),
        TareaSvc.getAll({ filter: filterAll }),
      ]);

      const total = allItems.length ?? 0;
      const done  = itemsFinalizadas.length ?? 0;

      const porcentaje = total > 0 ? (done / total) * 100 : 0;

      setMonthlyItems(itemsPendientes);
      setPercentaje(porcentaje);
      setCantidadTareas(total)
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tareas");
      setMonthlyItems([]);
      setPercentaje(0);
    } finally {
      setLoading(false);
    }
  }, [TareaSvc]);


  const setField = <K extends keyof NuevaTarea>(k: K, v: NuevaTarea[K]) => setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: TareasError = {};
    if (!state.titulo) e.titulo = "Requerido";
    if (!state.solicitante) e.solicitante = "Requerido";
    if (!state.fecha) e.fecha = "Requerida";
    if (!state.hora) e.hora = "Requerida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Fecha del evento (si la columna es solo fecha, NO combines hora aquí)
      const fechaNota = toISODateOnly(state.fecha ?? "");
      const fechaHoraEvento = combineLocalDateTime(state.fecha ?? "", state.hora ?? "");

      const payload = {
        Cantidaddediasalarma: Number(state.diasRecordatorio ?? 0),
        Estado: "Pendiente",
        Quienlasolicita: state.solicitante?.label ?? "",
        Reportadapor: state.Encargado ? state.Encargado.label ?? "": account?.name ?? "", 
        ReportadaporCorreo: state.Encargado ? state.Encargado.value ?? "": account?.username ?? "", 
        Title: state.titulo,
        Fechadelanota: fechaNota,      
        Fechadesolicitud: fechaHoraEvento,
        Nota: state.Nota,

      };

      await TareaSvc.create(payload);

      // Reset de form + recarga
      setState({
        diasRecordatorio: 2,
        titulo: "",
        fecha: "",
        hora: "",
        solicitante: null,
        Nota: "",
        Encargado: null
      });
      await loadTasks();
      // opcional: setFilterMode("Pendientes");
      alert("El recordatorio ha sido agendado");
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      alert("Ha ocurrido un error al crear el recordatorio");
    }
  };

  const deleteTask = React.useCallback(
    async (Id: string) => {
      try {
        await TareaSvc.delete(Id);
        await loadTasks();
        alert("El recordatorio se ha eliminado con éxito");
      } catch (err) {
        console.error("Error al eliminar:", err);
        alert("Ha ocurrido un error al eliminar el recordatorio");
      }
    },
    [TareaSvc, loadTasks]
  );


  const iniciarTarea = React.useCallback(
    async (Id: string) => {
      await patchTarea(TareaSvc, Id, { Estado: "Iniciada" });
      await loadTasks();
    },
    [TareaSvc, loadTasks]
  );

  const finalizarTarea = React.useCallback(
    async (t: Pick<Tarea, "Id" | "Fechadesolicitud">) => {
      const hoy = localDateOnly(new Date());
      const f = toDate(t.Fechadesolicitud);
      const fSolo = f ? localDateOnly(f) : null;

      const Estado =
        fSolo && fSolo.getTime() > hoy.getTime()
          ? "Finalizada a tiempo"
          : "Finalizada fuera de tiempo";

      await patchTarea(TareaSvc, t.Id ?? "", { Estado });
      await loadTasks();
    },
    [TareaSvc, loadTasks]
  );

  React.useEffect(() => {
    loadTasks();
    loadMonthTask()
  }, [loadTasks, loadMonthTask]);

  const reloadAll = React.useCallback(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    rows, loading, error, filterMode,  state, errors, percentaje, monthlyItems, cantidadTareas,
    setFilterMode, setField, handleSubmit, deleteTask, iniciarTarea, finalizarTarea, reloadAll,
  };
}
