"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AppTextarea from "@/components/ui/AppTextarea";
import Meldung from "@/components/ui/Meldung";
import StarRating from "@/components/feedback/StarRating";
import { FEEDBACK_CREDITS, FEEDBACK_TEXT_MAX, type FeedbackSection } from "@/lib/feedback/forms";

type AnswerValue = number | string | string[];

export default function FeedbackFormClient({
  enrollmentId,
  trainingTitle,
  sections,
}: {
  enrollmentId: string;
  trainingTitle: string;
  sections: FeedbackSection[];
}) {
  const router = useRouter();
  const [anonymous, setAnonymous] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [handy, setHandy] = useState(false);

  // Klebende Absendeleiste: `overflow-x: hidden` auf html/body macht das
  // Wurzelelement zum Scrollbereich, sticky hängt dann daran statt am
  // Fenster (gemessen in DashboardHero). Für diese Seite auf clip umstellen
  // und beim Verlassen zurücknehmen; am Handy liegt die Leiste über der
  // 76 px hohen unteren Menüleiste (Befund f07-5, 05.09.2026).
  useEffect(() => {
    const html = document.documentElement;
    const vorherHtml = html.style.overflowX;
    const vorherBody = document.body.style.overflowX;
    html.style.overflowX = "clip";
    document.body.style.overflowX = "clip";

    const abfrage = window.matchMedia("(max-width: 759px)");
    const setzen = () => setHandy(abfrage.matches);
    setzen();
    abfrage.addEventListener("change", setzen);

    return () => {
      html.style.overflowX = vorherHtml;
      document.body.style.overflowX = vorherBody;
      abfrage.removeEventListener("change", setzen);
    };
  }, []);

  function setAnswer(key: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  // Abgewählter Stern: Schlüssel entfernen statt 0 zu speichern — der Server
  // wies 0 als ungültige Bewertung zurück (Befund f03-1, 05.09.2026).
  function setRating(key: string, value: number) {
    setAnswers((prev) => {
      if (value < 1) {
        const rest = { ...prev };
        delete rest[key];
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }

  function toggleMulti(key: string, option: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [key]: next };
    });
  }

  function fehlerZeigen(text: string) {
    setError(text);
    // Die Fehlerkarte steht oben, der Knopf ganz unten — ohne Scroll blieb
    // die Meldung am Handy unsichtbar (Befund f03-2, 05.09.2026).
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    setError(null);

    const overall = answers["allgemeineZufriedenheit"];
    if (typeof overall !== "number" || overall < 1) {
      fehlerZeigen("Bitte bewerte mindestens deine allgemeine Zufriedenheit (Pflichtfeld).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, anonymous, answers }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data.error === "ALREADY_SUBMITTED") {
          fehlerZeigen("Für diese Schulung wurde bereits Feedback abgegeben.");
        } else if (data.error === "INVALID_ANSWERS") {
          fehlerZeigen("Einige Angaben sind ungültig. Bitte prüfe deine Eingaben.");
        } else {
          fehlerZeigen("Das Feedback konnte nicht gespeichert werden. Bitte später erneut versuchen.");
        }
        setSubmitting(false);
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/meine-zertifikate"), 1800);
    } catch {
      fehlerZeigen("Netzwerkfehler. Bitte später erneut versuchen.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AnimatedSection>
        <AppCard>
          <div style={{ textAlign: "center", padding: "20px 8px" }}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>★</div>
            <h2 style={{ margin: "12px 0 6px", color: "var(--vfa-gruen-text)", fontSize: "var(--t-gross)", fontWeight: 700, lineHeight: "var(--lh-eng)" }}>
              Vielen Dank für dein Feedback!
            </h2>
            <p style={{ margin: 0, color: "var(--vfa-text)", fontSize: "var(--t-basis)" }}>
              Dir wurden <strong>+{FEEDBACK_CREDITS} Credits</strong> gutgeschrieben.
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
          <p style={{ margin: "0 0 14px", color: "var(--vfa-text)", lineHeight: "var(--lh-weit)" }}>
            Deine Rückmeldung zur Schulung <strong>{trainingTitle}</strong>. Bewerte mit 1–5
            Sternen. Nur die allgemeine Zufriedenheit ist Pflicht – alles andere ist freiwillig.
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "#007873" }}
            />
            <span style={{ fontSize: "var(--t-basis)", color: "var(--vfa-text)", fontWeight: 600 }}>
              Anonym ausfüllen (dein Name erscheint nicht in der Auswertung)
            </span>
          </label>
        </AppCard>
      </AnimatedSection>

      {error && <Meldung art="fehler">{error}</Meldung>}

      {sections.map((section, sIndex) => (
        <AnimatedSection key={section.title} delayMs={Math.min(80 + sIndex * 40, 360)}>
          <AppCard>
            <h2 style={{ margin: "0 0 14px", color: "var(--vfa-gruen-text)", fontSize: "var(--t-gross)", fontWeight: 700, lineHeight: "var(--lh-eng)" }}>
              {section.title}
            </h2>

            <div style={{ display: "grid", gap: 18 }}>
              {section.questions.map((q) => (
                <div key={q.key} style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontSize: "var(--t-basis)", color: "var(--vfa-text)", fontWeight: 600, lineHeight: 1.45 }}>
                    {q.label}
                    {q.required && <span style={{ color: "var(--vfa-rot-text)" }}> *</span>}
                  </span>

                  {q.type === "rating" && (
                    <StarRating
                      value={typeof answers[q.key] === "number" ? (answers[q.key] as number) : 0}
                      onChange={(v) => setRating(q.key, v)}
                    />
                  )}

                  {q.type === "text" && (
                    <AppTextarea
                      label=""
                      value={typeof answers[q.key] === "string" ? (answers[q.key] as string) : ""}
                      onChange={(v) => setAnswer(q.key, v)}
                      rows={3}
                      maxLength={FEEDBACK_TEXT_MAX}
                    />
                  )}

                  {q.type === "single" &&
                    q.options?.map((option) => (
                      <label key={option} style={radioRowStyle}>
                        <input
                          type="radio"
                          name={q.key}
                          checked={answers[q.key] === option}
                          onChange={() => setAnswer(q.key, option)}
                          style={{ width: 17, height: 17, accentColor: "#007873" }}
                        />
                        <span style={{ fontSize: "var(--t-basis)", color: "var(--vfa-text)" }}>{option}</span>
                      </label>
                    ))}

                  {q.type === "multi" &&
                    q.options?.map((option) => {
                      const list = Array.isArray(answers[q.key]) ? (answers[q.key] as string[]) : [];
                      return (
                        <label key={option} style={radioRowStyle}>
                          <input
                            type="checkbox"
                            checked={list.includes(option)}
                            onChange={() => toggleMulti(q.key, option)}
                            style={{ width: 17, height: 17, accentColor: "#007873", marginTop: 2 }}
                          />
                          <span style={{ fontSize: "var(--t-basis)", color: "var(--vfa-text)" }}>{option}</span>
                        </label>
                      );
                    })}
                </div>
              ))}
            </div>
          </AppCard>
        </AnimatedSection>
      ))}

      <div
        style={{
          position: "sticky",
          bottom: handy ? "calc(76px + env(safe-area-inset-bottom, 0px))" : 0,
          padding: "12px 0",
          // Auslauf aus dem Seitengrund-Token statt festem Hell, sonst steht im
          // Dunkelmodus ein heller Balken über dem Knopf (20.08.2026)
          background: "linear-gradient(to top, var(--vfa-light) 70%, transparent)",
        }}
      >
        <AppButton fullWidth onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Wird gesendet …" : `Feedback absenden (+${FEEDBACK_CREDITS} Credits)`}
        </AppButton>
      </div>
    </div>
  );
}

const radioRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  cursor: "pointer",
  padding: "2px 0",
};
