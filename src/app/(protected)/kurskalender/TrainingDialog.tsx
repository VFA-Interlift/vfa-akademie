"use client";

import AppButton from "@/components/ui/AppButton";
import {
  cleanTrainingTitle,
  formatDateRange,
  formatInstructorName,
  formatVenueLines,
  getDisplayTrainingTitle,
  istAusgebucht,
} from "@/lib/trainings/format";

/** Eine Schulung, wie sie /api/trainings/public liefert. */
export type CalendarTraining = {
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

const ANMELDUNG_URL = "https://www.vfa-interlift.de/schulungsanmeldung";
const VDI_BOOKING_URL = "https://www.vfa-interlift.de/vdi-schulungen-anmeldung";
const EFK_BOOKING_URL = "https://www.vfa-interlift.de/efk-schulungen-neu";
const FOCUS_BOOKING_URL = "https://www.vfa-interlift.de/schwerpunkt-schulungen-neu";
// Wix-Duplikat-Adresse; laut Website-Plan 2026 soll die Seite eine sprechende
// Adresse bekommen. Dann hier nachziehen (Befund f02-9, 05.09.2026).
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

/**
 * Der Schulungsdialog des Kurskalenders. Aus page.tsx ausgelagert
 * (Launch-Runde 05.09.2026), damit die Seite nicht weiter anwächst.
 */
export default function TrainingDialog({
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
        // Unten den Home-Balken des Handys freihalten.
        paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
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
          // dvh statt vh: 100vh ist im Handy-Safari die Höhe mit eingeklappten
          // Leisten, die Karte lief sonst unter den Home-Balken.
          maxHeight: "calc(100dvh - 36px - env(safe-area-inset-bottom, 0px))",
          overflow: "auto",
          background: "var(--vfa-karte)",
          border: "1px solid #FFC100",
          borderRadius: 14,
          boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
          padding: "clamp(14px, 4vw, 22px)",
          animationName: "vfaDialogCardIn",
          animationDuration: "280ms",
          animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          animationFillMode: "both",
        }}
      >
        <AppButton variant="ghost" onClick={onClose}>
          Zurück zum Kalender
        </AppButton>

        <div style={{ marginTop: 18 }}>
          <h2
            style={{
              margin: 0,
              color: "var(--vfa-gruen-text)",
              fontSize: "var(--t-titel)",
              fontWeight: 700,
              lineHeight: "var(--lh-eng)",
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
                color: "var(--vfa-text)",
                fontSize: "var(--t-basis)",
                lineHeight: "var(--lh-weit)",
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
          <Info
            label="Kürzel"
            value={training.code ?? "Noch nicht hinterlegt"}
            muted={!training.code}
          />

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
              borderTop: "1px solid var(--vfa-linie)",
            }}
          >
            <Info label="Weitere Informationen" value={training.description} />
          </div>
        )}

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid var(--vfa-linie)",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              color: "var(--vfa-text)",
              fontSize: "var(--t-basis)",
              lineHeight: "var(--lh-weit)",
            }}
          >
            Die Anmeldung läuft über die VFA-Website.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <AppButton variant="ghost" href={getBookingUrl(training)} external>
              Schulungsdetails
            </AppButton>

            {istAusgebucht(training.title) ? (
              <AppButton variant="secondary" disabled>
                Ausgebucht
              </AppButton>
            ) : (
              <AppButton href={getAnmeldungUrl(training)} external>
                Jetzt anmelden
              </AppButton>
            )}
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
      <div className="etikett" style={{ marginBottom: 3 }}>
        {label}
      </div>

      <div
        style={{
          color: muted ? "var(--vfa-text-3)" : "var(--vfa-text)",
          lineHeight: "var(--lh-weit)",
          fontSize: "var(--t-basis)",
          fontStyle: muted ? "italic" : "normal",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function AddressInfo({ lines }: { lines: string[] }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="etikett" style={{ marginBottom: 3 }}>
        Adresse
      </div>

      {lines.length === 0 ? (
        <div
          style={{
            color: "var(--vfa-text-3)",
            lineHeight: "var(--lh-weit)",
            fontSize: "var(--t-basis)",
            fontStyle: "italic",
          }}
        >
          Noch nicht hinterlegt
        </div>
      ) : (
        <div
          style={{
            color: "var(--vfa-text)",
            lineHeight: "var(--lh-weit)",
            fontSize: "var(--t-basis)",
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

function formatPreis(wert: number | null | undefined) {
  if (wert === null || wert === undefined || Number.isNaN(Number(wert))) return null;
  const n = Number(wert);
  if (n <= 0) return null;
  // Cent-Beträge nicht wegrunden: 449,50 wurde vorher zu „450 €“.
  return `${n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
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
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--vfa-linie)" }}>
      <div className="etikett" style={{ marginBottom: 8 }}>
        Teilnahmegebühr
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {stufen.map((s) => (
          <div
            key={s.label}
            style={{
              padding: "8px 12px",
              background: "var(--vfa-karte-2)",
              borderRadius: 8,
              minWidth: 110,
            }}
          >
            <div style={{ fontSize: "var(--t-gross)", fontWeight: 800, color: "var(--vfa-text)" }}>
              {s.wert}
            </div>
            <div style={{ fontSize: "var(--t-label)", color: "var(--vfa-text-3)", fontWeight: 700 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: "var(--t-klein)", color: "var(--vfa-text-3)" }}>
        Angaben ohne Gewähr. Verbindliche Preise stehen auf der VFA-Website.
      </div>
    </div>
  );
}

/**
 * Direkter Sprung ins Anmeldeformular der Website mit vorausgewählter Schulung.
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

  // EFK-Auffrischung ("EFK-ffT_Auffrischung_online-…"): der Code steht in keiner
  // Codeliste, die Schulung landete darum faelschlich auf der Schwerpunkt-Seite.
  // Die Auffrischungstermine stehen auf der Website im selben EFK-Block wie
  // EFK1/EFK2, also dorthin (Sitemap gegengeprueft, 20.08.2026).
  if (normalizeCourseText(training.code ?? "").startsWith("EFK")) {
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
