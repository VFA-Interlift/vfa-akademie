"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import StatusBadge from "@/components/ui/StatusBadge";

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
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "32px 18px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          display: "grid",
          gap: 22,
        }}
      >
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
              fontSize: "clamp(38px, 11vw, 56px)",
              fontWeight: 400,
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Anmeldung
          </h1>

          <p
            style={{
              marginTop: 16,
              marginBottom: 0,
              color: "#333333",
              fontSize: 17,
              lineHeight: 1.6,
              maxWidth: 560,
            }}
          >
            Melde dich mit deinem VFA-Akademie-Konto an, um deine Schulungen,
            Zertifikate, Credits und Profildaten zu verwalten.
          </p>
        </section>

        <AppCard accent="green">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#007873",
                  fontSize: 26,
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                Einloggen
              </h2>

              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  color: "#333333",
                  lineHeight: 1.6,
                }}
              >
                Zugang zur VFA-Akademie-App.
              </p>
            </div>

            <StatusBadge variant="yellow">Login</StatusBadge>
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
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
                  border: "1px solid rgba(176,0,32,0.28)",
                  background: "rgba(176,0,32,0.08)",
                  color: "#B00020",
                  fontWeight: 800,
                  lineHeight: 1.5,
                }}
              >
                {msg}
              </div>
            )}
          </form>

          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: "1px solid #E6E6E6",
              color: "#333333",
              lineHeight: 1.6,
            }}
          >
            Noch kein Konto?{" "}
            <Link
              href="/register"
              style={{
                color: "#007873",
                fontWeight: 800,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Jetzt registrieren
            </Link>
          </div>
        </AppCard>
      </div>
    </main>
  );
}