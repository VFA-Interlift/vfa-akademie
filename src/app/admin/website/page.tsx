"use client";

import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import Meldung from "@/components/ui/Meldung";
import PageHeader from "@/components/ui/PageHeader";

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
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader title="Website-Synchronisation" showTitle />

        <div style={{ display: "grid", gap: 16 }}>
          <AppCard accent="green">
            <div style={{ display: "grid", gap: 10 }}>
              <div className="etikett">So läuft die Verbindung zur Website</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--vfa-text-2)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
                <li><strong>Kurskalender & Dozenten:</strong> kommen live von der Website (höchstens fünf Minuten zwischengespeichert), kein Abgleich nötig.</li>
                <li><strong>Anmeldungen:</strong> kommen sofort an, wenn jemand das Formular auf der Website absendet.</li>
                <li><strong>App-Datenbank (für Anmeldungen, Zertifikate, Credits):</strong> wird mit dem Knopf unten aus den Website-Schulungen befüllt und aktualisiert.</li>
              </ul>
            </div>
          </AppCard>

          <AppCard>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "var(--t-gross)", fontWeight: 700, color: "var(--vfa-gruen-text)", lineHeight: "var(--lh-eng)" }}>Schulungen in die App-Datenbank übernehmen</h2>
                <p style={{ margin: "6px 0 0", color: "var(--vfa-text-2)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
                  Übernimmt alle Schulungen von der Website in die App-Datenbank (Zuordnung über den
                  Kurscode, nichts wird gelöscht). Nach Änderungen an Schulungen auf der Website hier
                  einmal klicken. Neue Anmeldungen werden automatisch zugeordnet.
                </p>
              </div>

              <div>
                <AppButton onClick={runSync} disabled={loading}>
                  {loading ? "Synchronisiert …" : "Jetzt von der Website synchronisieren"}
                </AppButton>
              </div>

              {result && (
                <Meldung art={result.ok ? "erfolg" : "fehler"}>
                  {result.ok ? (
                    <>
                      <strong>Fertig:</strong> {result.received} Schulungen von der Website gelesen ·{" "}
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
                </Meldung>
              )}
            </div>
          </AppCard>

          <AppCard accent="none">
            <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
              Der frühere Cobra-Abgleich ist weiterhin unter{" "}
              <a href="/admin/cobra" style={{ color: "var(--vfa-gruen-text)", fontWeight: 700 }}>/admin/cobra</a>{" "}
              erreichbar, wird aber nicht mehr für den Kalender genutzt.
            </div>
          </AppCard>
        </div>
      </div>
    </main>
  );
}
