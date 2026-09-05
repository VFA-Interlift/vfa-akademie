"use client";

import { useState } from "react";
import Link from "next/link";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import Kennzahl from "@/components/ui/Kennzahl";
import AnimatedSection from "@/components/ui/AnimatedSection";
import StatusBadge from "@/components/ui/StatusBadge";
import PdfAnsichtLink from "@/components/PdfAnsichtLink";
import {
  formatDateRange,
  formatInstructorName,
  formatVenueLines,
  getDisplayTrainingTitle,
  formatEnrollmentStatus,
  enrollmentStatusVariant,
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
  cancelledAt?: string | null;
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
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span aria-hidden="true" style={{
                flex: "none", width: 30, height: 30, borderRadius: 9,
                background: "rgba(0,120,115,0.10)", color: "var(--vfa-gruen-text)",
                display: "grid", placeItems: "center", fontSize: "var(--t-gross)", fontWeight: 800,
              }}>i</span>
              <div style={{ minWidth: 0 }}>
                {/* „bevorstehende": darunter kann die Liste bisheriger
                    Teilnahmen stehen — „zugeordnet" widersprach ihr. */}
                <div style={{ fontSize: "var(--t-gross)", fontWeight: 700, color: "var(--vfa-text)", lineHeight: 1.3 }}>
                  Keine bevorstehende Schulung
                </div>
                <p style={{ marginTop: 3, marginBottom: 0, color: "var(--vfa-text-2)", fontSize: "var(--t-klein)", lineHeight: 1.5 }}>
                  Im{" "}
                  <Link href="/kurskalender" style={{ color: "var(--vfa-gruen-text)", fontWeight: 700 }}>
                    Kurskalender
                  </Link>{" "}
                  findest du alle kommenden Termine.
                </p>
              </div>
            </div>
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
  // Abgesagte Kurse bleiben in der Liste sichtbar, zaehlen aber weder als
  // bevorstehend (wie im Dashboard) noch zu den moeglichen Credits.
  const nichtAbgesagt = visible.filter((t) => !t.cancelledAt);
  const totalCredits = nichtAbgesagt.reduce((sum, t) => sum + t.creditsAward, 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AnimatedSection delayMs={0}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <Kennzahl label="Bevorstehende Schulungen" value={nichtAbgesagt.length} />
          <Kennzahl label="Mögliche Credits" value={totalCredits} />
        </div>
      </AnimatedSection>

      {visible.length === 0 ? (
        <AnimatedSection delayMs={80}>
          <AppCard>
            <h2 style={{ margin: 0, fontSize: "var(--t-gross)", fontWeight: 700, color: "var(--vfa-gruen-text)", lineHeight: "var(--lh-eng)" }}>
              Aktuell sind keine bevorstehenden Schulungen geplant.
            </h2>
            <p style={{ marginTop: 8, marginBottom: 0, color: "var(--vfa-text-2)", fontSize: "var(--t-klein)", lineHeight: 1.5 }}>
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
            // Eine Absage ueberschreibt den Anmeldestatus in der Anzeige —
            // der Kurs bleibt sichtbar, damit niemand umsonst anreist.
            const abgesagt = Boolean(training.cancelledAt);
            const statusLabel = abgesagt ? "Abgesagt" : formatEnrollmentStatus(training.status);
            const statusVariant = abgesagt ? "danger" : enrollmentStatusVariant(training.status);

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
                          <StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>
                        </div>

                        <h2 style={{ margin: 0, color: "var(--vfa-gruen-text)", fontSize: "var(--t-gross)", fontWeight: 700, lineHeight: 1.2, maxWidth: 520 }}>
                          {displayTitle}
                        </h2>

                        <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", fontWeight: 600 }}>
                          <span>📅 {dateText}</span>
                          {addressLines.length > 0 && <span>📍 {addressLines[0]}</span>}
                        </div>
                      </div>

                      <div style={{ minWidth: 80, display: "grid", justifyItems: "end", alignContent: "start", gap: 4, paddingTop: 2 }}>
                        <div style={{ color: "var(--vfa-gruen-text)", fontWeight: 800, fontSize: "var(--t-zahl)", lineHeight: 1, textAlign: "right" }}>
                          {training.creditsAward}
                        </div>
                        <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-label)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "right" }}>
                          Credits
                        </div>
                        <div style={{ marginTop: 8, color: "var(--vfa-gruen-text)", fontSize: 22, fontWeight: 800, lineHeight: 1, transition: "transform 180ms ease", transform: isOpen ? "rotate(180deg)" : "none" }}>
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
                          {!abgesagt && (
                            <AppButton href={`/api/trainings/${training.id}/calendar`} external>
                              <span aria-hidden="true">📅</span>
                              Zum Kalender hinzufügen
                            </AppButton>
                          )}
                          {/* Route zum Schulungsort — öffnet die Karten-App;
                              der Google-Link funktioniert auf iPhone und
                              Android gleichermaßen. */}
                          {!abgesagt && addressLines.length > 0 && (
                            <AppButton
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLines.join(", "))}`}
                              external
                              variant="ghost"
                            >
                              <span aria-hidden="true">🗺️</span>
                              Route
                            </AppButton>
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
  // "Gesammelt" heisst gutgeschrieben: Credits bucht erst die Zertifikat-Ausstellung
  // auf das Konto. Teilnahmen ohne Zertifikat (abwesend, keine Vorlage, abgesagt)
  // zaehlen hier nicht mit — sonst nennt diese Kachel eine hoehere Summe als
  // "Meine Credits" (20.08.2026).
  const credits = trainings.reduce((s, t) => s + (t.certificateId ? t.creditsAward : 0), 0);

  return (
    <AnimatedSection delayMs={120}>
      <div style={{ marginTop: 8 }}>
        <div className="etikett">Bisherige Teilnahmen</div>
        <div style={{ color: "var(--vfa-text-2)", fontSize: "var(--t-klein)", marginTop: 2, marginBottom: 10 }}>
          {trainings.length} {trainings.length === 1 ? "Schulung" : "Schulungen"} · {credits.toLocaleString("de-DE")} Credits gesammelt
        </div>

        <AppCard style={{ padding: 0, overflow: "hidden" }}>
          {sichtbar.map((t, i) => {
            const titel = getDisplayTrainingTitle(t);
            // Der Kurscode ist meist schon der Titel — dann nicht noch einmal
            // in der Metazeile (Befund f04-1, 05.09.2026).
            const codeZusatz = t.code && t.code.trim() !== titel ? ` · ${t.code.trim()}` : "";
            return (
              <div
                key={`${t.id}-${t.date}`}
                style={{
                  display: "flex", gap: 12, alignItems: "baseline", justifyContent: "space-between",
                  padding: "12px 16px",
                  borderTop: i === 0 ? "none" : "1px solid var(--vfa-linie-2)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--vfa-text)", fontSize: "var(--t-basis)" }}>
                    {titel}
                  </div>
                  <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-klein)", marginTop: 2 }}>
                    {formatDateRange(t.date, t.endDate)}
                    {codeZusatz}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                  {t.cancelledAt ? (
                    <StatusBadge variant="danger">Abgesagt</StatusBadge>
                  ) : (
                    <>
                      {t.certificateId ? (
                        <PdfAnsichtLink
                          url={`/api/certificates/${t.certificateId}/download`}
                          titel={titel}
                          dateiname="nachweis.pdf"
                          style={{ color: "var(--vfa-gruen-text)", fontSize: "var(--t-klein)", fontWeight: 700, whiteSpace: "nowrap" }}
                        >
                          Nachweis ansehen
                        </PdfAnsichtLink>
                      ) : null}
                      {/* "+X" nur bei ausgestelltem Zertifikat — vorher ist nichts gutgeschrieben,
                          und die Zeilen muessen zur Summe oben passen (20.08.2026). */}
                      {t.certificateId && t.creditsAward > 0 ? (
                        <span style={{ color: "var(--vfa-gruen-text)", fontWeight: 800, fontSize: "var(--t-klein)", whiteSpace: "nowrap" }}>
                          +{t.creditsAward}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {trainings.length > 5 ? (
            <button
              type="button"
              onClick={() => setAlleZeigen(!alleZeigen)}
              style={{
                width: "100%", padding: "11px 16px", border: "none", borderTop: "1px solid var(--vfa-linie-2)",
                background: "var(--vfa-karte-2)", color: "var(--vfa-gruen-text)", fontWeight: 700, fontSize: "var(--t-klein)", cursor: "pointer",
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
          <div className="etikett">Empfohlen für dich</div>
          <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", marginTop: 2 }}>
            Dein nächster Schritt in der VFA-Weiterbildung
          </div>
        </div>

        {recommendations.map((rec) => (
          <AppCard key={rec.prefix} accent="yellow">
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: "var(--t-label)", fontWeight: 700, color: "var(--vfa-text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ★ {rec.reason}
              </div>
              <h2 className="balance" style={{ margin: 0, fontSize: "var(--t-gross)", fontWeight: 700, color: "var(--vfa-gruen-text)", lineHeight: 1.25 }}>
                {rec.title}
              </h2>
              <div className="text-2zeilen" style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", lineHeight: 1.5 }}>
                {rec.description}
              </div>

              {rec.nextTraining ? (
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", fontWeight: 600, marginTop: 2 }}>
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
                <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)", fontStyle: "italic" }}>
                  Termine folgen. Schau im Kurskalender vorbei.
                </div>
              )}

              <div style={{ marginTop: 4 }}>
                <AppButton href="/kurskalender">Zum Kurskalender →</AppButton>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </AnimatedSection>
  );
}

function Info({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="etikett" style={{ marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ color: muted ? "var(--vfa-text-3)" : "var(--vfa-text)", lineHeight: "var(--lh-weit)", fontSize: "var(--t-basis)", fontStyle: muted ? "italic" : "normal", overflowWrap: "anywhere" }}>
        {value}
      </div>
    </div>
  );
}

function AddressInfo({ lines }: { lines: string[] }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="etikett" style={{ marginBottom: 3 }}>
        Adresse
      </div>
      {lines.length === 0 ? (
        <div style={{ color: "var(--vfa-text-3)", lineHeight: "var(--lh-weit)", fontSize: "var(--t-basis)", fontStyle: "italic" }}>Noch nicht hinterlegt</div>
      ) : (
        <div style={{ color: "var(--vfa-text)", lineHeight: "var(--lh-weit)", fontSize: "var(--t-basis)" }}>
          {lines.map((line) => <div key={line}>{line}</div>)}
        </div>
      )}
    </div>
  );
}
