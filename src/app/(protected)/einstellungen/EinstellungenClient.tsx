"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import AppCard from "@/components/ui/AppCard";
import PushEinstellung from "@/components/PushEinstellung";
import ThemaSchalter from "@/components/ThemaSchalter";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppSelect from "@/components/ui/AppSelect";
import AppTextarea from "@/components/ui/AppTextarea";
import Meldung from "@/components/ui/Meldung";
import StatusBadge from "@/components/ui/StatusBadge";

const APP_VERSION = "0.1.0";

/** Muss zur Liste in src/app/api/feedback/route.ts passen. */
const FEEDBACK_CATEGORIES = [
  "Allgemein",
  "Fehler",
  "Idee / Wunsch",
  "Sonstiges",
];

/** Obergrenze der Route (/api/feedback lehnt längere Nachrichten ab). */
const FEEDBACK_MAX = 5000;

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
      <div className="etikett">{title}</div>
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

      <p style={{ marginTop: 0, marginBottom: 14, fontSize: "var(--t-basis)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
        {feedbackGesendet
          ? "Deine Antworten sind angekommen, danke! Ist dir seitdem noch etwas aufgefallen, kannst du den Bogen erneut ausfüllen. Er ersetzt dann deine bisherigen Antworten."
          : "Zehn Fragen zu deinen Eindrücken, zwei bis drei Minuten. Pflicht ist nur die letzte. Füll ihn aus, wenn du dich in Ruhe umgesehen hast."}
      </p>

      <AppButton href="/app-test" variant="primary">
        {feedbackGesendet ? "Rückmeldung ergänzen" : "Zum Fragebogen"}
      </AppButton>
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

  async function kontoLoeschen() {
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
          // Die Route sperrt nach fünf Fehlversuchen für 15 Minuten.
          ZU_VIELE_VERSUCHE: "Zu viele Versuche. Bitte in 15 Minuten erneut probieren.",
        };
        setMsg(texte[data.error] ?? "Löschen fehlgeschlagen. Bitte erneut versuchen.");
        return;
      }

      await signOut({ callbackUrl: "/login" });
    } catch {
      setMsg("Löschen fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <AppCard accent="none">
      <SectionHeader title="Datenauskunft" badge="Datenschutz" />

      <div style={{ fontSize: "var(--t-basis)", color: "var(--vfa-text)", lineHeight: "var(--lh-weit)" }}>
        Alles, was zu deinem Konto gespeichert ist: Profil, Anmeldungen,
        Zertifikate, Credits und Feedback.
      </div>

      <div style={{ marginTop: 12 }}>
        {/* Kein href: Ein Link würde die Datei beim Vorladen schon anfordern.
            Die Route liefert einen Download, deshalb reicht die Navigation. */}
        <AppButton variant="ghost" onClick={() => window.location.assign("/api/me/export")}>
          Daten herunterladen
        </AppButton>
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--vfa-linie)" }}>
        <div style={{ fontSize: "var(--t-basis)", fontWeight: 700, color: "var(--vfa-text)" }}>Konto löschen</div>
        <p style={{ margin: "6px 0 0", fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
          Dein Konto und alles daran Hängende wird endgültig entfernt: Anmeldungen,
          Zertifikate, Credits, Feedback und hochgeladene Nachweise. Die Teilnahmeunterlagen
          der Akademie zu besuchten Schulungen bleiben davon unberührt.
        </p>

        {!zeigeLoeschen ? (
          <div style={{ marginTop: 12 }}>
            <AppButton variant="danger" onClick={() => setZeigeLoeschen(true)}>
              Konto löschen …
            </AppButton>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!laeuft && passwort) void kontoLoeschen();
            }}
            style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 360 }}
          >
            <AppInput
              label="Zur Bestätigung dein Passwort"
              type="password"
              value={passwort}
              autoComplete="current-password"
              onChange={setPasswort}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <AppButton type="submit" variant="danger" disabled={laeuft || !passwort}>
                {laeuft ? "Wird gelöscht …" : "Endgültig löschen"}
              </AppButton>

              <AppButton
                variant="secondary"
                onClick={() => { setZeigeLoeschen(false); setPasswort(""); setMsg(null); }}
              >
                Abbrechen
              </AppButton>
            </div>

            {msg ? <Meldung art="fehler">{msg}</Meldung> : null}
          </form>
        )}
      </div>
    </AppCard>
  );
}

function NotificationsCard({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; art: "erfolg" | "fehler" } | null>(null);

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
        setMsg({ text: "Konnte nicht gespeichert werden.", art: "fehler" });
        return;
      }

      setMsg({ text: "Gespeichert.", art: "erfolg" });
    } catch {
      setEnabled(!next);
      setMsg({ text: "Konnte nicht gespeichert werden.", art: "fehler" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppCard accent="none">
      <SectionHeader title="Benachrichtigungen" badge="E-Mail" />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "var(--t-basis)", fontWeight: 700, color: "var(--vfa-text)", lineHeight: "var(--lh-eng)" }}>
            Erinnerung vor Schulungen
          </div>
          <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", marginTop: 4, lineHeight: "var(--lh-weit)" }}>
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
            // Schiene und Knopf wie beim ThemaSchalter (Befund d13-19, 05.09.2026).
            background: enabled ? "#007873" : "var(--vfa-grey)",
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
        <Meldung art={msg.art} role="status" style={{ marginTop: 12 }}>
          {msg.text}
        </Meldung>
      )}

      {/* Push aufs Handy — zusätzlich zur E-Mail, je Gerät aktivierbar. */}
      <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--vfa-linie-2)" }}>
        <div style={{ fontSize: "var(--t-basis)", fontWeight: 700, color: "var(--vfa-text)", lineHeight: "var(--lh-eng)", marginBottom: 8 }}>
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
        setMsg(
          data?.error === "ZU_VIELE_VERSUCHE"
            ? "Zu viele Nachrichten in kurzer Zeit. Bitte in 15 Minuten erneut versuchen."
            : "Feedback konnte nicht gesendet werden. Bitte später erneut versuchen."
        );
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
    <AppCard id="feedback" accent="none">
      <SectionHeader title="Feedback geben" badge="Feedback" />

      <p style={{ marginTop: 0, marginBottom: 14, fontSize: "var(--t-basis)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
        Fehler gefunden, Idee oder Wunsch? Schreib uns, wir lesen jede Nachricht.
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <AppSelect
          ohnePlatzhalter
          label="Kategorie"
          value={category}
          onChange={setCategory}
          options={FEEDBACK_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />

        <AppTextarea
          label="Deine Nachricht"
          value={message}
          placeholder="Beschreibe dein Feedback so genau wie möglich …"
          rows={5}
          maxLength={FEEDBACK_MAX}
          onChange={setMessage}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <AppButton onClick={submit} disabled={loading} variant="primary">
            {loading ? "Wird gesendet …" : "Feedback senden"}
          </AppButton>

          {msg && (
            <Meldung art={success ? "erfolg" : "fehler"} style={{ flex: "1 1 240px" }}>
              {msg}
            </Meldung>
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

      <div style={{ display: "grid", gap: 10, fontSize: "var(--t-basis)", color: "var(--vfa-text)", lineHeight: "var(--lh-weit)" }}>
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
        <AppButton variant="secondary" fullWidth onClick={() => signOut({ callbackUrl: "/login" })}>
          Abmelden
        </AppButton>
      </div>
    </AppCard>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(90px, 120px) 1fr", gap: 12, alignItems: "baseline" }}>
      <span className="etikett">{label}</span>
      <span style={{ color: "var(--vfa-text)", overflowWrap: "anywhere" }}>{value}</span>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  color: "var(--vfa-gruen-text)",
  fontWeight: 700,
  textDecoration: "none",
};
