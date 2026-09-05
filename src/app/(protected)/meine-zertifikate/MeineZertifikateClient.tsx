"use client";

import { useMemo, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import Kennzahl from "@/components/ui/Kennzahl";
import AppButton from "@/components/ui/AppButton";
import AppSelect from "@/components/ui/AppSelect";
import StatusBadge from "@/components/ui/StatusBadge";
import CertificateDownloadButton from "@/components/CertificateDownloadButton";
import ZertifikatTeilen from "@/components/ZertifikatTeilen";
import AnimatedSection from "@/components/ui/AnimatedSection";
import {
  formatDate,
  formatDateRange,
  formatInstructorName,
  formatVenueLines,
} from "@/lib/trainings/format";

type SerializableCertificate = {
  id: string;
  enrollmentId: string;
  feedbackGiven: boolean;
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
  // "" = alle Jahre (Platzhalter von AppSelect).
  const [selectedYear, setSelectedYear] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const years = useMemo(() => {
    const values = certificates
      .map((cert) => getYear(cert.trainingDate))
      .filter((year): year is string => Boolean(year));

    return Array.from(new Set(values)).sort((a, b) => Number(b) - Number(a));
  }, [certificates]);

  const filteredCertificates = useMemo(() => {
    if (selectedYear === "") {
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
          <div className="balance" style={{ fontSize: "var(--t-gross)", fontWeight: 700, color: "var(--vfa-gruen-text)" }}>
            Aktuell sind noch keine Zertifikate vorhanden.
          </div>
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
          <Kennzahl label="Zertifikate" value={issuedCount} />
          <Kennzahl label="Erhaltene Credits" value={totalCredits} />
        </div>
      </AnimatedSection>

      <AnimatedSection delayMs={80}>
        {/* Ohne gelben Rand: Der Filter ist nicht die eine wichtige Karte
            der Seite (Launch-Runde 05.09.2026). */}
        <AppCard>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div className="etikett">Jahresfilter</div>

            <div style={{ minWidth: 180, flex: "0 1 220px" }}>
              <AppSelect
                label="Jahr"
                value={selectedYear}
                onChange={(value) => {
                  setSelectedYear(value);
                  setOpenId(null);
                }}
                options={years.map((year) => ({ value: year, label: year }))}
                placeholder="Alle Jahre"
              />
            </div>
          </div>
        </AppCard>
      </AnimatedSection>

      {filteredCertificates.length === 0 ? (
        <AnimatedSection delayMs={140}>
          <AppCard>
            <div style={{ color: "var(--vfa-text)", lineHeight: 1.6 }}>
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
            const addressLines = formatVenueLines(cert.location, cert.instructor);
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
                    // Grüner Streifen links: gibt der Kachel eine Urkunden-
                    // Anmutung. Nach borderColor gesetzt, damit er auch im
                    // offenen Zustand (gelber Rand) grün bleibt.
                    borderLeftColor: "#007873",
                    borderLeftWidth: 4,
                    borderLeftStyle: "solid",
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
                            color: "var(--vfa-gruen-text)",
                            fontSize: "var(--t-gross)",
                            fontWeight: 700,
                            lineHeight: "var(--lh-eng)",
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
                        {/* Kennzahl-Größe aus der Staffel statt clamp bis 34px;
                            Petrol bleibt, weil die Zahl hier der Akzent der
                            Karte ist, kein Statistikkasten (05.09.2026). */}
                        <div
                          style={{
                            color: "var(--vfa-gruen-text)",
                            fontWeight: 800,
                            fontSize: "var(--t-zahl)",
                            lineHeight: 1,
                            textAlign: "right",
                          }}
                        >
                          {cert.credits}
                        </div>

                        <div
                          style={{
                            color: "var(--vfa-text-2)",
                            fontSize: "var(--t-label)",
                            fontWeight: 700,
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
                            color: "var(--vfa-gruen-text)",
                            fontSize: "var(--t-titel)",
                            fontWeight: 800,
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
                          borderTop: "1px solid var(--vfa-linie)",
                          padding: "16px 20px 18px",
                          background: "var(--vfa-karte)",
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
                              borderTop: "1px solid var(--vfa-linie)",
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
                              label="Zertifikat ansehen"
                            />
                          ) : (
                            <StatusBadge>Dokument wird vorbereitet</StatusBadge>
                          )}

                          <ZertifikatTeilen
                            titel={displayTitle}
                            zeitraum={dateText}
                            credits={cert.credits}
                          />

                          {cert.feedbackGiven ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                minHeight: 42,
                                padding: "10px 18px",
                                borderRadius: 999,
                                background: "var(--vfa-karte-2)",
                                color: "var(--vfa-text-3)",
                                fontSize: "var(--t-klein)",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                              }}
                            >
                              ★ Feedback abgegeben
                            </span>
                          ) : (
                            <AppButton href={`/feedback/${cert.enrollmentId}`} variant="yellow">
                              ★ Feedback abgeben (+10)
                            </AppButton>
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