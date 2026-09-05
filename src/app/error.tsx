"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import AppButton from "@/components/ui/AppButton";

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
  // Die Seite greift auch auf Login und Registrierung. „Problem melden“ führt
  // in die Einstellungen, die ohne Sitzung zur Anmeldung umleiten — deshalb
  // bekommen Ausgeloggte stattdessen die Adresse (Befund d01-27, 05.09.2026).
  const { status } = useSession();
  const angemeldet = status === "authenticated";

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
        <div className="etikett">Da ist etwas schiefgegangen</div>

        <h1
          style={{
            margin: "10px 0 12px",
            fontSize: "var(--t-titel)",
            fontWeight: 750,
            color: "var(--vfa-text)",
            letterSpacing: "-0.02em",
            lineHeight: "var(--lh-eng)",
          }}
        >
          Diese Seite ließ sich nicht laden
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "var(--t-basis)",
            lineHeight: "var(--lh-weit)",
            color: "var(--vfa-text-2)",
          }}
        >
          Versuch es bitte noch einmal.{" "}
          {angemeldet ? (
            <>Bleibt der Fehler, sag uns kurz Bescheid. Wir kümmern uns darum.</>
          ) : (
            <>
              Bleibt der Fehler, schreib uns kurz an{" "}
              <a
                href="mailto:info@vfa-interlift.de"
                style={{ color: "var(--vfa-gruen-text)", fontWeight: 700 }}
              >
                info@vfa-interlift.de
              </a>
              .
            </>
          )}
        </p>

        {error.digest && (
          <p
            style={{
              margin: "18px 0 0",
              fontSize: "var(--t-klein)",
              color: "var(--vfa-text-3)",
              // Monospace bleibt: eine Kennung liest sich so leichter ab.
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
          <AppButton onClick={reset}>Noch einmal versuchen</AppButton>

          {/* Der Anker #feedback setzt voraus, dass die Feedback-Karte unter
              Einstellungen die id trägt (offene Frage an die Werkstatt). */}
          {angemeldet && (
            <AppButton href="/einstellungen#feedback" variant="ghost">
              Problem melden
            </AppButton>
          )}
        </div>
      </div>
    </main>
  );
}
