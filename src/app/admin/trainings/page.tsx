"use client";

import { useEffect, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCertificateKind } from "@/lib/certificates/templates";
import type { CertificateKind } from "@prisma/client";

type Training = {
  id: string;
  title: string;
  code: string | null;
  certificateKind: CertificateKind | null;
  date: string;
  endDate: string | null;
  location: string | null;
  instructor: string | null;
  creditsAward: number;
  cobraId?: string | null;
};

type TrainingsResponse = { ok: true; trainings: Training[] } | { ok: false; error: string };

export default function AdminTrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/trainings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: TrainingsResponse) => {
        if (d.ok) setTrainings(d.trainings);
        else setError(d.error);
      })
      .catch(() => setError("Schulungen konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-main">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 10 }}>
          <a href="/admin/cobra" style={{ color: "#007873", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>← Cobra/WebConnect</a>
        </div>
        <PageHeader
          title="Schulungen in der App-DB"
          description="Alle Schulungen, die per Cobra-Sync in die App importiert wurden. Neue Schulungen kommen täglich automatisch aus Cobra."
        />

        {error && (
          <div style={{ marginBottom: 18, padding: "12px 14px", border: "1px solid rgba(176,0,32,0.28)", background: "rgba(176,0,32,0.08)", color: "#B00020", fontWeight: 800 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: "#555555", lineHeight: 1.6 }}>Wird geladen...</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {trainings.length === 0 ? (
              <AppCard>
                <div style={{ color: "#555555" }}>Noch keine Schulungen in der DB. Cobra-Sync hat noch nicht gelaufen oder Cobra liefert noch nichts.</div>
              </AppCard>
            ) : (
              trainings.map((t) => (
                <AppCard key={t.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#1F1F1F", lineHeight: 1.2 }}>{t.title}</div>
                      {t.location && <div style={{ color: "#555555", fontSize: 13, marginTop: 3 }}>{t.location}</div>}
                      {t.instructor && <div style={{ color: "#888888", fontSize: 12, marginTop: 2 }}>{t.instructor}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                      {t.code ? <StatusBadge>{t.code}</StatusBadge> : <StatusBadge variant="warning">Kein Kürzel</StatusBadge>}
                      <StatusBadge variant="yellow">{formatCertificateKind(t.certificateKind)}</StatusBadge>
                      <StatusBadge variant="success">{t.creditsAward} Cr.</StatusBadge>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#888888" }}>
                    {formatDate(t.date)}{t.endDate ? ` – ${formatDate(t.endDate)}` : ""}
                    {t.cobraId ? ` · Cobra-ID ${t.cobraId}` : " · kein Cobra-ID"}
                  </div>
                </AppCard>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE");
}
