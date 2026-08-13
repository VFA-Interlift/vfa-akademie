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

export default function AdminWebsitePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

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

  return (
    <main className="page-main">
      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 16 }}>
        <PageHeader backHref="/admin" backLabel="Adminbereich" title="Website-Synchronisation" showTitle />

        <AppCard accent="green">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              So läuft die Verbindung zur Website
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#444444", fontSize: 14, lineHeight: 1.7 }}>
              <li><strong>Kurskalender & Dozenten:</strong> live von der Website (max. 5 Min Cache) – kein Sync nötig.</li>
              <li><strong>Anmeldungen:</strong> kommen sofort per Webhook, wenn jemand das Formular absendet.</li>
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
