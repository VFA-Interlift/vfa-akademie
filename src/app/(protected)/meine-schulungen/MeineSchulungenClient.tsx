"use client";

import { useState } from "react";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";

type SerializableTraining = {
  id: string;
  title: string;
  code: string | null;
  certificateKindLabel: string;
  date: string;
  endDate: string | null;
  location: string | null;
  instructor: string | null;
  description: string | null;
  creditsAward: number;
  status: string;
};

export default function MeineSchulungenClient({
  trainings,
}: {
  trainings: SerializableTraining[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (trainings.length === 0) {
    return (
      <AnimatedSection>
        <AppCard>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#007873" }}>
            Aktuell sind dir keine Schulungen zugeordnet.
          </div>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              color: "#333333",
              lineHeight: 1.6,
            }}
          >
            Sobald eine Schulung über die VFA-Akademie oder später über
            Cobra/WebConnect zugeordnet wurde, erscheint sie hier.
          </p>
        </AppCard>
      </AnimatedSection>
    );
  }

  const upcomingCount = trainings.filter((training) =>
    isUpcoming(training.date)
  ).length;

  const totalCredits = trainings.reduce(
    (sum, training) => sum + training.creditsAward,
    0
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AnimatedSection delayMs={0}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          <SummaryBox label="Bevorstehend" value={upcomingCount} />
          <SummaryBox label="Mögliche Credits" value={totalCredits} />
        </div>
      </AnimatedSection>

      <div style={{ display: "grid", gap: 10 }}>
        {trainings.map((training, index) => {
          const isOpen = openId === training.id;
          const dateText = formatDateRange(training.date, training.endDate);
          const displayTitle = getDisplayTrainingTitle(training);
          const addressLines = formatAddressLines(training.location);
          const instructorName = formatInstructorName(training.instructor);

          return (
            <AnimatedSection
              key={training.id}
              delayMs={Math.min(90 + index * 55, 420)}
            >
              <AppCard
                style={{
                  padding: 0,
                  overflow: "hidden",
                  borderColor: isOpen ? "#FFC100" : undefined,
                  transition:
                    "border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease",
                  boxShadow: isOpen
                    ? "0 12px 30px rgba(0,0,0,0.08)"
                    : undefined,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : training.id)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "left",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      padding: "18px 20px",
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: 18,
                      alignItems: "start",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <h2
                        style={{
                          margin: 0,
                          color: "#007873",
                          fontSize: 32,
                          fontWeight: 750,
                          lineHeight: 1.12,
                          maxWidth: 520,
                          textWrap: "balance",
                        }}
                      >
                        {displayTitle}
                      </h2>

                      <div
                        style={{
                          marginTop: 18,
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(170px, 1fr))",
                          gap: "10px 18px",
                        }}
                      >
                        <Info label="Zeitraum" value={dateText} />
                      </div>
                    </div>

                    <div
                      style={{
                        minWidth: 92,
                        display: "grid",
                        justifyItems: "end",
                        alignContent: "start",
                        gap: 6,
                        paddingTop: 2,
                      }}
                    >
                      <div
                        style={{
                          color: "#007873",
                          fontWeight: 950,
                          fontSize: 34,
                          lineHeight: 1,
                          textAlign: "right",
                        }}
                      >
                        {training.creditsAward}
                      </div>

                      <div
                        style={{
                          color: "#666666",
                          fontSize: 12,
                          fontWeight: 850,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          textAlign: "right",
                        }}
                      >
                        Credits
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          color: "#007873",
                          fontSize: 24,
                          fontWeight: 900,
                          lineHeight: 1,
                          transition: "transform 180ms ease",
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      >
                        {isOpen ? "−" : "+"}
                      </div>
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <AnimatedSection delayMs={0}>
                    <div
                      style={{
                        borderTop: "1px solid #E6E6E6",
                        padding: "16px 20px 18px",
                        background: "#FFFFFF",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(190px, 1fr))",
                          gap: "16px 20px",
                        }}
                      >
                        <Info
                          label="Dozent"
                          value={instructorName}
                          muted={instructorName === "Noch nicht hinterlegt"}
                        />

                        <Info
                          label="Abschlussdokument"
                          value={training.certificateKindLabel}
                        />

                        <AddressInfo lines={addressLines} />
                      </div>
                    </div>
                  </AnimatedSection>
                ) : null}
              </AppCard>
            </AnimatedSection>
          );
        })}
      </div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid #E6E6E6",
        background: "#FFFFFF",
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
          color: "#1F1F1F",
          fontSize: 24,
          fontWeight: 900,
          lineHeight: 1.1,
        }}
      >
        {value.toLocaleString("de-DE")}
      </div>
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
      <div
        style={{
          fontSize: 12,
          fontWeight: 850,
          color: "#007873",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 3,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: muted ? "#777777" : "#1F1F1F",
          lineHeight: 1.45,
          fontSize: 14,
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
      <div
        style={{
          fontSize: 12,
          fontWeight: 850,
          color: "#007873",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 3,
        }}
      >
        Adresse
      </div>

      {lines.length === 0 ? (
        <div
          style={{
            color: "#777777",
            lineHeight: 1.45,
            fontSize: 14,
            fontStyle: "italic",
          }}
        >
          Noch nicht hinterlegt
        </div>
      ) : (
        <div
          style={{
            color: "#1F1F1F",
            lineHeight: 1.45,
            fontSize: 14,
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

function getDisplayTrainingTitle(training: SerializableTraining) {
  if (training.code?.trim()) {
    return training.code.trim();
  }

  return cleanTrainingTitle(training.title);
}

function cleanTrainingTitle(value: string) {
  return value
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatInstructorName(value: string | null) {
  const extractedName = extractInstructorName(value);

  return extractedName || "Noch nicht hinterlegt";
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

function formatAddressLines(value: string | null) {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatDateRange(startValue: string, endValue: string | null) {
  const start = formatDate(startValue);
  const end = endValue ? formatDate(endValue) : null;

  if (!end || end === start) {
    return start;
  }

  return `${start} bis ${end}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("de-DE");
}

function isUpcoming(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date >= today;
}