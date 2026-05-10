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

  const calendarDays = useMemo(() => buildCalendarDays(monthDate), [monthDate]);

  const monthTrainings = useMemo(() => {
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();

    return trainings.filter((training) => {
      const start = toLocalDate(training.date);
      const end = training.endDate ? toLocalDate(training.endDate) : start;

      const firstOfMonth = new Date(year, month, 1);
      const lastOfMonth = new Date(year, month + 1, 0);

      return start <= lastOfMonth && end >= firstOfMonth;
    });
  }, [trainings, monthDate]);

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
        <PageHeader
          title="Kurskalender"
          description="Hier findest du eine Jahres- und Monatsübersicht der geplanten Schulungen. Die Daten kommen aktuell aus der App und können später automatisiert aus Cobra synchronisiert werden."
        />

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
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button type="button" onClick={previousMonth} style={navButtonStyle}>
                ← Monat zurück
              </button>

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    color: "#007873",
                    fontSize: 28,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  {monthDate.toLocaleDateString("de-DE", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>

                <div style={{ marginTop: 6 }}>
                  <StatusBadge variant="yellow">
                    {monthTrainings.length} Schulung
                    {monthTrainings.length === 1 ? "" : "en"}
                  </StatusBadge>
                </div>
              </div>

              <button type="button" onClick={nextMonth} style={navButtonStyle}>
                Monat weiter →
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
                    gap: 8,
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

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gap: 8,
                  }}
                >
                  {calendarDays.map((day) => {
                    const dayTrainings = trainingsForDay(trainings, day.date);
                    const isCurrentMonth =
                      day.date.getMonth() === monthDate.getMonth();

                    return (
                      <div
                        key={day.key}
                        style={{
                          minHeight: 112,
                          padding: 8,
                          border: "1px solid #E6E6E6",
                          background: isCurrentMonth ? "#FFFFFF" : "#F1F1EE",
                          opacity: isCurrentMonth ? 1 : 0.55,
                          display: "grid",
                          alignContent: "start",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            color: isToday(day.date) ? "#FFFFFF" : "#333333",
                            background: isToday(day.date)
                              ? "#007873"
                              : "transparent",
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 900,
                            fontSize: 13,
                          }}
                        >
                          {day.date.getDate()}
                        </div>

                        <div style={{ display: "grid", gap: 5 }}>
                          {dayTrainings.slice(0, 3).map((training) => (
                            <button
                              key={`${day.key}-${training.id}`}
                              type="button"
                              onClick={() => setSelectedTraining(training)}
                              style={{
                                width: "100%",
                                border: "none",
                                background: "#FFC100",
                                color: "#1F1F1F",
                                padding: "6px 7px",
                                borderRadius: 8,
                                cursor: "pointer",
                                textAlign: "left",
                                fontWeight: 900,
                                fontSize: 12,
                                lineHeight: 1.25,
                              }}
                              title={training.title}
                            >
                              {training.code || "Kurs"} · {training.title}
                            </button>
                          ))}

                          {dayTrainings.length > 3 && (
                            <div
                              style={{
                                color: "#007873",
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              +{dayTrainings.length - 3} weitere
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </AppCard>

          {selectedTraining && (
            <AppCard accent="yellow">
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
                      fontSize: 26,
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
            </AppCard>
          )}
        </div>
      </div>
    </main>
  );
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;

  const start = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    };
  });
}

function trainingsForDay(trainings: CalendarTraining[], day: Date) {
  const normalizedDay = startOfDay(day);

  return trainings.filter((training) => {
    const start = startOfDay(toLocalDate(training.date));
    const end = training.endDate
      ? startOfDay(toLocalDate(training.endDate))
      : start;

    return normalizedDay >= start && normalizedDay <= end;
  });
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

const navButtonStyle: React.CSSProperties = {
  minHeight: 40,
  padding: "9px 16px",
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