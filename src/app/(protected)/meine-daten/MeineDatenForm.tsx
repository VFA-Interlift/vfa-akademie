"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type FormState = {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  birthDate: string; // TT.MM.JJJJ
  gender: string;
  phone: string;

  company: string;
  companyAddress: string;
  companyStreet: string;
  companyZip: string;
  companyCity: string;
  companyCountry: string;
  position: string;
};

export default function MeineDatenForm({ initial }: { initial: FormState }) {
  const [f, setF] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error ?? "Fehler beim Speichern.");
        return;
      }

      if (data?.emailChanged) {
        setMsg("Gespeichert. Da du die E-Mail geändert hast, wirst du neu eingeloggt.");
        setTimeout(() => signOut({ callbackUrl: "/login" }), 800);
        return;
      }

      setMsg("Gespeichert ✅");
    } catch {
      setMsg("Fehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  }

  function setField(key: keyof FormState, value: string) {
    setF((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function input(
    label: string,
    key: keyof FormState,
    placeholder?: string,
    type: "text" | "email" | "tel" = "text"
  ) {
    return (
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ color: "#aaa" }}>{label}</span>
        <input
          type={type}
          value={f[key]}
          placeholder={placeholder}
          onChange={(event) => setField(key, event.target.value)}
          style={inputStyle}
        />
      </label>
    );
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Persönliche Daten</h2>

        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {input("Vorname", "firstName", "Max")}
            {input("Nachname", "lastName", "Mustermann")}
          </div>

          {input("E-Mail", "email", "max@firma.de", "email")}

          {input("Geburtsdatum (TT.MM.JJJJ)", "birthDate", "31.01.1990")}

          {input("Telefon", "phone", "+49 170 1234567", "tel")}

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#aaa" }}>Geschlecht / Anrede</span>
            <select
              value={f.gender}
              onChange={(event) => setField("gender", event.target.value)}
              style={inputStyle}
            >
              <option value="">– bitte wählen –</option>
              <option value="weiblich">weiblich</option>
              <option value="männlich">männlich</option>
              <option value="divers">divers</option>
              <option value="keine Angabe">keine Angabe</option>
            </select>
          </label>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Firmendaten</h2>

        <div style={{ display: "grid", gap: 14 }}>
          {input("Firmenname", "company", "Firma GmbH")}

          {input("Funktion / Position", "position", "Technischer Leiter")}

          {input("Straße und Hausnummer", "companyStreet", "Musterstraße 12")}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            {input("PLZ", "companyZip", "20537")}
            {input("Ort", "companyCity", "Hamburg")}
          </div>

          {input("Land", "companyCountry", "Deutschland")}

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#aaa" }}>Firmenadresse Zusatz / Bemerkung</span>
            <textarea
              value={f.companyAddress}
              onChange={(event) => setField("companyAddress", event.target.value)}
              rows={3}
              placeholder="Optional, z. B. Postfach, Standort, Abteilung"
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </label>
        </div>
      </section>

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
          cursor: loading ? "not-allowed" : "pointer",
          width: "fit-content",
          opacity: loading ? 0.6 : 1,
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

const sectionStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.04)",
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  fontSize: 20,
  fontWeight: 800,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: 15,
};