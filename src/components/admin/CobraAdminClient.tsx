"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import Meldung from "@/components/ui/Meldung";
import { CobraFelder, SectionLabel, SummaryBox, TrainingCard } from "./CobraTrainingCard";
import {
  getPreviewKey,
  getTrainingTimestamp,
  isPastTraining,
  searchText,
  type CobraTraining,
  type PreviewResponse,
  type PreviewState,
  type TrainingsResponse,
} from "./cobra-typen";

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
    // Rückfrage: Der Abgleich legt nicht nur an, er räumt auch auf — Schulungen
    // ohne Entsprechung in Cobra werden gelöscht.
    const sicher = window.confirm(
      "Abgleich mit Cobra starten? Dabei werden Schulungen angelegt, aktualisiert und solche ohne Entsprechung in Cobra gelöscht."
    );
    if (!sicher) return;

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
      // Auch sagen, warum Zuordnungen leer ausgingen — sonst bleibt „12 geprüft,
      // 3 erstellt“ ein Rätsel (05.09.2026).
      const uebersprungen = [
        data.skippedAbsent ? `${data.skippedAbsent} nicht anwesend` : "",
        data.skippedNoTemplate ? `${data.skippedNoTemplate} ohne Vorlage` : "",
        data.skippedCollision ? `${data.skippedCollision} mit Nummernkollision` : "",
      ].filter(Boolean);
      setCertMsg(
        `Fertig. Geprüfte Zuordnungen: ${data.checkedEnrollments}. Zertifikate erstellt: ${data.createdCertificates}. Vergebene Credits: ${data.awardedCredits}.` +
          (uebersprungen.length > 0 ? ` Übersprungen: ${uebersprungen.join(", ")}.` : "")
      );
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

  const sampleRaw =
    trainings.find((training) => training.raw && Object.keys(training.raw).length > 0)?.raw ?? null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AppCard as="section">
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
            value={loadingTrainings ? "Wird geprüft …" : trainingError ? "Fehler" : "Verbunden"}
            tone={!loadingTrainings && !trainingError ? "green" : trainingError ? "error" : "default"}
          />
          <SummaryBox
            label="Schulungen in Cobra"
            value={loadingTrainings ? "…" : trainings.length.toLocaleString("de-DE")}
          />
          <SummaryBox
            label="Schulungen in der App-Datenbank"
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
          <Meldung art="fehler" style={{ marginBottom: 14 }}>
            Cobra liefert {trainings.length} Schulungen, aber nur {dbTrainingCount} sind in der App-Datenbank.
            Schulungen ohne Cobra-ID, Kurscode, Titel oder Datum werden beim Abgleich übersprungen.
            Klicke bei einer Schulung auf „Prüfen“, dort siehst du den Status.
          </Meldung>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div className="etikett" style={{ marginBottom: 6 }}>Cobra-Abgleich</div>
            <h2 style={{ margin: 0, fontSize: "var(--t-gross)", fontWeight: 700, color: "var(--vfa-gruen-text)", lineHeight: "var(--lh-eng)" }}>
              Schulungsdaten aus Cobra
            </h2>
            <p style={{ marginTop: 8, marginBottom: 0, color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)", fontSize: "var(--t-basis)" }}>
              Der Abgleich mit Cobra/WebConnect läuft nicht mehr automatisch; die Schulungen kommen
              täglich von der Website. Zertifikate entstehen automatisch am Tag nach Schulungsende.
              Mit „Jetzt synchronisieren“ überträgst du Änderungen aus Cobra (z. B. einen neuen
              Dozenten) sofort in die App-Datenbank.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            <AppButton variant="primary" onClick={() => void syncTrainings()} disabled={syncLoading}>
              {syncLoading ? "Synchronisiere …" : "Jetzt synchronisieren"}
            </AppButton>
            <AppButton variant="ghost" onClick={() => void generateCertificates()} disabled={certLoading}>
              {certLoading ? "Läuft …" : "Zertifikate erstellen"}
            </AppButton>
          </div>
        </div>

        {syncMsg && (
          <Meldung art={syncOk ? "erfolg" : "fehler"} style={{ marginTop: 10 }}>
            {syncMsg}
          </Meldung>
        )}

        {certMsg && (
          <Meldung art={certOk ? "erfolg" : "fehler"} style={{ marginTop: 10 }}>
            {certMsg}
          </Meldung>
        )}

        {/* Die echten Läufe aus vercel.json (05.09.2026): Website-Schulungen 00:05 UTC,
            Zertifikate 00:20 UTC. Einen Cobra-Lauf gibt es nicht. */}
        <Meldung art="hinweis" style={{ marginTop: 14 }}>
          Automatische Läufe, täglich nachts: Schulungen von der Website um 00:05 Uhr UTC (nach
          deutscher Zeit ein bis zwei Stunden später), Zertifikate um 00:20 Uhr UTC. Ein Abgleich
          mit Cobra läuft nicht automatisch, nur über „Jetzt synchronisieren“.
        </Meldung>

        {/* Diagnose: alle Felder, die Cobra liefert – z. B. um das Inhouse/Öffentlich-Kennzeichen zu finden */}
        <div style={{ marginTop: 14 }}>
          <AppButton variant="ghost" onClick={() => setShowFields((value) => !value)}>
            {showFields ? "Cobra-Felder ausblenden" : "Cobra-Felder anzeigen (Diagnose)"}
          </AppButton>

          {showFields && <CobraFelder raw={sampleRaw} />}
        </div>

        <div style={{ marginTop: 16 }}>
          <AppInput
            label="Suche"
            value={query}
            onChange={setQuery}
            placeholder="z. B. A1-2701, EFK, Dozent, ID …"
            inputMode="search"
          />
        </div>

        {loadingTrainings ? (
          <p
            style={{
              marginTop: 18,
              marginBottom: 0,
              color: "var(--vfa-text)",
              fontSize: "var(--t-basis)",
              lineHeight: "var(--lh-weit)",
            }}
          >
            Cobra-Schulungen werden geladen …
          </p>
        ) : trainingError ? (
          <Meldung art="fehler" style={{ marginTop: 18 }}>
            {trainingError}
          </Meldung>
        ) : filteredTrainings.length === 0 ? (
          <Meldung art="hinweis" style={{ marginTop: 18 }}>
            Keine Cobra-Schulung zur Suche gefunden.
          </Meldung>
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
                    border: "1px dashed var(--vfa-grey)",
                    borderRadius: 12,
                    color: "var(--vfa-text-2)",
                    lineHeight: "var(--lh-weit)",
                    fontSize: "var(--t-basis)",
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
                    border: "1px solid var(--vfa-linie)",
                    borderRadius: 14,
                    background: "var(--vfa-karte-2)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--t-label)",
                      fontWeight: 700,
                      color: "var(--vfa-text-2)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Archiv · vergangene Schulungen ({pastTrainings.length.toLocaleString("de-DE")})
                  </span>
                  <span
                    style={{
                      color: "var(--vfa-gruen-text)",
                      fontSize: "var(--t-gross)",
                      fontWeight: 700,
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
      </AppCard>
    </div>
  );
}
