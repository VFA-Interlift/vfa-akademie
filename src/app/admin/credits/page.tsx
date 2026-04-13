"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";

export default function AdminCreditsPage() {
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveCredits() {
    setLoading(true);
    setMsg("");

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        credits: Number(credits),
        note: note.trim() || null,
      };

      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.error === "INVALID_EMAIL") {
          setMsg("⚠️ Bitte eine gültige E-Mail eingeben.");
        } else if (data.error === "INVALID_CREDITS") {
          setMsg("⚠️ Bitte eine ganze Zahl ungleich 0 eingeben.");
        } else if (data.error === "USER_NOT_FOUND") {
          setMsg("⚠️ Nutzer wurde nicht gefunden.");
        } else if (data.error === "UNAUTHENTICATED") {
          setMsg("⚠️ Du bist nicht eingeloggt.");
        } else if (data.error === "FORBIDDEN") {
          setMsg("⚠️ Du hast keine Berechtigung.");
        } else {
          setMsg(`⚠️ ${data.error}`);
        }

        return;
      }

      if (Number(credits) > 0) {
        setMsg(`✅ ${credits} Credits wurden erfolgreich vergeben.`);
      } else {
        setMsg(`✅ ${Math.abs(Number(credits))} Credits wurden erfolgreich abgezogen.`);
      }

      setEmail("");
      setCredits("");
      setNote("");
    } catch {
      setMsg("⚠️ Serverfehler beim Speichern.");
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BackButton label="Zurück" />
          <h1 style={{ fontSize: 42, margin: 0 }}>Credits vergeben</h1>
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

        <div style={{ marginTop: 32, display: "grid", gap: 14 }}>
          <Input
            label="User E-Mail"
            value={email}
            onChange={setEmail}
          />

          <Input
            label="Credits (positiv = vergeben, negativ = abziehen)"
            value={credits}
            onChange={(v) => {
              if (v === "" || v === "-" || /^-?\d+$/.test(v)) {
                setCredits(v);
              }
            }}
          />

          <Input
            label="Notiz"
            value={note}
            onChange={setNote}
          />

          <Button
            onClick={saveCredits}
            disabled={loading || !email.trim() || !credits.trim()}
          >
            {loading ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function Button({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        marginTop: 10,
        padding: "12px 16px",
        borderRadius: 14,
        fontWeight: 800,
        background: "#fff",
        color: "#000",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: 15,
};