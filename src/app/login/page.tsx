"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setMsg("Login fehlgeschlagen. Bitte E-Mail/Passwort prüfen.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>VFA-Akademie – Login</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          E-Mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <label>
          Passwort
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <button disabled={loading} style={{ padding: 12, fontWeight: 700 }}>
          {loading ? "…" : "Einloggen"}
        </button>

        {msg && <div style={{ padding: 10, border: "1px solid #999", borderRadius: 6 }}>{msg}</div>}
      </form>

      <p style={{ marginTop: 16, opacity: 0.8 }}>
        Noch kein Konto? <a href="/register">Registrieren</a>
      </p>
    </main>
  );
}
