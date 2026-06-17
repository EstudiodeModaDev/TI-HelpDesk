import * as React from "react";
import { useAuth } from "../auth/authContext";
import { GraphRest } from "../graph/GraphRest";
import type { TicketsRepository } from "./TicketsRepository/TicketRepository";
import { SupabaseTicketRepository } from "./TicketsRepository/TicketsFromSupabase";
import type { UsuariosSPRepository } from "./UsuariosRepository/UsuariosSPRepository";
import { UsuariosSPFromSharepoint } from "./UsuariosRepository/UsuariosFromSharepoint";
import type { AttachmentRepository } from "./AttachmentsRepostory/AttachmentRepository";
import { AttachmentFromSupabase } from "./AttachmentsRepostory/AttachmentFromSupabase";
import type { LogRepository } from "./LogRepository/LogRespository";
import { LogFromSupabase } from "./LogRepository/LogFromSupabase";

type RepositorySource = "supabase" | "sharepoint";

export type AppRepositories = {
  tickets: TicketsRepository | null;
  usuarios: UsuariosSPRepository | null;
  attachments: AttachmentRepository | null
  logs: LogRepository | null
};

type RepositoriesProviderProps = {
  children: React.ReactNode;
  sources?: Partial<{
    tickets: RepositorySource;
    usuarios: RepositorySource;
    attachments: RepositorySource
    logs: RepositorySource
  }>;
};

const RepositoriesContext = React.createContext<AppRepositories | null>(null);

export const RepositoriesProvider: React.FC<RepositoriesProviderProps> = ({
  children,
  sources,
}) => {
  const { getToken } = useAuth();

  const graph = React.useMemo(() => new GraphRest(getToken), [getToken]);

  const repositories = React.useMemo<AppRepositories>(() => {
    const attachmentsSource = sources?.attachments ?? "supabase"
    const ticketsSource = sources?.tickets ?? "supabase";
    const usuariosSource = sources?.usuarios ?? "sharepoint";
    const logsSource = sources?.logs ?? "supabase"

    return {
      tickets: ticketsSource === "supabase" ? new SupabaseTicketRepository() : null,
      usuarios: usuariosSource === "sharepoint" ? new UsuariosSPFromSharepoint(graph) : null,
      attachments: attachmentsSource === "supabase" ? new AttachmentFromSupabase() : null,
      logs: logsSource === "supabase" ? new LogFromSupabase() : null
    };
  }, [graph, sources?.tickets, sources?.usuarios]);

  return (
    <RepositoriesContext.Provider value={repositories}>
      {children}
    </RepositoriesContext.Provider>
  );
};

export function useRepositories(): AppRepositories {
  const ctx = React.useContext(RepositoriesContext);

  if (!ctx) {
    throw new Error("useRepositories must be used within <RepositoriesProvider>");
  }

  return ctx;
}