"use client";

import Link from "next/link";
import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import Meldung from "@/components/ui/Meldung";
import PageHeader from "@/components/ui/PageHeader";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Ein Fehler ist aufgetreten.");
        return;
      }

      setSent(true);
    } catch {
      setError("Serverfehler. Bitte versuch es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-main">
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <PageHeader title="Passwort vergessen" />
        <p style={UNTERTITEL}>Wir schicken dir einen Link zum Zurücksetzen per E-Mail.</p>

        <AppCard>
          {sent ? (
            // Der Weg zurück steht in der Fußzeile — ein zweiter Link direkt
            // darüber stand doppelt (Befund d03-18).
            <Meldung art="erfolg">
              Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link
              zum Zurücksetzen geschickt. Bitte prüfe auch deinen Spam-Ordner.
            </Meldung>
          ) : (
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
              <AppInput label="E-Mail" value={email} placeholder="max@firma.de" type="email" name="email" autoComplete="email" inputMode="email" onChange={setEmail} />

              <AppButton type="submit" disabled={loading || !email.trim()} variant="primary" fullWidth>
                {loading ? "Wird gesendet …" : "Link senden"}
              </AppButton>

              {error && <Meldung art="fehler">{error}</Meldung>}
            </form>
          )}
        </AppCard>

        <p style={FUSSZEILE}>
          <Link href="/login" style={FUSSLINK}>
            Zurück zur Anmeldung
          </Link>
        </p>
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
