"use client";

import { useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import Meldung from "@/components/ui/Meldung";
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
    if (absagen && !window.confirm(`Schulung „${t.code?.trim() || t.title}“ wirklich absagen? Erinnerungen und Zertifikate für diese Schulung entfallen. Die Anmeldungen bleiben erhalten.`)) {
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
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <PageHeader backHref="/admin" backLabel="Adminbereich" title="Schulungen in der App-Datenbank" />
        {/* PageHeader zeigt keine Beschreibung — der Satz steht deshalb als Absatz unter dem Band. */}
        <p style={{ margin: "0 0 20px", fontSize: "var(--t-basis)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
          Alle Schulungen in der App-Datenbank. Neue kommen täglich automatisch von der Website;
          ältere stammen aus dem einmaligen Cobra-Import.
        </p>

        {error && (
          <Meldung art="fehler" style={{ marginBottom: 18 }}>
            {error}
          </Meldung>
        )}

        {loading ? (
          <div style={{ color: "var(--vfa-text-2)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>Wird geladen …</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {trainings.length === 0 ? (
              <AppCard>
                <div style={{ color: "var(--vfa-text-2)", fontSize: "var(--t-basis)" }}>Noch keine Schulungen in der App-Datenbank. Die Website-Synchronisation ist noch nicht gelaufen.</div>
              </AppCard>
            ) : (
              trainings.map((t) => (
                <AppCard key={t.id} style={t.cancelledAt ? { opacity: 0.7 } : undefined}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ margin: 0, fontWeight: 700, fontSize: "var(--t-gross)", color: "var(--vfa-gruen-text)", lineHeight: "var(--lh-eng)", textDecoration: t.cancelledAt ? "line-through" : "none" }}>{t.title}</h2>
                      {t.location && <div style={{ color: "var(--vfa-text-2)", fontSize: "var(--t-klein)", marginTop: 3 }}>{t.location}</div>}
                      {t.instructor && formatInstructorName(t.instructor) !== "Noch nicht hinterlegt" && (
                        <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-label)", marginTop: 2 }}>{formatInstructorName(t.instructor)}</div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                      {t.cancelledAt && <StatusBadge variant="warning">Abgesagt</StatusBadge>}
                      {t.code ? <StatusBadge>{t.code}</StatusBadge> : <StatusBadge variant="warning">Kein Kurscode</StatusBadge>}
                      <StatusBadge variant="yellow">{formatCertificateKind(t.certificateKind)}</StatusBadge>
                      <StatusBadge variant="success">{t.creditsAward} Credits</StatusBadge>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)" }}>
                      {formatDate(t.date)}{t.endDate ? ` – ${formatDate(t.endDate)}` : ""}
                      {t.cobraId ? ` · Cobra-ID ${t.cobraId}` : " · keine Cobra-ID"}
                    </div>
                    <AppButton
                      variant={t.cancelledAt ? "ghost" : "danger"}
                      disabled={aktionId === t.id}
                      onClick={() => absageUmschalten(t)}
                    >
                      {t.cancelledAt ? "Absage zurücknehmen" : "Schulung absagen"}
                    </AppButton>
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
