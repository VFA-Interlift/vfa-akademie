"use client";

import { useMemo, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import StatusBadge from "@/components/ui/StatusBadge";
import CertificateDownloadButton from "@/components/CertificateDownloadButton";
import AnimatedSection from "@/components/ui/AnimatedSection";
import {
  formatDate,
  formatDateRange,
  formatInstructorName,
  formatAddressLines,
} from "@/lib/trainings/format";

type SerializableCertificate = {
  id: string;
  title: string;
  issuedAt: string;
  credits: number;
  status: string;

  code: string | null;
  certificateKind: string | null;
  certificateKindLabel: string;

  trainingTitle: string;
  trainingDate: string;
  trainingEndDate: string | null;
  location: string | null;
  instructor: string | null;
  description: string | null;
  pdfUrl: string | null;
};

export default function MeineZertifikateClient({
  certificates,
}: {
  certificates: SerializableCertificate[];
}) {
  const [selectedYear, setSelectedYear] = useState("alle");
  const [openId, setOpenId] = useState<string | null>(null);

  const years = useMemo(() => {
    const values = certificates
      .map((cert) => getYear(cert.trainingDate))
      .filter((year): year is string => Boolean(year));

    return Array.from(new Set(values)).sort((a, b) => Number(b) - Number(a));
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    if (selectedYear === "alle") {
      return certificates;
    }

    return certificates.filter((cert) => {
      return getYear(cert.trainingDate) === selectedYear;
    });
  }, [certificates, selectedYear]);

  if (certificates.length === 0) {
    return (
      <AnimatedSection>
        <AppCard>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#007873" }}>
            Aktuell sind noch keine Zertifikate vorhanden.
          </div>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              color: "#333333",
              lineHeight: 1.6,
            }}
          >
            Sobald eine Schulung abgeschlossen ist, erscheinen deine
            Teilnahmebestätigungen und Zertifikate hier.
          </p>
        </AppCard>
      </AnimatedSection>
    );
  }

  const issuedCount = certificates.filter((cert) =>
    isDownloadableCertificate(cert)
  ).length;

  const totalCredits = certificates.reduce(
    (sum, cert) => sum + cert.credits,
    0
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AnimatedSection delayMs={0}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          <SummaryBox label="Zertifikate" value={issuedCount} />
          <SummaryBox label="Erhaltene Credits" value={totalCredits} />
        </div>
      </AnimatedSection>

      <AnimatedSection delayMs={80}>
        <AppCard accent="yellow">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                color: "#007873",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Jahresfilter
            </div>

            <label style={{ display: "grid", gap: 6, minWidth: 180 }}>
              <span
                style={{
                  color: "#333333",
                  fontSize: 13,
                  fontWeight: 850,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Jahr
              </span>

              <select
                value={selectedYear}
                onChange={(event) => {
                  setSelectedYear(event.target.value);
                  setOpenId(null);
                }}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 999,
                  border: "1px solid #C7C7C7",
                  background: "#FFFFFF",
                  color: "#1F1F1F",
                  fontSize: 15,
                  fontWeight: 800,
                  outlineColor: "#007873",
                }}
              >
                <option value="alle">Alle Jahre</option>

                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </AppCard>
      </AnimatedSection>

      {filteredCertificates.length === 0 ? (
        <AnimatedSection delayMs={140}>
          <AppCard>
            <div style={{ color: "#333333", lineHeight: 1.6 }}>
              Für dieses Jahr wurden keine Zertifikate gefunden.
            </div>
          </AppCard>
        </AnimatedSection>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filteredCertificates.map((cert, index) => {
            const isOpen = openId === cert.id;
            const displayTitle = getDisplayCertificateTitle(cert);
            const dateText = formatDateRange(
              cert.trainingDate,
              cert.trainingEndDate
            );
            const addressLines = formatAddressLines(cert.location);
            const instructorName = formatInstructorName(cert.instructor);
            const canDownload = isDownloadableCertificate(cert);

            return (
              <AnimatedSection
                key={cert.id}
                delayMs={Math.min(140 + index * 55, 420)}
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
                    onClick={() => setOpenId(isOpen ? null : cert.id)}
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
                            fontSize: "clamp(18px, 5vw, 32px)",
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

                          <Info
                            label="Ausgestellt am"
                            value={formatDate(cert.issuedAt)}
                          />
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
                            fontSize: "clamp(22px, 5vw, 34px)",
                            lineHeight: 1,
                            textAlign: "right",
                          }}
                        >
                          {cert.credits}
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
                            transform: isOpen
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
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
                            value={cert.certificateKindLabel}
                          />

                          <Info
                            label="Status"
                            value={formatStatus(cert.status)}
                          />

                          <AddressInfo lines={addressLines} />
                        </div>

                        {cert.description ? (
                          <div
                            style={{
                              marginTop: 16,
                              paddingTop: 16,
                              borderTop: "1px solid #E6E6E6",
                            }}
                          >
                            <Info label="Inhalte" value={cert.description} />
                          </div>
                        ) : null}

                        <div
                          style={{
                            marginTop: 18,
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          {canDownload ? (
                            <CertificateDownloadButton
                              certificateId={cert.id}
                              label="Dokument herunterladen"
                            />
                          ) : (
                            <StatusBadge>Dokument wird vorbereitet</StatusBadge>
                          )}
                        </div>
                      </div>
                    </AnimatedSection>
                  ) : null}
                </AppCard>
              </AnimatedSection>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid #EFEFEF",
        background: "#FFFFFF",
        padding: "14px 16px",
        borderRadius: 12,
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

function isDownloadableCertificate(cert: SerializableCertificate) {
  return cert.status === "ISSUED";
}

function getDisplayCertificateTitle(cert: SerializableCertificate) {
  if (cert.code?.trim()) return cert.code.trim();
  const fallback = cert.trainingTitle || cert.title;
  return fallback.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

function getYear(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return String(date.getFullYear());
}

function formatStatus(status: string) {
  if (status === "ISSUED") return "Ausgestellt";
  if (status === "REVOKED") return "Widerrufen";

  return status;
}