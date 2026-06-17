"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMsg(null);

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

      router.push("/login");
    } catch {
      setMsg("Serverfehler beim Registrieren.");
    } finally {
      setLoading(false);
    }
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
              Konto erstellen
            </h1>
            <p
              style={{
                marginTop: 8,
                color: "#666666",
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              Registriere dich für die VFA-Akademie.
            </p>
          </div>

          <AppCard accent="none" style={{ padding: 28 }}>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
              <AppInput
                label="Name"
                value={name}
                placeholder="Max Mustermann"
                onChange={setName}
              />

              <AppInput
                label="Geburtsdatum (TT.MM.JJJJ)"
                value={birthDate}
                placeholder="31.01.1990"
                onChange={setBirthDate}
              />

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
                placeholder="Mindestens 8 Zeichen"
                type="password"
                onChange={setPassword}
              />

              <AppButton
                type="submit"
                disabled={loading || !email.trim() || !password.trim() || !name.trim()}
                variant="primary"
                fullWidth
              >
                {loading ? "Registrieren..." : "Registrieren"}
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
            Bereits ein Konto?{" "}
            <Link
              href="/login"
              style={{
                color: "#007873",
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Zur Anmeldung
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
