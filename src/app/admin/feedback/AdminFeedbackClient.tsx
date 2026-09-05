"use client";

import { useMemo, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppSelect from "@/components/ui/AppSelect";
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
  displayTitle: string;
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
        arr.sort((a, b) => a.displayTitle.localeCompare(b.displayTitle, "de"));
        break;
      default:
        arr.sort((a, b) => latest(b) - latest(a));
    }
    return arr;
  }, [trainings, sortKey]);

  if (trainings.length === 0) {
    return (
      <AppCard>
        <p style={{ margin: 0, color: "var(--vfa-text)", fontSize: "var(--t-basis)" }}>Es liegt noch kein Feedback vor.</p>
      </AppCard>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <AnimatedSection>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 220 }}>
            <AppSelect
              ohnePlatzhalter
              label="Sortieren nach"
              value={sortKey}
              onChange={(v) => setSortKey((v || "recent") as SortKey)}
              options={SORT_OPTIONS}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <AppButton
              variant="primary"
              onClick={() =>
                setPdf({
                  url: "/api/admin/feedback/export/pdf",
                  title: "Alle Schulungen",
                  filename: `feedback-gesamt-${todayStr()}.pdf`,
                })
              }
            >
              Alles als PDF
            </AppButton>
            <AppButton variant="secondary" href="/api/admin/feedback/export" external>
              Alles als Excel
            </AppButton>
          </div>
        </div>
      </AnimatedSection>

      {sortedTrainings.map((training, index) => {
        const isOpen = openId === training.trainingId;
        const title = training.displayTitle;

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
                  color: "inherit",
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
                  <h2 style={{ margin: 0, fontSize: "var(--t-gross)", fontWeight: 700, color: "var(--vfa-gruen-text)", lineHeight: "var(--lh-eng)" }}>{title}</h2>
                  <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", marginTop: 3 }}>
                    {training.responseCount} {training.responseCount === 1 ? "Antwort" : "Antworten"}
                    {" · "}
                    {training.formType === "INHOUSE" ? "Inhouse" : "Öffentlich"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "var(--t-titel)", fontWeight: 800, color: "var(--vfa-gruen-text)", lineHeight: 1 }}>
                      {training.overallAverage != null ? training.overallAverage.toFixed(1) : "–"}
                    </div>
                    <div style={{ fontSize: "var(--t-label)", color: "var(--vfa-text-3)", fontWeight: 700 }}>Ø Gesamt</div>
                  </div>
                  <span style={{ fontSize: "var(--t-titel)", fontWeight: 700, color: "var(--vfa-gruen-text)" }}>{isOpen ? "−" : "+"}</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--vfa-linie)", padding: "16px 20px 18px", background: "var(--vfa-karte)" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                    <AppButton
                      variant="primary"
                      onClick={() =>
                        setPdf({
                          url: `/api/admin/feedback/export/pdf?trainingId=${training.trainingId}`,
                          title,
                          filename: `feedback-${title.replace(/[^\w-]+/g, "_")}-${todayStr()}.pdf`,
                        })
                      }
                    >
                      Diese Schulung als PDF
                    </AppButton>
                    <AppButton
                      variant="secondary"
                      href={`/api/admin/feedback/export?trainingId=${training.trainingId}`}
                      external
                    >
                      Diese Schulung als Excel
                    </AppButton>
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

/**
 * PDF-Ansicht als Vollbild-Overlay. Die dunkle Kopfleiste und der weiße
 * Grund des Dokuments bleiben bewusst fest (05.09.2026): Das ist die
 * Betrachter-Leiste über dem Dokument, kein Seiteninhalt — sie soll in beiden
 * Farbmodi gleich aussehen wie ein PDF-Viewer.
 */
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
        // 4100 statt 1000 (20.08.2026): Die Bottom-Nav liegt bei z-index 3000
        // und stand sonst am Handy über dem Viewer; 4100 liegt wie beim
        // PdfOverlay über allen Leisten und Sheets (3000/3500/4000).
        zIndex: 4100,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
        // Unten bis über den iPhone-Home-Balken polstern, sonst endet das
        // iframe unsichtbar dahinter.
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
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
        <div style={{ flex: 1, minWidth: 0, fontSize: "var(--t-basis)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pdf.title}
        </div>
        <AppButton variant="primary" onClick={download} disabled={downloading}>
          {downloading ? "…" : "Herunterladen"}
        </AppButton>
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
            fontSize: "var(--t-titel)",
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
    <div style={{ paddingBottom: 10, borderBottom: "1px solid var(--vfa-linie-2)" }}>
      <div style={{ fontSize: "var(--t-basis)", fontWeight: 700, color: "var(--vfa-text)", marginBottom: 4 }}>{stat.label}</div>

      {stat.type === "rating" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "var(--t-gross)", fontWeight: 800, color: "var(--vfa-gruen-text)" }}>
            {stat.average != null ? stat.average.toFixed(1) : "–"}
          </span>
          <span style={{ fontSize: "var(--t-label)", color: "var(--vfa-text-3)" }}>
            {stat.ratingCount} {stat.ratingCount === 1 ? "Bewertung" : "Bewertungen"}
          </span>
        </div>
      )}

      {(stat.type === "single" || stat.type === "multi") && (
        <div style={{ display: "grid", gap: 3 }}>
          {stat.optionCounts
            .filter((o) => o.count > 0)
            .map((o) => (
              <div key={o.option} style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)" }}>
                <strong>{o.count}×</strong> {o.option}
              </div>
            ))}
          {stat.optionCounts.every((o) => o.count === 0) && (
            <span style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)" }}>keine Auswahl</span>
          )}
        </div>
      )}

      {stat.type === "text" && (
        <div style={{ display: "grid", gap: 4 }}>
          {stat.textAnswers.length === 0 ? (
            <span style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)" }}>keine Angaben</span>
          ) : (
            stat.textAnswers.map((text, i) => (
              <div
                key={i}
                style={{
                  fontSize: "var(--t-klein)",
                  color: "var(--vfa-text-2)",
                  background: "var(--vfa-karte-2)",
                  borderRadius: 8,
                  padding: "6px 10px",
                }}
              >
                „{text}“
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
