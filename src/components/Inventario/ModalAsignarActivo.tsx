import React from "react";
import Select from "react-select";
import "./ModalAsignarActivo.css";
import { useRepositories } from "../../repositories/repositoriesContext";
import { useAuth } from "../../auth/authContext";
import { useActivoMovimientos } from "../../Funcionalidades/inventario/useActivoMovimientos";
import { useWorkers } from "../../Funcionalidades/access/Workers";
import { useFranquicias } from "../../Funcionalidades/access/Franquicias";
import { useGraphServices } from "../../graph/GrapServicesContext";
import type {
  ActivoTI,
  EstadoActivo,
  Ubicacion_Tipo,
} from "../../Models/ActivoTI";
import { ESTADOS_ACTIVO } from "../../Models/ActivoTI";
import type { UserOption } from "../../Models/Commons";
import type { UsuariosSP } from "../../Models/Usuarios";
import { useActivosTI } from "../../Funcionalidades/inventario/useActivosTI";
import type { TipoEvento } from "../../Models/ActivosTIMovimientos";

interface ModalAsignarActivoProps {
  activo: ActivoTI;
  onSaved?: () => void;
  onClose?: () => void;
}

export const ModalAsignarActivo: React.FC<ModalAsignarActivoProps> = ({
  activo,
  onSaved,
  onClose,
}) => {
  const { movimientosTI, usuarios, activosTI } = useRepositories();
  const { account } = useAuth();
  const { Franquicias: FranquiciasSvc } = useGraphServices();

  const { form, formErrors, setField, saveMovimiento } = useActivoMovimientos({
    MovimientosSvc: movimientosTI!,
    activoId: activo.id,
  });

  const { workersOptions, loadingWorkers } = useWorkers({ onlyEnabled: true });
  const { franqOptions, loading: loadingFranq } = useFranquicias(
    FranquiciasSvc!,
  );
  const [responsable, setResponsable] = React.useState<UsuariosSP | null>(null);

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

  const usuarioDestinoSeleccionado =
    listaUsuariosDestino.find(
      (u) =>
        u.value.toLowerCase() === (form.usuario_destino_id ?? "").toLowerCase(),
    ) ?? null;

  const esReasignacion = activo.estado === "asignado";

  React.useEffect(() => {
    setField("tipo_evento", "asignacion");
    setField("ubicacion_origen", activo.ubicacion_tipo);
    setField("ubicacion_destino", activo.ubicacion_tipo);
    setField("estado_anterior", activo.estado);
  }, [activo]);
  React.useEffect(() => {
    if (form.usuario_destino_id) {
      setField("estado_nuevo", "asignado");
    }
  }, [form.usuario_destino_id]);

  React.useEffect(() => {
    if (!activo.correo_usuario || !usuarios) return;
    usuarios.getByEmail(activo.correo_usuario).then((result) => {
      if (result.status && result.data?.Id) {
        setField("usuario_origen_id", result.data.Id);
      }
    });
  }, [activo.correo_usuario, usuarios]);

  React.useEffect(() => {
    if (!account?.username || !usuarios) return;
    usuarios.getByEmail(account.username).then((result) => {
      if (result.status && result.data) {
        setResponsable(result.data);
        if (result.data.Id) setField("responsable_id", result.data.Id);
      }
    });
  }, [account?.username, usuarios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveMovimiento();
    if (ok) {
      onSaved?.();
      onClose?.();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="activo-form-page">
        <div className="activo-form-header">
          <h2>{esReasignacion ? "Reasignar activo" : "Asignar activo"}</h2>
          <p>Registra el nuevo responsable del activo en la bitácora</p>
        </div>

        <form onSubmit={handleSubmit} className="activo-form-container">
          <div className="form-section">
            <div className="section-title">
              <h3>Activo</h3>
              <span>Información actual del equipo</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Código de inventario</label>
                <input type="text" value={activo.codigo_inventario} disabled />
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
          </div>

          <div className="form-section">
            <div className="section-title">
              <h3>Nuevo responsable</h3>
              <span>Selecciona el usuario que recibirá el activo</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="usuario_destino_id">
                  Usuario destino <span>*</span>
                </label>
                <Select<UserOption, false>
                  inputId="usuario_destino_id"
                  required
                  options={listaUsuariosDestino}
                  value={usuarioDestinoSeleccionado}
                  onChange={(opt) =>
                    setField("usuario_destino_id", opt?.value ?? "")
                  }
                  placeholder={
                    loadingWorkers || loadingFranq
                      ? "Cargando usuarios…"
                      : "Selecciona usuarios..."
                  }
                  isLoading={loadingWorkers || loadingFranq}
                  isDisabled={loadingWorkers || loadingFranq}
                  isClearable
                  classNamePrefix="rs"
                  formatOptionLabel={(opt) => {
                    const correo = opt.email || opt.value;
                    return correo ? `${opt.label} (${correo})` : opt.label;
                  }}
                  noOptionsMessage={() => "Sin coincidencias"}
                />
              </div>

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
                  <option value="bodega">Bodega</option>
                  <option value="usuario">Usuario</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tipo_evento">Tipo de evento</label>
                <select
                  id="estado_nuevo"
                  value={form.estado_nuevo ?? ""}
                  onChange={(e) =>
                    setField("tipo_evento", e.target.value as TipoEvento)
                  }
                >
                  <option value="">Selecciona...</option>
                  {Object.entries(ESTADOS_ACTIVO).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 18 }}>
              <label htmlFor="comentario">Comentario</label>
              <textarea
                id="comentario"
                rows={3}
                value={form.comentario ?? ""}
                onChange={(e) => setField("comentario", e.target.value)}
              />
            </div>

            {formErrors.tipo_evento && (
              <small style={{ color: "#dc2626" }}>
                {formErrors.tipo_evento}
              </small>
            )}
          </div>

          <div className="activo-form-footer">
            <button type="button" onClick={onClose} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" className="btn-guardar">
              {esReasignacion ? "Reasignar" : "Asignar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
