"use client";

import { useEffect } from "react";

/**
 * Letzte Auffangstelle: greift, wenn der Fehler im Wurzel-Layout selbst steckt.
 * Dann steht kein Layout mehr, deshalb bringt diese Seite html und body selbst
 * mit und verzichtet auf gemeinsame Bausteine.
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
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Die App ließ sich nicht laden
            </h1>

            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#666666" }}>
              Bitte lade die Seite neu. Bleibt der Fehler, schreib uns kurz an{" "}
              <a href="mailto:info@vfa-interlift.de" style={{ color: "#007873" }}>
                info@vfa-interlift.de
              </a>
              .
            </p>

            {error.digest && (
              <p
                style={{
                  margin: "18px 0 0",
                  fontSize: 12,
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
                minHeight: 46,
                padding: "12px 26px",
                borderRadius: 999,
                background: "#007873",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
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
