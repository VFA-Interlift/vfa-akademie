"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import Meldung from "@/components/ui/Meldung";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import {
  formatDateRange,
  formatVenueLines,
  getDisplayTrainingTitle,
  cleanTrainingTitle,
} from "@/lib/trainings/format";
import TrainingDialog, { type CalendarTraining } from "./TrainingDialog";

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

  // Bereiche aus den geladenen Schulungen ableiten — so taucht eine neue Art
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
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader title="Kurskalender" showTitle={true} />

        {msg && (
          <AnimatedSection delayMs={60}>
            <Meldung art="fehler" style={{ marginBottom: 18 }}>
              {msg}
            </Meldung>
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
                      fontWeight: 700,
                      fontSize: "var(--t-klein)",
                      background: ansicht === v ? "#007873" : "var(--vfa-karte)",
                      color: ansicht === v ? "#FFFFFF" : "var(--vfa-gruen-text)",
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
                        fontSize: "var(--t-label)",
                        fontWeight: 700,
                        border: bereich === b ? "1px solid #FFC100" : "1px solid var(--vfa-linie)",
                        background: bereich === b ? "rgba(255,193,0,0.12)" : "var(--vfa-karte)",
                        color: "var(--vfa-text)",
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </AnimatedSection>

          {/* Bei einem Ladefehler steht die Meldung schon oben; die Liste
              zeigte darunter sonst noch „Keine kommenden Schulungen“. */}
          {ansicht === "liste" && !msg ? (
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
                    color: "var(--vfa-gruen-text)",
                    fontSize: "var(--t-titel)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    lineHeight: "var(--lh-eng)",
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
                <div style={{ color: "var(--vfa-text)", lineHeight: "var(--lh-weit)" }}>
                  Kurskalender wird geladen …
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
                      <div key={day} className="etikett" style={{ textAlign: "center" }}>
                        {day}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    {weeks.map((week) => {
                      const bars = buildWeekTrainingBars(gefilterte, week.days);

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
                                border: "1px solid var(--vfa-linie)",
                                background: !day.isCurrentMonth
                                  ? "var(--vfa-karte-2)"
                                  : isWeekend(day.date)
                                    ? "var(--vfa-karte-2)"
                                    : "var(--vfa-karte)",
                                opacity: day.isCurrentMonth ? 1 : 0.55,
                              }}
                            >
                              <div
                                style={{
                                  color: isToday(day.date)
                                    ? "#FFFFFF"
                                    : "var(--vfa-text)",
                                  background: isToday(day.date)
                                    ? "#007873"
                                    : "transparent",
                                  width: 26,
                                  height: 26,
                                  borderRadius: 999,
                                  display: "grid",
                                  placeItems: "center",
                                  fontWeight: 700,
                                  fontSize: "var(--t-klein)",
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
                                  fontWeight: 700,
                                  // 11 px bleiben (Kanon: Chips 11–12 px) — die
                                  // Tageszellen sind am Handy nur ~45 px breit,
                                  // mit 12 px blieben nur Auslassungspunkte
                                  // (05.09.2026).
                                  fontSize: 11,
                                  lineHeight: "var(--lh-eng)",
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
                                fontSize: "var(--t-label)",
                                fontWeight: 700,
                                background: overflowWeek === week.key ? "#007873" : "var(--vfa-karte)",
                                color: overflowWeek === week.key ? "#FFFFFF" : "var(--vfa-gruen-text)",
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

      {/* Wochenliste bei mehr als zwei Schulungen in einer Woche */}
      {overflowWeek && (() => {
        const week = weeks.find((w) => w.key === overflowWeek);
        if (!week) return null;
        const bars = buildWeekTrainingBars(gefilterte, week.days);
        const start = week.days[0].date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
        const end = week.days[6].date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
        return (
          <AnimatedSection delayMs={0}>
            <AppCard style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
                <div className="etikett">
                  Alle Schulungen {start}–{end}
                </div>
                <button type="button" onClick={() => setOverflowWeek(null)} aria-label="Wochenliste schließen" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--vfa-text-3)", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
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
                      background: "rgba(255,193,0,0.12)", border: "1px solid rgba(255,193,0,0.25)",
                      cursor: "pointer", textAlign: "left", width: "100%",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "var(--vfa-text)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-eng)" }}>{getDisplayTrainingTitle(bar.training)}</div>
                      <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", marginTop: 2 }}>{formatDateRange(bar.training.date, bar.training.endDate)}</div>
                    </div>
                    <div style={{ color: "var(--vfa-gruen-text)", fontSize: "var(--t-klein)", fontWeight: 700, whiteSpace: "nowrap" }}>{bar.training.creditsAward} Cr.</div>
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

/**
 * Listenansicht der kommenden Schulungen. Bei rund drei Terminen pro Monat ist
 * ein Monatsraster viel Fläche für wenig Inhalt — besonders auf dem Handy.
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
        <div style={{ color: "var(--vfa-text)", lineHeight: "var(--lh-weit)" }}>Schulungen werden geladen …</div>
      </AppCard>
    );
  }

  if (kommende.length === 0) {
    return (
      <AppCard>
        <div style={{ fontWeight: 700, color: "var(--vfa-gruen-text)", fontSize: "var(--t-gross)" }}>
          Keine kommenden Schulungen gefunden.
        </div>
        <p style={{ margin: "6px 0 0", color: "var(--vfa-text-2)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
          Falls ein Bereichsfilter aktiv ist, hebe ihn auf.
        </p>
      </AppCard>
    );
  }

  // Monat je Eintrag vorab bestimmen, statt während der Darstellung eine
  // Variable fortzuschreiben: React darf jederzeit neu rendern, dann fehlte
  // die erste Monatsüberschrift.
  const monate = kommende.map((t) =>
    new Date(t.date).toLocaleDateString("de-DE", { month: "long", year: "numeric" })
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {kommende.map((t, index) => {
        const d = new Date(t.date);
        const monat = monate[index];
        const neuerMonat = index === 0 || monate[index - 1] !== monat;
        const adresse = formatVenueLines(t.location, t.instructor);

        return (
          <div key={t.id}>
            {neuerMonat ? (
              <div className="etikett" style={{ margin: "12px 0 6px" }}>
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
                background: "var(--vfa-karte)",
                border: "1px solid var(--vfa-linie)",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                gap: 14,
                alignItems: "center",
              }}
            >
              <div style={{ textAlign: "center", minWidth: 46 }}>
                <div style={{ fontSize: "var(--t-titel)", fontWeight: 800, color: "var(--vfa-text)", lineHeight: 1 }}>
                  {d.getDate()}
                </div>
                <div style={{ fontSize: "var(--t-label)", color: "var(--vfa-text-3)", fontWeight: 700, textTransform: "uppercase" }}>
                  {d.toLocaleDateString("de-DE", { month: "short" })}
                </div>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--vfa-gruen-text)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-eng)" }}>
                  {cleanTrainingTitle(t.title)}
                </div>
                <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-klein)", marginTop: 3 }}>
                  {formatDateRange(t.date, t.endDate)}
                  {t.code ? ` · ${t.code}` : ""}
                  {adresse.length > 0 ? ` · ${adresse[0]}` : ""}
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "var(--vfa-gruen-text)", fontWeight: 800, fontSize: "var(--t-gross)", lineHeight: 1 }}>
                  {t.creditsAward}
                </div>
                <div style={{ fontSize: "var(--t-label)", color: "var(--vfa-text-3)", fontWeight: 700, textTransform: "uppercase" }}>
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

// Rand über dasselbe Token wie der Geisterknopf (AppButton ghost), damit die
// Pfeile im Dunkelmodus keinen hellen Ring behalten.
const arrowButtonStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 999,
  border: "1px solid var(--vfa-grey)",
  background: "var(--vfa-karte)",
  color: "var(--vfa-gruen-text)",
  fontWeight: 700,
  fontSize: "var(--t-titel)",
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
  transition: "background 180ms ease, border-color 180ms ease, transform 180ms ease",
};
