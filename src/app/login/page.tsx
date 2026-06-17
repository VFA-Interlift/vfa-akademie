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
      <AuthBrandPanel />

      <div className="auth-panel-right">
        <div style={{ width: "100%", maxWidth: 420 }} className="page-enter">
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
            Willkommen zurück
          </h1>
          <p style={{ margin: "0 0 28px", color: "#888888", fontSize: 15, lineHeight: 1.5 }}>
            Melde dich mit deinem VFA-Akademie-Konto an.
          </p>

          <AppCard accent="none" style={{ padding: 28, borderRadius: 16 }}>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
              <AppInput label="E-Mail" value={email} placeholder="max@firma.de" type="email" onChange={setEmail} />
              <AppInput label="Passwort" value={password} placeholder="Passwort eingeben" type="password" onChange={setPassword} />

              <div style={{ textAlign: "right", marginTop: -10 }}>
                <Link href="/forgot-password" style={{ color: "#007873", fontSize: 13, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
                  Passwort vergessen?
                </Link>
              </div>

              <AppButton type="submit" disabled={loading || !email.trim() || !password.trim()} variant="primary" fullWidth>
                {loading ? "Einloggen..." : "Einloggen"}
              </AppButton>

              {msg && <ErrorBox>{msg}</ErrorBox>}
            </form>
          </AppCard>

          <p style={{ marginTop: 20, textAlign: "center", color: "#888888", fontSize: 14 }}>
            Noch kein Konto?{" "}
            <Link href="/register" style={{ color: "#007873", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthBrandPanel() {
  return (
    <div className="auth-panel-left">
      {/* Logo + title */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 32, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/logo.png" alt="VFA Logo" style={{ width: 56, height: 56, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>VFA-Akademie</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 500, letterSpacing: "0.04em", marginTop: 2 }}>
              VERBAND FREIER AUFZUGSUNTERNEHMER
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              width: 40,
              height: 3,
              background: "#FFC100",
              borderRadius: 999,
              marginBottom: 20,
            }}
          />
          <p style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.35, letterSpacing: "-0.01em", margin: 0 }}>
            Schulungen, Zertifikate und Credits — digital verwaltet.
          </p>
        </div>

        {/* Feature list */}
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

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}
