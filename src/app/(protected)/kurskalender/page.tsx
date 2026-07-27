"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import {
  formatDate,
  formatDateRange,
  formatInstructorName,
  formatVenueLines,
  getDisplayTrainingTitle,
  cleanTrainingTitle,
} from "@/lib/trainings/format";

type CalendarTraining = {
  id: string;
  title: string;
  code: string | null;
  certificateKind: string | null;
  certificateKindLabel: string;
  date: string;
  endDate: string | null;
  location: string | null;
  instructor: string | null;
  description: string | null;
  creditsAward: number;
  category?: string | null;
  preisVfaMitglied?: number | null;
  preisVmaMitglied?: number | null;
  preisNichtmitglied?: number | null;
};

type TrainingsResponse =
  | {
      ok: true;
      source?: string;
      trainings: CalendarTraining[];
    }
  | {
      ok: false;
      error: string;
    };

type CalendarDay = {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
};

type CalendarWeek = {
  key: string;
  days: CalendarDay[];
};

type WeekTrainingBar = {
  training: CalendarTraining;
  gridColumn: string;
};

const ANMELDUNG_URL = "https://www.vfa-interlift.de/schulungsanmeldung";
const VDI_BOOKING_URL = "https://www.vfa-interlift.de/vdi-schulungen-anmeldung";
const EFK_BOOKING_URL = "https://www.vfa-interlift.de/efk-schulungen-neu";
const FOCUS_BOOKING_URL = "https://www.vfa-interlift.de/schwerpunkt-schulungen-neu";
const PRAXIS_BOOKING_URL = "https://www.vfa-interlift.de/kopie-von-vdi-schulungen-neu";

const VDI_CODES = ["A1", "A2", "B", "C"];
const EFK_CODES = ["EFK1", "EFK2"];

// Kompakte Praxisschulungen (Inbetriebnahme / Servicearbeiten / Troubleshooting)
const PRAXIS_CODES = ["IN/SER/TR", "IN", "SER", "TR"];

const FOCUS_CODES = [
  "SCHALL",
  "AZUBI",
  "EINST",
  "DGUV",
  "FPFW",
  "BETR",
  "ARB",
  "BRG",
  "DOK",
  "FRQ",
  "GEF",
  "MOD",
  "MVO",
  "NUR",
  "PLG",
  "SICH",
  "SON",
  "YLD",
];

const ALL_COURSE_CODES = [...VDI_CODES, ...EFK_CODES, ...PRAXIS_CODES, ...FOCUS_CODES];

export default function KurskalenderPage() {
  const today = new Date();

  const [monthDate, setMonthDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [trainings, setTrainings] = useState<CalendarTraining[]>([]);
  const [selectedTraining, setSelectedTraining] =
    useState<CalendarTraining | null>(null);
  const [overflowWeek, setOverflowWeek] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [ansicht, setAnsicht] = useState<"liste" | "monat">("liste");
  const [bereich, setBereich] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTrainings() {
      setLoading(true);
      setMsg("");

      try {
        const res = await fetch("/api/trainings/public", {
          cache: "no-store",
        });

        const data = (await res.json()) as TrainingsResponse;

        if (cancelled) return;

        if (!res.ok || !data.ok) {
          setMsg("Schulungen konnten nicht geladen werden.");
          setTrainings([]);
          return;
        }

        setTrainings(data.trainings);
      } catch {
        if (!cancelled) {
          setMsg("Schulungen konnten nicht geladen werden.");
          setTrainings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTrainings();

    return () => {
      cancelled = true;
    };
  }, []);

  const weeks = useMemo(() => buildCalendarWeeks(monthDate), [monthDate]);

  // Bereiche aus den geladenen Kursen ableiten — so taucht eine neue Kursart
  // automatisch als Filter auf, ohne dass hier eine Liste gepflegt werden muss.
  const bereiche = useMemo(() => {
    const set = new Set<string>();
    for (const t of trainings) if (t.category) set.add(t.category);
    return [...set].sort();
  }, [trainings]);

  const gefilterte = useMemo(
    () => (bereich ? trainings.filter((t) => t.category === bereich) : trainings),
    [trainings, bereich]
  );

  function previousMonth() {
    setSelectedTraining(null);
    setOverflowWeek(null);
    setMonthDate((current) => {
      return new Date(current.getFullYear(), current.getMonth() - 1, 1);
    });
  }

  function nextMonth() {
    setSelectedTraining(null);
    setOverflowWeek(null);
    setMonthDate((current) => {
      return new Date(current.getFullYear(), current.getMonth() + 1, 1);
    });
  }

  return (
    <main className="page-main">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <AnimatedSection delayMs={0}>
          <PageHeader title="Kurskalender" showTitle={true} />
        </AnimatedSection>

        {msg && (
          <AnimatedSection delayMs={60}>
            <div
              style={{
                marginBottom: 18,
                padding: "12px 14px",
                border: "1px solid rgba(176,0,32,0.28)",
                background: "rgba(176,0,32,0.08)",
                color: "#B00020",
                fontWeight: 800,
                lineHeight: 1.5,
              }}
            >
              {msg}
            </div>
          </AnimatedSection>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          <AnimatedSection delayMs={70}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "inline-flex", border: "1px solid #007873", borderRadius: 999, overflow: "hidden" }}>
                {(["liste", "monat"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAnsicht(v)}
                    style={{
                      padding: "7px 16px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: 13,
                      background: ansicht === v ? "#007873" : "#FFFFFF",
                      color: ansicht === v ? "#FFFFFF" : "#007873",
                    }}
                  >
                    {v === "liste" ? "Liste" : "Monat"}
                  </button>
                ))}
              </div>

              {bereiche.length > 1 ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {bereiche.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBereich(bereich === b ? null : b)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        border: bereich === b ? "1px solid #FFC100" : "1px solid #DDDDDD",
                        background: bereich === b ? "#FFF6E0" : "#FFFFFF",
                        color: "#1F1F1F",
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </AnimatedSection>

          {ansicht === "liste" ? (
            <AnimatedSection delayMs={120}>
              <ListenAnsicht
                trainings={gefilterte}
                loading={loading}
                onSelect={(t) => setSelectedTraining(t)}
              />
            </AnimatedSection>
          ) : null}

          <div style={{ display: ansicht === "monat" ? "grid" : "none", gap: 16 }}>
          <AnimatedSection delayMs={90}>
            <AppCard accent="green">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr 44px",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={previousMonth}
                  aria-label="Vorheriger Monat"
                  style={arrowButtonStyle}
                >
                  ←
                </button>

                <div
                  style={{
                    textAlign: "center",
                    color: "#007873",
                    fontSize: "clamp(18px, 4vw, 30px)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    lineHeight: 1.15,
                  }}
                >
                  {monthDate.toLocaleDateString("de-DE", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Nächster Monat"
                  style={arrowButtonStyle}
                >
                  →
                </button>
              </div>
            </AppCard>
          </AnimatedSection>

          <AnimatedSection delayMs={160}>
            <AppCard>
              {loading ? (
                <div style={{ color: "#333333", lineHeight: 1.6 }}>
                  Kurskalender wird geladen...
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
                      <div
                        key={day}
                        style={{
                          color: "#007873",
                          fontWeight: 900,
                          fontSize: 13,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          textAlign: "center",
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    {weeks.map((week) => {
                      const bars = buildWeekTrainingBars(trainings, week.days);

                      return (
                        <div
                          key={week.key}
                          style={{
                            position: "relative",
                            minHeight: 92,
                            display: "grid",
                            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                            gap: 6,
                          }}
                        >
                          {week.days.map((day) => (
                            <div
                              key={day.key}
                              style={{
                                minHeight: 92,
                                padding: 7,
                                border: "1px solid #E6E6E6",
                                background: !day.isCurrentMonth
                                  ? "#F1F1EE"
                                  : isWeekend(day.date)
                                    ? "#ECECE8"
                                    : "#FFFFFF",
                                opacity: day.isCurrentMonth ? 1 : 0.55,
                              }}
                            >
                              <div
                                style={{
                                  color: isToday(day.date)
                                    ? "#FFFFFF"
                                    : "#333333",
                                  background: isToday(day.date)
                                    ? "#007873"
                                    : "transparent",
                                  width: 26,
                                  height: 26,
                                  borderRadius: 999,
                                  display: "grid",
                                  placeItems: "center",
                                  fontWeight: 900,
                                  fontSize: 13,
                                }}
                              >
                                {day.date.getDate()}
                              </div>
                            </div>
                          ))}

                          <div
                            style={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              bottom: 8,
                              display: "grid",
                              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                              gap: 6,
                              pointerEvents: "none",
                            }}
                          >
                            {bars.slice(0, 2).map((bar, index) => (
                              <button
                                key={`${week.key}-${bar.training.id}-${bar.gridColumn}`}
                                type="button"
                                onClick={() => setSelectedTraining(bar.training)}
                                style={{
                                  gridColumn: bar.gridColumn,
                                  border: "none",
                                  background: "#FFC100",
                                  color: "#1F1F1F",
                                  minHeight: 24,
                                  padding: "4px 9px",
                                  borderRadius: 999,
                                  cursor: "pointer",
                                  textAlign: "left",
                                  fontWeight: 900,
                                  fontSize: 11,
                                  lineHeight: 1.15,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  pointerEvents: "auto",
                                  boxShadow: "0 5px 14px rgba(0,0,0,0.10)",
                                  animationName: "vfaCalendarBarIn",
                                  animationDuration: "420ms",
                                  animationTimingFunction:
                                    "cubic-bezier(0.22, 1, 0.36, 1)",
                                  animationFillMode: "both",
                                  animationDelay: `${index * 70}ms`,
                                  transition:
                                    "box-shadow 180ms ease, transform 180ms ease",
                                }}
                                title={getDisplayTrainingTitle(bar.training)}
                              >
                                {formatTrainingBarLabel(bar.training)}
                              </button>
                            ))}
                          </div>

                          {bars.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setOverflowWeek(overflowWeek === week.key ? null : week.key)}
                              style={{
                                position: "absolute",
                                right: 8,
                                top: 8,
                                fontSize: 12,
                                fontWeight: 900,
                                background: overflowWeek === week.key ? "#007873" : "#FFFFFF",
                                color: overflowWeek === week.key ? "#FFFFFF" : "#007873",
                                border: "1px solid #007873",
                                borderRadius: 999,
                                padding: "4px 8px",
                                cursor: "pointer",
                                pointerEvents: "auto",
                              }}
                            >
                              +{bars.length - 2}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <style jsx>{`
                    @keyframes vfaCalendarBarIn {
                      from {
                        opacity: 0;
                        transform: translateY(6px);
                      }

                      to {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }

                    @media (prefers-reduced-motion: reduce) {
                      button {
                        animation: none !important;
                        transition: none !important;
                      }
                    }
                  `}</style>
                </>
              )}
            </AppCard>
          </AnimatedSection>
          </div>
        </div>
      </div>

      {/* Overflow week list */}
      {overflowWeek && (() => {
        const week = weeks.find((w) => w.key === overflowWeek);
        if (!week) return null;
        const bars = buildWeekTrainingBars(trainings, week.days);
        const start = week.days[0].date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
        const end = week.days[6].date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
        return (
          <AnimatedSection delayMs={0}>
            <AppCard style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
                <div style={{ color: "#007873", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Alle Schulungen {start}–{end}
                </div>
                <button type="button" onClick={() => setOverflowWeek(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888888", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {bars.map((bar) => (
                  <button
                    key={bar.training.id}
                    type="button"
                    onClick={() => { setSelectedTraining(bar.training); setOverflowWeek(null); }}
                    style={{
                      display: "flex", gap: 12, alignItems: "center",
                      padding: "10px 14px", borderRadius: 10,
                      background: "#FFC10015", border: "1px solid #FFC10040",
                      cursor: "pointer", textAlign: "left", width: "100%",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: "#1F1F1F", fontSize: 14, lineHeight: 1.2 }}>{getDisplayTrainingTitle(bar.training)}</div>
                      <div style={{ fontSize: 12, color: "#666666", marginTop: 2 }}>{formatDateRange(bar.training.date, bar.training.endDate)}</div>
                    </div>
                    <div style={{ color: "#007873", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{bar.training.creditsAward} Cr.</div>
                  </button>
                ))}
              </div>
            </AppCard>
          </AnimatedSection>
        );
      })()}

      {selectedTraining && (
        <TrainingDialog
          training={selectedTraining}
          onClose={() => setSelectedTraining(null)}
        />
      )}
    </main>
  );
}

function TrainingDialog({
  training,
  onClose,
}: {
  training: CalendarTraining;
  onClose: () => void;
}) {
  const displayTitle = getDisplayTrainingTitle(training);
  const instructorName = formatInstructorName(training.instructor);
  const addressLines = formatVenueLines(training.location, training.instructor);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Schulungsdetails"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(0,0,0,0.42)",
        display: "grid",
        placeItems: "center",
        padding: 18,
        animationName: "vfaDialogBackdropIn",
        animationDuration: "180ms",
        animationTimingFunction: "ease-out",
        animationFillMode: "both",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 760,
          maxHeight: "calc(100vh - 36px)",
          overflow: "auto",
          background: "#FFFFFF",
          border: "1px solid #FFC100",
          boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
          padding: "clamp(14px, 4vw, 22px)",
          animationName: "vfaDialogCardIn",
          animationDuration: "280ms",
          animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          animationFillMode: "both",
        }}
      >
        <button type="button" onClick={onClose} style={backButtonStyle}>
          Zurück zum Kalender
        </button>

        <div style={{ marginTop: 18 }}>
          <h2
            style={{
              margin: 0,
              color: "#007873",
              fontSize: "clamp(18px, 5vw, 30px)",
              fontWeight: 650,
              lineHeight: 1.18,
              overflowWrap: "anywhere",
            }}
          >
            {displayTitle}
          </h2>

          {training.code && cleanTrainingTitle(training.title) !== training.code && (
            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: "#333333",
                lineHeight: 1.5,
              }}
            >
              {cleanTrainingTitle(training.title)}
            </p>
          )}
        </div>

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
          }}
        >
          <Info label="Kürzel" value={training.code ?? "Nicht hinterlegt"} />

          <Info
            label="Zeitraum"
            value={formatDateRange(training.date, training.endDate)}
          />

          <Info
            label="Dozent"
            value={instructorName}
            muted={instructorName === "Noch nicht hinterlegt"}
          />

          <Info label="Abschluss" value={training.certificateKindLabel} />

          <Info label="Credits" value={`${training.creditsAward} Credits`} />

          <AddressInfo lines={addressLines} />
        </div>

        <PreisBlock training={training} />

        {training.description && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid #E6E6E6",
            }}
          >
            <Info label="Weitere Informationen" value={training.description} />
          </div>
        )}

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid #E6E6E6",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              color: "#333333",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Die Anmeldung läuft über die VFA-Website.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              href={getBookingUrl(training)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...bookingButtonStyle, background: "#FFFFFF", color: "#007873", border: "1px solid #007873" }}
            >
              Kursdetails
            </a>

            <a
              href={getAnmeldungUrl(training)}
              target="_blank"
              rel="noopener noreferrer"
              style={bookingButtonStyle}
            >
              Jetzt anmelden
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes vfaDialogBackdropIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes vfaDialogCardIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          div {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Listenansicht der kommenden Kurse. Bei rund drei Terminen pro Monat ist ein
 * Monatsraster viel Fläche für wenig Inhalt — besonders auf dem Handy.
 */
function ListenAnsicht({
  trainings,
  loading,
  onSelect,
}: {
  trainings: CalendarTraining[];
  loading: boolean;
  onSelect: (t: CalendarTraining) => void;
}) {
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);

  const kommende = trainings
    .filter((t) => new Date(t.endDate ?? t.date) >= heute)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (loading) {
    return (
      <AppCard>
        <div style={{ color: "#333333", lineHeight: 1.6 }}>Kurse werden geladen...</div>
      </AppCard>
    );
  }

  if (kommende.length === 0) {
    return (
      <AppCard>
        <div style={{ fontWeight: 800, color: "#007873" }}>Keine kommenden Kurse gefunden.</div>
        <p style={{ margin: "6px 0 0", color: "#666666", fontSize: 14 }}>
          Falls ein Bereichsfilter aktiv ist, hebe ihn auf.
        </p>
      </AppCard>
    );
  }

  let letzterMonat = "";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {kommende.map((t) => {
        const d = new Date(t.date);
        const monat = d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
        const neuerMonat = monat !== letzterMonat;
        letzterMonat = monat;
        const adresse = formatVenueLines(t.location, t.instructor);

        return (
          <div key={t.id}>
            {neuerMonat ? (
              <div
                style={{
                  color: "#007873",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  margin: "12px 0 6px",
                }}
              >
                {monat}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => onSelect(t)}
              style={{
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                background: "#FFFFFF",
                border: "1px solid #E6E6E6",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                gap: 14,
                alignItems: "center",
              }}
            >
              <div style={{ textAlign: "center", minWidth: 46 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#1F1F1F", lineHeight: 1 }}>
                  {d.getDate()}
                </div>
                <div style={{ fontSize: 11, color: "#888888", fontWeight: 700, textTransform: "uppercase" }}>
                  {d.toLocaleDateString("de-DE", { month: "short" })}
                </div>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 750, color: "#007873", fontSize: 15, lineHeight: 1.25 }}>
                  {cleanTrainingTitle(t.title)}
                </div>
                <div style={{ color: "#888888", fontSize: 12, marginTop: 3 }}>
                  {formatDateRange(t.date, t.endDate)}
                  {t.code ? ` · ${t.code}` : ""}
                  {adresse.length > 0 ? ` · ${adresse[0]}` : ""}
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "#007873", fontWeight: 900, fontSize: 16, lineHeight: 1 }}>
                  {t.creditsAward}
                </div>
                <div style={{ fontSize: 10, color: "#888888", fontWeight: 800, textTransform: "uppercase" }}>
                  Credits
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function formatPreis(wert: number | null | undefined) {
  if (wert === null || wert === undefined || Number.isNaN(Number(wert))) return null;
  const n = Number(wert);
  if (n <= 0) return null;
  return `${n.toLocaleString("de-DE", { maximumFractionDigits: 0 })} €`;
}

/** Preisstufen der Website. Fehlen sie, bleibt der Block ganz weg. */
function PreisBlock({ training }: { training: CalendarTraining }) {
  const stufen = [
    { label: "VFA-Mitglied", wert: formatPreis(training.preisVfaMitglied) },
    { label: "VmA-Mitglied", wert: formatPreis(training.preisVmaMitglied) },
    { label: "Nichtmitglied", wert: formatPreis(training.preisNichtmitglied) },
  ].filter((s) => s.wert);

  if (stufen.length === 0) return null;

  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #E6E6E6" }}>
      <div
        style={{
          color: "#888888",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Teilnahmegebühr
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {stufen.map((s) => (
          <div
            key={s.label}
            style={{
              padding: "8px 12px",
              background: "#F7F7F7",
              borderRadius: 8,
              minWidth: 110,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1F1F1F" }}>{s.wert}</div>
            <div style={{ fontSize: 11, color: "#888888", fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#999999" }}>
        Angaben ohne Gewähr — verbindliche Preise auf der VFA-Website.
      </div>
    </div>
  );
}

/**
 * Direkter Sprung ins Anmeldeformular der Website mit vorausgewähltem Kurs.
 * Die Seite liest den Kurscode aus dem Parameter `kurs` und lädt den Termin
 * daraus — ohne ihn landet man auf „Kein Kurs ausgewählt".
 */
function getAnmeldungUrl(training: CalendarTraining) {
  const code = String(training.code ?? "").trim();
  if (!code) return ANMELDUNG_URL;
  return `${ANMELDUNG_URL}?kurs=${encodeURIComponent(code)}`;
}

function getBookingUrl(training: CalendarTraining) {
  const courseKey = getCourseKey(training);
  const titleNorm = normalizeCourseText(training.title ?? "");

  // Praxisschulungen: am Titel-Keyword oder am Praxis-Code erkennbar.
  if (PRAXIS_CODES.includes(courseKey) || titleNorm.includes("PRAXISSCHULUNG")) {
    return PRAXIS_BOOKING_URL;
  }

  if (VDI_CODES.includes(courseKey)) {
    return VDI_BOOKING_URL;
  }

  if (EFK_CODES.includes(courseKey)) {
    return EFK_BOOKING_URL;
  }

  return FOCUS_BOOKING_URL;
}

function getCourseKey(training: CalendarTraining) {
  const rawCode = normalizeCourseText(training.code ?? "");
  const rawTitle = normalizeCourseText(training.title ?? "");

  const codeMatch = findCourseCode(rawCode);
  if (codeMatch) return codeMatch;

  const titleMatch = findCourseCode(rawTitle);
  if (titleMatch) return titleMatch;

  return "";
}

function normalizeCourseText(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/Ä/g, "AE")
    .replace(/Ö/g, "OE")
    .replace(/Ü/g, "UE")
    .replace(/ß/g, "SS");
}

function findCourseCode(value: string) {
  if (!value) return "";

  const compactValue = value.replace(/\s+/g, "");

  const matchedCode = ALL_COURSE_CODES.find((code) => {
    const compactCode = code.replace(/\s+/g, "").toUpperCase();

    return (
      compactValue === compactCode ||
      compactValue.startsWith(`${compactCode}-`) ||
      compactValue.startsWith(`${compactCode}_`) ||
      compactValue.startsWith(`${compactCode}:`) ||
      compactValue.startsWith(`${compactCode}.`) ||
      compactValue.startsWith(`${compactCode}/`)
    );
  });

  return matchedCode ?? "";
}

function buildCalendarWeeks(monthDate: Date): CalendarWeek[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstDayWeekIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const lastDayWeekIndex = (lastDayOfMonth.getDay() + 6) % 7;

  const calendarStart = new Date(firstDayOfMonth);
  calendarStart.setDate(firstDayOfMonth.getDate() - firstDayWeekIndex);

  const calendarEnd = new Date(lastDayOfMonth);
  calendarEnd.setDate(lastDayOfMonth.getDate() + (6 - lastDayWeekIndex));

  const totalDays = diffDays(calendarStart, calendarEnd) + 1;

  const days = Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      date,
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      isCurrentMonth: date.getMonth() === month,
    };
  });

  return Array.from({ length: totalDays / 7 }, (_, weekIndex) => {
    const weekDays = days.slice(weekIndex * 7, weekIndex * 7 + 7);

    return {
      key: `week-${weekDays[0].key}`,
      days: weekDays,
    };
  });
}

function buildWeekTrainingBars(
  trainings: CalendarTraining[],
  days: CalendarDay[]
): WeekTrainingBar[] {
  const weekStart = startOfDay(days[0].date);
  const weekEnd = startOfDay(days[6].date);

  return trainings
    .map((training) => {
      const trainingStart = startOfDay(toLocalDate(training.date));
      const trainingEnd = training.endDate
        ? startOfDay(toLocalDate(training.endDate))
        : trainingStart;

      if (trainingEnd < weekStart || trainingStart > weekEnd) {
        return null;
      }

      const visibleStart = trainingStart < weekStart ? weekStart : trainingStart;
      const visibleEnd = trainingEnd > weekEnd ? weekEnd : trainingEnd;

      const startIndex = diffDays(weekStart, visibleStart);
      const endIndex = diffDays(weekStart, visibleEnd);

      return {
        training,
        gridColumn: `${startIndex + 1} / ${endIndex + 2}`,
      };
    })
    .filter((bar): bar is WeekTrainingBar => Boolean(bar))
    .sort((a, b) => {
      const aStart = toLocalDate(a.training.date).getTime();
      const bStart = toLocalDate(b.training.date).getTime();

      return aStart - bStart;
    });
}

function formatTrainingBarLabel(training: CalendarTraining) {
  return getDisplayTrainingTitle(training);
}

function AddressInfo({ lines }: { lines: string[] }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 850,
          color: "#007873",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 3,
        }}
      >
        Adresse
      </div>

      {lines.length === 0 ? (
        <div
          style={{
            color: "#777777",
            lineHeight: 1.45,
            fontSize: 14,
            fontStyle: "italic",
          }}
        >
          Noch nicht hinterlegt
        </div>
      ) : (
        <div
          style={{
            color: "#1F1F1F",
            lineHeight: 1.45,
            fontSize: 14,
          }}
        >
          {lines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function diffDays(start: Date, end: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (startOfDay(end).getTime() - startOfDay(start).getTime()) / msPerDay
  );
}

function toLocalDate(value: string) {
  const date = new Date(value);

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isToday(date: Date) {
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isWeekend(date: Date) {
  const day = date.getDay();

  return day === 0 || day === 6;
}

function Info({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 850,
          color: "#007873",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 3,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: muted ? "#777777" : "#1F1F1F",
          lineHeight: 1.45,
          fontSize: 14,
          fontStyle: muted ? "italic" : "normal",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const arrowButtonStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 999,
  border: "1px solid #C7C7C7",
  background: "#FFFFFF",
  color: "#007873",
  fontWeight: 900,
  fontSize: 22,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
  transition: "background 180ms ease, border-color 180ms ease, transform 180ms ease",
};

const backButtonStyle: CSSProperties = {
  minHeight: 38,
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #007873",
  background: "#FFFFFF",
  color: "#007873",
  fontWeight: 850,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  cursor: "pointer",
};

const bookingButtonStyle: CSSProperties = {
  minHeight: 42,
  padding: "10px 18px",
  borderRadius: 999,
  border: "1px solid #007873",
  background: "#007873",
  color: "#FFFFFF",
  fontWeight: 900,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 20px rgba(0,120,115,0.20)",
};