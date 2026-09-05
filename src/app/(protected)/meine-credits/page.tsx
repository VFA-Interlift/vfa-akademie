"use client";

import { useEffect, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import PageHeader from "@/components/ui/PageHeader";
import Meldung from "@/components/ui/Meldung";

type CreditTx = {
  id: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
  trainingTitle: string | null;
  certificateTitle: string | null;
  meta: unknown;
};

function reasonLabel(reason: string) {
  if (reason === "CERTIFICATE_ISSUED") return "Zertifikat ausgestellt";
  if (reason === "ADMIN_ADJUST") return "Admin-Korrektur";
  if (reason === "TRAINING_CLAIM") return "Schulungsteilnahme";
  if (reason === "FEEDBACK_SUBMITTED") return "Feedback-Belohnung";
  return reason;
}

export default function MeineCreditsPage() {
  const [txs, setTxs] = useState<CreditTx[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/credit-history", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setError("Verlauf konnte nicht geladen werden."); return; }
        setTxs(d.transactions);
        setTotal(d.creditsTotal);
      })
      .catch(() => setError("Serverfehler."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-main">
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader title="Meine Credits" showTitle />

        <AnimatedSection delayMs={60}>
          {/* Drei Kästen in einer Reihe, auch am Handy (Launch-Runde 05.09.2026). */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 20 }}>
            <SummaryBox label="Credits gesamt" value={total} animate />
            <SummaryBox label="Buchungen" value={txs.length} />
            <SummaryBox label="Gutschriften" value={txs.filter((t) => t.amount > 0).length} />
          </div>
        </AnimatedSection>

        {loading ? (
          <AnimatedSection delayMs={80}><AppCard><div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-basis)" }}>Wird geladen …</div></AppCard></AnimatedSection>
        ) : error ? (
          <AnimatedSection delayMs={80}><Meldung art="fehler">{error}</Meldung></AnimatedSection>
        ) : txs.length === 0 ? (
          <AnimatedSection delayMs={80}><AppCard><div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-basis)" }}>Noch keine Credit-Buchungen vorhanden.</div></AppCard></AnimatedSection>
        ) : (
          <AnimatedSection delayMs={80}>
            <AppCard accent="green">
              <div style={{ display: "grid", gap: 1 }}>
                {txs.map((tx, i) => {
                  const isPos = tx.amount > 0;
                  const title = tx.trainingTitle || tx.certificateTitle || reasonLabel(tx.reason);
                  const date = new Date(tx.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
                  return (
                    <div
                      key={tx.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 0",
                        borderBottom: i < txs.length - 1 ? "1px solid var(--vfa-linie-2)" : "none",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "var(--t-basis)", color: "var(--vfa-text)", lineHeight: "var(--lh-eng)" }}>{title}</div>
                        <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)", marginTop: 3 }}>
                          {date} · {reasonLabel(tx.reason)}
                        </div>
                      </div>
                      <div style={{
                        fontWeight: 800, fontSize: "var(--t-gross)", lineHeight: 1, whiteSpace: "nowrap",
                        color: isPos ? "var(--vfa-gruen-text)" : "var(--vfa-rot-text)",
                      }}>
                        {isPos ? "+" : ""}{tx.amount.toLocaleString("de-DE")} Credits
                      </div>
                    </div>
                  );
                })}
              </div>
            </AppCard>
          </AnimatedSection>
        )}
      </div>
    </main>
  );
}

/** Kennzahl-Kasten nach Kanon: Etikett oben, Zahl darunter (.etikett / .kennzahl). */
function SummaryBox({ label, value, animate = false }: { label: string; value: number; animate?: boolean }) {
  return (
    <div style={{ padding: "14px 16px", background: "var(--vfa-karte)", border: "1px solid var(--vfa-linie-2)", borderRadius: 12, minWidth: 0 }}>
      <div className="etikett">{label}</div>
      <div className="kennzahl" style={{ marginTop: 4 }}>
        {animate ? <AnimatedNumber value={value} /> : value.toLocaleString("de-DE")}
      </div>
    </div>
  );
}
