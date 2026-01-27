"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type FormState = {
  name: string;
  email: string;
  company: string;
  birthDate: string; // TT.MM.JJJJ
  gender: string;
  companyAddress: string;
};

export default function MeineDatenForm({ initial }: { initial: FormState }) {
  const [f, setF] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Fehler beim Speichern.");
      return;
    }

    if (data?.emailChanged) {
      setMsg("Gespeichert. Da du die E-Mail geändert hast, wirst du neu eingeloggt.");
      // sauber: Session beenden → Login neu
      setTimeout(() => signOut({ callbackUrl: "/login" }), 800);
      return;
    }

    setMsg("Gespeichert ✅");
  }

  function input(label: string, key: keyof FormState, placeholder?: string) {
    return (
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ color: "#aaa" }}>{label}</span>
        <input
          value={f[key]}
          placeholder={placeholder}
          onChange={(e) => setF({ ...f, [key]: e.target.value })}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
          }}
        />
      </label>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {input("Name", "name", "Max Mustermann")}
      {input("E-Mail", "email", "max@firma.de")}
      {input("Unternehmen", "company", "Firma GmbH")}
      {input("Geburtsdatum (TT.MM.JJJJ)", "birthDate", "31.01.1990")}

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ color: "#aaa" }}>Geschlecht</span>
        <select
          value={f.gender}
          onChange={(e) => setF({ ...f, gender: e.target.value })}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
          }}
        >
          <option value="">– bitte wählen –</option>
          <option value="weiblich">weiblich</option>
          <option value="männlich">männlich</option>
          <option value="divers">divers</option>
          <option value="keine Angabe">keine Angabe</option>
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ color: "#aaa" }}>Firmenadresse</span>
        <textarea
          value={f.companyAddress}
          onChange={(e) => setF({ ...f, companyAddress: e.target.value })}
          rows={3}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            resize: "vertical",
          }}
        />
      </label>

      <button
        onClick={save}
        disabled={loading}
        style={{
          marginTop: 6,
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "#fff",
          color: "#000",
          fontWeight: 800,
          cursor: "pointer",
          width: "fit-content",
        }}
      >
        {loading ? "Speichern…" : "Speichern"}
      </button>

      {msg && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.03)",
            color: "#fff",
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
