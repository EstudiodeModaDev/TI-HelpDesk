import {
  listSharePointUsers,
  updateSharePointUserFields,
} from "./graph.ts";
import type {
  GraphListItemFields,
  ProcessEmailsConfig,
  ResolverAssignment,
  SharePointTechnician,
} from "./types.ts";

function getStringField(
  fields: GraphListItemFields | undefined,
  keys: string[],
): string | null {
  if (!fields) {
    return null;
  }

  for (const key of keys) {
    const value = fields[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getNumberField(
  fields: GraphListItemFields | undefined,
  keys: string[],
): number {
  if (!fields) {
    return 0;
  }

  for (const key of keys) {
    const value = fields[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

// ID (lista Usuarios de SharePoint) del resolutor al que se asignan todos los tickets por correo.
export const FIXED_RESOLVER_ID = "121";

function toTechnician(item: { id: string; fields?: GraphListItemFields }): SharePointTechnician {
  const role = getStringField(item.fields, ["Rol"]);
  const availability = getStringField(item.fields, ["Disponible"]);
  const name = getStringField(item.fields, ["Title", "Nombre", "NombreCompleto"]) ??
    `Tecnico ${item.id}`;
  const email = getStringField(item.fields, [
    "Correo",
    "Email",
    "EMail",
    "CorreoElectronico",
  ]);
  const caseCount = getNumberField(item.fields, ["Numerodecasos"]);

  return {
    id: item.id,
    name,
    email,
    role: role ?? "",
    availability: availability ?? "",
    caseCount,
  };
}

// Devuelve el resolutor fijo sin importar su rol ni disponibilidad.
export async function getFixedTechnician(
  accessToken: string,
  config: ProcessEmailsConfig,
): Promise<SharePointTechnician | null> {
  const items = await listSharePointUsers(accessToken, config);
  const item = items.find((i) => String(i.id) === FIXED_RESOLVER_ID);
  return item ? toTechnician(item) : null;
}

export async function listAvailableTechnicians(
  accessToken: string,
  config: ProcessEmailsConfig,
): Promise<SharePointTechnician[]> {
  const items = await listSharePointUsers(accessToken, config);

  return items
    .map(toTechnician)
    .filter((technician) =>
      technician.role === "Tecnico" &&
      technician.availability === "Disponible"
    );
}

export function selectTechnicianWithLowestCases(
  technicians: SharePointTechnician[],
): SharePointTechnician | null {
  if (technicians.length === 0) {
    return null;
  }

  return [...technicians].sort((left, right) => {
    if (left.caseCount !== right.caseCount) {
      return left.caseCount - right.caseCount;
    }

    return left.name.localeCompare(right.name, "es", { sensitivity: "base" });
  })[0];
}


export async function incrementTechnicianCaseCount(
  accessToken: string,
  config: ProcessEmailsConfig,
  technician: SharePointTechnician,
): Promise<void> {
  await updateSharePointUserFields(accessToken, config, technician.id, {
    Numerodecasos: technician.caseCount + 1,
  });
}

export function buildResolverAssignment(
  technician: SharePointTechnician | null,
): ResolverAssignment | null {
  if (!technician) {
    return null;
  }

  return {
    nombre_resolutor: technician.name,
    correo_resolutor: technician.email,
    id_resolutor_sharepoint: technician.id,
  };
}
