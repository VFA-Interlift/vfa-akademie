"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "vfa_tester_welcome_geschlossen";

/**
 * Begruessung fuer die Testrunde, ganz oben im Dashboard. Wird nur denen
 * gezeigt, die in TESTER_EMAILS stehen (die Entscheidung faellt serverseitig
 * im Dashboard, diese Komponente wird sonst gar nicht erst gerendert).
 *
 * Einmal geschlossen, bleibt sie weg: der Vermerk liegt in localStorage, also
 * dauerhaft auf dem Geraet. Der Link zum Fragebogen bleibt darunter als
 * schmale Zeile stehen, solange noch keine Rueckmeldung da ist.
 */
export default function TesterWelcome({
  vorname,
  feedbackGesendet,
}: {
  vorname: string | null;
  feedbackGesendet: boolean;
}) {
  // null = noch nicht entschieden (localStorage erst im Effekt lesbar). Mit
  // false als Startwert blitzte beim ersten Laden kurz der "Rueckmeldung
  // fehlt"-Hinweis auf, bevor die Begruessung ihn ersetzte (Befund 20.08.2026).
  const [begruessungOffen, setBegruessungOffen] = useState<boolean | null>(null);

  useEffect(() => {
    setBegruessungOffen(window.localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  function schliessen() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setBegruessungOffen(false);
  }

  const anrede = vorname ? `Hallo ${vorname},` : "Hallo,";

  // Vor der Entscheidung weder Begruessung noch Hinweis zeigen — sonst flackert
  // es beim Start.
  if (begruessungOffen === null) return null;

  if (begruessungOffen) {
    return (
      <div
        style={{
          position: "relative",
          marginBottom: 14,
          padding: "18px 44px 18px 18px",
          background: "rgba(0,120,115,0.06)",
          border: "1px solid rgba(0,120,115,0.28)",
          borderRadius: 14,
        }}
      >
        <button
          type="button"
          onClick={schliessen}
          aria-label="Begrüßung schließen"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            border: "none",
            background: "transparent",
            color: "#007873",
            fontSize: 20,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#007873" }}>
          {anrede} schön, dass du dabei bist!
        </h2>

        <p style={{ margin: "0 0 10px", fontSize: 15, lineHeight: 1.6, color: "var(--vfa-text-2)" }}>
          Du gehörst zu den Ersten, die die VFA-Akademie App ausprobieren. Sie bündelt
          deine Schulungen, Zertifikate und Credits an einer Stelle.
        </p>

        <p style={{ margin: "0 0 10px", fontSize: 15, lineHeight: 1.6, color: "var(--vfa-text-2)" }}>
          Am besten legst du sie gleich auf den Startbildschirm deines Handys.
          Schau dich danach in Ruhe um: Startseite, deine Schulungen und
          Zertifikate, der Kurskalender, der Kompetenzpass und deine Credits.
        </p>

        <p style={{ margin: "0 0 10px", fontSize: 15, lineHeight: 1.6, color: "var(--vfa-text-2)" }}>
          Wenn dir etwas fehlt, komisch vorkommt oder schlicht nicht funktioniert,
          freuen wir uns über deine Rückmeldung!
        </p>

        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--vfa-text-2)" }}>
          {feedbackGesendet ? "Ist dir seitdem noch etwas aufgefallen? Unter " : "Probier die App erst in Ruhe aus. Danach findest du unter "}
          <Link href="/einstellungen" style={{ color: "#007873", fontWeight: 700 }}>
            Einstellungen
          </Link>
          {feedbackGesendet
            ? " kannst du deine Rückmeldung jederzeit ergänzen."
            : " den Fragebogen zur Testrunde — zehn Fragen, zwei bis drei Minuten. Lass dir damit ruhig ein paar Tage Zeit."}
        </p>
      </div>
    );
  }

  // Begruessung weggeklickt: der Hinweis auf den Bogen bleibt stehen, solange
  // noch nichts eingegangen ist - er zeigt auf die Einstellungen, damit der
  // Weg immer derselbe ist.
  if (feedbackGesendet) return null;

  return (
    <div
      style={{
        marginBottom: 14,
        padding: "10px 14px",
        background: "rgba(0,120,115,0.06)",
        border: "1px solid rgba(0,120,115,0.22)",
        borderRadius: 12,
        fontSize: 14,
        color: "var(--vfa-text-2)",
      }}
    >
      Deine Rückmeldung zur Testrunde fehlt noch — der Fragebogen liegt unter{" "}
      <Link href="/einstellungen" style={{ color: "#007873", fontWeight: 700 }}>
        Einstellungen
      </Link>
      .
    </div>
  );
}
