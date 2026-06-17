"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMsg(null);

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setMsg("Login fehlgeschlagen. Bitte E-Mail und Passwort prüfen.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-split">
      {/* Left branding panel */}
      <div className="auth-panel-left">
        <img
          src="/logo.png"
          alt="VFA Logo"
          style={{ width: 80, height: 80, objectFit: "contain", opacity: 0.95 }}
        />
        <div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "0.02em",
            }}
          >
            VFA-Akademie
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 15,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.6,
              maxWidth: 280,
            }}
          >
            Schulungen, Zertifikate und Credits – alles an einem Ort.
          </div>
        </div>
        <div
          style={{
            width: 48,
            height: 4,
            background: "#FFC100",
            borderRadius: 999,
          }}
        />
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div style={{ width: "100%", maxWidth: 460, display: "grid", gap: 24 }}>
          <div>
            <h1
              style={{
                margin: 0,
                color: "#007873",
                fontSize: "clamp(26px, 6vw, 36px)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              Willkommen zurück
            </h1>
            <p
              style={{
                marginTop: 8,
                color: "#666666",
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              Melde dich mit deinem VFA-Akademie-Konto an.
            </p>
          </div>

          <AppCard accent="none" style={{ padding: 28 }}>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
              <AppInput
                label="E-Mail"
                value={email}
                placeholder="max@firma.de"
                type="email"
                onChange={setEmail}
              />

              <AppInput
                label="Passwort"
                value={password}
                placeholder="Passwort eingeben"
                type="password"
                onChange={setPassword}
              />

              <div style={{ textAlign: "right", marginTop: -8 }}>
                <Link
                  href="/forgot-password"
                  style={{
                    color: "#007873",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  Passwort vergessen?
                </Link>
              </div>

              <AppButton
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                variant="primary"
                fullWidth
              >
                {loading ? "Einloggen..." : "Einloggen"}
              </AppButton>

              {msg && (
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
                  {msg}
                </div>
              )}
            </form>
          </AppCard>

          <p style={{ textAlign: "center", color: "#666666", fontSize: 14 }}>
            Noch kein Konto?{" "}
            <Link
              href="/register"
              style={{
                color: "#007873",
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
