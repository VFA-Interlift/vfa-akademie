"use client";

import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AppTextarea from "@/components/ui/AppTextarea";
import Meldung from "@/components/ui/Meldung";
import StarRating from "@/components/feedback/StarRating";
import { APP_TEST_FRAGEN, APP_TEST_TEXT_MAX, PFLICHT_FRAGE_ID } from "@/lib/app-test/fragen";

type Antwort = number | string | string[];

const auswahlZeile = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  cursor: "pointer",
  padding: "4px 0",
} as const;

export default function AppTestClient({
  bereitsGesendet,
  gespeicherteAntworten,
}: {
  bereitsGesendet: boolean;
  gespeicherteAntworten: Record<string, Antwort> | null;
}) {
  // Vorbefuellt mit den gespeicherten Antworten: die API ersetzt beim erneuten
  // Absenden den kompletten Datensatz — ein leerer Bogen loeschte beim
  // "Ergaenzen" alle Erstantworten (Befund 20.08.2026).
  const [answers, setAnswers] = useState<Record<string, Antwort>>(gespeicherteAntworten ?? {});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function setAnswer(id: string, wert: Antwort) {
    setAnswers((prev) => ({ ...prev, [id]: wert }));
  }

  // Abgewählter Stern: Schlüssel entfernen statt 0 zu speichern — wie im
  // Schulungsfeedback (Befund f03-1, 05.09.2026). Die API verwirft 0 ohnehin.
  function setSkala(id: string, wert: number) {
    setAnswers((prev) => {
      if (wert < 1) {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      }
      return { ...prev, [id]: wert };
    });
  }

  function toggleMulti(id: string, option: string) {
    setAnswers((prev) => {
      const aktuell = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      const neu = aktuell.includes(option)
        ? aktuell.filter((o) => o !== option)
        : [...aktuell, option];
      return { ...prev, [id]: neu };
    });
  }

  async function absenden() {
    setError(null);

    const gesamt = answers[PFLICHT_FRAGE_ID];
    if (typeof gesamt !== "number" || gesamt < 1) {
      setError("Bitte bewerte zumindest deine Zufriedenheit insgesamt — das ist die einzige Pflichtangabe.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/app-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        setError("Das hat nicht geklappt. Bitte versuche es gleich noch einmal.");
        // Die Fehlerkarte steht ueber den Fragekarten, der Knopf ganz unten —
        // ohne Scroll blieb die Meldung auf dem Handy unsichtbar und der Bogen
        // wirkte abgeschickt (Befund 20.08.2026).
        window.scrollTo({ top: 0, behavior: "smooth" });
        setSending(false);
        return;
      }

      setDone(true);
    } catch {
      setError("Keine Verbindung. Bitte versuche es gleich noch einmal.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSending(false);
    }
  }

  if (done) {
    return (
      <AnimatedSection>
        <AppCard>
          <div style={{ textAlign: "center", padding: "20px 8px" }}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>★</div>
            <h2 style={{ margin: "12px 0 6px", color: "var(--vfa-gruen-text)", fontSize: "var(--t-gross)", fontWeight: 700, lineHeight: "var(--lh-eng)" }}>
              Danke für deine Rückmeldung!
            </h2>
            <p style={{ margin: 0, color: "var(--vfa-text)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
              Deine Antworten sind angekommen. Wenn dir später noch etwas auffällt,
              kannst du den Bogen einfach noch einmal ausfüllen.
            </p>
          </div>
        </AppCard>
      </AnimatedSection>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <AnimatedSection>
        <AppCard>
          <p style={{ margin: 0, color: "var(--vfa-text)", lineHeight: "var(--lh-weit)" }}>
            Zehn Fragen, zwei bis drei Minuten. Pflicht ist nur die letzte —
            alles andere ist freiwillig. Es gibt keine falschen Antworten:
            was dich stört, hilft uns am meisten.
          </p>
          {bereitsGesendet && (
            <p style={{ margin: "12px 0 0", color: "var(--vfa-text-3)", fontSize: "var(--t-klein)", lineHeight: "var(--lh-weit)" }}>
              Du hast den Bogen schon einmal abgeschickt — deine bisherigen
              Antworten sind unten bereits eingetragen. Ändere oder ergänze
              einfach, was dir aufgefallen ist, und sende erneut.
            </p>
          )}
        </AppCard>
      </AnimatedSection>

      {error && <Meldung art="fehler">{error}</Meldung>}

      {APP_TEST_FRAGEN.map((frage, i) => (
        <AnimatedSection key={frage.id} delayMs={Math.min(60 + i * 30, 360)}>
          <AppCard>
            <div style={{ display: "grid", gap: 10 }}>
              <span style={{ fontSize: "var(--t-basis)", color: "var(--vfa-text)", fontWeight: 600, lineHeight: 1.45 }}>
                {frage.text}
                {frage.id === PFLICHT_FRAGE_ID && <span style={{ color: "var(--vfa-rot-text)" }}> *</span>}
              </span>

              {frage.typ === "skala" && (
                <div style={{ display: "grid", gap: 6 }}>
                  <StarRating
                    value={typeof answers[frage.id] === "number" ? (answers[frage.id] as number) : 0}
                    onChange={(v) => setSkala(frage.id, v)}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      maxWidth: 200,
                      fontSize: "var(--t-label)",
                      color: "var(--vfa-text-3)",
                    }}
                  >
                    <span>{frage.links}</span>
                    <span>{frage.rechts}</span>
                  </div>
                </div>
              )}

              {frage.typ === "text" && (
                <AppTextarea
                  label=""
                  value={typeof answers[frage.id] === "string" ? (answers[frage.id] as string) : ""}
                  onChange={(v) => setAnswer(frage.id, v)}
                  rows={3}
                  placeholder={frage.platzhalter}
                  maxLength={APP_TEST_TEXT_MAX}
                />
              )}

              {frage.typ === "auswahl" &&
                frage.optionen.map((option) => {
                  const liste = Array.isArray(answers[frage.id])
                    ? (answers[frage.id] as string[])
                    : [];
                  return (
                    <label key={option} style={auswahlZeile}>
                      <input
                        type={frage.mehrfach ? "checkbox" : "radio"}
                        name={frage.id}
                        checked={frage.mehrfach ? liste.includes(option) : answers[frage.id] === option}
                        onChange={() =>
                          frage.mehrfach ? toggleMulti(frage.id, option) : setAnswer(frage.id, option)
                        }
                        style={{ width: 17, height: 17, accentColor: "#007873", marginTop: 2 }}
                      />
                      <span style={{ fontSize: "var(--t-basis)", color: "var(--vfa-text)" }}>{option}</span>
                    </label>
                  );
                })}
            </div>
          </AppCard>
        </AnimatedSection>
      ))}

      <AnimatedSection>
        <AppButton fullWidth onClick={absenden} disabled={sending}>
          {sending ? "Wird gesendet …" : "Rückmeldung absenden"}
        </AppButton>
      </AnimatedSection>
    </div>
  );
}
