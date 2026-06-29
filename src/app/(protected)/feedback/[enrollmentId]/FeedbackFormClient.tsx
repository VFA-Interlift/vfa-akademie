"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AppTextarea from "@/components/ui/AppTextarea";
import StarRating from "@/components/feedback/StarRating";
import { FEEDBACK_CREDITS, type FeedbackSection } from "@/lib/feedback/forms";

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

  function setAnswer(key: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
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

  async function handleSubmit() {
    setError(null);

    const overall = answers["allgemeineZufriedenheit"];
    if (typeof overall !== "number" || overall < 1) {
      setError("Bitte bewerte mindestens deine allgemeine Zufriedenheit (Pflichtfeld).");
      window.scrollTo({ top: 0, behavior: "smooth" });
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
          setError("Für diese Schulung wurde bereits Feedback abgegeben.");
        } else if (data.error === "INVALID_ANSWERS") {
          setError("Einige Angaben sind ungültig. Bitte prüfe deine Eingaben.");
        } else {
          setError("Das Feedback konnte nicht gespeichert werden. Bitte später erneut versuchen.");
        }
        setSubmitting(false);
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/meine-zertifikate"), 1800);
    } catch {
      setError("Netzwerkfehler. Bitte später erneut versuchen.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AnimatedSection>
        <AppCard>
          <div style={{ textAlign: "center", padding: "20px 8px" }}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>★</div>
            <h2 style={{ margin: "12px 0 6px", color: "#007873", fontSize: 24, fontWeight: 800 }}>
              Vielen Dank für dein Feedback!
            </h2>
            <p style={{ margin: 0, color: "#333333", fontSize: 16 }}>
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
          <p style={{ margin: "0 0 14px", color: "#333333", lineHeight: 1.6 }}>
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
            <span style={{ fontSize: 15, color: "#1F1F1F", fontWeight: 600 }}>
              Anonym ausfüllen (dein Name erscheint nicht in der Auswertung)
            </span>
          </label>
        </AppCard>
      </AnimatedSection>

      {error && (
        <AppCard style={{ borderColor: "rgba(176,0,32,0.4)", background: "rgba(176,0,32,0.05)" }}>
          <span style={{ color: "#B00020", fontWeight: 700 }}>{error}</span>
        </AppCard>
      )}

      {sections.map((section, sIndex) => (
        <AnimatedSection key={section.title} delayMs={Math.min(80 + sIndex * 40, 360)}>
          <AppCard>
            <h2 style={{ margin: "0 0 14px", color: "#007873", fontSize: 18, fontWeight: 800 }}>
              {section.title}
            </h2>

            <div style={{ display: "grid", gap: 18 }}>
              {section.questions.map((q) => (
                <div key={q.key} style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontSize: 15, color: "#1F1F1F", fontWeight: 600, lineHeight: 1.45 }}>
                    {q.label}
                    {q.required && <span style={{ color: "#B00020" }}> *</span>}
                  </span>

                  {q.type === "rating" && (
                    <StarRating
                      value={typeof answers[q.key] === "number" ? (answers[q.key] as number) : 0}
                      onChange={(v) => setAnswer(q.key, v)}
                    />
                  )}

                  {q.type === "text" && (
                    <AppTextarea
                      label=""
                      value={typeof answers[q.key] === "string" ? (answers[q.key] as string) : ""}
                      onChange={(v) => setAnswer(q.key, v)}
                      rows={3}
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
                        <span style={{ fontSize: 14, color: "#333333" }}>{option}</span>
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
                          <span style={{ fontSize: 14, color: "#333333" }}>{option}</span>
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
          bottom: 0,
          padding: "12px 0",
          background: "linear-gradient(to top, #F7F7F4 70%, rgba(247,247,244,0))",
        }}
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="vfa-btn"
          style={{
            width: "100%",
            minHeight: 50,
            borderRadius: 999,
            border: "1px solid #007873",
            background: "#007873",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Wird gesendet…" : `Feedback absenden (+${FEEDBACK_CREDITS} Credits)`}
        </button>
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
