"use client";

import { useEffect } from "react";

/**
 * Letzte Auffangstelle: greift, wenn der Fehler im Wurzel-Layout selbst steckt.
 * Dann steht kein Layout mehr, deshalb bringt diese Seite html und body selbst
 * mit und verzichtet auf gemeinsame Bausteine.
 *
 * Bewusste Abweichung vom Kanon (05.09.2026): Ohne Wurzel-Layout ist auch
 * globals.css nicht geladen — Token wie var(--vfa-text) und var(--t-titel)
 * gibt es hier nicht, AppButton lässt sich nicht importieren. Die Werte sind
 * deshalb fest, aber in den Maßen der Staffel (Titel 22/750, Text 15,
 * Knopf 42/14 in Versalien wie AppButton).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("APP_GLOBAL_ERROR", error);
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, Helvetica, sans-serif",
          background: "#F7F7F4",
          color: "#1F1F1F",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
          }}
        >
          <div style={{ maxWidth: 460, textAlign: "center" }}>
            <div style={{ height: 5, background: "#FFC100", marginBottom: 28 }} />

            <h1
              style={{
                margin: "0 0 12px",
                fontSize: 22,
                fontWeight: 750,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Die App ließ sich nicht laden
            </h1>

            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "#666666" }}>
              Bitte lade die Seite neu. Bleibt der Fehler, schreib uns kurz an{" "}
              <a href="mailto:info@vfa-interlift.de" style={{ color: "#007873", fontWeight: 700 }}>
                info@vfa-interlift.de
              </a>
              .
            </p>

            {error.digest && (
              <p
                style={{
                  margin: "18px 0 0",
                  fontSize: 13,
                  color: "#999999",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                Fehlernummer: {error.digest}
              </p>
            )}

            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 28,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 42,
                padding: "10px 22px",
                borderRadius: 999,
                background: "#007873",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                border: "1px solid #007873",
                cursor: "pointer",
              }}
            >
              Noch einmal versuchen
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
