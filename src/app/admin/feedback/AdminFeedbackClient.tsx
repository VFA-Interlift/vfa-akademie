"use client";

import { useState } from "react";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import type { AdminQuestionStat } from "@/lib/feedback/evaluation";

type Submission = {
  id: string;
  createdAt: string;
  anonymous: boolean;
  participantName: string | null;
  overallRating: number | null;
};

type TrainingEval = {
  trainingId: string;
  trainingTitle: string;
  trainingCode: string | null;
  formType: "PUBLIC" | "INHOUSE";
  responseCount: number;
  overallAverage: number | null;
  questions: AdminQuestionStat[];
  submissions: Submission[];
};

export default function AdminFeedbackClient({ trainings }: { trainings: TrainingEval[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (trainings.length === 0) {
    return (
      <AppCard>
        <p style={{ margin: 0, color: "#333333" }}>Es liegt noch kein Feedback vor.</p>
      </AppCard>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <AnimatedSection>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
          <a href="/api/admin/feedback/export" style={exportBtnStyle} download>
            ⬇ Alles als Excel
          </a>
        </div>
      </AnimatedSection>

      {trainings.map((training, index) => {
        const isOpen = openId === training.trainingId;
        const title = training.trainingCode?.trim() || training.trainingTitle;

        return (
          <AnimatedSection key={training.trainingId} delayMs={Math.min(60 + index * 40, 320)}>
            <AppCard style={{ padding: 0, overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : training.trainingId)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  padding: "16px 20px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#1F1F1F" }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#888888", marginTop: 3 }}>
                    {training.responseCount} {training.responseCount === 1 ? "Antwort" : "Antworten"}
                    {" · "}
                    {training.formType === "INHOUSE" ? "Inhouse" : "Öffentlich"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#FFB000", lineHeight: 1 }}>
                      {training.overallAverage != null ? training.overallAverage.toFixed(1) : "–"}
                    </div>
                    <div style={{ fontSize: 11, color: "#999999", fontWeight: 700 }}>Ø Gesamt</div>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#007873" }}>{isOpen ? "−" : "+"}</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid #E6E6E6", padding: "16px 20px 18px", background: "#FFFFFF" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                    <a
                      href={`/api/admin/feedback/export?trainingId=${training.trainingId}`}
                      style={exportBtnStyle}
                      download
                    >
                      ⬇ Diese Schulung als Excel
                    </a>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {training.questions.map((q) => (
                      <QuestionStatRow key={q.key} stat={q} />
                    ))}
                  </div>
                </div>
              )}
            </AppCard>
          </AnimatedSection>
        );
      })}
    </div>
  );
}

function QuestionStatRow({ stat }: { stat: AdminQuestionStat }) {
  return (
    <div style={{ paddingBottom: 10, borderBottom: "1px solid #F0F0F0" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1F1F1F", marginBottom: 4 }}>{stat.label}</div>

      {stat.type === "rating" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#FFB000" }}>
            {stat.average != null ? stat.average.toFixed(1) : "–"}
          </span>
          <span style={{ fontSize: 12, color: "#999999" }}>
            {stat.ratingCount} {stat.ratingCount === 1 ? "Bewertung" : "Bewertungen"}
          </span>
        </div>
      )}

      {(stat.type === "single" || stat.type === "multi") && (
        <div style={{ display: "grid", gap: 3 }}>
          {stat.optionCounts
            .filter((o) => o.count > 0)
            .map((o) => (
              <div key={o.option} style={{ fontSize: 13, color: "#444444" }}>
                <strong>{o.count}×</strong> {o.option}
              </div>
            ))}
          {stat.optionCounts.every((o) => o.count === 0) && (
            <span style={{ fontSize: 13, color: "#aaaaaa" }}>keine Auswahl</span>
          )}
        </div>
      )}

      {stat.type === "text" && (
        <div style={{ display: "grid", gap: 4 }}>
          {stat.textAnswers.length === 0 ? (
            <span style={{ fontSize: 13, color: "#aaaaaa" }}>keine Angaben</span>
          ) : (
            stat.textAnswers.map((text, i) => (
              <div
                key={i}
                style={{
                  fontSize: 13,
                  color: "#444444",
                  background: "#F7F7F4",
                  borderRadius: 8,
                  padding: "6px 10px",
                }}
              >
                „{text}"
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const exportBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 38,
  padding: "8px 16px",
  borderRadius: 999,
  background: "#1D6F42",
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: "0.03em",
  textDecoration: "none",
};
