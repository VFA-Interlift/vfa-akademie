"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import PdfOverlay from "@/components/PdfOverlay";

/**
 * Link auf ein PDF, der es in der App oeffnet (Vollbild mit X zurueck) statt
 * den Nutzer in den Download zu schicken. Fuer alles, was bisher ein rohes
 * <a href="/api/...pdf"> war. Laedt erst beim Antippen.
 */
export default function PdfAnsichtLink({
  url,
  titel,
  dateiname,
  style,
  children,
}: {
  url: string;
  titel: string;
  dateiname: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [ansicht, setAnsicht] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState(false);

  async function oeffnen() {
    if (laedt) return;
    setLaedt(true);
    setFehler(false);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("leer");
      setAnsicht(window.URL.createObjectURL(blob));
    } catch {
      setFehler(true);
    } finally {
      setLaedt(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={oeffnen}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          font: "inherit",
          cursor: laedt ? "wait" : "pointer",
          opacity: laedt ? 0.6 : 1,
          ...style,
        }}
      >
        {children}
      </button>

      {fehler && (
        <span style={{ color: "#B00020", fontSize: 12, fontWeight: 700 }}>
          Konnte nicht geöffnet werden.
        </span>
      )}

      {ansicht && (
        <PdfOverlay
          url={ansicht}
          titel={titel}
          dateiname={dateiname}
          onClose={() => {
            window.URL.revokeObjectURL(ansicht);
            setAnsicht(null);
          }}
        />
      )}
    </>
  );
}
