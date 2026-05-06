"use client";

import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AdminCertificatesPage() {
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generateCertificates() {
    if (
      !confirm(
        "Zertifikate für alle abgeschlossenen Schulungen erstellen und Credits vergeben?"
      )
    ) {
      return;
    }

    setLoading(true);
    setMsg("");
    setMsgOk(false);

    try {
      const res = await fetch("/api/admin/certificates/generate", {
        method: "POST",
      });

      const data = await res.json();

      if (!data.ok) {
        setMsg(data.error ?? "Fehler beim Erstellen der Zertifikate.");
        setMsgOk(false);
        return;
      }

      setMsg(
        `Fertig. Geprüfte Zuordnungen: ${data.checkedEnrollments}. Zertifikate erstellt: ${data.createdCertificates}. Vergebene Credits: ${data.awardedCredits}.`
      );
      setMsgOk(true);
    } catch {
      setMsg("Serverfehler beim Erstellen der Zertifikate.");
      setMsgOk(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader
          title="Zertifikate verwalten"
          description="Hier kannst du abgeschlossene Schulungen verarbeiten. Die App erstellt dabei automatisch Teilnahmebestätigungen oder Zertifikate und vergibt erst dann die zugehörigen Credits."
        />

        {msg && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              border: msgOk
                ? "1px solid #007873"
                : "1px solid rgba(176,0,32,0.28)",
              background: msgOk
                ? "rgba(0,120,115,0.08)"
                : "rgba(176,0,32,0.08)",
              color: msgOk ? "#007873" : "#B00020",
              fontWeight: 800,
              lineHeight: 1.5,
            }}
          >
            {msg}
          </div>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          <AppCard accent="green">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#007873",
                    fontSize: 24,
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  Abgeschlossene Schulungen verarbeiten
                </h2>

                <p
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: "#333333",
                    lineHeight: 1.6,
                    maxWidth: 720,
                  }}
                >
                  Die App sucht alle Teilnehmer-Zuordnungen, deren Schulung
                  abgeschlossen ist und für die noch kein Zertifikat existiert.
                  Für diese Einträge wird automatisch ein Zertifikat oder eine
                  Teilnahmebestätigung erstellt.
                </p>
              </div>

              <StatusBadge variant="yellow">Automatik</StatusBadge>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <Info
                label="Wann wird verarbeitet?"
                value="Wenn das Enddatum der Schulung in der Vergangenheit liegt."
              />

              <Info
                label="Was wird erstellt?"
                value="Je nach Kürzel: Teilnahmebestätigung, Zertifikat oder VDI-Zertifikat."
              />

              <Info
                label="Wann gibt es Credits?"
                value="Credits werden erst bei der Zertifikatserstellung vergeben."
              />
            </div>

            <AppButton
              onClick={generateCertificates}
              disabled={loading}
              variant="primary"
            >
              {loading ? "Wird verarbeitet..." : "Zertifikate erstellen"}
            </AppButton>
          </AppCard>

          <AppCard>
            <h2
              style={{
                margin: 0,
                color: "#007873",
                fontSize: 24,
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              Hinweis zur automatischen Verarbeitung
            </h2>

            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              Diese manuelle Funktion ist vor allem zum Testen und Nachverarbeiten
              gedacht. Im Normalbetrieb übernimmt der Cronjob die automatische
              Erstellung nach Schulungsende. Bereits vorhandene Zertifikate werden
              nicht doppelt erstellt.
            </p>
          </AppCard>
        </div>
      </div>
    </main>
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