"use client";

import Link from "next/link";
import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import Meldung from "@/components/ui/Meldung";
import PageHeader from "@/components/ui/PageHeader";

/** Heutiges Datum als JJJJ-MM-TT nach Ortszeit — toISOString() lieferte
    zwischen Mitternacht und 2 Uhr den Vortag (Befund f03-5). */
function heuteIso() {
  const heute = new Date();
  const monat = String(heute.getMonth() + 1).padStart(2, "0");
  const tag = String(heute.getDate()).padStart(2, "0");
  return `${heute.getFullYear()}-${monat}-${tag}`;
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const todayIso = heuteIso();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMsg(null);

    if (password.length < 10) {
      setMsg("Das Passwort muss mindestens 10 Zeichen haben.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          birthDate: birthDate.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error ?? "Fehler beim Registrieren.");
        return;
      }

      // Keine Weiterleitung zur Anmeldung mehr: ohne bestätigte Adresse käme
      // der Nutzer dort nicht hinein und stünde ratlos vor der Fehlermeldung.
      setDone(true);
    } catch {
      setMsg("Serverfehler beim Registrieren.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-main">
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <PageHeader title="Konto erstellen" />
        <p style={UNTERTITEL}>Registriere dich für die VFA-Akademie.</p>

        {done ? (
          <AppCard style={{ textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(0,120,115,0.10)",
                border: "1px solid rgba(0,120,115,0.30)",
                color: "var(--vfa-gruen-text)",
                fontSize: "var(--t-titel)",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              ✓
            </div>
            <h2 style={{ margin: "0 0 6px", color: "var(--vfa-gruen-text)", fontSize: "var(--t-gross)", fontWeight: 700, lineHeight: "var(--lh-eng)" }}>
              Fast geschafft
            </h2>
            <p style={{ margin: 0, color: "var(--vfa-text)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
              Wir haben dir eine E-Mail an <strong>{email.trim().toLowerCase()}</strong>{" "}
              geschickt. Öffne darin den Bestätigungslink, dann kannst du dich
              anmelden.
            </p>
            <p style={{ margin: "12px 0 0", color: "var(--vfa-text-2)", fontSize: "var(--t-klein)", lineHeight: "var(--lh-weit)" }}>
              Nichts angekommen? Sieh bitte im Spam-Ordner nach. Der Link gilt 24
              Stunden.
            </p>
          </AppCard>
        ) : (
          <AppCard>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
              <AppInput label="Name" value={name} placeholder="Max Mustermann" name="name" autoComplete="name" onChange={setName} />
              {/* min wie die Serverprüfung (api/register): ein dreistelliges
                  Jahr aus dem nativen Datumsfeld stünde sonst auf Zertifikaten. */}
              <AppInput label="Geburtsdatum" value={birthDate} type="date" min="1900-01-01" max={todayIso} name="bday" autoComplete="bday" onChange={setBirthDate} />
              <AppInput label="E-Mail" value={email} placeholder="max@firma.de" type="email" name="email" autoComplete="email" inputMode="email" onChange={setEmail} />
              <AppInput label="Passwort" value={password} placeholder="Mindestens 10 Zeichen" type="password" name="new-password" autoComplete="new-password" onChange={setPassword} />
              <AppInput label="Passwort bestätigen" value={confirmPassword} placeholder="Passwort wiederholen" type="password" name="confirm-password" autoComplete="new-password" onChange={setConfirmPassword} />

              {/* Informationspflicht nach Art. 13 DSGVO: Vor der Registrierung
                  muss erkennbar sein, was mit den Daten geschieht. Das
                  Geburtsdatum ist Pflichtfeld, deshalb steht hier auch, wofür. */}
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--t-klein)",
                  lineHeight: "var(--lh-weit)",
                  color: "var(--vfa-text-2)",
                }}
              >
                Mit dem Anlegen des Kontos bestätigst du, die{" "}
                <Link
                  href="/datenschutz"
                  target="_blank"
                  style={{ color: "var(--vfa-gruen-text)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  Datenschutzerklärung
                </Link>{" "}
                gelesen zu haben. Dein Geburtsdatum brauchen wir, weil es auf
                Teilnahmebestätigungen und Zertifikaten steht.
              </p>

              <AppButton
                type="submit"
                disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim() || !name.trim() || !birthDate.trim()}
                variant="primary"
                fullWidth
              >
                {loading ? "Konto wird erstellt …" : "Konto erstellen"}
              </AppButton>

              {msg && <Meldung art="fehler">{msg}</Meldung>}
            </form>
          </AppCard>
        )}

        <p style={FUSSZEILE}>
          Bereits ein Konto?{" "}
          <Link href="/login" style={FUSSLINK}>
            Zur Anmeldung
          </Link>
        </p>

        {/* Impressum/Datenschutz stehen im SocialFooter (Root-Layout) —
            die frühere Inline-Zeile stand doppelt darüber (Tobi, 13.08.). */}
      </div>
    </main>
  );
}

const UNTERTITEL: React.CSSProperties = {
  margin: "0 0 20px",
  fontSize: "var(--t-basis)",
  lineHeight: "var(--lh-weit)",
  color: "var(--vfa-text-2)",
};

const FUSSZEILE: React.CSSProperties = {
  marginTop: 20,
  textAlign: "center",
  fontSize: "var(--t-klein)",
  color: "var(--vfa-text-2)",
};

const FUSSLINK: React.CSSProperties = {
  color: "var(--vfa-gruen-text)",
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
