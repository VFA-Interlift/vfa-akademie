"use client";

import { useState } from "react";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import {
  formatDateRange,
  formatInstructorName,
  formatVenueLines,
  getDisplayTrainingTitle,
  formatEnrollmentStatus,
  enrollmentStatusColor,
} from "@/lib/trainings/format";

type SerializableTraining = {
  id: string;
  title: string;
  code: string | null;
  certificateKindLabel: string;
  date: string;
  endDate: string | null;
  location: string | null;
  instructor: string | null;
  description: string | null;
  creditsAward: number;
  status: string;
};

export default function MeineSchulungenClient({ trainings }: { trainings: SerializableTraining[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (trainings.length === 0) {
    return (
      <AnimatedSection>
        <AppCard>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#007873" }}>
            Aktuell sind dir keine Schulungen zugeordnet.
          </div>
        </AppCard>
      </AnimatedSection>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Nur bevorstehende/laufende Schulungen anzeigen. Vergangene Schulungen werden
  // automatisch (Cron) in Zertifikate umgewandelt (Enrollment → CERTIFICATE_ISSUED)
  // und erscheinen dann unter „Meine Zertifikate".
  const visible = trainings.filter((t) => new Date(t.endDate ?? t.date) >= today);
  const totalCredits = visible.reduce((sum, t) => sum + t.creditsAward, 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AnimatedSection delayMs={0}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <SummaryBox label="Bevorstehende Schulungen" value={visible.length} />
          <SummaryBox label="Mögliche Credits" value={totalCredits} />
        </div>
      </AnimatedSection>

      {visible.length === 0 ? (
        <AnimatedSection delayMs={80}>
          <AppCard>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#007873" }}>
              Aktuell sind keine bevorstehenden Schulungen geplant.
            </div>
            <p style={{ marginTop: 8, marginBottom: 0, color: "#666666", fontSize: 14, lineHeight: 1.6 }}>
              Abgeschlossene Schulungen findest du unter &bdquo;Meine Zertifikate&ldquo;.
            </p>
          </AppCard>
        </AnimatedSection>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {visible.map((training, index) => {
            const isOpen = openId === training.id;
            const dateText = formatDateRange(training.date, training.endDate);
            const displayTitle = getDisplayTrainingTitle(training);
            const addressLines = formatVenueLines(training.location, training.instructor);
            const instructorName = formatInstructorName(training.instructor);
            const statusLabel = formatEnrollmentStatus(training.status);
            const statusStyle = enrollmentStatusColor(training.status);

            return (
              <AnimatedSection key={training.id} delayMs={Math.min(80 + index * 50, 400)}>
                <AppCard
                  style={{
                    padding: 0,
                    overflow: "hidden",
                    borderColor: isOpen ? "#FFC100" : undefined,
                    transition: "border-color 220ms ease, box-shadow 220ms ease",
                    boxShadow: isOpen ? "0 12px 30px rgba(0,0,0,0.08)" : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : training.id)}
                    aria-expanded={isOpen}
                    style={{ width: "100%", border: "none", background: "transparent", padding: 0, cursor: "pointer", textAlign: "left", color: "inherit" }}
                  >
                    <div style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 18, alignItems: "start" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center",
                            padding: "3px 10px", borderRadius: 999,
                            fontSize: 11, fontWeight: 700,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: statusStyle.border,
                          }}>
                            {statusLabel}
                          </span>
                        </div>

                        <h2 style={{ margin: 0, color: "#007873", fontSize: "clamp(17px, 4vw, 26px)", fontWeight: 750, lineHeight: 1.15, maxWidth: 520 }}>
                          {displayTitle}
                        </h2>

                        <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#666666", fontWeight: 600 }}>
                          <span>📅 {dateText}</span>
                          {addressLines.length > 0 && <span>📍 {addressLines[0]}</span>}
                        </div>
                      </div>

                      <div style={{ minWidth: 80, display: "grid", justifyItems: "end", alignContent: "start", gap: 4, paddingTop: 2 }}>
                        <div style={{ color: "#007873", fontWeight: 950, fontSize: "clamp(20px, 4vw, 30px)", lineHeight: 1, textAlign: "right" }}>
                          {training.creditsAward}
                        </div>
                        <div style={{ color: "#888888", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "right" }}>
                          Credits
                        </div>
                        <div style={{ marginTop: 8, color: "#007873", fontSize: 22, fontWeight: 900, lineHeight: 1, transition: "transform 180ms ease", transform: isOpen ? "rotate(180deg)" : "none" }}>
                          {isOpen ? "−" : "+"}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <AnimatedSection delayMs={0}>
                      <div style={{ borderTop: "1px solid #E6E6E6", padding: "16px 20px 18px", background: "#FFFFFF" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px 20px" }}>
                          <Info label="Dozent" value={instructorName} muted={instructorName === "Noch nicht hinterlegt"} />
                          <Info label="Abschlussdokument" value={training.certificateKindLabel} />
                          {training.description && <Info label="Inhalte" value={training.description} />}
                          <AddressInfo lines={addressLines} />
                        </div>

                        <a
                          href={`/api/trainings/${training.id}/calendar`}
                          style={{
                            marginTop: 18,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "11px 18px",
                            borderRadius: 10,
                            background: "#007873",
                            color: "#FFFFFF",
                            fontSize: 14,
                            fontWeight: 800,
                            textDecoration: "none",
                            border: "none",
                          }}
                        >
                          <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>📅</span>
                          Zum Kalender hinzufügen
                        </a>
                      </div>
                    </AnimatedSection>
                  )}
                </AppCard>
              </AnimatedSection>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid #EFEFEF", background: "#FFFFFF", padding: "14px 16px", borderRadius: 12 }}>
      <div style={{ color: "#007873", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ color: "#1F1F1F", fontSize: 24, fontWeight: 900, lineHeight: 1.1 }}>
        {value.toLocaleString("de-DE")}
      </div>
    </div>
  );
}

function Info({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 850, color: "#007873", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ color: muted ? "#777777" : "#1F1F1F", lineHeight: 1.45, fontSize: 14, fontStyle: muted ? "italic" : "normal", overflowWrap: "anywhere" }}>
        {value}
      </div>
    </div>
  );
}

function AddressInfo({ lines }: { lines: string[] }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 850, color: "#007873", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
        Adresse
      </div>
      {lines.length === 0 ? (
        <div style={{ color: "#777777", lineHeight: 1.45, fontSize: 14, fontStyle: "italic" }}>Noch nicht hinterlegt</div>
      ) : (
        <div style={{ color: "#1F1F1F", lineHeight: 1.45, fontSize: 14 }}>
          {lines.map((line) => <div key={line}>{line}</div>)}
        </div>
      )}
    </div>
  );
}
