"use client";

import { useState } from "react";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";

const TEAL = "#007873";

type SyncResult = {
  ok: boolean;
  received?: number;
  created?: number;
  updated?: number;
  skipped?: { kurscode: string; reason: string }[];
  message?: string;
  error?: string;
};

type AnmeldungenResult = {
  ok: boolean;
  received?: number;
  normalized?: number;
  skipped?: number;
  created?: number;
  updated?: number;
  linkedToTraining?: number;
  enrolled?: number;
  message?: string;
  error?: string;
};

export default function AdminWebsitePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [anmLoading, setAnmLoading] = useState(false);
  const [anmResult, setAnmResult] = useState<AnmeldungenResult | null>(null);

  async function runSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/wix/sync-trainings", { method: "POST" });
      const data = (await res.json()) as SyncResult;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "NETZWERKFEHLER" });
    } finally {
      setLoading(false);
    }
  }

  async function runAnmeldungenSync() {
    setAnmLoading(true);
    setAnmResult(null);
    try {
      const res = await fetch("/api/admin/wix/sync-anmeldungen", { method: "POST" });
      const data = (await res.json()) as AnmeldungenResult;
      setAnmResult(data);
    } catch {
      setAnmResult({ ok: false, error: "NETZWERKFEHLER" });
    } finally {
      setAnmLoading(false);
    }
  }

  return (
    <main className="page-main">
      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ marginBottom: 0 }}>
          <a href="/admin" style={{ color: TEAL, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>← Adminbereich</a>
        </div>
        <PageHeader title="Website-Synchronisation" showTitle />

        <AppCard accent="green">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              So läuft die Verbindung zur Website
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#444444", fontSize: 14, lineHeight: 1.7 }}>
              <li><strong>Kurskalender & Dozenten:</strong> live von der Website (max. 5 Min Cache) – kein Sync nötig.</li>
              <li><strong>Anmeldungen:</strong> kommen sofort per Webhook, wenn jemand das Formular absendet – und werden zusätzlich täglich komplett aus der Website-Collection „Schulungsanmeldung" nachgezogen (Button unten).</li>
              <li><strong>App-Datenbank (für Anmeldungen, Zertifikate, Credits):</strong> wird mit dem Button unten aus den Website-Kursen befüllt bzw. aktualisiert.</li>
            </ul>
          </div>
        </AppCard>

        <AppCard>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1F1F1F" }}>Kurse in die App-DB übernehmen</div>
              <p style={{ margin: "6px 0 0", color: "#666666", fontSize: 14, lineHeight: 1.6 }}>
                Übernimmt alle Schulungen aus dem Website-CMS in die App-Datenbank (Matching per
                Kurscode, nichts wird gelöscht). Nach Änderungen an Kursen auf der Website hier
                einmal klicken – oder einfach laufen lassen, neue Anmeldungen matchen automatisch.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={runSync}
                disabled={loading}
                style={{
                  minHeight: 46,
                  padding: "12px 26px",
                  borderRadius: 999,
                  border: "none",
                  background: loading ? "#8CBFBC" : TEAL,
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Synchronisiert…" : "↺ Jetzt von der Website synchronisieren"}
              </button>
            </div>

            {result && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: result.ok ? "1px solid rgba(0,120,115,0.3)" : "1px solid rgba(176,0,32,0.3)",
                  background: result.ok ? "rgba(0,120,115,0.06)" : "rgba(176,0,32,0.06)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: result.ok ? "#005f5b" : "#B00020",
                }}
              >
                {result.ok ? (
                  <>
                    <strong>Fertig:</strong> {result.received} Kurse von der Website gelesen ·{" "}
                    {result.created} neu angelegt · {result.updated} aktualisiert
                    {result.skipped && result.skipped.length > 0 && (
                      <> · {result.skipped.length} übersprungen ({result.skipped.map((s) => s.kurscode).join(", ")})</>
                    )}
                  </>
                ) : (
                  <>
                    <strong>Fehler:</strong> {result.message || result.error || "Unbekannter Fehler"}
                  </>
                )}
              </div>
            )}
          </div>
        </AppCard>

        <AppCard>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1F1F1F" }}>Anmeldungen aus der Website ziehen</div>
              <p style={{ margin: "6px 0 0", color: "#666666", fontSize: 14, lineHeight: 1.6 }}>
                Holt alle Einträge der Website-Collection „Schulungsanmeldung" in die App und trägt jede
                Person per Kurscode in die richtige Schulung ein (bestehende Konten werden eingeschrieben).
                Läuft täglich automatisch – hier für die sofortige Übernahme.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={runAnmeldungenSync}
                disabled={anmLoading}
                style={{
                  minHeight: 46,
                  padding: "12px 26px",
                  borderRadius: 999,
                  border: "none",
                  background: anmLoading ? "#8CBFBC" : TEAL,
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  cursor: anmLoading ? "wait" : "pointer",
                }}
              >
                {anmLoading ? "Synchronisiert…" : "↺ Anmeldungen jetzt synchronisieren"}
              </button>
            </div>

            {anmResult && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: anmResult.ok ? "1px solid rgba(0,120,115,0.3)" : "1px solid rgba(176,0,32,0.3)",
                  background: anmResult.ok ? "rgba(0,120,115,0.06)" : "rgba(176,0,32,0.06)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: anmResult.ok ? "#005f5b" : "#B00020",
                }}
              >
                {anmResult.ok ? (
                  <>
                    <strong>Fertig:</strong> {anmResult.received} Anmeldungen gelesen ·{" "}
                    {anmResult.created} neu · {anmResult.updated} aktualisiert ·{" "}
                    {anmResult.linkedToTraining} einer Schulung zugeordnet · {anmResult.enrolled} eingeschrieben
                    {anmResult.skipped ? <> · {anmResult.skipped} ohne Kurscode/Name übersprungen</> : null}
                  </>
                ) : (
                  <>
                    <strong>Fehler:</strong> {anmResult.message || anmResult.error || "Unbekannter Fehler"}
                  </>
                )}
              </div>
            )}
          </div>
        </AppCard>

        <AppCard accent="none">
          <div style={{ fontSize: 13, color: "#888888", lineHeight: 1.6 }}>
            Der frühere Cobra-Sync ist weiterhin unter{" "}
            <a href="/admin/cobra" style={{ color: TEAL, fontWeight: 700 }}>/admin/cobra</a>{" "}
            erreichbar, wird aber nicht mehr für den Kalender genutzt.
          </div>
        </AppCard>
      </div>
    </main>
  );
}
