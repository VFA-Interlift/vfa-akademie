"use client";

import { useState } from "react";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AppTextarea from "@/components/ui/AppTextarea";
import StarRating from "@/components/feedback/StarRating";
import { APP_TEST_FRAGEN, PFLICHT_FRAGE_ID } from "@/lib/app-test/fragen";

type Antwort = number | string | string[];

const auswahlZeile = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  cursor: "pointer",
  padding: "4px 0",
} as const;

export default function AppTestClient({ bereitsGesendet }: { bereitsGesendet: boolean }) {
  const [answers, setAnswers] = useState<Record<string, Antwort>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function setAnswer(id: string, wert: Antwort) {
    setAnswers((prev) => ({ ...prev, [id]: wert }));
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
        setSending(false);
        return;
      }

      setDone(true);
    } catch {
      setError("Keine Verbindung. Bitte versuche es gleich noch einmal.");
      setSending(false);
    }
  }

  if (done) {
    return (
      <AnimatedSection>
        <AppCard>
          <div style={{ textAlign: "center", padding: "20px 8px" }}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>★</div>
            <h2 style={{ margin: "12px 0 6px", color: "#007873", fontSize: 24, fontWeight: 800 }}>
              Danke für deine Rückmeldung!
            </h2>
            <p style={{ margin: 0, color: "#333333", fontSize: 16, lineHeight: 1.6 }}>
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
          <p style={{ margin: 0, color: "#333333", lineHeight: 1.6 }}>
            Zehn Fragen, zwei bis drei Minuten. Pflicht ist nur die letzte —
            alles andere ist freiwillig. Es gibt keine falschen Antworten:
            was dich stört, hilft uns am meisten.
          </p>
          {bereitsGesendet && (
            <p style={{ margin: "12px 0 0", color: "#777777", fontSize: 14, lineHeight: 1.6 }}>
              Du hast den Bogen schon einmal abgeschickt. Wenn du ihn erneut
              absendest, ersetzt das deine bisherigen Antworten.
            </p>
          )}
        </AppCard>
      </AnimatedSection>

      {error && (
        <AppCard style={{ borderColor: "rgba(176,0,32,0.4)", background: "rgba(176,0,32,0.05)" }}>
          <span style={{ color: "#B00020", fontWeight: 700 }}>{error}</span>
        </AppCard>
      )}

      {APP_TEST_FRAGEN.map((frage, i) => (
        <AnimatedSection key={frage.id} delayMs={Math.min(60 + i * 30, 360)}>
          <AppCard>
            <div style={{ display: "grid", gap: 10 }}>
              <span style={{ fontSize: 15, color: "#1F1F1F", fontWeight: 600, lineHeight: 1.45 }}>
                {frage.text}
                {frage.id === PFLICHT_FRAGE_ID && <span style={{ color: "#B00020" }}> *</span>}
              </span>

              {frage.typ === "skala" && (
                <div style={{ display: "grid", gap: 6 }}>
                  <StarRating
                    value={typeof answers[frage.id] === "number" ? (answers[frage.id] as number) : 0}
                    onChange={(v) => setAnswer(frage.id, v)}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      maxWidth: 200,
                      fontSize: 12,
                      color: "#888888",
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
                      <span style={{ fontSize: 14, color: "#333333" }}>{option}</span>
                    </label>
                  );
                })}
            </div>
          </AppCard>
        </AnimatedSection>
      ))}

      <AnimatedSection>
        <button
          type="button"
          onClick={absenden}
          disabled={sending}
          style={{
            width: "100%",
            padding: "14px 20px",
            background: sending ? "#9AA0A6" : "#007873",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: 15,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            border: "none",
            borderRadius: 999,
            cursor: sending ? "default" : "pointer",
          }}
        >
          {sending ? "Wird gesendet …" : "Rückmeldung absenden"}
        </button>
      </AnimatedSection>
    </div>
  );
}
