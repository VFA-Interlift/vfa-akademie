"use client";

import { useState } from "react";
import MeineZertifikateClient from "./MeineZertifikateClient";
import EigeneNachweise from "./EigeneNachweise";
import type { SerializableDocument } from "@/lib/documents/service";

const TEAL = "#007873";

// Muss zum Prop-Typ von MeineZertifikateClient passen.
type SerializableCertificate = React.ComponentProps<typeof MeineZertifikateClient>["certificates"][number];

type Tab = "vfa" | "eigene";

export default function ZertifikateTabs({
  certificates,
  documents,
}: {
  certificates: SerializableCertificate[];
  documents: SerializableDocument[];
}) {
  const [tab, setTab] = useState<Tab>("vfa");

  return (
    <div>
      <div
        role="tablist"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          background: "#EFEFEC",
          border: "1px solid #E6E6E6",
          borderRadius: 12,
          padding: 5,
          marginBottom: 20,
        }}
      >
        <TabButton active={tab === "vfa"} onClick={() => setTab("vfa")} label="VFA-Zertifikate" count={certificates.length} />
        <TabButton active={tab === "eigene"} onClick={() => setTab("eigene")} label="Meine Nachweise" count={documents.length} />
      </div>

      {tab === "vfa" ? (
        <MeineZertifikateClient certificates={certificates} />
      ) : (
        <EigeneNachweise initialDocuments={documents} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        minHeight: 42,
        border: "none",
        borderRadius: 8,
        background: active ? TEAL : "transparent",
        color: active ? "#FFFFFF" : "#555555",
        fontWeight: 800,
        fontSize: 13.5,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        transition: "background 160ms ease, color 160ms ease",
      }}
    >
      <span style={{ whiteSpace: "nowrap" }}>{label}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          minWidth: 20,
          padding: "1px 6px",
          borderRadius: 999,
          background: active ? "rgba(255,255,255,0.22)" : "rgba(0,120,115,0.10)",
          color: active ? "#FFFFFF" : TEAL,
        }}
      >
        {count}
      </span>
    </button>
  );
}
