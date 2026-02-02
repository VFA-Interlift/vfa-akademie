"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function promote() {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/users/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        setMsg("SERVER_RESPONSE_INVALID");
        return;
      }

      if (!res.ok || !data?.ok) {
        setMsg(data?.error ?? "PROMOTE_FAILED");
        return;
      }

      setMsg(`✅ ${data.email} ist jetzt ADMIN`);
      setEmail("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        background: "radial-gradient(circle at top, #111 0%, #000 80%)",
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <BackButton label="Zurück" />
          <h1 style={{ fontSize: 42, margin: 0 }}>Admin ernennen</h1>
        </div>

        {msg && (
          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {msg}
          </div>
        )}

        <div style={{ marginTop: 28, display: "grid", gap: 12, maxWidth: 520 }}>
          <label style={{ display: "grid", gap: 6 }}>
            User E-Mail
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontSize: 15,
              }}
            />
          </label>

          <button
            onClick={promote}
            disabled={loading || !email.trim()}
            style={{
              marginTop: 6,
              padding: "12px 16px",
              borderRadius: 14,
              fontWeight: 900,
              background: "#fff",
              color: "#000",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "…" : "Zum Admin machen"}
          </button>

          <p style={{ opacity: 0.7, marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>
            Hinweis: Der User muss bereits registriert sein. Danach sieht er den Admin-Menüpunkt.
          </p>
        </div>
      </div>
    </div>
  );
}
