"use client";

import { useEffect, useMemo, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

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
};

type TrainingsResponse =
  | {
      ok: true;
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
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function loadTrainings() {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/trainings/public", {
        cache: "no-store",
      });

      const data = (await res.json()) as TrainingsResponse;

      if (!data.ok) {
        setMsg("Schulungen konnten nicht geladen werden.");
        return;
      }

      setTrainings(data.trainings);
    } catch {
      setMsg("Schulungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrainings();
  }, []);

  const weeks = useMemo(() => buildCalendarWeeks(monthDate), [monthDate]);

  function previousMonth() {
    setSelectedTraining(null);
    setMonthDate((current) => {
      return new Date(current.getFullYear(), current.getMonth() - 1, 1);
    });
  }

  function nextMonth() {
    setSelectedTraining(null);
    setMonthDate((current) => {
      return new Date(current.getFullYear(), current.getMonth() + 1, 1);
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <PageHeader title="Kurskalender" />

        {msg && (
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
        )}

        <div style={{ display: "grid", gap: 16 }}>
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
                  fontSize: 30,
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
                          minHeight: 86,
                          display: "grid",
                          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                          gap: 6,
                        }}
                      >
                        {week.days.map((day) => (
                          <div
                            key={day.key}
                            style={{
                              minHeight: 86,
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
                                color: isToday(day.date) ? "#FFFFFF" : "#333333",
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
                          {bars.slice(0, 2).map((bar) => (
                            <button
                              key={`${week.key}-${bar.training.id}-${bar.gridColumn}`}
                              type="button"
                              onClick={() => setSelectedTraining(bar.training)}
                              style={{
                                gridColumn: bar.gridColumn,
                                border: "none",
                                background: "#FFC100",
                                color: "#1F1F1F",
                                minHeight: 22,
                                padding: "3px 9px",
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
                              }}
                              title={bar.training.title}
                            >
                              {formatTrainingBarLabel(bar.training)}
                            </button>
                          ))}
                        </div>

                        {bars.length > 2 && (
                          <div
                            style={{
                              position: "absolute",
                              right: 8,
                              top: 8,
                              color: "#007873",
                              fontSize: 12,
                              fontWeight: 900,
                              background: "#FFFFFF",
                              border: "1px solid #E6E6E6",
                              borderRadius: 999,
                              padding: "4px 8px",
                            }}
                          >
                            +{bars.length - 2}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </AppCard>
        </div>
      </div>

      {selectedTraining && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Schulungsdetails"
          onClick={() => setSelectedTraining(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5000,
            background: "rgba(0,0,0,0.42)",
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              maxHeight: "calc(100vh - 36px)",
              overflow: "auto",
              background: "#FFFFFF",
              border: "1px solid #FFC100",
              boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  {selectedTraining.code && (
                    <StatusBadge variant="yellow">
                      {selectedTraining.code}
                    </StatusBadge>
                  )}

                  <StatusBadge>
                    {selectedTraining.certificateKindLabel}
                  </StatusBadge>

                  <StatusBadge>
                    {selectedTraining.creditsAward} Credits
                  </StatusBadge>
                </div>

                <h2
                  style={{
                    margin: 0,
                    color: "#007873",
                    fontSize: 28,
                    fontWeight: 500,
                    lineHeight: 1.25,
                  }}
                >
                  {selectedTraining.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTraining(null)}
                style={smallButtonStyle}
              >
                Schließen
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <Info
                label="Zeitraum"
                value={`${formatDate(selectedTraining.date)}${
                  selectedTraining.endDate
                    ? ` bis ${formatDate(selectedTraining.endDate)}`
                    : ""
                }`}
              />

              {selectedTraining.location && (
                <Info label="Ort" value={selectedTraining.location} />
              )}

              {selectedTraining.instructor && (
                <Info label="Dozent" value={selectedTraining.instructor} />
              )}

              <Info
                label="Abschluss"
                value={selectedTraining.certificateKindLabel}
              />

              <Info
                label="Credits"
                value={String(selectedTraining.creditsAward)}
              />
            </div>

            {selectedTraining.description && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid #E6E6E6",
                }}
              >
                <Info label="Inhalte" value={selectedTraining.description} />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function buildCalendarWeeks(monthDate: Date): CalendarWeek[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayOffset);

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      isCurrentMonth: date.getMonth() === month,
    };
  });

  return Array.from({ length: 6 }, (_, weekIndex) => {
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
  return training.title || training.code || "Kurs";
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

function formatDate(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("de-DE");
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#007873",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div style={{ color: "#1F1F1F", lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

const arrowButtonStyle: React.CSSProperties = {
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
};

const smallButtonStyle: React.CSSProperties = {
  minHeight: 38,
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #C7C7C7",
  background: "#FFFFFF",
  color: "#007873",
  fontWeight: 800,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  cursor: "pointer",
};