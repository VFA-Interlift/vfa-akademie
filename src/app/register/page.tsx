"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState(""); // TT.MM.JJJJ
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, birthDate }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Fehler beim Registrieren.");
      return;
    }

    router.push("/login");
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>VFA-Akademie – Registrierung</h1>
      <p style={{ marginBottom: 18, opacity: 0.8 }}>Bitte Daten eingeben (Geburtsdatum: TT.MM.JJJJ).</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          Geburtsdatum (TT.MM.JJJJ)
          <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          E-Mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          Passwort (min. 8 Zeichen)
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <button disabled={loading} style={{ padding: 12, fontWeight: 700 }}>
          {loading ? "…" : "Registrieren"}
        </button>

        {msg && <div style={{ padding: 10, border: "1px solid #999", borderRadius: 6 }}>{msg}</div>}
      </form>
    </main>
  );
}
