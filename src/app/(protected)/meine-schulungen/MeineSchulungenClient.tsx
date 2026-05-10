"use client";

import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import StatusBadge from "@/components/ui/StatusBadge";

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
        <div style={{ fontSize: 18, fontWeight: 800, color: "#007873" }}>
          Aktuell sind dir keine aktiven Schulungen zugeordnet.
        </div>

        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            color: "#333333",
            lineHeight: 1.6,
          }}
        >
          Sobald dir eine Schulung zugeordnet wurde, erscheint sie hier.
        </p>
      </AppCard>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {trainings.map((training) => {
        const isOpen = openId === training.id;

        return (
          <AppCard key={training.id} style={{ padding: 0, overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : training.id)}
              style={{
                width: "100%",
                padding: 18,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    minWidth: 58,
                    minHeight: 42,
                    borderRadius: 999,
                    background: "#FFC100",
                    color: "#1F1F1F",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    fontSize: 14,
                    letterSpacing: "0.04em",
                    padding: "0 10px",
                  }}
                >
                  {training.code || "—"}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: "#007873",
                      fontSize: 18,
                      fontWeight: 800,
                      lineHeight: 1.25,
                    }}
                  >
                    {training.title}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#333333",
                      fontSize: 14,
                      lineHeight: 1.4,
                    }}
                  >
                    {formatDate(training.date)}
                    {training.endDate
                      ? ` bis ${formatDate(training.endDate)}`
                      : ""}
                  </div>
                </div>

                <div
                  style={{
                    color: "#007873",
                    fontWeight: 900,
                    fontSize: 22,
                  }}
                >
                  {isOpen ? "−" : "+"}
                </div>
              </div>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: "0 18px 18px",
                  borderTop: "1px solid #E6E6E6",
                }}
              >
                <div
                  style={{
                    paddingTop: 16,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 16,
                  }}
                >
                  <StatusBadge variant="success">
                    {formatStatus(training.status)}
                  </StatusBadge>

                  <StatusBadge variant="yellow">
                    Nach Abschluss: {training.certificateKindLabel}
                  </StatusBadge>

                  {training.code && (
                    <StatusBadge>Kürzel: {training.code}</StatusBadge>
                  )}

                  <StatusBadge>{training.creditsAward} Credits</StatusBadge>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 14,
                  }}
                >
                  <Info label="Schulung" value={training.title} />

                  <Info
                    label="Zeitraum"
                    value={`${formatDate(training.date)}${
                      training.endDate
                        ? ` bis ${formatDate(training.endDate)}`
                        : ""
                    }`}
                  />

                  {training.location && (
                    <Info label="Ort" value={training.location} />
                  )}

                  {training.instructor && (
                    <Info label="Dozent" value={training.instructor} />
                  )}

                  <Info
                    label="Abschlussdokument"
                    value={training.certificateKindLabel}
                  />

                  <Info
                    label="Credits nach Abschluss"
                    value={String(training.creditsAward)}
                  />
                </div>

                {training.description && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #E6E6E6",
                    }}
                  >
                    <Info label="Inhalte" value={training.description} />
                  </div>
                )}

                <div
                  style={{
                    marginTop: 18,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <AppButton
                    href={`/training/${training.id}`}
                    variant="primary"
                  >
                    Detailseite öffnen
                  </AppButton>
                </div>
              </div>
            )}
          </AppCard>
        );
      })}
    </div>
  );
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

function formatDate(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("de-DE");
}

function formatStatus(status: string) {
  if (status === "PENDING") return "Ausstehend";
  if (status === "CONFIRMED") return "Angemeldet";
  if (status === "ATTENDED") return "Teilgenommen";
  if (status === "COMPLETED") return "Abgeschlossen";
  if (status === "CERTIFICATE_ISSUED") return "Zertifikat erstellt";
  if (status === "CANCELLED") return "Storniert";
  if (status === "NO_SHOW") return "Nicht teilgenommen";

  return status;
}