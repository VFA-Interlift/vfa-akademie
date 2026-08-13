"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AppCard from "@/components/ui/AppCard";
import PushEinstellung from "@/components/PushEinstellung";
import ThemaSchalter from "@/components/ThemaSchalter";
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
  istTester = false,
  feedbackGesendet = false,
}: {
  notifyBeforeTraining: boolean;
  /** Nur Teilnehmer der Testrunde sehen den Fragebogen. */
  istTester?: boolean;
  feedbackGesendet?: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {istTester && <TestrundeCard feedbackGesendet={feedbackGesendet} />}
      <DarstellungCard />
      <NotificationsCard initial={notifyBeforeTraining} />
      <FeedbackCard />
      <DatenschutzCard />
      <AppInfoCard />
    </div>
  );
}

function DarstellungCard() {
  return (
    <AppCard accent="none">
      <SectionHeader title="Darstellung" badge="Design" />
      <ThemaSchalter />
    </AppCard>
  );
}

/**
 * Der Fragebogen der Testrunde. Er steht hier oben, weil die Begruessung auf
 * dem Dashboard genau hierher verweist - der Weg zum Bogen soll immer derselbe
 * sein. Fuer alle ausserhalb der Testrunde erscheint die Karte nicht.
 */
function TestrundeCard({ feedbackGesendet }: { feedbackGesendet: boolean }) {
  return (
    <AppCard accent="none">
      <SectionHeader title="Rückmeldung zur Testrunde" badge="Testrunde" />

      <p style={{ marginTop: 0, marginBottom: 14, fontSize: 14, color: "var(--vfa-text-2)", lineHeight: 1.6 }}>
        {feedbackGesendet
          ? "Deine Antworten sind angekommen — danke! Ist dir seitdem noch etwas aufgefallen, kannst du den Bogen erneut ausfüllen. Er ersetzt dann deine bisherigen Antworten."
          : "Zehn Fragen zu deinen Eindrücken, zwei bis drei Minuten. Pflicht ist nur die letzte. Füll ihn aus, wenn du dich in Ruhe umgesehen hast."}
      </p>

      <Link
        href="/app-test"
        style={{
          display: "inline-block",
          padding: "10px 22px",
          borderRadius: 999,
          background: "#007873",
          color: "#FFFFFF",
          fontWeight: 800,
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        {feedbackGesendet ? "Rückmeldung ergänzen" : "Zum Fragebogen"}
      </Link>
    </AppCard>
  );
}

/**
 * Auskunft und Löschung nach DSGVO. Ohne diese Möglichkeiten wäre das
 * Versprechen „DSGVO konform" auf der Startseite nur ein Wort.
 */
function DatenschutzCard() {
  const [passwort, setPasswort] = useState("");
  const [zeigeLoeschen, setZeigeLoeschen] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function konventLoeschen() {
    setLaeuft(true);
    setMsg(null);
    try {
      const res = await fetch("/api/me/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwort }),
      });
      const data = await res.json();

      if (!data.ok) {
        const texte: Record<string, string> = {
          PASSWORT_FALSCH: "Das Passwort stimmt nicht.",
          PASSWORT_FEHLT: "Bitte gib dein Passwort ein.",
          ADMIN_KONTO: "Adminkonten können nur über einen anderen Admin gelöscht werden.",
        };
        setMsg(texte[data.error] ?? "Löschen fehlgeschlagen.");
        return;
      }

      await signOut({ callbackUrl: "/login" });
    } catch {
      setMsg("Löschen fehlgeschlagen.");
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <AppCard accent="none">
      <SectionHeader title="Meine Daten" badge="Datenschutz" />

      <div style={{ fontSize: 14, color: "var(--vfa-text)", lineHeight: 1.6 }}>
        Du kannst jederzeit alle zu deinem Konto gespeicherten Daten herunterladen —
        Profil, Anmeldungen, Zertifikate, Credits und Feedback.
      </div>

      <a
        href="/api/me/export"
        style={{
          display: "inline-block",
          marginTop: 12,
          padding: "10px 18px",
          borderRadius: 999,
          border: "1px solid #007873",
          color: "#007873",
          fontWeight: 800,
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        Daten herunterladen
      </a>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--vfa-linie)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--vfa-text)" }}>Konto löschen</div>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--vfa-text-2)", lineHeight: 1.6 }}>
          Dein Konto und alles daran Hängende wird endgültig entfernt: Anmeldungen,
          Zertifikate, Credits, Feedback und hochgeladene Nachweise. Die Teilnahmeunterlagen
          der Akademie zu besuchten Schulungen bleiben davon unberührt.
        </p>

        {!zeigeLoeschen ? (
          <button
            type="button"
            onClick={() => setZeigeLoeschen(true)}
            style={{
              marginTop: 12,
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid #B00020",
              background: "var(--vfa-karte)",
              color: "#B00020",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Konto löschen …
          </button>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 360 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--vfa-text)" }}>
              Zur Bestätigung dein Passwort
              <input
                type="password"
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
                autoComplete="current-password"
                style={{
                  width: "100%", marginTop: 4, padding: "10px 12px",
                  border: "1px solid var(--vfa-linie)", borderRadius: 8, fontSize: 14,
                }}
              />
            </label>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={konventLoeschen}
                disabled={laeuft || !passwort}
                style={{
                  padding: "10px 18px", borderRadius: 999, border: "none",
                  background: passwort ? "#B00020" : "#DDDDDD",
                  color: "#FFFFFF", fontWeight: 800, fontSize: 14,
                  cursor: laeuft || !passwort ? "default" : "pointer",
                }}
              >
                {laeuft ? "Wird gelöscht …" : "Endgültig löschen"}
              </button>

              <button
                type="button"
                onClick={() => { setZeigeLoeschen(false); setPasswort(""); setMsg(null); }}
                style={{
                  padding: "10px 18px", borderRadius: 999,
                  border: "1px solid var(--vfa-linie)", background: "var(--vfa-karte)",
                  color: "var(--vfa-text-2)", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                Abbrechen
              </button>
            </div>

            {msg ? <div style={{ color: "#B00020", fontSize: 13, fontWeight: 700 }}>{msg}</div> : null}
          </div>
        )}
      </div>
    </AppCard>
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
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--vfa-text)", lineHeight: 1.3 }}>
            Erinnerung vor Schulungen
          </div>
          <div style={{ fontSize: 13, color: "var(--vfa-text-2)", marginTop: 4, lineHeight: 1.5 }}>
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
              background: "var(--vfa-karte)",
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

      {/* Push aufs Handy — zusätzlich zur E-Mail, je Gerät aktivierbar. */}
      <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--vfa-linie-2)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--vfa-text)", lineHeight: 1.3, marginBottom: 8 }}>
          Mitteilung aufs Handy
        </div>
        <PushEinstellung />
      </div>
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

      <p style={{ marginTop: 0, marginBottom: 14, fontSize: 14, color: "var(--vfa-text-2)", lineHeight: 1.6 }}>
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

      <div style={{ display: "grid", gap: 10, fontSize: 14, color: "var(--vfa-text)", lineHeight: 1.6 }}>
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

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--vfa-linie)" }}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 999,
            border: "1px solid var(--vfa-linie)",
            background: "var(--vfa-karte-2)",
            color: "var(--vfa-text-2)",
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
      <span style={{ color: "var(--vfa-text)", overflowWrap: "anywhere" }}>{value}</span>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  color: "#007873",
  fontWeight: 700,
  textDecoration: "none",
};
