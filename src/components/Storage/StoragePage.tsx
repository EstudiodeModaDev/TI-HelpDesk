import * as React from "react";
import { useGraphServices } from "../../graph/GrapServicesContext";

import LibrariesStorage from "./LibrariesStorage";
import ListsStorageEstimate from "./ListsStorageEstimate";

type Tab = "bibliotecas" | "listas";

export function StoragePage() {
  const { graph } = useGraphServices();

  const hostname = "estudiodemoda.sharepoint.com";
  const sitePath = "/sites/TransformacionDigital/IN/HD";

  const [tab, setTab] = React.useState<Tab>("bibliotecas");

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <header style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button type="button" onClick={() => setTab("bibliotecas")} style={{
            height: 34,
            padding: "0 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: tab === "bibliotecas" ? "#111827" : "#fff",
            color: tab === "bibliotecas" ? "#fff" : "#111827",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Bibliotecas
        </button>

        <button
          type="button"
          onClick={() => setTab("listas")}
          style={{
            height: 34,
            padding: "0 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: tab === "listas" ? "#111827" : "#fff",
            color: tab === "listas" ? "#fff" : "#111827",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Listas 
        </button>
      </header>

      {tab === "bibliotecas" ? (
        <LibrariesStorage graph={graph} hostname={hostname} sitePath={sitePath} />
      ) : (
        <ListsStorageEstimate graph={graph} hostname={hostname} sitePath={sitePath} sampleSize={200} />
      )}
    </section>
  );
}
