"use client";

import { useEffect, useMemo, useState } from "react";

type CobraTraining = {
  cobraId: number | null;
  caption: string | null;
  code: string | null;
  title: string | null;
  date: string | null;
  endDate: string | null;
  location: string | null;
  instructor: string | null;
  instructors: string[];
  description: string | null;
};

type CobraParticipant = {
  cobraParticipantId: number | null;
  caption: string | null;
  trainingCaption: string | null;
  status: string | null;
  participantType: string | null;
  participantText: string | null;
  note: string | null;
};

type TrainingsResponse =
  | {
      ok: true;
      source: "cobra";
      endpoint: string;
      count: number;
      trainings: CobraTraining[];
    }
  | {
      ok: false;
      error: string;
      message?: string;
      details?: unknown;
    };

type ParticipantsResponse =
  | {
      ok: true;
      source: "cobra";
      endpoint: string;
      cobraId: string;
      count: number;
      participants: CobraParticipant[];
    }
  | {
      ok: false;
      error: string;
      message?: string;
      details?: unknown;
    };

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getCoursePrefix(code: string | null) {
  const cleanCode = String(code ?? "").trim();

  if (!cleanCode) {
    return "SONSTIGE";
  }

  const match = cleanCode.match(/^[A-Za-zÄÖÜäöüß0-9/]+/);

  return match?.[0]?.toUpperCase() ?? cleanCode.toUpperCase();
}

function searchText(training: CobraTraining) {
  return [
    training.cobraId,
    training.caption,
    training.code,
    training.title,
    training.date,
    training.endDate,
    training.location,
    training.instructor,
    training.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function CobraAdminClient() {
  const [trainings, setTrainings] = useState<CobraTraining[]>([]);
  const [loadingTrainings, setLoadingTrainings] = useState(true);
  const [trainingError, setTrainingError] = useState("");

  const [query, setQuery] = useState("");
  const [selectedCobraId, setSelectedCobraId] = useState<number | null>(null);

  const [participants, setParticipants] = useState<CobraParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantError, setParticipantError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTrainings() {
      setLoadingTrainings(true);
      setTrainingError("");

      try {
        const res = await fetch("/api/cobra/trainings", {
          cache: "no-store",
        });

        const data = (await res.json()) as TrainingsResponse;

        if (cancelled) {
          return;
        }

        if (!res.ok || !data.ok) {
          setTrainingError(
            data.ok === false
              ? data.message ?? data.error
              : "Cobra-Schulungen konnten nicht geladen werden."
          );
          setTrainings([]);
          return;
        }

        setTrainings(data.trainings);
      } catch (error) {
        if (!cancelled) {
          setTrainingError(
            error instanceof Error
              ? error.message
              : "Cobra-Schulungen konnten nicht geladen werden."
          );
          setTrainings([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingTrainings(false);
        }
      }
    }

    void loadTrainings();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTrainings = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return trainings;
    }

    return trainings.filter((training) =>
      searchText(training).includes(cleanQuery)
    );
  }, [query, trainings]);

  async function loadParticipants(cobraId: number | null) {
    if (!cobraId) {
      return;
    }

    setSelectedCobraId(cobraId);
    setParticipants([]);
    setParticipantError("");
    setLoadingParticipants(true);

    try {
      const res = await fetch(`/api/cobra/trainings/${cobraId}/participants`, {
        cache: "no-store",
      });

      const data = (await res.json()) as ParticipantsResponse;

      if (!res.ok || !data.ok) {
        setParticipantError(
          data.ok === false
            ? data.message ?? data.error
            : "Teilnehmer konnten nicht geladen werden."
        );
        setParticipants([]);
        return;
      }

      setParticipants(data.participants);
    } catch (error) {
      setParticipantError(
        error instanceof Error
          ? error.message
          : "Teilnehmer konnten nicht geladen werden."
      );
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
      }}
    >
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6E6E6",
          padding: 18,
          boxShadow: "0 10px 28px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#007873",
                fontSize: 24,
                fontWeight: 500,
              }}
            >
              Cobra-Schulungen
            </h2>

            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              Read-only-Testansicht. Hier werden Daten aus Cobra angezeigt, aber
              nicht in die App-Datenbank übernommen.
            </p>
          </div>

          <div
            style={{
              padding: "8px 12px",
              border: "1px solid #FFC100",
              background: "rgba(255,193,0,0.14)",
              color: "#1F1F1F",
              fontWeight: 900,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {trainings.length.toLocaleString("de-DE")} Schulungen geladen
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label
            style={{
              display: "grid",
              gap: 7,
              color: "#007873",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            Suche
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="z. B. A1-2701, EFK, Dozent, ID..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                minHeight: 44,
                border: "1px solid #C7C7C7",
                background: "#FFFFFF",
                color: "#1F1F1F",
                padding: "10px 12px",
                fontSize: 15,
                fontWeight: 700,
                outline: "none",
              }}
            />
          </label>
        </div>

        {loadingTrainings ? (
          <p
            style={{
              marginTop: 18,
              marginBottom: 0,
              color: "#333333",
              lineHeight: 1.6,
            }}
          >
            Cobra-Schulungen werden geladen...
          </p>
        ) : trainingError ? (
          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              border: "1px solid rgba(176,0,32,0.28)",
              background: "rgba(176,0,32,0.08)",
              color: "#B00020",
              fontWeight: 800,
              lineHeight: 1.5,
            }}
          >
            {trainingError}
          </div>
        ) : (
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gap: 10,
            }}
          >
            {filteredTrainings.map((training) => {
              const isSelected = selectedCobraId === training.cobraId;

              return (
                <article
                  key={`${training.cobraId}-${training.code}`}
                  style={{
                    border: isSelected
                      ? "2px solid #007873"
                      : "1px solid #E6E6E6",
                    background: "#FFFFFF",
                    padding: 14,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: "#007873",
                          fontWeight: 900,
                          fontSize: 18,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {training.code ?? training.title ?? training.caption}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          color: "#333333",
                          lineHeight: 1.5,
                          fontSize: 14,
                        }}
                      >
                        ID {training.cobraId ?? "—"} ·{" "}
                        {getCoursePrefix(training.code)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void loadParticipants(training.cobraId)}
                      disabled={!training.cobraId || loadingParticipants}
                      style={{
                        minHeight: 38,
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: "none",
                        background: "#007873",
                        color: "#FFFFFF",
                        fontWeight: 900,
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        cursor:
                          !training.cobraId || loadingParticipants
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          !training.cobraId || loadingParticipants ? 0.55 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Teilnehmer laden
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(190px, 1fr))",
                      gap: 10,
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    <Info label="Start" value={formatDateTime(training.date)} />
                    <Info label="Ende" value={formatDateTime(training.endDate)} />
                    <Info label="Ort" value={training.location ?? "—"} />
                    <Info label="Dozent" value={training.instructor ?? "—"} />
                  </div>
                </article>
              );
            })}

            {filteredTrainings.length === 0 && (
              <div
                style={{
                  padding: "12px 14px",
                  border: "1px solid #E6E6E6",
                  color: "#333333",
                  lineHeight: 1.6,
                }}
              >
                Keine Cobra-Schulung zur Suche gefunden.
              </div>
            )}
          </div>
        )}
      </section>

      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #FFC100",
          padding: 18,
          boxShadow: "0 10px 28px rgba(0,0,0,0.04)",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#007873",
            fontSize: 24,
            fontWeight: 500,
          }}
        >
          Teilnehmer zur Schulung
        </h2>

        <p
          style={{
            marginTop: 8,
            marginBottom: 0,
            color: "#333333",
            lineHeight: 1.6,
          }}
        >
          Wähle oben eine Schulung aus, um die verknüpften Cobra-Teilnehmer zu
          laden.
        </p>

        {selectedCobraId && (
          <div
            style={{
              marginTop: 12,
              color: "#1F1F1F",
              fontWeight: 900,
            }}
          >
            Ausgewählte Cobra-Schulungs-ID: {selectedCobraId}
          </div>
        )}

        {loadingParticipants ? (
          <p
            style={{
              marginTop: 18,
              marginBottom: 0,
              color: "#333333",
              lineHeight: 1.6,
            }}
          >
            Teilnehmer werden geladen...
          </p>
        ) : participantError ? (
          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              border: "1px solid rgba(176,0,32,0.28)",
              background: "rgba(176,0,32,0.08)",
              color: "#B00020",
              fontWeight: 800,
              lineHeight: 1.5,
            }}
          >
            {participantError}
          </div>
        ) : participants.length > 0 ? (
          <div
            style={{
              marginTop: 18,
              display: "grid",
              gap: 10,
            }}
          >
            {participants.map((participant) => (
              <div
                key={`${participant.cobraParticipantId}-${participant.caption}`}
                style={{
                  border: "1px solid #E6E6E6",
                  padding: 14,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    color: "#007873",
                    fontWeight: 900,
                    fontSize: 16,
                    lineHeight: 1.4,
                  }}
                >
                  {participant.participantText ?? participant.caption ?? "—"}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 10,
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  <Info
                    label="Cobra-ID"
                    value={String(participant.cobraParticipantId ?? "—")}
                  />
                  <Info
                    label="Teilnehmerart"
                    value={participant.participantType ?? "—"}
                  />
                  <Info label="Status" value={participant.status ?? "—"} />
                  <Info label="Notiz" value={participant.note ?? "—"} />
                </div>
              </div>
            ))}
          </div>
        ) : selectedCobraId ? (
          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              border: "1px solid #E6E6E6",
              color: "#333333",
              lineHeight: 1.6,
            }}
          >
            Für diese Schulung wurden keine Teilnehmer zurückgegeben.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          color: "#777777",
          fontWeight: 800,
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 2,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#1F1F1F",
          fontWeight: 700,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}