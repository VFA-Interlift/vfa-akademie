"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppSelect from "@/components/ui/AppSelect";
import AppTextarea from "@/components/ui/AppTextarea";
import AppCard from "@/components/ui/AppCard";
import StatusBadge from "@/components/ui/StatusBadge";

type FormState = {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  birthDate: string;
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
  const [success, setSuccess] = useState(false);

  async function save() {
    setLoading(true);
    setMsg(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data?.error ?? "Fehler beim Speichern.");
        setSuccess(false);
        return;
      }

      if (data?.emailChanged) {
        setMsg("Gespeichert. Da du die E-Mail geändert hast, wirst du neu eingeloggt.");
        setSuccess(true);
        setTimeout(() => signOut({ callbackUrl: "/login" }), 800);
        return;
      }

      setMsg("Gespeichert.");
      setSuccess(true);
    } catch {
      setMsg("Fehler beim Speichern.");
      setSuccess(false);
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

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <AppCard accent="none" style={{ boxShadow: "none" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#007873",
                fontSize: 24,
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              Persönliche Daten
            </h2>

            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              Diese Daten werden für dein Profil und später für Zertifikate verwendet.
            </p>
          </div>

          <StatusBadge variant="yellow">Profil</StatusBadge>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <AppInput
              label="Vorname"
              value={f.firstName}
              placeholder="Max"
              onChange={(value) => setField("firstName", value)}
            />

            <AppInput
              label="Nachname"
              value={f.lastName}
              placeholder="Mustermann"
              onChange={(value) => setField("lastName", value)}
            />
          </div>

          <AppInput
            label="E-Mail"
            value={f.email}
            placeholder="max@firma.de"
            type="email"
            onChange={(value) => setField("email", value)}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <AppInput
              label="Geburtsdatum (TT.MM.JJJJ)"
              value={f.birthDate}
              placeholder="31.01.1990"
              onChange={(value) => setField("birthDate", value)}
            />

            <AppInput
              label="Telefon"
              value={f.phone}
              placeholder="+49 170 1234567"
              type="tel"
              onChange={(value) => setField("phone", value)}
            />
          </div>

          <AppSelect
            label="Geschlecht / Anrede"
            value={f.gender}
            onChange={(value) => setField("gender", value)}
            placeholder="Bitte auswählen"
            options={[
              { value: "weiblich", label: "weiblich" },
              { value: "männlich", label: "männlich" },
              { value: "divers", label: "divers" },
              { value: "keine Angabe", label: "keine Angabe" },
            ]}
          />
        </div>
      </AppCard>

      <AppCard accent="none" style={{ boxShadow: "none" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#007873",
                fontSize: 24,
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              Firmendaten
            </h2>

            <p
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              Diese Angaben helfen bei Schulungsverwaltung, Kommunikation und späterer Cobra-Zuordnung.
            </p>
          </div>

          <StatusBadge>Firma</StatusBadge>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <AppInput
            label="Firmenname"
            value={f.company}
            placeholder="Firma GmbH"
            onChange={(value) => setField("company", value)}
          />

          <AppInput
            label="Funktion / Position"
            value={f.position}
            placeholder="Technischer Leiter"
            onChange={(value) => setField("position", value)}
          />

          <AppInput
            label="Straße und Hausnummer"
            value={f.companyStreet}
            placeholder="Musterstraße 12"
            onChange={(value) => setField("companyStreet", value)}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            <AppInput
              label="PLZ"
              value={f.companyZip}
              placeholder="20537"
              onChange={(value) => setField("companyZip", value)}
            />

            <AppInput
              label="Ort"
              value={f.companyCity}
              placeholder="Hamburg"
              onChange={(value) => setField("companyCity", value)}
            />
          </div>

          <AppInput
            label="Land"
            value={f.companyCountry}
            placeholder="Deutschland"
            onChange={(value) => setField("companyCountry", value)}
          />

          <AppTextarea
            label="Firmenadresse Zusatz / Bemerkung"
            value={f.companyAddress}
            placeholder="Optional, z. B. Postfach, Standort, Abteilung"
            rows={3}
            onChange={(value) => setField("companyAddress", value)}
          />
        </div>
      </AppCard>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <AppButton onClick={save} disabled={loading} variant="primary">
          {loading ? "Speichern..." : "Speichern"}
        </AppButton>

        {msg && (
          <div
            style={{
              padding: "10px 14px",
              border: success ? "1px solid #007873" : "1px solid rgba(176,0,32,0.28)",
              background: success ? "rgba(0,120,115,0.08)" : "rgba(176,0,32,0.08)",
              color: success ? "#007873" : "#B00020",
              fontWeight: 800,
            }}
          >
            {msg}
          </div>
        )}
      </div>

      <div className="logout-mobile-only">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 999,
            border: "1px solid #D4D4D4",
            background: "#F4F4F4",
            color: "#666666",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.04em",
            cursor: "pointer",
          }}
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}