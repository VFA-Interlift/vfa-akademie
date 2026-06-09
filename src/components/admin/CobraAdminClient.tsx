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
  if (!value) return "—";

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

function formatInstructorNames(
  values: string[] | null | undefined,
  fallback: string | null | undefined
) {
  const sourceValues =
    values && values.length > 0
      ? values
      : fallback
        ? fallback.split("|")
        : [];

  const names = sourceValues
    .map((value) => extractInstructorName(value))
    .filter(Boolean);

  const uniqueNames = Array.from(new Set(names));

  return uniqueNames.length > 0
    ? uniqueNames.join(" / ")
    : "Noch nicht hinterlegt";
}

function extractInstructorName(value: string | null | undefined) {
  if (!value?.trim()) {
    return "";
  }

  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/\b(E-Mail|Email|Mail|Telefon|Tel\.?|Mobil)\b.*$/i, "")
    .trim();

  const commaParts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const likelyName =
    commaParts.length >= 2
      ? commaParts[1]
      : cleaned
          .split(/[;|/]/)[0]
          .replace(
            /\b(Adresse|Strasse|Straße|Str\.?|PLZ|Ort|Firma|Unternehmen)\b.*$/i,
            ""
          )
          .trim();

  if (!likelyName || looksLikeCompany(likelyName) || looksLikeAddress(likelyName)) {
    return "";
  }

  const words = likelyName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^(Herr|Frau|Dr\.?|Prof\.?|Dipl\.?-?Ing\.?)$/i.test(part))
    .filter((part) => !/\d/.test(part));

  if (words.length < 2) {
    return "";
  }

  const possibleName = `${words[0]} ${words[1]}`;

  if (looksLikeCompany(possibleName) || looksLikeAddress(possibleName)) {
    return "";
  }

  return possibleName;
}

function looksLikeCompany(value: string) {
  const normalized = value.toLowerCase();

  const companyIndicators = [
    "gmbh",
    "mbh",
    "ag",
    "kg",
    "ohg",
    "ug",
    "e.v.",
    "ev",
    "gbr",
    "holding",
    "gruppe",
    "group",
    "company",
    "unternehmen",
    "firma",
    "werke",
    "aufzug",
    "aufzüge",
    "aufzuege",
    "elevator",
    "lift",
    "lifts",
    "hydraulic",
    "hydraulics",
    "hydraulik",
    "metallbau",
    "maschinenbau",
    "service",
    "services",
    "technik",
    "technical",
    "akademie",
    "academy",
    "institut",
    "institute",
    "training",
    "seminar",
    "flughafen",
    "airport",
  ];

  return companyIndicators.some((indicator) => normalized.includes(indicator));
}

function looksLikeAddress(value: string) {
  const normalized = value.toLowerCase();

  return (
    /\d/.test(normalized) ||
    /\b(strasse|straße|str\.|weg|platz|allee|ring|d\s?\d{4,5}|\d{4,5})\b/i.test(
      normalized
    )
  );
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

        if (cancelled) return;

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
                : "Vorschau konnte nicht geladen werden.",
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
              : "Vorschau konnte nicht geladen werden.",
          data: null,
        },
      }));
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
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
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <SummaryBox label="Status" value="Verbunden" tone="green" />
          <SummaryBox
            label="Schulungen aus Cobra"
            value={trainings.length.toLocaleString("de-DE")}
          />
          <SummaryBox
            label="Gefilterte Ansicht"
            value={filteredTrainings.length.toLocaleString("de-DE")}
          />
        </div>

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
              Schulungsdaten aus Cobra
            </h2>

            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              Die App liest Schulungen aus Cobra/WebConnect und bereitet daraus
              die spätere Darstellung in der VFA-Akademie vor.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            border: "1px solid rgba(0,120,115,0.22)",
            background: "rgba(0,120,115,0.06)",
            color: "#333333",
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          Nächster technischer Schritt: Im Teilnehmer-Endpunkt soll zusätzlich
          die E-Mail-Adresse des jeweiligen Teilnehmers ausgegeben werden. Erst
          damit ist eine sichere automatische Zuordnung zu App-Nutzern möglich.
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
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: 14,
                      alignItems: "start",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: "#007873",
                          fontWeight: 900,
                          fontSize: 20,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {training.code ??
                          cleanTrainingTitle(training.title) ??
                          training.caption}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          color: "#333333",
                          lineHeight: 1.5,
                          fontSize: 14,
                        }}
                      >
                        Cobra-ID {training.cobraId ?? "—"} ·{" "}
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
                      {previewState?.loading ? "Prüfe..." : "Prüfen"}
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
                    <Info
                      label="Ende"
                      value={formatDateTime(training.endDate)}
                    />
                    <Info label="Ort" value={training.location ?? "—"} />
                    <Info
                      label="Dozent"
                      value={formatInstructorNames(
                        training.instructors,
                        training.instructor
                      )}
                    />
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

function SummaryBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green";
}) {
  return (
    <div
      style={{
        border:
          tone === "green"
            ? "1px solid rgba(0,120,115,0.25)"
            : "1px solid #E6E6E6",
        background: tone === "green" ? "rgba(0,120,115,0.06)" : "#FFFFFF",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          color: "#007873",
          fontSize: 12,
          fontWeight: 850,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: tone === "green" ? "#007873" : "#1F1F1F",
          fontSize: 24,
          fontWeight: 900,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PreviewBox({
  preview,
}: {
  preview: Extract<PreviewResponse, { ok: true }>;
}) {
  const isNew = preview.action === "CREATE_NEW";

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
        <strong style={{ color: "#007873", fontSize: 16 }}>App-Abgleich</strong>

        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: isNew ? "#007873" : "#FFC100",
            color: isNew ? "#FFFFFF" : "#1F1F1F",
            fontWeight: 900,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {isNew ? "Neue Schulung" : "Bestehende Schulung"}
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
        <Info label="Kürzel" value={preview.proposed.code} />
        <Info label="Titel" value={cleanTrainingTitle(preview.proposed.title)} />
        <Info
          label="Credits"
          value={`${preview.proposed.creditsAward} Credits`}
        />
        <Info label="Regel" value={preview.proposed.creditRule.label} />
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
          Passende App-Schulung gefunden:{" "}
          <strong>
            {preview.app.existingTraining.code ??
              preview.app.existingTraining.title}
          </strong>
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

function cleanTrainingTitle(value: string | null | undefined) {
  if (!value) return "—";

  return value
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}