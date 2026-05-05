"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";

export default function AdminCertificatesPage() {
  const [msg, setMsg] = useState("");
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

    try {
      const res = await fetch("/api/admin/certificates/generate", {
        method: "POST",
      });

      const data = await res.json();

      if (!data.ok) {
        setMsg(`⚠️ ${data.error ?? "Fehler beim Erstellen der Zertifikate."}`);
        return;
      }

      setMsg(
        `✅ Fertig. Zertifikate erstellt: ${data.createdCertificates}. Vergebene Credits: ${data.awardedCredits}.`
      );
    } catch {
      setMsg("⚠️ Serverfehler beim Erstellen der Zertifikate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        background: "radial-gradient(circle at top, #111 0%, #000 80%)",
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BackButton label="Zurück" />
          <h1 style={{ fontSize: 42, margin: 0 }}>Zertifikate verwalten</h1>
        </div>

        <p style={{ marginTop: 18, color: "#aaa", lineHeight: 1.6 }}>
          Hier können Zertifikate für abgeschlossene Schulungen erstellt werden.
          Dabei werden die Credits erst dann vergeben, wenn das Zertifikat
          erzeugt wird.
        </p>

        {msg && (
          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {msg}
          </div>
        )}

        <div
          style={{
            marginTop: 32,
            padding: 18,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Abgeschlossene Schulungen verarbeiten</h2>

          <p style={{ color: "#aaa", lineHeight: 1.6 }}>
            Die App sucht alle zugeordneten Schulungen, deren Enddatum in der
            Vergangenheit liegt und für die noch kein Zertifikat existiert.
          </p>

          <button
            onClick={generateCertificates}
            disabled={loading}
            style={{
              marginTop: 12,
              padding: "12px 16px",
              borderRadius: 14,
              fontWeight: 800,
              background: "#fff",
              color: "#000",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Wird verarbeitet..." : "Zertifikate erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}