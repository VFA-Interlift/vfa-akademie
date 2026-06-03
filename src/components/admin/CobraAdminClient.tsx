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

type PreviewResponse =
  | {
      ok: true;
      mode: "PREVIEW_ONLY";
      action: "CREATE_NEW" | "UPDATE_EXISTING_BY_CODE";
      cobra: {
        cobraId: number;
        code: string;
        title: string;
        date: string;
        endDate: string | null;
        location: string | null;
        instructor: string | null;
        description: string | null;
      };
      app: {
        exists: boolean;
        existingTraining: {
          id: string;
          title: string;
          code: string | null;
          date: string;
          endDate: string | null;
          location: string | null;
          instructor: string | null;
          description: string | null;
          creditsAward: number;
          certificateKind: string;
        } | null;
      };
      proposed: {
        title: string;
        code: string;
        date: string;
        endDate: string | null;
        location: string | null;
        instructor: string | null;
        description: string | null;
        creditsAward: number;
        creditRule: {
          credits: number;
          automatic: boolean;
          reason: string;
          label: string;
        };
      };
      warnings: string[];
    }
  | {
      ok: false;
      error: string;
      message?: string;
      details?: unknown;
    };

type PreviewState = {
  loading: boolean;
  error: string;
  data: PreviewResponse | null;
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

function getTrainingTimestamp(training: CobraTraining) {
  if (!training.date) {
    return Number.MAX_SAFE_INTEGER;
  }

  const timestamp = new Date(training.date).getTime();

  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function getPreviewKey(cobraId: number | null) {
  return String(cobraId ?? "unknown");
}

export default function CobraAdminClient() {
  const [trainings, setTrainings] = useState<CobraTraining[]>([]);
  const [loadingTrainings, setLoadingTrainings] = useState(true);
  const [trainingError, setTrainingError] = useState("");

  const [query, setQuery] = useState("");

  const [previewByTraining, setPreviewByTraining] = useState<
    Record<string, PreviewState>
  >({});

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

    const result = cleanQuery
      ? trainings.filter((training) => searchText(training).includes(cleanQuery))
      : trainings;

    return [...result].sort((a, b) => {
      return getTrainingTimestamp(a) - getTrainingTimestamp(b);
    });
  }, [query, trainings]);

  async function loadPreview(training: CobraTraining) {
    const key = getPreviewKey(training.cobraId);

    setPreviewByTraining((current) => ({
      ...current,
      [key]: {
        loading: true,
        error: "",
        data: null,
      },
    }));

    try {
      const res = await fetch("/api/admin/cobra/preview-training", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify(training),
      });

      const data = (await res.json()) as PreviewResponse;

      if (!res.ok || !data.ok) {
        setPreviewByTraining((current) => ({
          ...current,
          [key]: {
            loading: false,
            error:
              data.ok === false
                ? data.message ?? data.error
                : "Import-Vorschau konnte nicht geladen werden.",
            data,
          },
        }));

        return;
      }

      setPreviewByTraining((current) => ({
        ...current,
        [key]: {
          loading: false,
          error: "",
          data,
        },
      }));
    } catch (error) {
      setPreviewByTraining((current) => ({
        ...current,
        [key]: {
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Import-Vorschau konnte nicht geladen werden.",
          data: null,
        },
      }));
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
              Read-only-Testansicht. Hier werden Schulungen aus Cobra geprüft.
              Die App-Datenbank wird noch nicht verändert.
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

        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            border: "1px solid #E6E6E6",
            background: "#FAFAF8",
            color: "#333333",
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          Für die spätere automatische Zuordnung zu App-Usern brauchen wir im
          Cobra-Teilnehmer-Endpunkt zusätzlich die E-Mail-Adresse des
          Teilnehmers. Der aktuelle Teilnehmertext reicht für einen sicheren
          Abgleich nicht aus.
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
              const previewState =
                previewByTraining[getPreviewKey(training.cobraId)];

              return (
                <article
                  key={`${training.cobraId}-${training.code}`}
                  style={{
                    border: "1px solid #E6E6E6",
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
                      onClick={() => void loadPreview(training)}
                      disabled={!training.cobraId || previewState?.loading}
                      style={{
                        minHeight: 38,
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: "1px solid #007873",
                        background: "#FFFFFF",
                        color: "#007873",
                        fontWeight: 900,
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        cursor:
                          !training.cobraId || previewState?.loading
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          !training.cobraId || previewState?.loading ? 0.55 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {previewState?.loading ? "Prüfe..." : "Vorschau"}
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

                  {previewState?.error && (
                    <div
                      style={{
                        padding: "10px 12px",
                        border: "1px solid rgba(176,0,32,0.28)",
                        background: "rgba(176,0,32,0.08)",
                        color: "#B00020",
                        fontWeight: 800,
                        lineHeight: 1.5,
                      }}
                    >
                      {previewState.error}
                    </div>
                  )}

                  {previewState?.data?.ok && (
                    <PreviewBox preview={previewState.data} />
                  )}
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
    </div>
  );
}

function PreviewBox({
  preview,
}: {
  preview: Extract<PreviewResponse, { ok: true }>;
}) {
  return (
    <div
      style={{
        border: "1px solid #FFC100",
        background: "rgba(255,193,0,0.08)",
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
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <strong style={{ color: "#007873", fontSize: 16 }}>
          Import-Vorschau
        </strong>

        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background:
              preview.action === "CREATE_NEW" ? "#007873" : "#FFC100",
            color: preview.action === "CREATE_NEW" ? "#FFFFFF" : "#1F1F1F",
            fontWeight: 900,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {preview.action === "CREATE_NEW"
            ? "Neu anlegen"
            : "Bestehende aktualisieren"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <Info label="Code" value={preview.proposed.code} />
        <Info label="Titel" value={preview.proposed.title} />
        <Info
          label="Credits"
          value={`${preview.proposed.creditsAward} Credits`}
        />
        <Info label="Credit-Regel" value={preview.proposed.creditRule.label} />
      </div>

      {preview.app.exists && preview.app.existingTraining && (
        <div
          style={{
            padding: "10px 12px",
            border: "1px solid #E6E6E6",
            background: "#FFFFFF",
            color: "#1F1F1F",
            lineHeight: 1.5,
          }}
        >
          Bestehende App-Schulung gefunden:{" "}
          <strong>{preview.app.existingTraining.title}</strong>
        </div>
      )}

      {preview.warnings.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 6,
            color: "#B00020",
            fontWeight: 800,
            lineHeight: 1.5,
          }}
        >
          {preview.warnings.map((warning) => (
            <div key={warning}>Hinweis: {warning}</div>
          ))}
        </div>
      )}
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