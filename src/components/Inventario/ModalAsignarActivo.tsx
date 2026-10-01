import React from "react";
import Select from "react-select";
import "./ModalAsignarActivo.css";
import { useRepositories } from "../../repositories/repositoriesContext";
import { useAuth } from "../../auth/authContext";
import { useActivoMovimientos } from "../../Funcionalidades/inventario/useActivoMovimientos";
import { useWorkers } from "../../Funcionalidades/access/Workers";
import { useFranquicias } from "../../Funcionalidades/access/Franquicias";
import { useGraphServices } from "../../graph/GrapServicesContext";
import { ESTADOS_ACTIVO } from "../../Models/ActivosTIMovimientos";
import {
  UBICACIONES_ACTIVO,
  type ActivoTI,
  type Ubicacion_Tipo,
} from "../../Models/ActivoTI";
import type { UserOption } from "../../Models/Commons";
import type { UsuariosSP } from "../../Models/Usuarios";

import type { EstadoActivo } from "../../Models/ActivosTIMovimientos";
import { BuscadorActivo } from "./BuscadorActivo";
import { usePrestamos } from "../../Funcionalidades/loans/prestamos";
import { useActivoPrestamo } from "../../Funcionalidades/inventario/useActivoPrestamo";

type TipoMovimiento = "asignacion" | "prestamo";

interface ModalAsignarActivoProps {
  activo?: ActivoTI;
  onSaved?: () => void;
  onClose?: () => void;
}

interface AsignarActivoFormProps extends Omit<
  ModalAsignarActivoProps,
  "activo"
> {
  activo: ActivoTI | null;
  // Solo cuando se entra sin activo (desde el menú): permite buscarlo aquí mismo
  onCambiarActivo?: (activo: ActivoTI | null) => void;
}

export const ModalAsignarActivo: React.FC<ModalAsignarActivoProps> = ({
  activo,
  onSaved,
  onClose,
}) => {
  const [elegido, setElegido] = React.useState<ActivoTI | null>(null);
  const actual = activo ?? elegido;

  // El key reinicia el formulario cada vez que cambia el activo elegido
  return (
    <AsignarActivoForm
      key={actual?.id ?? "sin-activo"}
      activo={actual}
      onCambiarActivo={activo ? undefined : setElegido}
      onSaved={onSaved}
      onClose={activo ? onClose : () => setElegido(null)}
    />
  );
};

const AsignarActivoForm: React.FC<AsignarActivoFormProps> = ({
  activo,
  onCambiarActivo,
  onSaved,
  onClose,
}) => {
  const { movimientosTI, activosTI, usuarios } = useRepositories();
  const [errorActivo, setErrorActivo] = React.useState<string | null>(null);
  const { account } = useAuth();
  const { Franquicias: FranquiciasSvc } = useGraphServices();

  const { form, formErrors, error, setField, saveMovimiento } =
    useActivoMovimientos({
      MovimientosSvc: movimientosTI!,
      activoId: activo?.id,
    });

  const {
    workersOptions,
    loadingWorkers,
    error: usersError,
  } = useWorkers({ onlyEnabled: true });
  const {
    franqOptions,
    loading: loadingFranq,
    error: franqError,
  } = useFranquicias(FranquiciasSvc!);
  const [responsable, setResponsable] = React.useState<UsuariosSP | null>(null);
  const [usuarioDestino, setUsuarioDestino] = React.useState<UserOption | null>(
    null,
  );

  const listaUsuariosDestino: UserOption[] = React.useMemo(() => {
    const map = new Map<string, UserOption>();
    for (const o of [...workersOptions, ...franqOptions]) {
      const key = (o.value || "").toLowerCase();
      if (!map.has(key)) map.set(key, o);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [workersOptions, franqOptions]);

  // Préstamo: reutiliza el mismo flujo de la página de Préstamos
  // (ticket + registro en la lista de préstamos + correo)
  const {
    handleSubmit: crearPrestamo,
    setField: setPrestamoField,
    notify: notificarPrestamo,
  } = usePrestamos();
  const { iniciarPrestamoActivo } = useActivoPrestamo();
  const [tipoMovimiento, setTipoMovimiento] =
    React.useState<TipoMovimiento>("asignacion");
  const [guardando, setGuardando] = React.useState(false);

  const esPrestamo = tipoMovimiento === "prestamo";
  const esReasignacion = activo?.estado === "Asignado";
  const enPrestamo = activo?.estado === "en_prestamo";

  React.useEffect(() => {
    if (!activo) return;
    setField("ubicacion_origen", activo.ubicacion_tipo);
    setField("ubicacion_destino", activo.ubicacion_tipo);
    setField("estado_anterior", activo.estado);
    setField("usuario_origen_nombre", activo.nombre_usuario || "");
    setField("usuario_origen_correo", activo.correo_usuario || "");
    setPrestamoField("Id_dispositivo", activo.id);
  }, [activo]);

  React.useEffect(() => {
    if (!account?.username) return;
    setField("responsable_correo", account.username);
    setField("responsable_nombre", account.name ?? account.username);
    if (!usuarios) return;
    usuarios.getByEmail(account.username).then((result) => {
      if (result.status && result.data) {
        setResponsable(result.data);
        if (result.data.Title)
          setField("responsable_nombre", result.data.Title);
      }
    });
  }, [account?.username, account?.name, usuarios]);

  const registrarPrestamo = async (activo: ActivoTI) => {
    if (!usuarioDestino) {
      setErrorActivo("Selecciona el usuario que recibe el préstamo");
      return;
    }
    setGuardando(true);
    try {
      const res = await crearPrestamo();
      if (!res.continue || !res.created) {
        setErrorActivo("No se pudo crear el préstamo");
        return;
      }

      const ok = await iniciarPrestamoActivo(res.created, form.comentario);
      if (!ok) {
        setErrorActivo(
          `Se creó el ticket #${res.created.IdTicket}, pero no se pudo actualizar el activo`,
        );
        return;
      }

      notificarPrestamo(res.created, [
        {
          Id: activo.id,
          Title: [activo.tipo, activo.marca, activo.modelo]
            .filter(Boolean)
            .join(" "),
          Referencia: activo.codigo_inventario,
          Serial: activo.numero_serie,
          Estado: "en_prestamo",
        },
      ]).catch((err) => console.error("Error notificando el préstamo:", err));

      onSaved?.();
      onClose?.();
    } finally {
      setGuardando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activo) return;
    setErrorActivo(null);

    if (enPrestamo) {
      setErrorActivo(
        "El activo está en préstamo. Finaliza el préstamo desde Préstamos antes de moverlo.",
      );
      return;
    }
    if (esPrestamo) {
      await registrarPrestamo(activo);
      return;
    }

    const estadoNuevo = form.estado_nuevo as EstadoActivo | undefined;
    const destinoNombre = form.usuario_destino_nombre?.trim() ?? "";
    const destinoCorreo = form.usuario_destino_correo?.trim() ?? "";

    const tieneDestino = Boolean(destinoNombre && destinoCorreo);
    const cambiaEstado = Boolean(estadoNuevo && estadoNuevo !== activo.estado);
    const quedaDisponible = estadoNuevo === "Disponible";
    const ubicacionNueva = form.ubicacion_destino as Ubicacion_Tipo | undefined;
    const cambiaUbicacion = Boolean(
      ubicacionNueva && ubicacionNueva !== activo.ubicacion_tipo,
    );

    const ok = await saveMovimiento();
    if (!ok) return;

    if (tieneDestino || cambiaEstado || cambiaUbicacion) {
      const result = await activosTI!.updateActivo(activo.id, {
        ...(cambiaEstado ? { estado: estadoNuevo } : {}),
        ...(cambiaUbicacion ? { ubicacion_tipo: ubicacionNueva } : {}),
        ...(tieneDestino
          ? { nombre_usuario: destinoNombre, correo_usuario: destinoCorreo }
          : {}),
        ...(quedaDisponible
          ? { nombre_usuario: "", correo_usuario: "" }
          : tieneDestino
            ? { nombre_usuario: destinoNombre, correo_usuario: destinoCorreo }
            : {}),
      });
      if (!result.status) {
        setErrorActivo(result.message ?? "Error actualizando el activo");
        return;
      }
    }

    onSaved?.();
    onClose?.();
  };

  return (
    <div className="activo-form-page asignar-activo">
      <div className="activo-form-header">
        <h2>{esReasignacion ? "Reasignar activo" : "Asignar activo"}</h2>
        <p>Registra el nuevo responsable del activo en la bitácora</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="activo-form-container">
          <div className="form-section">
            <div className="section-title">
              <h3>Activo</h3>
              <span>
                {onCambiarActivo
                  ? "Busca el activo que vas a asignar o reasignar"
                  : "Información actual del equipo"}
              </span>
            </div>

            {onCambiarActivo && (
              <div
                className="form-group"
                style={{ marginBottom: activo ? 18 : 0 }}
              >
                <label htmlFor="buscar_activo_id">Buscar activo</label>
                <BuscadorActivo
                  inputId="buscar_activo_id"
                  value={activo}
                  onChange={onCambiarActivo}
                />
              </div>
            )}

            {activo && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Código de inventario</label>
                  <input
                    type="text"
                    value={activo.codigo_inventario}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <input type="text" value={activo.tipo} disabled />
                </div>
                <div className="form-group">
                  <label>Usuario actual</label>
                  <input
                    type="text"
                    value={activo.nombre_usuario || "Sin asignar"}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Responsable del movimiento</label>
                  <input
                    type="text"
                    value={responsable?.Title ?? account?.name ?? ""}
                    disabled
                  />
                </div>
              </div>
            )}
          </div>

          {!activo ? (
            <div className="form-section">
              <div className="section-title">
                <h3>Nuevo responsable</h3>
                <span>Primero busca y selecciona un activo</span>
              </div>
            </div>
          ) : (
            <div className="form-section">
              <div className="section-title">
                <h3>Nuevo responsable</h3>
                <span>Selecciona el usuario que recibirá el activo</span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="usuario_destino_id">Usuario destino</label>
                  <Select<UserOption, false>
                    inputId="usuario_destino_id"
                    options={listaUsuariosDestino}
                    value={usuarioDestino}
                    onChange={(opt) => {
                      setUsuarioDestino(opt ?? null);
                      setPrestamoField("Title", opt?.email || opt?.value || "");
                      setPrestamoField("nombreSolicitante", opt?.label ?? "");
                      setField("usuario_destino_nombre", opt?.label ?? "");
                      setField(
                        "usuario_destino_correo",
                        opt?.email || opt?.value || "",
                      );

                      if (opt && !form.estado_nuevo) {
                        setField("estado_nuevo", "Asignado");
                        setField(
                          "ubicacion_destino",
                          opt ? "usuario" : "bodega_central",
                        );
                      } else if (!opt && form.estado_nuevo === "Asignado") {
                        setField("estado_nuevo", undefined);
                      }
                    }}
                    placeholder={
                      loadingWorkers || loadingFranq
                        ? "Cargando opciones…"
                        : "Buscar usuario destino…"
                    }
                    isLoading={loadingWorkers || loadingFranq}
                    isDisabled={loadingWorkers || loadingFranq}
                    isClearable
                    classNamePrefix="rs"
                    formatOptionLabel={(opt) => {
                      const correo = opt.email || opt.value;
                      return correo ? `${opt.label} (${correo})` : opt.label;
                    }}
                    noOptionsMessage={() =>
                      usersError || franqError
                        ? "Error cargando opciones"
                        : "Sin coincidencias"
                    }
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 18 }}>
                <label>Tipo de movimiento</label>
                <div className="tipo-movimiento" role="radiogroup">
                  {(["asignacion", "prestamo"] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      role="radio"
                      aria-checked={tipoMovimiento === tipo}
                      className={
                        "tipo-movimiento__opcion" +
                        (tipoMovimiento === tipo ? " is-activo" : "")
                      }
                      onClick={() => setTipoMovimiento(tipo)}
                    >
                      {tipo === "asignacion" ? "Asignación" : "Préstamo"}
                    </button>
                  ))}
                </div>
                <small className="tipo-movimiento__ayuda">
                  {esPrestamo
                    ? "Préstamo temporal: se crea un ticket, el activo pasa a «En préstamo» y debe devolverse según lo acordado."
                    : "El usuario destino queda como responsable del activo."}
                </small>
              </div>

              {!esPrestamo && (
                <div className="form-grid" style={{ marginTop: 18 }}>
                  <div className="form-group">
                    <label htmlFor="ubicacion_destino">Ubicación destino</label>
                    <select
                      id="ubicacion_destino"
                      value={form.ubicacion_destino ?? ""}
                      onChange={(e) =>
                        setField(
                          "ubicacion_destino",
                          e.target.value as Ubicacion_Tipo,
                        )
                      }
                    >
                      <option value="">Selecciona...</option>
                      {Object.entries(UBICACIONES_ACTIVO).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="nuevo_estado">Nuevo Estado </label>
                    <select
                      id="estado_nuevo"
                      value={form.estado_nuevo ?? ""}
                      onChange={(e) => {
                        const estado = e.target.value as EstadoActivo;
                        setField("estado_nuevo", estado);
                        if (estado === "Disponible")
                          setField("ubicacion_destino", "bodega_central");
                      }}
                    >
                      <option value="">Selecciona...</option>
                      {/* "En préstamo" solo se pone con el tipo Préstamo */}
                      {Object.entries(ESTADOS_ACTIVO)
                        .filter(([value]) => value !== "en_prestamo")
                        .map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: 18 }}>
                <label htmlFor="comentario">Comentario (opcional)</label>
                <textarea
                  id="comentario"
                  rows={3}
                  placeholder={
                    esPrestamo
                      ? "Motivo, condiciones del préstamo, fecha de devolución estimada…"
                      : ""
                  }
                  value={form.comentario ?? ""}
                  onChange={(e) => setField("comentario", e.target.value)}
                />
              </div>

              {!esPrestamo &&
                Object.values(formErrors)
                  .filter(Boolean)
                  .map((msg, i) => (
                    <small
                      key={i}
                      style={{ display: "block", color: "#dc2626" }}
                    >
                      {msg}
                    </small>
                  ))}
              {(error || errorActivo) && (
                <small style={{ display: "block", color: "#dc2626" }}>
                  {error || errorActivo}
                </small>
              )}
            </div>
          )}

          <div className="activo-form-footer">
            <button
              type="submit"
              className="btn-guardar"
              disabled={!activo || guardando}
            >
              {guardando
                ? "Guardando..."
                : esPrestamo
                  ? "Confirmar préstamo"
                  : esReasignacion
                    ? "Reasignar"
                    : "Asignar"}
            </button>
            <button type="button" onClick={onClose} className="btn-cancelar">
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
