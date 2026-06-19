"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import AppCard from "@/components/ui/AppCard";
import AppButton from "@/components/ui/AppButton";
import AppSelect from "@/components/ui/AppSelect";
import AppTextarea from "@/components/ui/AppTextarea";
import StatusBadge from "@/components/ui/StatusBadge";

const APP_VERSION = "0.1.0";

const FEEDBACK_CATEGORIES = [
  "Allgemein",
  "Fehler / Bug",
  "Idee / Wunsch",
  "Sonstiges",
];

function SectionHeader({ title, badge }: { title: string; badge: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#007873",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </div>
      <StatusBadge>{badge}</StatusBadge>
    </div>
  );
}

export default function EinstellungenClient({
  notifyBeforeTraining,
}: {
  notifyBeforeTraining: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <NotificationsCard initial={notifyBeforeTraining} />
      <FeedbackCard />
      <AppInfoCard />
    </div>
  );
}

function NotificationsCard({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyBeforeTraining: next }),
      });

      if (!res.ok) {
        setEnabled(!next);
        setMsg("Konnte nicht gespeichert werden.");
        return;
      }

      setMsg("Gespeichert.");
    } catch {
      setEnabled(!next);
      setMsg("Konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppCard accent="none">
      <SectionHeader title="Benachrichtigungen" badge="E-Mail" />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1F1F1F", lineHeight: 1.3 }}>
            Erinnerung vor Schulungen
          </div>
          <div style={{ fontSize: 13, color: "#666666", marginTop: 4, lineHeight: 1.5 }}>
            Du bekommst 3 Tage vor einer Schulung, für die du angemeldet bist, eine
            E-Mail-Erinnerung.
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Erinnerung vor Schulungen"
          onClick={toggle}
          disabled={saving}
          style={{
            position: "relative",
            flexShrink: 0,
            width: 52,
            height: 30,
            borderRadius: 999,
            border: "none",
            background: enabled ? "#007873" : "#CFCFCF",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "background 180ms ease",
            opacity: saving ? 0.7 : 1,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: enabled ? 25 : 3,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              transition: "left 180ms ease",
            }}
          />
        </button>
      </div>

      {msg && (
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#007873" }}>
          {msg}
        </div>
      )}
    </AppCard>
  );
}

function FeedbackCard() {
  const [category, setCategory] = useState(FEEDBACK_CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (message.trim().length < 5) {
      setSuccess(false);
      setMsg("Bitte schreibe etwas mehr (mindestens 5 Zeichen).");
      return;
    }

    setLoading(true);
    setMsg(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setSuccess(false);
        setMsg("Feedback konnte nicht gesendet werden. Bitte später erneut versuchen.");
        return;
      }

      setSuccess(true);
      setMsg("Danke für dein Feedback!");
      setMessage("");
    } catch {
      setSuccess(false);
      setMsg("Feedback konnte nicht gesendet werden. Bitte später erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppCard accent="none">
      <SectionHeader title="Feedback geben" badge="Feedback" />

      <p style={{ marginTop: 0, marginBottom: 14, fontSize: 14, color: "#666666", lineHeight: 1.6 }}>
        Fehler gefunden, Idee oder Wunsch? Schreib uns – wir lesen jede Nachricht.
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <AppSelect
          label="Kategorie"
          value={category}
          onChange={setCategory}
          options={FEEDBACK_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />

        <AppTextarea
          label="Deine Nachricht"
          value={message}
          placeholder="Beschreibe dein Feedback so genau wie möglich..."
          rows={5}
          onChange={setMessage}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <AppButton onClick={submit} disabled={loading} variant="primary">
            {loading ? "Wird gesendet..." : "Feedback senden"}
          </AppButton>

          {msg && (
            <div
              style={{
                padding: "10px 14px",
                border: success ? "1px solid #007873" : "1px solid rgba(176,0,32,0.28)",
                background: success ? "rgba(0,120,115,0.08)" : "rgba(176,0,32,0.08)",
                color: success ? "#007873" : "#B00020",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {msg}
            </div>
          )}
        </div>
      </div>
    </AppCard>
  );
}

function AppInfoCard() {
  return (
    <AppCard accent="none">
      <SectionHeader title="App-Info" badge="Info" />

      <div style={{ display: "grid", gap: 10, fontSize: 14, color: "#333333", lineHeight: 1.6 }}>
        <InfoRow label="App" value="VFA-Akademie" />
        <InfoRow label="Version" value={APP_VERSION} />
        <InfoRow label="Veranstalter" value="VFA-Akademie gGmbH" />
        <InfoRow label="Adresse" value="Süderstraße 282, 20537 Hamburg" />
        <InfoRow
          label="E-Mail"
          value={
            <a href="mailto:info@vfa-interlift.de" style={linkStyle}>
              info@vfa-interlift.de
            </a>
          }
        />
        <InfoRow
          label="Telefon"
          value={
            <a href="tel:+4940800047310" style={linkStyle}>
              +49 40 8000473-10
            </a>
          }
        />
        <InfoRow
          label="Website"
          value={
            <a href="https://www.vfa-interlift.de" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              vfa-interlift.de
            </a>
          }
        />
      </div>

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #E6E6E6" }}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 999,
            border: "1px solid #D4D4D4",
            background: "#F4F4F4",
            color: "#666666",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.04em",
            cursor: "pointer",
          }}
        >
          Abmelden
        </button>
      </div>
    </AppCard>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(90px, 120px) 1fr", gap: 12, alignItems: "baseline" }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: "#007873", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ color: "#1F1F1F", overflowWrap: "anywhere" }}>{value}</span>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  color: "#007873",
  fontWeight: 700,
  textDecoration: "none",
};
