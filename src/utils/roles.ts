// src/utils/roles.ts
import type { GraphRest } from "../graph/GraphRest";
import type { UsuariosSPService } from "../Services/Usuarios.Service";

/* =========================
   Tipos
   ========================= */
export type RoleDecision = | { role: string; source: "group"; matchedGroupId: string } | { role: string; source: "sp" } | { role: string; source: "default" };
export type GroupRule = { groupId: string; role: string };

/* =========================
   Cache simple (memoria)
   ========================= */
type CacheEntry<T> = { value: T; expiresAt: number };
const TTL_MS = 5 * 60 * 1000;

const uidCache = new Map<string, CacheEntry<string | null>>();     // email -> userId
const membCache = new Map<string, CacheEntry<boolean>>();          // `${userId}|${groupId}` -> bool
const multiMembCache = new Map<string, CacheEntry<string[] | null>>(); // `${userId}|sortedGroupIds` -> matchedIds

const now = () => Date.now();
function getFromCache<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  const hit = map.get(key);
  if (!hit) return null;
  if (hit.expiresAt < now()) { map.delete(key); return null; }
  return hit.value;
}
function setCache<T>(map: Map<string, CacheEntry<T>>, key: string, value: T) {
  map.set(key, { value, expiresAt: now() + TTL_MS });
}

/* =========================
   Helpers Graph
   ========================= */
async function getUserIdByEmail(graph: GraphRest, email: string): Promise<string | null> {
  const safe = String(email).trim().toLowerCase();
  if (!safe) return null;

  const k = safe;
  const cached = getFromCache(uidCache, k);
  if (cached !== null) return cached;

  // 1) /users/{upn|mail}
  try {
    const user = await graph.get<{ id?: string }>(
      `/users/${encodeURIComponent(safe)}?$select=id`
    );
    if (user?.id) { setCache(uidCache, k, user.id); return user.id; }
  } catch { /* continúa */ }

  // 2) búsqueda por mail|UPN
  try {
    const esc = safe.replace(/'/g, "''");
    const filter = `mail eq '${esc}' or userPrincipalName eq '${esc}'`;
    const resp = await graph.get<{ value?: Array<{ id?: string }> }>(
      `/users?$select=id&$top=1&$filter=${encodeURIComponent(filter)}`
    );
    const id = resp?.value?.[0]?.id ?? null;
    setCache(uidCache, k, id);
    return id;
  } catch {
    setCache(uidCache, k, null);
    return null;
  }
}

/* =========================
   1) Obtener rol desde UN grupo
   ========================= */
export async function getRoleFromGroup(graph: GraphRest, email: string, groupId: string, roleIfMember: string): Promise<RoleDecision | null> {
  const safeGroup = String(groupId).trim();
  const safeEmail = String(email).trim().toLowerCase();
  if (!safeGroup || !safeEmail) return null;

  const userId = await getUserIdByEmail(graph, safeEmail);
  if (!userId) return null;

  // cache por par userId|groupId
  const ck = `${userId}|${safeGroup}`;
  const cached = getFromCache(membCache, ck);
  if (cached !== null) {
    return cached ? { role: roleIfMember, source: "group", matchedGroupId: safeGroup } : null;
  }

  try {
    const data = await graph.post<{ value: string[] }>(
      `/users/${encodeURIComponent(userId)}/checkMemberGroups`,
      { groupIds: [safeGroup] }
    );
    const isMember = Array.isArray(data?.value) && data.value.includes(safeGroup);
    setCache(membCache, ck, isMember);
    return isMember ? { role: roleIfMember, source: "group", matchedGroupId: safeGroup } : null;
  } catch {
    setCache(membCache, ck, false);
    return null;
  }
}

/* =========================
   1b) Obtener rol desde VARIOS grupos (prioridad = orden del array)
   (Eficiente: un único checkMemberGroups)
   ========================= */
export async function getRoleFromGroups(graph: GraphRest, email: string, rules: GroupRule[]): Promise<RoleDecision | null> {
  const safeEmail = String(email).trim().toLowerCase();
  if (!safeEmail || !rules.length) return null;

  const userId = await getUserIdByEmail(graph, safeEmail);
  if (!userId) return null;

  const groupIds = rules.map(r => r.groupId);
  const sortedKey = groupIds.slice().sort().join(",");
  const cacheKey = `${userId}|${sortedKey}`;
  const cached = getFromCache(multiMembCache, cacheKey);
  if (cached !== null) {
    const matched = cached ?? [];
    const first = rules.find(r => matched.includes(r.groupId));
    return first ? { role: first.role, source: "group", matchedGroupId: first.groupId } : null;
  }

  try {
    const data = await graph.post<{ value: string[] }>(
      `/users/${encodeURIComponent(userId)}/checkMemberGroups`,
      { groupIds }
    );
    const matched = data?.value ?? [];
    setCache(multiMembCache, cacheKey, matched);

    const first = rules.find(r => matched.includes(r.groupId));
    return first ? { role: first.role, source: "group", matchedGroupId: first.groupId } : null;
  } catch {
    setCache(multiMembCache, cacheKey, null);
    return null;
  }
}

/* =========================
   2) Obtener rol desde SharePoint
   ========================= */
export async function getRoleFromSP(usuariosSvc: UsuariosSPService, email: string): Promise<RoleDecision | null> {
  const safe = String(email).trim().toLowerCase();
  if (!safe) return null;

  const resp = await usuariosSvc.getAll({
    filter: `fields/Correo eq '${safe.replace(/'/g, "''")}'`,
    top: 1,
  });

  const items = Array.isArray(resp) ? resp : resp?.items ?? [];
  const rolSP =
    items?.[0]?.fields?.Rol ??
    items?.[0]?.Rol ??
    undefined;

  if (rolSP && String(rolSP).trim()) {
    return { role: String(rolSP).trim(), source: "sp" };
  }
  return null;
}

/* =========================
   3) Resolver combinado (prioriza grupos → luego SP → default)
   ========================= */
export async function resolveUserRole({graph, usuariosSvc, email, groupRules = [], singleGroup, defaultRole = "Usuario",}: {
  graph: GraphRest;
  usuariosSvc: UsuariosSPService;
  email: string | null | undefined;
  groupRules?: GroupRule[];
  singleGroup?: { groupId: string; role: string }; // comodidad cuando es un solo grupo
  defaultRole?: string;
}): Promise<RoleDecision> {
  const safeEmail = String(email ?? "").trim().toLowerCase();
  if (!safeEmail) return { role: defaultRole, source: "default" };

  // 1) Grupos (si hay graph)
  if (graph) {
    if (singleGroup?.groupId) {
      const byOne = await getRoleFromGroup(graph, safeEmail, singleGroup.groupId, singleGroup.role);
      if (byOne) return byOne;
    } else if (groupRules.length) {
      const byMany = await getRoleFromGroups(graph, safeEmail, groupRules);
      if (byMany) return byMany;
    }
  }

  // 2) Lista SP
  try {
    const bySp = await getRoleFromSP(usuariosSvc, safeEmail);
    if (bySp) return bySp;
  } catch { /* si SP falla, sigue default */ }

  // 3) Default
  return { role: defaultRole, source: "default" };
}
