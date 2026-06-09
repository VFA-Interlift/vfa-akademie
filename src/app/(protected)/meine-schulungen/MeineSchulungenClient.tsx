"use client";

import { useState } from "react";
import AppCard from "@/components/ui/AppCard";

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

      <div style={{ display: "grid", gap: 10 }}>
        {trainings.map((training) => {
          const isOpen = openId === training.id;
          const dateText = formatDateRange(training.date, training.endDate);
          const displayTitle = getDisplayTrainingTitle(training);
          const addressLines = formatAddressLines(training.location);
          const instructorName = formatInstructorName(training.instructor);

          return (
            <AppCard
              key={training.id}
              style={{
                padding: 0,
                overflow: "hidden",
                borderColor: isOpen ? "#FFC100" : undefined,
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
                      }}
                    >
                      {isOpen ? "−" : "+"}
                    </div>
                  </div>
                </div>
              </button>

              {isOpen ? (
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
              ) : null}
            </AppCard>
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
  if (!value?.trim()) {
    return "Noch nicht hinterlegt";
  }

  const cleaned = value.replace(/\s+/g, " ").trim();

  const withoutAddressParts = cleaned
    .split(/[,;|/]/)[0]
    .replace(/\b(E-Mail|Email|Mail|Telefon|Tel\.?|Mobil|Adresse|Straße|Str\.?|PLZ|Ort)\b.*$/i, "")
    .trim();

  const parts = withoutAddressParts.split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "Noch nicht hinterlegt";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]} ${parts[1]}`;
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