"use client";

import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import Meldung from "@/components/ui/Meldung";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  cleanTrainingTitle,
  formatDateTime,
  formatInstructorNames,
  formatRawValue,
  getCoursePrefix,
  type CobraTraining,
  type PreviewResponse,
  type PreviewState,
} from "./cobra-typen";

/**
 * Karten-Bausteine der Cobra-Adminseite — ausgelagert aus CobraAdminClient.tsx
 * (Launch-Runde 05.09.2026): Schulungskarte mit Vorschau, Kennzahlkasten,
 * Abschnittsetikett und Info-Feld.
 */

export function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <div className="etikett" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>{title}</span>
      <span
        style={{
          padding: "2px 9px",
          borderRadius: 999,
          background: "rgba(0,120,115,0.10)",
          color: "var(--vfa-gruen-text)",
          fontSize: "var(--t-label)",
          fontWeight: 700,
        }}
      >
        {count.toLocaleString("de-DE")}
      </span>
    </div>
  );
}

export function SummaryBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "error";
}) {
  const border =
    tone === "green"
      ? "1px solid rgba(0,120,115,0.25)"
      : tone === "error"
        ? "1px solid rgba(176,0,32,0.25)"
        : "1px solid var(--vfa-linie)";
  const background =
    tone === "green"
      ? "rgba(0,120,115,0.06)"
      : tone === "error"
        ? "rgba(176,0,32,0.06)"
        : "var(--vfa-karte-2)";
  // Kennzahl in Textfarbe (Kanon); Erfolg und Fehler dürfen ihre Farbe behalten.
  const color =
    tone === "green" ? "var(--vfa-gruen-text)" : tone === "error" ? "var(--vfa-rot-text)" : undefined;

  return (
    <div style={{ border, background, borderRadius: 12, padding: "14px 16px" }}>
      <div className="etikett">{label}</div>
      <div className="kennzahl" style={{ marginTop: 6, color }}>
        {value}
      </div>
    </div>
  );
}

/** Diagnose: alle Rohfelder einer Beispiel-Schulung, wie Cobra sie liefert. */
export function CobraFelder({ raw }: { raw: Record<string, unknown> | null }) {
  if (!raw) {
    return (
      <div style={{ marginTop: 10, color: "var(--vfa-text-2)", fontSize: "var(--t-klein)" }}>
        Keine Felddaten verfügbar.
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 10,
        border: "1px solid var(--vfa-linie)",
        background: "var(--vfa-karte-2)",
        borderRadius: 12,
        padding: 12,
        display: "grid",
        gap: 6,
        fontSize: "var(--t-klein)",
      }}
    >
      <div style={{ color: "var(--vfa-text-2)", marginBottom: 4, lineHeight: 1.5 }}>
        Felder einer Beispiel-Schulung aus Cobra.
      </div>
      {Object.entries(raw).map(([key, value]) => (
        <div
          key={key}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(120px, 220px) 1fr",
            gap: 10,
            alignItems: "start",
          }}
        >
          <span style={{ fontWeight: 700, color: "var(--vfa-gruen-text)", overflowWrap: "anywhere" }}>
            {key}
          </span>
          <span style={{ color: "var(--vfa-text)", overflowWrap: "anywhere" }}>
            {formatRawValue(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          color: "var(--vfa-text-2)",
          fontWeight: 700,
          fontSize: "var(--t-label)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 2,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "var(--vfa-text)",
          fontWeight: 700,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function TrainingCard({
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
    <AppCard
      as="article"
      style={{
        padding: 14,
        display: "grid",
        gap: 10,
        background: muted ? "var(--vfa-karte-2)" : "var(--vfa-karte)",
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
          <h2
            style={{
              margin: 0,
              color: "var(--vfa-gruen-text)",
              fontWeight: 700,
              fontSize: "var(--t-gross)",
              lineHeight: "var(--lh-eng)",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {training.code ??
              cleanTrainingTitle(training.title) ??
              training.caption}
          </h2>

          <div
            style={{
              marginTop: 4,
              color: "var(--vfa-text-2)",
              lineHeight: 1.5,
              fontSize: "var(--t-klein)",
            }}
          >
            Cobra-ID {training.cobraId ?? "—"} · {getCoursePrefix(training.code)}
          </div>
        </div>

        <AppButton
          variant="ghost"
          onClick={onPreview}
          disabled={!training.cobraId || previewState?.loading}
        >
          {previewState?.loading ? "Prüfe …" : "Prüfen"}
        </AppButton>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 10,
          fontSize: "var(--t-basis)",
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

      {previewState?.error && <Meldung art="fehler">{previewState.error}</Meldung>}

      {previewState?.data?.ok && <PreviewBox preview={previewState.data} />}
    </AppCard>
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
        border: "1px solid var(--vfa-yellow)",
        background: "rgba(255,193,0,0.08)",
        borderRadius: 12,
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
        <strong style={{ color: "var(--vfa-gruen-text)", fontSize: "var(--t-gross)", fontWeight: 700 }}>App-Abgleich</strong>

        <StatusBadge variant={isNew ? "success" : "yellow"}>
          {isNew ? "Neue Schulung" : "Bestehende Schulung"}
        </StatusBadge>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          fontSize: "var(--t-basis)",
          lineHeight: 1.5,
        }}
      >
        <Info label="Kurscode" value={preview.proposed.code} />
        <Info label="Titel" value={cleanTrainingTitle(preview.proposed.title)} />
        <Info
          label="Credits"
          value={`${preview.proposed.creditsAward} Credits`}
        />
        <Info label="Regel" value={preview.proposed.creditRule.label} />
      </div>

      {preview.app.exists && preview.app.existingTraining && (
        <Meldung art="hinweis">
          Passende App-Schulung gefunden:{" "}
          <strong>
            {preview.app.existingTraining.code ??
              preview.app.existingTraining.title}
          </strong>
        </Meldung>
      )}

      {preview.warnings.length > 0 && (
        <Meldung art="fehler" role="status">
          <div style={{ display: "grid", gap: 6 }}>
            {preview.warnings.map((warning) => (
              <div key={warning}>Hinweis: {warning}</div>
            ))}
          </div>
        </Meldung>
      )}
    </div>
  );
}
