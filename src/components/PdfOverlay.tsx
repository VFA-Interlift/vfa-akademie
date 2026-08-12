"use client";

import { useEffect } from "react";

/**
 * Vollbild-Ansicht fuer PDFs innerhalb der App. Tobis Vorgabe (12.08.2026):
 * Alle PDFs sollen mit einem X zurueck auf die App gehen, statt den Nutzer in
 * den Download bzw. einen fremden Viewer zu werfen - die App ist eine reine
 * Handy-App, dort gibt es sonst keinen Weg zurueck.
 *
 * Angezeigt wird eine Blob-URL, die der Aufrufer haelt (und nach dem
 * Schliessen wieder freigibt). Der Download bleibt als Knopf in der Kopfzeile
 * erhalten, wer die Datei behalten will, bekommt sie weiterhin.
 */
export default function PdfOverlay({
  url,
  titel,
  dateiname,
  onClose,
}: {
  url: string;
  titel: string;
  dateiname: string;
  onClose: () => void;
}) {
  // Solange die Ansicht offen ist, scrollt die Seite dahinter nicht mit.
  useEffect(() => {
    const vorher = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = vorher;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        background: "#1F1F1F",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          paddingTop: "max(10px, env(safe-area-inset-top))",
          background: "#007873",
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: 14,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {titel}
        </span>

        <a
          href={url}
          download={dateiname}
          style={{
            flexShrink: 0,
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.65)",
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Herunterladen
        </a>

        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          style={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,255,255,0.16)",
            color: "#FFFFFF",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      <iframe
        src={`${url}#toolbar=0&navpanes=0`}
        title={titel}
        style={{ flex: 1, width: "100%", border: "none", background: "#3A3A3A" }}
      />
    </div>
  );
}
