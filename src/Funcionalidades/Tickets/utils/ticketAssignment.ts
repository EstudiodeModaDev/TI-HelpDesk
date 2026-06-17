import type { UsuariosSP } from "../../../Models/Usuarios";
import type { UsuariosSPRepository } from "../../../repositories/UsuariosRepository/UsuariosSPRepository";

export async function increaseResolverCaseCount(Usuarios: UsuariosSPRepository, email?: string): Promise<void> {
  const safeEmail = email?.trim();
  if (!safeEmail) return;

  const resolutorRow = await Usuarios.getByEmail(safeEmail);

  if (!resolutorRow?.data?.Id) return;

  const prev = Number(resolutorRow.data.Numerodecasos ?? 0);
  await Usuarios.updateUsuario(String(resolutorRow.data.Id), {
    Numerodecasos: prev + 1,
  });
}

export async function pickTecnicoConMenosCasos(Usuarios: UsuariosSPRepository): Promise<UsuariosSP | null> {

  // 1. Traer técnicos disponibles
  const resolutores: UsuariosSP[] = (await Usuarios.loadUsuarios({estado: "Disponible"})).data;

  if (!resolutores.length) return null;

  // 2. Normalizar valores
  const clean = resolutores.map((r) => ({
    ...r,
    Numerodecasos: Number(r.Numerodecasos ?? 0),
  }));

  // 3. Encontrar mínimo
  const min = Math.min(...clean.map((r) => r.Numerodecasos));

  // 4. Filtrar los de menor carga
  const candidatos = clean.filter((r) => r.Numerodecasos === min);

  if (!candidatos.length) return null;

  // 5. Selección (random entre los mejores)
  const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];

  return elegido;
}

export async function balanceCharge(Usuarios: UsuariosSPRepository, targetId: string, maxDiff = 3): Promise<{ ok: boolean }> {
  const resolutores: UsuariosSP[] = (await Usuarios.loadUsuarios({rol: "Tecnico", estado: "Disponible"})).data;

  if (!resolutores.length) return { ok: false };

  const counts = resolutores.map((r) => Number(r.Numerodecasos ?? 0));
  const resolutor = await Usuarios.getById(targetId);

  const min = Math.min(...counts);
  const respuesta = Number(resolutor.data?.Numerodecasos ?? 0) + 1 - min < maxDiff;

  return { ok: respuesta };
}