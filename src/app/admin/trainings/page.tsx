"use client";

import { useEffect, useState } from "react";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCertificateKind } from "@/lib/certificates/templates";
import { formatInstructorName } from "@/lib/trainings/format";
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
  cancelledAt?: string | null;
};

type TrainingsResponse = { ok: true; trainings: Training[] } | { ok: false; error: string };

export default function AdminTrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aktionId, setAktionId] = useState<string | null>(null);

  async function absageUmschalten(t: Training) {
    const absagen = !t.cancelledAt;
    if (absagen && !window.confirm(`Kurs „${t.code?.trim() || t.title}" wirklich absagen? Erinnerungen und Zertifikate für diesen Kurs entfallen. Die Anmeldungen bleiben erhalten.`)) {
      return;
    }
    setAktionId(t.id);
    try {
      const res = await fetch(`/api/admin/trainings/${t.id}/cancel`, {
        method: absagen ? "POST" : "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        setTrainings((prev) =>
          prev.map((x) => (x.id === t.id ? { ...x, cancelledAt: absagen ? new Date().toISOString() : null } : x))
        );
      } else {
        setError(data.error ?? "Aktion fehlgeschlagen.");
      }
    } catch {
      setError("Serverfehler.");
    } finally {
      setAktionId(null);
    }
  }

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
          <a href="/admin" style={{ color: "#007873", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>← Adminbereich</a>
        </div>
        <PageHeader
          title="Schulungen in der App-DB"
          description="Alle Schulungen in der App-Datenbank. Neue kommen täglich automatisch von der Website; ältere stammen aus dem einmaligen Cobra-Import."
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
                <div style={{ color: "#555555" }}>Noch keine Schulungen in der Datenbank. Die Website-Synchronisation ist noch nicht gelaufen.</div>
              </AppCard>
            ) : (
              trainings.map((t) => (
                <AppCard key={t.id} style={t.cancelledAt ? { opacity: 0.7 } : undefined}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#1F1F1F", lineHeight: 1.2, textDecoration: t.cancelledAt ? "line-through" : "none" }}>{t.title}</div>
                      {t.location && <div style={{ color: "#555555", fontSize: 13, marginTop: 3 }}>{t.location}</div>}
                      {t.instructor && formatInstructorName(t.instructor) !== "Noch nicht hinterlegt" && (
                        <div style={{ color: "#888888", fontSize: 12, marginTop: 2 }}>{formatInstructorName(t.instructor)}</div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                      {t.cancelledAt && <StatusBadge variant="warning">Abgesagt</StatusBadge>}
                      {t.code ? <StatusBadge>{t.code}</StatusBadge> : <StatusBadge variant="warning">Kein Kürzel</StatusBadge>}
                      <StatusBadge variant="yellow">{formatCertificateKind(t.certificateKind)}</StatusBadge>
                      <StatusBadge variant="success">{t.creditsAward} Cr.</StatusBadge>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ fontSize: 13, color: "#888888" }}>
                      {formatDate(t.date)}{t.endDate ? ` – ${formatDate(t.endDate)}` : ""}
                      {t.cobraId ? ` · Cobra-ID ${t.cobraId}` : " · kein Cobra-ID"}
                    </div>
                    <button
                      type="button"
                      disabled={aktionId === t.id}
                      onClick={() => absageUmschalten(t)}
                      style={{
                        padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: "pointer",
                        border: t.cancelledAt ? "1px solid #007873" : "1px solid #B00020",
                        background: "#FFFFFF", color: t.cancelledAt ? "#007873" : "#B00020",
                        opacity: aktionId === t.id ? 0.6 : 1,
                      }}
                    >
                      {t.cancelledAt ? "Absage zurücknehmen" : "Kurs absagen"}
                    </button>
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
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
