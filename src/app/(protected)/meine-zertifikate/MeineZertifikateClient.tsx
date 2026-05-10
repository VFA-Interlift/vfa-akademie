"use client";

import { useMemo, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import StatusBadge from "@/components/ui/StatusBadge";
import CertificateDownloadButton from "@/components/CertificateDownloadButton";

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
    if (selectedYear === "alle") return certificates;

    return certificates.filter((cert) => {
      return getYear(cert.trainingDate) === selectedYear;
    });
  }, [certificates, selectedYear]);

  if (certificates.length === 0) {
    return (
      <AppCard>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#007873" }}>
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
          Sobald eine dir zugeordnete Schulung abgeschlossen ist, wird automatisch
          eine Teilnahmebestätigung oder ein Zertifikat erstellt.
        </p>
      </AppCard>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AppCard accent="yellow">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#007873",
                fontSize: 22,
                fontWeight: 500,
              }}
            >
              Übersicht
            </h2>

            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              Wähle ein Jahr aus und öffne Details nur bei Bedarf.
            </p>
          </div>

          <label style={{ display: "grid", gap: 6, minWidth: 180 }}>
            <span
              style={{
                color: "#333333",
                fontSize: 14,
                fontWeight: 800,
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

      {filteredCertificates.length === 0 ? (
        <AppCard>
          <div style={{ color: "#333333", lineHeight: 1.6 }}>
            Für dieses Jahr wurden keine Zertifikate gefunden.
          </div>
        </AppCard>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filteredCertificates.map((cert) => {
            const isOpen = openId === cert.id;

            return (
              <AppCard key={cert.id} style={{ padding: 0, overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : cert.id)}
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
                        minWidth: 54,
                        minHeight: 42,
                        borderRadius: 999,
                        background: "#FFC100",
                        color: "#1F1F1F",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        fontSize: 14,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {cert.code || "—"}
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
                        {cert.trainingTitle || cert.title}
                      </div>

                      <div
                        style={{
                          marginTop: 5,
                          color: "#333333",
                          fontSize: 14,
                          lineHeight: 1.4,
                        }}
                      >
                        {cert.certificateKindLabel} ·{" "}
                        {formatDate(cert.trainingDate)}
                        {cert.trainingEndDate
                          ? ` bis ${formatDate(cert.trainingEndDate)}`
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
                        {cert.certificateKindLabel}
                      </StatusBadge>

                      {cert.code && (
                        <StatusBadge variant="yellow">
                          Kürzel: {cert.code}
                        </StatusBadge>
                      )}

                      <StatusBadge>
                        Ausgestellt: {formatDate(cert.issuedAt)}
                      </StatusBadge>

                      <StatusBadge>{cert.credits} Credits</StatusBadge>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 14,
                      }}
                    >
                      <Info
                        label="Schulung"
                        value={cert.trainingTitle || cert.title}
                      />

                      <Info
                        label="Zeitraum"
                        value={`${formatDate(cert.trainingDate)}${
                          cert.trainingEndDate
                            ? ` bis ${formatDate(cert.trainingEndDate)}`
                            : ""
                        }`}
                      />

                      {cert.location && (
                        <Info label="Ort" value={cert.location} />
                      )}

                      {cert.instructor && (
                        <Info label="Dozent" value={cert.instructor} />
                      )}
                    </div>

                    {cert.description && (
                      <div
                        style={{
                          marginTop: 16,
                          paddingTop: 16,
                          borderTop: "1px solid #E6E6E6",
                        }}
                      >
                        <Info label="Inhalte" value={cert.description} />
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: 18,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                      }}
                    >
                      <CertificateDownloadButton certificateId={cert.id} />

                      {cert.pdfUrl && (
                        <AppButton href={cert.pdfUrl} variant="secondary">
                          PDF öffnen
                        </AppButton>
                      )}
                    </div>
                  </div>
                )}
              </AppCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getYear(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return String(date.getFullYear());
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("de-DE");
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