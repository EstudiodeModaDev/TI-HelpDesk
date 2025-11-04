import React from "react";
import { useUsuarios } from "../../Funcionalidades/Usuarios";
import { useGraphServices } from "../../graph/GrapServicesContext";
import "./Usuarios.css"
import { useFranquicias } from "../../Funcionalidades/Franquicias";
import { useConfirm } from "../ModalDelete/ConfirmProvider";
import NuevoTecnico from "./AgregarUsuarios/AgregarUsuarios";
import NuevaFranquicia from "./AgregarFranquicias/AgregarFranquicias";

export default function UsuariosPanel() {
    const { Usuarios, Franquicias } = useGraphServices();
    const { administradores, tecnicos, loading, deleteUser} = useUsuarios(Usuarios)   
    const { franquicias, loading: loadingFranq} = useFranquicias(Franquicias);

    const [search, setSearch] = React.useState("");
    const [mostrar, setMostrar] = React.useState<string>("Tecnicos");
    const [modalAgregar, setModalAgregar] = React.useState<boolean>(false)

    const filteredTecnicos = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return tecnicos;
        return tecnicos.filter((t) => {
          const texto = `${t.Title ?? ""} ${t.Correo ?? ""}`.toLowerCase();
          return texto.includes(q);
        });
      }, [tecnicos, search]);

    const filteredFranquicias = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return franquicias;
        return franquicias.filter((t) => {
          const texto = `${t.Title ?? ""} ${t.Correo ?? ""}`.toLowerCase();
          return texto.includes(q);
        });
      }, [franquicias, search]);

    const filteredAdmin = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return administradores;
        return administradores.filter((t) => {
          const texto = `${t.Title ?? ""} ${t.Correo ?? ""}`.toLowerCase();
          return texto.includes(q);
        });
      }, [administradores, search]);
    
    const confirm = useConfirm();
    
    async function handleDelete(t: { Id: string; Title?: string }) {
        const ok = await confirm({
            title: "Eliminar tarea",
            message: (
            <>
                ¿Seguro que deseas eliminar <b>{t.Title ?? "esta tarea"}</b>?<br />
                <small>Esta acción no se puede deshacer.</small>
            </>
            ),
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            destructive: true,
        });
        if (!ok) return;

        await deleteUser(t.Id);
    }
     
    return (
        <section className="users-page" aria-label="Gestión de usuarios">
            <header className="users-header">
            <h2>{mostrar}</h2>

            <div className="users-toolbar">
                <input className="users-search" placeholder="Buscar Usuario" value={search} onChange={(e) => setSearch(e.target.value)}/>

                <div className="users-select-wrap">
                    <select className="users-select" value={mostrar} onChange={(e) => setMostrar(e.target.value)} aria-label="Filtrar por franquicia">
                        <option value="Franquicias">Franquicias</option>
                        <option value="Tecnico">Resolutores</option>
                        <option value="Administrador">Administradores</option>
                    </select>
                <span className="select-caret" aria-hidden>
                    ▾
                </span>
                </div>

                <button type="button" className="icon-btn" title="Agregar" aria-label="Agregar usuario" onClick={() => setModalAgregar(true)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </button>
            </div>
            </header>

            <div className="users-table-wrap">
                <table className="users-table">
                    <colgroup>
                        <col style={{ width: "44%" }} />
                        <col style={{ width: "36%" }} />
                        <col style={{ width: "16%" }} />
                        <col style={{ width: "4%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>{mostrar === "Franquicias" ? "Contacto" : "Rol"}</th>
                            <th> </th> {/* pon texto o &nbsp; para asegurar la columna */}
                        </tr>
                    </thead>

                    <tbody>
                        {mostrar === "Tecnico" && filteredTecnicos.map((u) => (
                            <tr key={u.Id}>
                                <td><div className="cell-name">{u.Title}</div></td>

                                <td><div className="cell-name">{u.Correo}</div></td>
                                
                                <td>{u.Rol || "—"}</td>
                                
                                <td className="cell-actions">
                                    <button type="button" className="icon-btn danger" title="Eliminar" aria-label={`Eliminar ${u.Title}`}  onClick={() => handleDelete({ Id: String(u.Id ?? ""), Title: u.Title })}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                    </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {mostrar === "Administrador" && filteredAdmin.map((u) => (
                            <tr key={u.Id}>
                                <td><div className="cell-name">{u.Title}</div></td>

                                <td><div className="cell-name">{u.Correo}</div></td>
                                
                                <td>{u.Rol || "—"}</td>
                                
                                <td className="cell-actions">
                                    <button type="button" className="icon-btn danger" title="Eliminar" aria-label={`Eliminar ${u.Title}`} onClick={() => handleDelete({ Id: String(u.Id ?? ""), Title: u.Title })}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                    </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {mostrar === "Franquicias" && filteredFranquicias.map((u) => (
                            <tr key={u.Id}>
                                <td><div className="cell-name">{u.Title}</div></td>

                                <td><div className="cell-name">{u.Correo}</div></td>
                                
                                <td>{u.Celular || "—"}</td>
                                
                                <td className="cell-actions">
                                    <button type="button" className="icon-btn danger" title="Eliminar" aria-label={`Eliminar ${u.Title}`} onClick={() => handleDelete({ Id: String(u.Id ?? ""), Title: u.Title })}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                    </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {(loading || loadingFranq) && (
                            <tr>
                            <td colSpan={4} className="empty-state">
                                No hay usuarios para los filtros seleccionados.
                            </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        
            {(mostrar === "Tecnico" || mostrar==="Administrador" ) &&<NuevoTecnico modal tipo={mostrar} open={modalAgregar} onCancel={() => setModalAgregar(false)} />}
            {mostrar === "Franquicias" && <NuevaFranquicia modal open={modalAgregar} onCancel={() => setModalAgregar(false)}/>}

        </section>
    );

}