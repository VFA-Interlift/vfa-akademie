"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";

export default function ResetPasswordPage() {
  return (
    <div className="auth-split">
      <AuthBrandPanel />
      <div className="auth-panel-right" style={{ padding: 0 }}>
        <AuthMobileBanner />
        <div style={{ width: "100%", maxWidth: 420, padding: "36px 24px" }} className="page-enter">
          <h1
            style={{
              margin: "0 0 6px",
              color: "#1F1F1F",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Neues Passwort
          </h1>
          <p style={{ margin: "0 0 28px", color: "#888888", fontSize: 15, lineHeight: 1.5 }}>
            Lege jetzt dein neues Passwort fest.
          </p>

          <Suspense fallback={<div />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
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
      setError("Serverfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AppCard accent="none" style={{ padding: 28, borderRadius: 16 }}>
        <div style={{ color: "#B00020", fontWeight: 600, marginBottom: 14, fontSize: 14 }}>
          Ungültiger Link. Bitte fordere einen neuen Reset-Link an.
        </div>
        <Link href="/forgot-password" style={{ color: "#007873", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3, fontSize: 14 }}>
          Neuen Link anfordern
        </Link>
      </AppCard>
    );
  }

  if (done) {
    return (
      <AppCard accent="none" style={{ padding: 28, borderRadius: 16 }}>
        <div style={{ padding: "14px 16px", borderRadius: 8, border: "1px solid rgba(0,120,115,0.25)", background: "rgba(0,120,115,0.05)", color: "#007873", fontWeight: 600, fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
          Dein Passwort wurde erfolgreich geändert.
        </div>
        <Link href="/login" style={{ color: "#007873", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3, fontSize: 14 }}>
          Zur Anmeldung
        </Link>
      </AppCard>
    );
  }

  return (
    <AppCard accent="none" style={{ padding: 28, borderRadius: 16 }}>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
        <AppInput label="Neues Passwort" value={password} placeholder="Mindestens 8 Zeichen" type="password" onChange={setPassword} />
        <AppInput label="Passwort bestätigen" value={passwordConfirm} placeholder="Passwort wiederholen" type="password" onChange={setPasswordConfirm} />
        <AppButton type="submit" disabled={loading || !password.trim() || !passwordConfirm.trim()} variant="primary" fullWidth>
          {loading ? "Wird gespeichert..." : "Passwort speichern"}
        </AppButton>
        {error && (
          <div style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(176,0,32,0.2)", background: "rgba(176,0,32,0.05)", color: "#B00020", fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>
            {error}
          </div>
        )}
      </form>
    </AppCard>
  );
}

function AuthMobileBanner() {
  return (
    <div className="auth-mobile-brand">
      <img src="/logo.png" alt="VFA Logo" style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>VFA-Akademie</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500, letterSpacing: "0.04em", marginTop: 1 }}>SCHULUNGEN · ZERTIFIKATE</div>
      </div>
    </div>
  );
}

function AuthBrandPanel() {
  return (
    <div className="auth-panel-left">
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 32, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/logo.png" alt="VFA Logo" style={{ width: 56, height: 56, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>VFA-Akademie</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500, letterSpacing: "0.04em", marginTop: 2 }}>VERBAND FREIER AUFZUGSUNTERNEHMER</div>
          </div>
        </div>
        <div>
          <div style={{ width: 40, height: 3, background: "#FFC100", borderRadius: 999, marginBottom: 20 }} />
          <p style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.35, letterSpacing: "-0.01em", margin: 0 }}>
            Sicher unterwegs mit deinem VFA-Konto.
          </p>
        </div>
        <div style={{ display: "grid", gap: 14, marginTop: 8 }}>
          {["Schulungen zentral verwalten", "Zertifikate automatisch ausstellen", "Credits & Ranking einsehen"].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,193,0,0.2)", border: "1px solid rgba(255,193,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: "#FFC100", fontWeight: 800 }}>✓</div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
