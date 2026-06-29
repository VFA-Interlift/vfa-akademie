"use client";

import { useMemo, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import type { AdminQuestionStat } from "@/lib/feedback/evaluation";

type SortKey = "recent" | "avgDesc" | "avgAsc" | "count" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Zuletzt bewertet" },
  { value: "avgDesc", label: "Ø-Bewertung (hoch → niedrig)" },
  { value: "avgAsc", label: "Ø-Bewertung (niedrig → hoch)" },
  { value: "count", label: "Meiste Antworten" },
  { value: "name", label: "Name (A–Z)" },
];

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
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [pdf, setPdf] = useState<{ url: string; title: string; filename: string } | null>(null);

  const sortedTrainings = useMemo(() => {
    const latest = (t: TrainingEval) =>
      t.submissions.reduce((m, s) => Math.max(m, new Date(s.createdAt).getTime()), 0);
    const arr = [...trainings];
    switch (sortKey) {
      case "avgDesc":
        arr.sort((a, b) => (b.overallAverage ?? -1) - (a.overallAverage ?? -1));
        break;
      case "avgAsc":
        arr.sort((a, b) => (a.overallAverage ?? Infinity) - (b.overallAverage ?? Infinity));
        break;
      case "count":
        arr.sort((a, b) => b.responseCount - a.responseCount);
        break;
      case "name":
        arr.sort((a, b) =>
          (a.trainingCode?.trim() || a.trainingTitle).localeCompare(
            b.trainingCode?.trim() || b.trainingTitle,
            "de"
          )
        );
        break;
      default:
        arr.sort((a, b) => latest(b) - latest(a));
    }
    return arr;
  }, [trainings, sortKey]);

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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ display: "grid", gap: 4, minWidth: 220 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#007873", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sortieren nach
            </span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              style={{
                padding: "9px 12px",
                borderRadius: 999,
                border: "1px solid #C7C7C7",
                background: "#FFFFFF",
                color: "#1F1F1F",
                fontSize: 14,
                fontWeight: 700,
                outlineColor: "#007873",
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              style={pdfBtnStyle}
              onClick={() =>
                setPdf({
                  url: "/api/admin/feedback/export/pdf",
                  title: "Alle Schulungen",
                  filename: `feedback-gesamt-${todayStr()}.pdf`,
                })
              }
            >
              📄 Alles als PDF
            </button>
            <a href="/api/admin/feedback/export" style={exportBtnStyle} download>
              ⬇ Alles als Excel
            </a>
          </div>
        </div>
      </AnimatedSection>

      {sortedTrainings.map((training, index) => {
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
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={pdfBtnStyle}
                      onClick={() =>
                        setPdf({
                          url: `/api/admin/feedback/export/pdf?trainingId=${training.trainingId}`,
                          title,
                          filename: `feedback-${(training.trainingCode?.trim() || training.trainingTitle).replace(/[^\w-]+/g, "_")}-${todayStr()}.pdf`,
                        })
                      }
                    >
                      📄 Diese Schulung als PDF
                    </button>
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

      {pdf && <PdfViewerModal pdf={pdf} onClose={() => setPdf(null)} />}
    </div>
  );
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function PdfViewerModal({
  pdf,
  onClose,
}: {
  pdf: { url: string; title: string; filename: string };
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch(pdf.url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = pdf.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          paddingTop: "max(10px, env(safe-area-inset-top))",
          background: "#1F1F1F",
          color: "#FFFFFF",
        }}
      >
        <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pdf.title}
        </div>
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minHeight: 38,
            padding: "8px 16px",
            borderRadius: 999,
            border: "none",
            background: "#007873",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 800,
            cursor: downloading ? "not-allowed" : "pointer",
            opacity: downloading ? 0.6 : 1,
          }}
        >
          {downloading ? "…" : "⬇ Download"}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            border: "none",
            background: "rgba(255,255,255,0.15)",
            color: "#FFFFFF",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
      <iframe
        src={pdf.url}
        title={pdf.title}
        style={{ flex: 1, width: "100%", border: "none", background: "#FFFFFF" }}
      />
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

const pdfBtnStyle: React.CSSProperties = {
  ...exportBtnStyle,
  background: "#007873",
};
