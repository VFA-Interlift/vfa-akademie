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
              fontSize: "clamp(30px, 9vw, 48px)",
              fontWeight: 400,
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Passwort vergessen
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
            Gib deine E-Mail-Adresse ein. Falls ein Konto existiert, senden wir
            dir einen Link zum Zurücksetzen des Passworts.
          </p>
        </section>

        <AppCard accent="green">
          {sent ? (
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
                Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein
                Reset-Link gesendet. Bitte prüfe auch deinen Spam-Ordner.
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
                Zurück zur Anmeldung
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
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

              <div
                style={{
                  marginTop: 6,
                  paddingTop: 18,
                  borderTop: "1px solid #E6E6E6",
                  color: "#333333",
                  lineHeight: 1.6,
                }}
              >
                <Link
                  href="/login"
                  style={{
                    color: "#007873",
                    fontWeight: 800,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  Zurück zur Anmeldung
                </Link>
              </div>
            </form>
          )}
        </AppCard>
      </div>
    </main>
  );
}
