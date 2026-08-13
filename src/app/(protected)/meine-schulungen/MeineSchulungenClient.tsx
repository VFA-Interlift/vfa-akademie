"use client";

import { useState } from "react";
import Link from "next/link";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import PdfAnsichtLink from "@/components/PdfAnsichtLink";
import {
  formatDateRange,
  formatInstructorName,
  formatVenueLines,
  getDisplayTrainingTitle,
  formatEnrollmentStatus,
  enrollmentStatusColor,
} from "@/lib/trainings/format";
import type { TrainingRecommendation } from "@/lib/trainings/recommendations";

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
  certificateId?: string | null;
};

export default function MeineSchulungenClient({
  trainings,
  past = [],
  recommendations = [],
}: {
  trainings: SerializableTraining[];
  past?: SerializableTraining[];
  recommendations?: TrainingRecommendation[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (trainings.length === 0) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <AnimatedSection>
          <AppCard>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#007873" }}>
              Aktuell sind dir keine Schulungen zugeordnet.
            </div>
            <p style={{ marginTop: 8, marginBottom: 0, color: "var(--vfa-text-2)", fontSize: 14, lineHeight: 1.6 }}>
              Im{" "}
              <Link href="/kurskalender" style={{ color: "#007873", fontWeight: 700 }}>
                Kurskalender
              </Link>{" "}
              findest du alle kommenden Termine.
            </p>
          </AppCard>
        </AnimatedSection>
        <RecommendationsSection recommendations={recommendations} />
        <VergangeneSection trainings={past} />
      </div>
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
            <p style={{ marginTop: 8, marginBottom: 0, color: "var(--vfa-text-2)", fontSize: 14, lineHeight: 1.6 }}>
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

                        <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "var(--vfa-text-2)", fontWeight: 600 }}>
                          <span>📅 {dateText}</span>
                          {addressLines.length > 0 && <span>📍 {addressLines[0]}</span>}
                        </div>
                      </div>

                      <div style={{ minWidth: 80, display: "grid", justifyItems: "end", alignContent: "start", gap: 4, paddingTop: 2 }}>
                        <div style={{ color: "#007873", fontWeight: 950, fontSize: "clamp(20px, 4vw, 30px)", lineHeight: 1, textAlign: "right" }}>
                          {training.creditsAward}
                        </div>
                        <div style={{ color: "var(--vfa-text-3)", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "right" }}>
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
                      <div style={{ borderTop: "1px solid var(--vfa-linie)", padding: "16px 20px 18px", background: "var(--vfa-karte)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px 20px" }}>
                          <Info label="Dozent" value={instructorName} muted={instructorName === "Noch nicht hinterlegt"} />
                          <Info label="Abschlussdokument" value={training.certificateKindLabel} />
                          {training.description && <Info label="Inhalte" value={training.description} />}
                          <AddressInfo lines={addressLines} />
                        </div>

                        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <a
                            href={`/api/trainings/${training.id}/calendar`}
                            style={{
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
                          {/* Route zum Schulungsort — öffnet die Karten-App;
                              der Google-Link funktioniert auf iPhone und
                              Android gleichermaßen. */}
                          {addressLines.length > 0 && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLines.join(", "))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "11px 18px",
                                borderRadius: 10,
                                background: "transparent",
                                color: "#007873",
                                fontSize: 14,
                                fontWeight: 800,
                                textDecoration: "none",
                                border: "1px solid #007873",
                              }}
                            >
                              <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>🗺️</span>
                              Route
                            </a>
                          )}
                        </div>
                      </div>
                    </AnimatedSection>
                  )}
                </AppCard>
              </AnimatedSection>
            );
          })}
        </div>
      )}

      <RecommendationsSection recommendations={recommendations} />
      <VergangeneSection trainings={past} />
    </div>
  );
}

/**
 * Bisherige Teilnahmen — auch die aus dem Cobra-Import. Bewusst kompakt
 * gehalten: Es können viele Jahre sein, und der Nutzer sucht hier einen
 * Nachweis, nicht die Kursdetails.
 */
function VergangeneSection({ trainings }: { trainings: SerializableTraining[] }) {
  const [alleZeigen, setAlleZeigen] = useState(false);

  if (trainings.length === 0) return null;

  const sichtbar = alleZeigen ? trainings : trainings.slice(0, 5);
  const credits = trainings.reduce((s, t) => s + t.creditsAward, 0);

  return (
    <AnimatedSection delayMs={120}>
      <div style={{ marginTop: 8 }}>
        <div style={{ color: "#007873", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Bisherige Teilnahmen
        </div>
        <div style={{ color: "var(--vfa-text-3)", fontSize: 13, marginTop: 2, marginBottom: 10 }}>
          {trainings.length} {trainings.length === 1 ? "Schulung" : "Schulungen"} · {credits} Credits gesammelt
        </div>

        <AppCard style={{ padding: 0, overflow: "hidden" }}>
          {sichtbar.map((t, i) => (
            <div
              key={`${t.id}-${t.date}`}
              style={{
                display: "flex", gap: 12, alignItems: "baseline", justifyContent: "space-between",
                padding: "12px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--vfa-linie-2)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "var(--vfa-text)", fontSize: 14 }}>
                  {getDisplayTrainingTitle(t)}
                </div>
                <div style={{ color: "var(--vfa-text-3)", fontSize: 12, marginTop: 2 }}>
                  {formatDateRange(t.date, t.endDate)}
                  {t.code ? ` · ${t.code}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                {t.certificateId ? (
                  <PdfAnsichtLink
                    url={`/api/certificates/${t.certificateId}/download`}
                    titel={getDisplayTrainingTitle(t)}
                    dateiname="nachweis.pdf"
                    style={{ color: "#007873", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}
                  >
                    Nachweis ansehen
                  </PdfAnsichtLink>
                ) : null}
                {t.creditsAward > 0 ? (
                  <span style={{ color: "#007873", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>
                    +{t.creditsAward}
                  </span>
                ) : null}
              </div>
            </div>
          ))}

          {trainings.length > 5 ? (
            <button
              type="button"
              onClick={() => setAlleZeigen(!alleZeigen)}
              style={{
                width: "100%", padding: "11px 16px", border: "none", borderTop: "1px solid var(--vfa-linie-2)",
                background: "var(--vfa-karte-2)", color: "#007873", fontWeight: 800, fontSize: 13, cursor: "pointer",
              }}
            >
              {alleZeigen ? "Weniger anzeigen" : `Alle ${trainings.length} anzeigen`}
            </button>
          ) : null}
        </AppCard>
      </div>
    </AnimatedSection>
  );
}

function RecommendationsSection({ recommendations }: { recommendations: TrainingRecommendation[] }) {
  if (recommendations.length === 0) return null;

  return (
    <AnimatedSection delayMs={120}>
      <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#007873", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Empfohlen für dich
          </div>
          <div style={{ fontSize: 13, color: "var(--vfa-text-3)", marginTop: 2 }}>
            Dein nächster Schritt in der VFA-Weiterbildung
          </div>
        </div>

        {recommendations.map((rec) => (
          <AppCard key={rec.prefix} accent="yellow">
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--vfa-text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ★ {rec.reason}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--vfa-text)", lineHeight: 1.25 }}>
                {rec.title}
              </div>
              <div style={{ fontSize: 13.5, color: "#555555", lineHeight: 1.55 }}>
                {rec.description}
              </div>

              {rec.nextTraining ? (
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "var(--vfa-text-2)", fontWeight: 600, marginTop: 2 }}>
                  <span>
                    📅 Nächster Termin: {formatDateRange(rec.nextTraining.date, rec.nextTraining.endDate)}
                    {rec.nextTraining.code ? ` (${rec.nextTraining.code})` : ""}
                  </span>
                  {(() => {
                    const venue = formatVenueLines(rec.nextTraining.location, rec.nextTraining.instructor);
                    return venue.length > 0 ? <span>📍 {venue[0]}</span> : null;
                  })()}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--vfa-text-3)", fontStyle: "italic" }}>
                  Termine folgen – schau im Kurskalender vorbei.
                </div>
              )}

              <div style={{ marginTop: 4 }}>
                <Link
                  href="/kurskalender"
                  className="vfa-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    minHeight: 40,
                    padding: "9px 18px",
                    borderRadius: 999,
                    background: "#007873",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                  }}
                >
                  Zum Kurskalender →
                </Link>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </AnimatedSection>
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid var(--vfa-linie-2)", background: "var(--vfa-karte)", padding: "14px 16px", borderRadius: 12 }}>
      <div style={{ color: "#007873", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ color: "var(--vfa-text)", fontSize: 24, fontWeight: 900, lineHeight: 1.1 }}>
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
      <div style={{ color: muted ? "var(--vfa-text-3)" : "var(--vfa-text)", lineHeight: 1.45, fontSize: 14, fontStyle: muted ? "italic" : "normal", overflowWrap: "anywhere" }}>
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
        <div style={{ color: "var(--vfa-text)", lineHeight: 1.45, fontSize: 14 }}>
          {lines.map((line) => <div key={line}>{line}</div>)}
        </div>
      )}
    </div>
  );
}
