"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatInstructorName } from "@/lib/trainings/format";

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
  raw?: Record<string, unknown> | null;
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

  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

/**
 * A training counts as "past" once its end (or its start, if no end) is before
 * the start of today. Past trainings are auto-moved into the collapsed archive.
 */
function isPastTraining(training: CobraTraining, cutoff: number) {
  const reference = training.endDate ?? training.date;

  if (!reference) {
    return false;
  }

  const timestamp = new Date(reference).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp < cutoff;
}

function getPreviewKey(cobraId: number | null) {
  return String(cobraId ?? "unknown");
}

/**
 * Show the clean instructor name(s). Each Cobra "Dozent" value is parsed to just
 * the person's name; only if parsing yields nothing do we fall back to the raw
 * value so the admin can still diagnose unexpected data ("—" if truly empty).
 */
function formatInstructorNames(
  values: string[] | null | undefined,
  fallback: string | null | undefined
) {
  const list =
    values && values.length > 0
      ? values
      : fallback
        ? fallback.split("|")
        : [];

  const cleaned = list
    .map((value) => formatInstructorName(value))
    .filter((name) => name && name !== "Noch nicht hinterlegt");

  if (cleaned.length > 0) {
    return cleaned.join(", ");
  }

  const raw = list
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return raw.length > 0 ? raw.join(" · ") : "—";
}

export default function CobraAdminClient() {
  const [trainings, setTrainings] = useState<CobraTraining[]>([]);
  const [loadingTrainings, setLoadingTrainings] = useState(true);
  const [trainingError, setTrainingError] = useState("");
  const [query, setQuery] = useState("");
  const [dbTrainingCount, setDbTrainingCount] = useState<number | null>(null);
  const [certMsg, setCertMsg] = useState("");
  const [certOk, setCertOk] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncOk, setSyncOk] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const [previewByTraining, setPreviewByTraining] = useState<
    Record<string, PreviewState>
  >({});

  const loadTrainings = useCallback(async () => {
    setLoadingTrainings(true);
    setTrainingError("");

    try {
      const [cobraRes, dbRes] = await Promise.all([
        fetch("/api/cobra/trainings", { cache: "no-store" }),
        fetch("/api/admin/trainings", { cache: "no-store" }),
      ]);

      const cobraData = (await cobraRes.json()) as TrainingsResponse;
      const dbData = (await dbRes.json()) as { ok: boolean; trainings?: unknown[] };

      if (!cobraRes.ok || !cobraData.ok) {
        setTrainingError(
          cobraData.ok === false
            ? cobraData.message ?? cobraData.error
            : "Cobra-Schulungen konnten nicht geladen werden."
        );
        setTrainings([]);
      } else {
        setTrainings(cobraData.trainings);
      }

      if (dbData.ok && Array.isArray(dbData.trainings)) {
        setDbTrainingCount(dbData.trainings.length);
      }
    } catch (error) {
      setTrainingError(
        error instanceof Error
          ? error.message
          : "Cobra-Schulungen konnten nicht geladen werden."
      );
      setTrainings([]);
    } finally {
      setLoadingTrainings(false);
    }
  }, []);

  useEffect(() => {
    void loadTrainings();
  }, [loadTrainings]);

  async function syncTrainings() {
    setSyncLoading(true);
    setSyncMsg("");
    setSyncOk(false);

    try {
      const res = await fetch("/api/admin/cobra/sync-trainings", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setSyncMsg(data.message ?? data.error ?? "Synchronisation fehlgeschlagen.");
        setSyncOk(false);
        return;
      }

      setSyncMsg(
        `Synchronisiert. Neu: ${data.created}, aktualisiert: ${data.updatedByCobraId + data.updatedByCode}, übersprungen: ${data.skipped}, gelöscht: ${data.deleted ?? 0}${data.orphansKept ? ` (${data.orphansKept} verwaiste mit Historie behalten)` : ""}.`
      );
      setSyncOk(true);
      await loadTrainings();
    } catch {
      setSyncMsg("Serverfehler bei der Synchronisation.");
      setSyncOk(false);
    } finally {
      setSyncLoading(false);
    }
  }

  async function generateCertificates() {
    if (!confirm("Zertifikate für alle abgeschlossenen Schulungen erstellen und Credits vergeben?")) return;
    setCertLoading(true);
    setCertMsg("");
    setCertOk(false);
    try {
      const res = await fetch("/api/admin/certificates/generate", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setCertMsg(data.error ?? "Fehler beim Erstellen der Zertifikate.");
        setCertOk(false);
        return;
      }
      setCertMsg(`Fertig. Geprüfte Zuordnungen: ${data.checkedEnrollments}. Zertifikate erstellt: ${data.createdCertificates}. Vergebene Credits: ${data.awardedCredits}.`);
      setCertOk(true);
    } catch {
      setCertMsg("Serverfehler.");
      setCertOk(false);
    } finally {
      setCertLoading(false);
    }
  }

  const filteredTrainings = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    const result = cleanQuery
      ? trainings.filter((training) => searchText(training).includes(cleanQuery))
      : trainings;

    return [...result].sort((a, b) => {
      return getTrainingTimestamp(a) - getTrainingTimestamp(b);
    });
  }, [query, trainings]);

  const { upcomingTrainings, pastTrainings } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const cutoff = startOfToday.getTime();

    const upcoming: CobraTraining[] = [];
    const past: CobraTraining[] = [];

    for (const training of filteredTrainings) {
      if (isPastTraining(training, cutoff)) {
        past.push(training);
      } else {
        upcoming.push(training);
      }
    }

    // Archiv: jüngste vergangene Schulung zuerst.
    past.reverse();

    return { upcomingTrainings: upcoming, pastTrainings: past };
  }, [filteredTrainings]);

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
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <SummaryBox
            label="Status"
            value={loadingTrainings ? "Wird geprüft..." : trainingError ? "Fehler" : "Verbunden"}
            tone={!loadingTrainings && !trainingError ? "green" : trainingError ? "error" : "default"}
          />
          <SummaryBox
            label="Schulungen in Cobra"
            value={loadingTrainings ? "…" : trainings.length.toLocaleString("de-DE")}
          />
          <SummaryBox
            label="Schulungen in App-DB"
            value={dbTrainingCount !== null ? dbTrainingCount.toLocaleString("de-DE") : "…"}
            tone={
              dbTrainingCount !== null && trainings.length > 0 && dbTrainingCount < trainings.length
                ? "error"
                : "default"
            }
          />
          <SummaryBox
            label="Gefiltert"
            value={filteredTrainings.length.toLocaleString("de-DE")}
          />
        </div>

        {dbTrainingCount !== null && trainings.length > 0 && dbTrainingCount < trainings.length && (
          <div style={{ marginBottom: 14, padding: "10px 14px", border: "1px solid rgba(176,0,32,0.28)", background: "rgba(176,0,32,0.06)", color: "#B00020", fontSize: 13, fontWeight: 800, lineHeight: 1.5 }}>
            Cobra liefert {trainings.length} Schulungen, aber nur {dbTrainingCount} sind in der App-DB.
            Trainings ohne Cobra-ID, Code, Titel oder Datum werden beim Sync übersprungen.
            Schulungen aus der Liste &quot;Prüfen&quot; → dort siehst du den Status.
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#007873", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              Automatische Synchronisation
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1F1F1F", letterSpacing: "-0.01em" }}>
              Schulungsdaten aus Cobra
            </h2>
            <p style={{ marginTop: 8, marginBottom: 0, color: "#555555", lineHeight: 1.6, fontSize: 14 }}>
              Schulungen und Teilnehmer werden täglich automatisch aus Cobra/WebConnect synchronisiert.
              Zertifikate entstehen automatisch am Tag nach Schulungsende. Mit &bdquo;Jetzt synchronisieren&ldquo;
              überträgst du Änderungen (z. B. einen neuen Dozenten) sofort in die App-DB und damit in den Kalender.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => void syncTrainings()}
              disabled={syncLoading}
              style={{
                minHeight: 40, padding: "9px 16px", borderRadius: 999,
                border: "1px solid #007873", background: "#007873", color: "#FFFFFF",
                fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.07em",
                cursor: syncLoading ? "not-allowed" : "pointer", opacity: syncLoading ? 0.65 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {syncLoading ? "Synchronisiere..." : "Jetzt synchronisieren"}
            </button>
            <button
              type="button"
              onClick={() => void generateCertificates()}
              disabled={certLoading}
              style={{
                minHeight: 40, padding: "9px 16px", borderRadius: 999,
                border: "1px solid #007873", background: "#FFFFFF", color: "#007873",
                fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.07em",
                cursor: certLoading ? "not-allowed" : "pointer", opacity: certLoading ? 0.65 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {certLoading ? "Läuft..." : "Zertifikate erstellen"}
            </button>
          </div>
        </div>

        {syncMsg && (
          <div style={{ marginTop: 10, padding: "10px 14px", border: syncOk ? "1px solid #007873" : "1px solid rgba(176,0,32,0.28)", background: syncOk ? "rgba(0,120,115,0.06)" : "rgba(176,0,32,0.06)", color: syncOk ? "#007873" : "#B00020", fontWeight: 800, lineHeight: 1.5, fontSize: 13 }}>
            {syncMsg}
          </div>
        )}

        {certMsg && (
          <div style={{ marginTop: 10, padding: "10px 14px", border: certOk ? "1px solid #007873" : "1px solid rgba(176,0,32,0.28)", background: certOk ? "rgba(0,120,115,0.06)" : "rgba(176,0,32,0.06)", color: certOk ? "#007873" : "#B00020", fontWeight: 800, lineHeight: 1.5, fontSize: 13 }}>
            {certMsg}
          </div>
        )}

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
          Cron-Zeiten: Schulungen 00:10 UTC · Teilnehmer 00:15 UTC · Zertifikate 00:05 UTC (täglich)
        </div>

        {/* Diagnose: alle Felder, die Cobra liefert – z.B. um das Inhouse/Öffentlich-Kennzeichen zu finden */}
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setShowFields((value) => !value)}
            style={{
              minHeight: 36,
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #C7C7C7",
              background: "#FFFFFF",
              color: "#007873",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {showFields ? "Cobra-Felder ausblenden" : "Cobra-Felder anzeigen (Diagnose)"}
          </button>

          {showFields &&
            (() => {
              const sampleRaw =
                trainings.find(
                  (training) =>
                    training.raw && Object.keys(training.raw).length > 0
                )?.raw ?? null;

              if (!sampleRaw) {
                return (
                  <div style={{ marginTop: 10, color: "#888888", fontSize: 13 }}>
                    Keine Felddaten verfügbar.
                  </div>
                );
              }

              return (
                <div
                  style={{
                    marginTop: 10,
                    border: "1px solid #E6E6E6",
                    background: "#FAFAFA",
                    padding: 12,
                    display: "grid",
                    gap: 6,
                    fontSize: 13,
                  }}
                >
                  <div style={{ color: "#555555", marginBottom: 4, lineHeight: 1.5 }}>
                    Felder einer Beispiel-Schulung aus Cobra. Sag mir den Feldnamen
                    für &bdquo;öffentlich/inhouse&ldquo; und welcher Wert was bedeutet &ndash; dann
                    filtere ich den Kalender automatisch.
                  </div>
                  {Object.entries(sampleRaw).map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(120px, 220px) 1fr",
                        gap: 10,
                        alignItems: "start",
                      }}
                    >
                      <span style={{ fontWeight: 800, color: "#007873", overflowWrap: "anywhere" }}>
                        {key}
                      </span>
                      <span style={{ color: "#1F1F1F", overflowWrap: "anywhere" }}>
                        {formatRawValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
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
        ) : filteredTrainings.length === 0 ? (
          <div
            style={{
              marginTop: 18,
              padding: "12px 14px",
              border: "1px solid #E6E6E6",
              color: "#333333",
              lineHeight: 1.6,
            }}
          >
            Keine Cobra-Schulung zur Suche gefunden.
          </div>
        ) : (
          <div style={{ marginTop: 18, display: "grid", gap: 18 }}>
            {/* Bevorstehende & laufende Schulungen */}
            <div style={{ display: "grid", gap: 10 }}>
              <SectionLabel
                title="Aktuelle & bevorstehende Schulungen"
                count={upcomingTrainings.length}
              />

              {upcomingTrainings.length === 0 ? (
                <div
                  style={{
                    padding: "12px 14px",
                    border: "1px dashed #D5D5D5",
                    color: "#888888",
                    lineHeight: 1.6,
                    fontSize: 14,
                  }}
                >
                  Keine bevorstehenden Schulungen
                  {query.trim() ? " zur Suche" : ""}. Vergangene findest du im Archiv.
                </div>
              ) : (
                upcomingTrainings.map((training) => (
                  <TrainingCard
                    key={`${training.cobraId}-${training.code}`}
                    training={training}
                    previewState={previewByTraining[getPreviewKey(training.cobraId)]}
                    onPreview={() => void loadPreview(training)}
                  />
                ))
              )}
            </div>

            {/* Archiv: vergangene Schulungen (automatisch, zugeklappt) */}
            {pastTrainings.length > 0 && (
              <div style={{ display: "grid", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowArchive((value) => !value)}
                  aria-expanded={showArchive}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    minHeight: 48,
                    padding: "12px 16px",
                    border: "1px solid #E6E6E6",
                    background: "#FAFAFA",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: "#666666",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Archiv · vergangene Schulungen ({pastTrainings.length.toLocaleString("de-DE")})
                  </span>
                  <span
                    style={{
                      color: "#007873",
                      fontSize: 20,
                      fontWeight: 900,
                      lineHeight: 1,
                      transform: showArchive ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 180ms ease",
                    }}
                  >
                    ⌄
                  </span>
                </button>

                {showArchive &&
                  pastTrainings.map((training) => (
                    <TrainingCard
                      key={`${training.cobraId}-${training.code}`}
                      training={training}
                      previewState={previewByTraining[getPreviewKey(training.cobraId)]}
                      onPreview={() => void loadPreview(training)}
                      muted
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        fontWeight: 900,
        color: "#007873",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      <span>{title}</span>
      <span
        style={{
          padding: "2px 9px",
          borderRadius: 999,
          background: "rgba(0,120,115,0.10)",
          color: "#007873",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {count.toLocaleString("de-DE")}
      </span>
    </div>
  );
}

function TrainingCard({
  training,
  previewState,
  onPreview,
  muted = false,
}: {
  training: CobraTraining;
  previewState: PreviewState | undefined;
  onPreview: () => void;
  muted?: boolean;
}) {
  return (
    <article
      style={{
        border: "1px solid #E6E6E6",
        background: muted ? "#FBFBFB" : "#FFFFFF",
        padding: 14,
        display: "grid",
        gap: 10,
        opacity: muted ? 0.85 : 1,
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
            Cobra-ID {training.cobraId ?? "—"} · {getCoursePrefix(training.code)}
          </div>
        </div>

        <button
          type="button"
          onClick={onPreview}
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
            opacity: !training.cobraId || previewState?.loading ? 0.55 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {previewState?.loading ? "Prüfe..." : "Prüfen"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 10,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <Info label="Start" value={formatDateTime(training.date)} />
        <Info label="Ende" value={formatDateTime(training.endDate)} />
        <Info label="Ort" value={training.location ?? "—"} />
        <Info
          label="Dozent"
          value={formatInstructorNames(training.instructors, training.instructor)}
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

      {previewState?.data?.ok && <PreviewBox preview={previewState.data} />}
    </article>
  );
}

function SummaryBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "error";
}) {
  const borderColor =
    tone === "green"
      ? "1px solid rgba(0,120,115,0.25)"
      : tone === "error"
        ? "1px solid rgba(176,0,32,0.25)"
        : "1px solid #E6E6E6";
  const bgColor =
    tone === "green"
      ? "rgba(0,120,115,0.06)"
      : tone === "error"
        ? "rgba(176,0,32,0.06)"
        : "#FFFFFF";
  const textColor =
    tone === "green" ? "#007873" : tone === "error" ? "#B00020" : "#1F1F1F";

  return (
    <div style={{ border: borderColor, background: bgColor, padding: "14px 16px" }}>
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
      <div style={{ color: textColor, fontSize: 24, fontWeight: 900, lineHeight: 1.1 }}>
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

function formatRawValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}