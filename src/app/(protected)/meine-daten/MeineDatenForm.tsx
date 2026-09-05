"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppSelect from "@/components/ui/AppSelect";
import AppTextarea from "@/components/ui/AppTextarea";
import AppCard from "@/components/ui/AppCard";
import Meldung from "@/components/ui/Meldung";
import StatusBadge from "@/components/ui/StatusBadge";

type FormState = {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;

  company: string;
  companyAddress: string;
  companyStreet: string;
  companyZip: string;
  companyCity: string;
  companyCountry: string;
  position: string;
};

/** Abschnittskopf einer Karte: Etikett nach Kanon plus Chip rechts. */
function Abschnitt({ titel, chip }: { titel: string; chip: React.ReactNode }) {
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
      <div className="etikett">{titel}</div>
      {chip}
    </div>
  );
}

export default function MeineDatenForm({
  initial,
  namePflegtAdmin = false,
}: {
  initial: FormState;
  /** Dozenten ändern ihren Namen nicht selbst — er steuert den Kurszugriff. */
  namePflegtAdmin?: boolean;
}) {
  const [f, setF] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  async function changePassword() {
    if (pwNew !== pwConfirm) {
      setPwMsg("Die neuen Passwörter stimmen nicht überein.");
      setPwSuccess(false);
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    setPwSuccess(false);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwMsg(data?.error ?? "Fehler beim Ändern.");
        return;
      }
      setPwMsg("Passwort erfolgreich geändert.");
      setPwSuccess(true);
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch {
      setPwMsg("Serverfehler. Bitte versuche es erneut.");
    } finally {
      setPwLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    setMsg(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error ?? "Fehler beim Speichern.");
        setSuccess(false);
        return;
      }

      if (data?.emailChanged) {
        // Kein Abmelden: Die Sitzung und die bisherige Adresse bleiben gültig,
        // bis der Link an der neuen Adresse eingelöst ist. Das erzwungene
        // signOut stammte aus dem alten Sofort-Wechsel-Modell und ließ die
        // Erklärung nach 2,5 s verschwinden (Gegenprüfung 13.08.2026).
        setMsg(
          `Gespeichert. Wir haben eine Bestätigungsmail an ${String(data?.pendingEmail ?? "die neue Adresse")} geschickt — ` +
            "erst nach dem Klick auf den Link zieht dein Konto um. Bis dahin bleibt " +
            "deine bisherige Adresse für die Anmeldung aktiv."
        );
        setSuccess(true);
        // Das Feld zeigt wieder die aktive Adresse, nicht die schwebende.
        setField("email", initial.email);
        return;
      }

      setMsg("Gespeichert.");
      setSuccess(true);
    } catch {
      setMsg("Fehler beim Speichern.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }

  function setField(key: keyof FormState, value: string) {
    setF((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Als Formular, damit Enter im Feld speichert (Befund f03-14, 05.09.2026). */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!loading) void save();
        }}
        style={{ display: "grid", gap: 18 }}
      >
        <AppCard accent="none">
          <Abschnitt titel="Persönliche Daten" chip={<StatusBadge variant="yellow">Profil</StatusBadge>} />

          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <AppInput
                label="Vorname"
                value={f.firstName}
                placeholder="Max"
                name="given-name"
                autoComplete="given-name"
                disabled={namePflegtAdmin}
                onChange={(value) => setField("firstName", value)}
              />

              <AppInput
                label="Nachname"
                value={f.lastName}
                placeholder="Mustermann"
                name="family-name"
                autoComplete="family-name"
                disabled={namePflegtAdmin}
                onChange={(value) => setField("lastName", value)}
              />
            </div>

            {namePflegtAdmin && (
              <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
                Dein Name wird vom Admin gepflegt. Stimmt etwas nicht, melde dich bei der Akademie.
              </div>
            )}

            <AppInput
              label="E-Mail"
              value={f.email}
              placeholder="max@firma.de"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              onChange={(value) => setField("email", value)}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <AppInput
                label="Geburtsdatum (TT.MM.JJJJ)"
                value={f.birthDate}
                placeholder="31.01.1990"
                onChange={(value) => setField("birthDate", value)}
              />

              <AppInput
                label="Telefon"
                value={f.phone}
                placeholder="+49 170 1234567"
                type="tel"
                name="tel"
                autoComplete="tel"
                inputMode="tel"
                onChange={(value) => setField("phone", value)}
              />
            </div>

            <AppSelect
              label="Geschlecht / Anrede"
              value={f.gender}
              onChange={(value) => setField("gender", value)}
              placeholder="Bitte auswählen"
              options={[
                { value: "weiblich", label: "weiblich" },
                { value: "männlich", label: "männlich" },
                { value: "divers", label: "divers" },
                { value: "keine Angabe", label: "keine Angabe" },
              ]}
            />
          </div>
        </AppCard>

        <AppCard accent="none">
          <Abschnitt titel="Firmendaten" chip={<StatusBadge>Firma</StatusBadge>} />

          <div style={{ display: "grid", gap: 14 }}>
            <AppInput
              label="Firmenname"
              value={f.company}
              placeholder="Firma GmbH"
              onChange={(value) => setField("company", value)}
            />

            <AppInput
              label="Funktion / Position"
              value={f.position}
              placeholder="Technischer Leiter"
              onChange={(value) => setField("position", value)}
            />

            <AppInput
              label="Straße und Hausnummer"
              value={f.companyStreet}
              placeholder="Musterstraße 12"
              onChange={(value) => setField("companyStreet", value)}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
              }}
            >
              <AppInput
                label="PLZ"
                value={f.companyZip}
                placeholder="20537"
                onChange={(value) => setField("companyZip", value)}
              />

              <AppInput
                label="Ort"
                value={f.companyCity}
                placeholder="Hamburg"
                onChange={(value) => setField("companyCity", value)}
              />
            </div>

            <AppInput
              label="Land"
              value={f.companyCountry}
              placeholder="Deutschland"
              onChange={(value) => setField("companyCountry", value)}
            />

            <AppTextarea
              label="Firmenadresse Zusatz / Bemerkung"
              value={f.companyAddress}
              placeholder="Optional, z. B. Postfach, Standort, Abteilung"
              rows={3}
              onChange={(value) => setField("companyAddress", value)}
            />
          </div>
        </AppCard>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <AppButton type="submit" disabled={loading} variant="primary">
            {loading ? "Speichern …" : "Speichern"}
          </AppButton>

          {msg && (
            <Meldung art={success ? "erfolg" : "fehler"} style={{ flex: "1 1 240px" }}>
              {msg}
            </Meldung>
          )}
        </div>
      </form>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!pwLoading && pwCurrent && pwNew && pwConfirm) void changePassword();
        }}
      >
        <AppCard accent="none">
          <Abschnitt titel="Passwort ändern" chip={<StatusBadge>Sicherheit</StatusBadge>} />

          <div style={{ display: "grid", gap: 14 }}>
            <AppInput
              label="Aktuelles Passwort"
              value={pwCurrent}
              placeholder="Dein bisheriges Passwort"
              type="password"
              autoComplete="current-password"
              onChange={setPwCurrent}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <AppInput
                label="Neues Passwort"
                value={pwNew}
                placeholder="Mindestens 10 Zeichen"
                type="password"
                autoComplete="new-password"
                onChange={setPwNew}
              />
              <AppInput
                label="Passwort bestätigen"
                value={pwConfirm}
                placeholder="Passwort wiederholen"
                type="password"
                autoComplete="new-password"
                onChange={setPwConfirm}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <AppButton
                type="submit"
                disabled={pwLoading || !pwCurrent || !pwNew || !pwConfirm}
                variant="primary"
              >
                {pwLoading ? "Wird gespeichert …" : "Passwort speichern"}
              </AppButton>
              {pwMsg && (
                <Meldung art={pwSuccess ? "erfolg" : "fehler"} style={{ flex: "1 1 240px" }}>
                  {pwMsg}
                </Meldung>
              )}
            </div>
          </div>
        </AppCard>
      </form>

      <div className="logout-mobile-only">
        <AppButton variant="secondary" fullWidth onClick={() => signOut({ callbackUrl: "/login" })}>
          Abmelden
        </AppButton>
      </div>
    </div>
  );
}
