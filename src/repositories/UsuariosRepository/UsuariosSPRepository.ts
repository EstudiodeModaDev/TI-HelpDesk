import type { UsuariosSP } from "../../Models/Usuarios";

type usuariosFilter = {
  estado? : string,
  rol?: string
}

export interface UsuariosSPRepository {
  loadUsuarios(filter?: usuariosFilter): Promise<{data: UsuariosSP[], status: boolean, message: string | null}>;
  createUsuario(payload: UsuariosSP): Promise<{data: UsuariosSP | null, status: boolean, message: string | null}>;
  inactivateUsuario(id: string): Promise<{data: UsuariosSP | null, status: boolean, message: string | null}>;
  activateUsuario(id: string,): Promise<{data: UsuariosSP | null, status: boolean, message: string | null}>;
  getByEmail(email: string): Promise<{data: UsuariosSP | null, status: boolean, message: string}>
  getById(id: string): Promise<{data: UsuariosSP | null, status: boolean, message: string}>
  updateUsuario(id: string, payload: Partial<UsuariosSP>): Promise<{data: UsuariosSP | null, status: boolean, message: string}>
}
