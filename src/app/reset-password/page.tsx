"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import Meldung from "@/components/ui/Meldung";
import PageHeader from "@/components/ui/PageHeader";

export default function ResetPasswordPage() {
  return (
    <main className="page-main">
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <PageHeader title="Neues Passwort" />
        <p style={UNTERTITEL}>Lege jetzt dein neues Passwort fest.</p>

        <Suspense fallback={<div />}>
          <ResetPasswordForm />
        </Suspense>

        {/* Vorher fehlte hier jeder Weg zur Anmeldung (Befunde d03-14, f01-7). */}
        <p style={FUSSZEILE}>
          <Link href="/login" style={FUSSLINK}>
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </main>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Ein Fehler ist aufgetreten.");
        return;
      }
      setDone(true);
    } catch {
      setError("Serverfehler. Bitte versuch es erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AppCard>
        <div style={{ display: "grid", gap: 18 }}>
          <Meldung art="fehler">
            Ungültiger Link. Bitte fordere einen neuen Link zum Zurücksetzen an.
          </Meldung>
          <AppButton href="/forgot-password" variant="primary" fullWidth>
            Neuen Link anfordern
          </AppButton>
        </div>
      </AppCard>
    );
  }

  if (done) {
    return (
      <AppCard>
        <div style={{ display: "grid", gap: 18 }}>
          <Meldung art="erfolg">Dein Passwort wurde geändert. Du kannst dich jetzt anmelden.</Meldung>
          <AppButton href="/login" variant="primary" fullWidth>
            Zur Anmeldung
          </AppButton>
        </div>
      </AppCard>
    );
  }

  // Der Link gilt nur eine Stunde; sein Fehler kam bisher ohne Ausweg
  // (Befund f01-7). Die Route liefert keinen Fehlercode, deshalb entscheidet
  // der Wortlaut („Der Link ist ungültig oder bereits abgelaufen.“).
  const linkProblem = Boolean(error && error.includes("Link"));

  return (
    <AppCard>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
        <AppInput label="Neues Passwort" value={password} placeholder="Mindestens 10 Zeichen" type="password" name="new-password" autoComplete="new-password" onChange={setPassword} />
        <AppInput label="Passwort bestätigen" value={passwordConfirm} placeholder="Passwort wiederholen" type="password" name="confirm-password" autoComplete="new-password" onChange={setPasswordConfirm} />
        <AppButton type="submit" disabled={loading || !password.trim() || !passwordConfirm.trim()} variant="primary" fullWidth>
          {loading ? "Wird gespeichert …" : "Passwort speichern"}
        </AppButton>
        {error && <Meldung art="fehler">{error}</Meldung>}
        {linkProblem && (
          <AppButton href="/forgot-password" variant="secondary" fullWidth>
            Neuen Link anfordern
          </AppButton>
        )}
      </form>
    </AppCard>
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
  fontSize: 13,
  color: "var(--vfa-text-2)",
};

const FUSSLINK: React.CSSProperties = {
  color: "var(--vfa-gruen-text)",
  fontWeight: 700,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
