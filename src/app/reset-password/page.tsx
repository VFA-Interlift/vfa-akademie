"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";

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
      setError("Serverfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AppCard accent="green">
        <p style={{ margin: 0, color: "#B00020", fontWeight: 700 }}>
          Ungültiger Link. Bitte fordere einen neuen Reset-Link an.
        </p>
        <div style={{ marginTop: 16 }}>
          <Link
            href="/forgot-password"
            style={{
              color: "#007873",
              fontWeight: 800,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Neuen Link anfordern
          </Link>
        </div>
      </AppCard>
    );
  }

  if (done) {
    return (
      <AppCard accent="green">
        <div style={{ display: "grid", gap: 16, textAlign: "center" }}>
          <div
            style={{
              padding: "14px 18px",
              border: "1px solid #007873",
              background: "rgba(0,120,115,0.06)",
              color: "#007873",
              fontWeight: 700,
              lineHeight: 1.5,
              borderRadius: 4,
            }}
          >
            Dein Passwort wurde erfolgreich geändert.
          </div>

          <Link
            href="/login"
            style={{
              color: "#007873",
              fontWeight: 800,
              textDecoration: "underline",
              textUnderlineOffset: 3,
              fontSize: 15,
            }}
          >
            Zur Anmeldung
          </Link>
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard accent="green">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <AppInput
          label="Neues Passwort"
          value={password}
          placeholder="Mindestens 8 Zeichen"
          type="password"
          onChange={setPassword}
        />

        <AppInput
          label="Passwort bestätigen"
          value={passwordConfirm}
          placeholder="Passwort wiederholen"
          type="password"
          onChange={setPasswordConfirm}
        />

        <AppButton
          type="submit"
          disabled={loading || !password.trim() || !passwordConfirm.trim()}
          variant="primary"
          fullWidth
        >
          {loading ? "Wird gespeichert..." : "Passwort speichern"}
        </AppButton>

        {error && (
          <div
            style={{
              padding: "12px 14px",
              border: "1px solid rgba(176,0,32,0.28)",
              background: "rgba(176,0,32,0.08)",
              color: "#B00020",
              fontWeight: 800,
              lineHeight: 1.5,
              borderRadius: 4,
            }}
          >
            {error}
          </div>
        )}
      </form>
    </AppCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "32px 18px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 22 }}>
        <section
          style={{
            textAlign: "center",
            display: "grid",
            justifyItems: "center",
          }}
        >
          <div
            style={{
              width: 70,
              height: 6,
              background: "#FFC100",
              marginBottom: 18,
            }}
          />

          <img
            src="/logo.png"
            alt="VFA Logo"
            style={{
              width: 92,
              height: 92,
              objectFit: "contain",
              marginBottom: 18,
            }}
          />

          <h1
            style={{
              margin: 0,
              color: "#007873",
              fontSize: "clamp(28px, 8vw, 44px)",
              fontWeight: 400,
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Neues Passwort
          </h1>

          <p
            style={{
              marginTop: 16,
              marginBottom: 0,
              color: "#333333",
              fontSize: 17,
              lineHeight: 1.6,
              maxWidth: 480,
            }}
          >
            Lege jetzt dein neues Passwort fest.
          </p>
        </section>

        <Suspense fallback={<div />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
