"use client";

import Link from "next/link";
import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";

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
      setError("Serverfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-panel-left">
        <img
          src="/logo.png"
          alt="VFA Logo"
          style={{ width: 80, height: 80, objectFit: "contain", opacity: 0.95 }}
        />
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.02em" }}>
            VFA-Akademie
          </div>
          <div style={{ marginTop: 10, fontSize: 15, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, maxWidth: 280 }}>
            Schulungen, Zertifikate und Credits – alles an einem Ort.
          </div>
        </div>
        <div style={{ width: 48, height: 4, background: "#FFC100", borderRadius: 999 }} />
      </div>

      <div className="auth-panel-right">
        <div style={{ width: "100%", maxWidth: 460, display: "grid", gap: 24 }}>
          <div>
            <h1
              style={{
                margin: 0,
                color: "#007873",
                fontSize: "clamp(24px, 5vw, 34px)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              Passwort vergessen
            </h1>
            <p style={{ marginTop: 8, color: "#666666", fontSize: 15, lineHeight: 1.5 }}>
              Wir schicken dir einen Reset-Link per E-Mail.
            </p>
          </div>

          <AppCard accent="none" style={{ padding: 28 }}>
            {sent ? (
              <div style={{ display: "grid", gap: 16 }}>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(0,120,115,0.3)",
                    background: "rgba(0,120,115,0.06)",
                    color: "#007873",
                    fontWeight: 600,
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link
                  gesendet. Bitte prüfe auch deinen Spam-Ordner.
                </div>
                <Link
                  href="/login"
                  style={{ color: "#007873", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3, fontSize: 14 }}
                >
                  Zurück zur Anmeldung
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
                <AppInput
                  label="E-Mail"
                  value={email}
                  placeholder="max@firma.de"
                  type="email"
                  onChange={setEmail}
                />

                <AppButton
                  type="submit"
                  disabled={loading || !email.trim()}
                  variant="primary"
                  fullWidth
                >
                  {loading ? "Wird gesendet..." : "Reset-Link senden"}
                </AppButton>

                {error && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: "1px solid rgba(176,0,32,0.24)",
                      background: "rgba(176,0,32,0.06)",
                      color: "#B00020",
                      fontWeight: 600,
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </div>
                )}
              </form>
            )}
          </AppCard>

          <p style={{ textAlign: "center", color: "#666666", fontSize: 14 }}>
            <Link
              href="/login"
              style={{ color: "#007873", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              Zurück zur Anmeldung
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
