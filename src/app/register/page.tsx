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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const todayIso = new Date().toISOString().slice(0, 10);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMsg(null);

    if (password.length < 8) {
      setMsg("Das Passwort muss mindestens 8 Zeichen haben.");
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

      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setMsg("Serverfehler beim Registrieren.");
    } finally {
      setLoading(false);
    }
  }

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
            Konto erstellen
          </h1>
          <p style={{ margin: "0 0 28px", color: "#888888", fontSize: 15, lineHeight: 1.5 }}>
            Registriere dich für die VFA-Akademie.
          </p>

          {done ? (
            <AppCard accent="none" style={{ padding: 28, borderRadius: 16, textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(0,120,115,0.10)",
                  border: "1px solid rgba(0,120,115,0.30)",
                  color: "#007873",
                  fontSize: 30,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                ✓
              </div>
              <h2 style={{ margin: "0 0 6px", color: "#007873", fontSize: 22, fontWeight: 800 }}>
                Konto erstellt!
              </h2>
              <p style={{ margin: 0, color: "#333333", fontSize: 15, lineHeight: 1.5 }}>
                Du wirst gleich zur Anmeldung weitergeleitet …
              </p>
            </AppCard>
          ) : (
            <AppCard accent="none" style={{ padding: 28, borderRadius: 16 }}>
              <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
                <AppInput label="Name" value={name} placeholder="Max Mustermann" onChange={setName} />
                <AppInput label="Geburtsdatum" value={birthDate} type="date" max={todayIso} onChange={setBirthDate} />
                <AppInput label="E-Mail" value={email} placeholder="max@firma.de" type="email" onChange={setEmail} />
                <AppInput label="Passwort" value={password} placeholder="Mindestens 8 Zeichen" type="password" onChange={setPassword} />
                <AppInput label="Passwort bestätigen" value={confirmPassword} placeholder="Passwort wiederholen" type="password" onChange={setConfirmPassword} />

                <AppButton
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim() || !name.trim() || !birthDate.trim()}
                  variant="primary"
                  fullWidth
                >
                  {loading ? "Registrieren..." : "Konto erstellen"}
                </AppButton>

                {msg && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: "1px solid rgba(176,0,32,0.2)",
                      background: "rgba(176,0,32,0.05)",
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
          )}

          <p style={{ marginTop: 20, textAlign: "center", color: "#888888", fontSize: 14 }}>
            Bereits ein Konto?{" "}
            <Link href="/login" style={{ color: "#007873", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>
              Zur Anmeldung
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthMobileBanner() {
  return (
    <div className="auth-mobile-brand">
      <img src="/logo.png" alt="VFA Logo" style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>VFA-Akademie</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500, letterSpacing: "0.04em", marginTop: 1 }}>
          SCHULUNGEN · ZERTIFIKATE
        </div>
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
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500, letterSpacing: "0.04em", marginTop: 2 }}>
              VERBAND FÜR AUFZUGSTECHNIK
            </div>
          </div>
        </div>

        <div>
          <div style={{ width: 40, height: 3, background: "#FFC100", borderRadius: 999, marginBottom: 20 }} />
          <p style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.35, letterSpacing: "-0.01em", margin: 0 }}>
            Schulungen, Zertifikate und Credits — digital verwaltet.
          </p>
        </div>

        <div style={{ display: "grid", gap: 14, marginTop: 8 }}>
          {[
            "Schulungen zentral verwalten",
            "Zertifikate automatisch ausstellen",
            "Credits & Ranking einsehen",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "rgba(255,193,0,0.2)",
                  border: "1px solid rgba(255,193,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 11,
                  color: "#FFC100",
                  fontWeight: 800,
                }}
              >
                ✓
              </div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
