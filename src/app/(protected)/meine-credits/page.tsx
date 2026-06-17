"use client";

import { useEffect, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import PageHeader from "@/components/ui/PageHeader";

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
  if (reason === "TRAINING_CLAIM") return "Schulungs-Claim";
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
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <AnimatedSection delayMs={0}>
          <PageHeader title="Meine Credits" description="Alle Credit-Buchungen auf einen Blick." showTitle />
        </AnimatedSection>

        <AnimatedSection delayMs={60}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
            <SummaryBox label="Credits gesamt" value={total} color="#007873" />
            <SummaryBox label="Buchungen" value={txs.length} color="#888888" />
            <SummaryBox label="Davon +" value={txs.filter((t) => t.amount > 0).length} color="#005f5b" />
          </div>
        </AnimatedSection>

        {loading ? (
          <AnimatedSection delayMs={80}><AppCard><div style={{ color: "#888888", fontSize: 14 }}>Wird geladen…</div></AppCard></AnimatedSection>
        ) : error ? (
          <AnimatedSection delayMs={80}><AppCard><div style={{ color: "#B00020", fontSize: 14 }}>{error}</div></AppCard></AnimatedSection>
        ) : txs.length === 0 ? (
          <AnimatedSection delayMs={80}><AppCard><div style={{ color: "#888888", fontSize: 14 }}>Noch keine Credit-Buchungen vorhanden.</div></AppCard></AnimatedSection>
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
                        borderBottom: i < txs.length - 1 ? "1px solid #F0F0F0" : "none",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1F1F1F", lineHeight: 1.2 }}>{title}</div>
                        <div style={{ fontSize: 12, color: "#888888", marginTop: 3 }}>
                          {date} · {reasonLabel(tx.reason)}
                        </div>
                      </div>
                      <div style={{
                        fontWeight: 900, fontSize: 18, lineHeight: 1, whiteSpace: "nowrap",
                        color: isPos ? "#007873" : "#B00020",
                      }}>
                        {isPos ? "+" : ""}{tx.amount.toLocaleString("de-DE")} Cr.
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

function SummaryBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ padding: "14px 16px", background: "#FFFFFF", border: "1px solid #EFEFEF", borderRadius: 12 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value.toLocaleString("de-DE")}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#888888", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{label}</div>
    </div>
  );
}
