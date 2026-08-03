"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Auffangseite für Fehler in Server- und Client-Komponenten. Ohne sie zeigt
 * Next.js die englische Standardmeldung („Application error: a server-side
 * exception has occurred") — im Testbetrieb der falsche erste Eindruck, und
 * niemand weiß, wohin er es melden soll.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("APP_ERROR", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#FFC100",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Da ist etwas schiefgegangen
        </div>

        <h1
          style={{
            margin: "10px 0 12px",
            fontSize: "clamp(26px, 6vw, 34px)",
            fontWeight: 800,
            color: "#1F1F1F",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          Diese Seite ließ sich nicht laden
        </h1>

        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#666666" }}>
          Versuch es bitte noch einmal. Bleibt der Fehler, sag uns kurz Bescheid.
          Wir kümmern uns darum.
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

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 28,
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
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

          <Link
            href="/einstellungen"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 46,
              padding: "12px 22px",
              borderRadius: 999,
              background: "transparent",
              color: "#444444",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "none",
              border: "1px solid #DEDEDE",
            }}
          >
            Problem melden
          </Link>
        </div>
      </div>
    </main>
  );
}
