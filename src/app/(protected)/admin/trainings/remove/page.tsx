"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";

type Training = {
  id: string;
  title: string;
  date: string;
  creditsAward: number;
};

export default function AdminTrainingAddPage() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState("");

  const [grantEmail, setGrantEmail] = useState("");
  const [grantCredits, setGrantCredits] = useState("");
  const [grantNote, setGrantNote] = useState("");

  const selectedTraining = useMemo(
    () => trainings.find((t) => t.id === selectedTrainingId) ?? null,
    [trainings, selectedTrainingId]
  );

  async function loadTrainings() {
    const res = await fetch("/api/admin/trainings");
    const data = await res.json();

    if (!data.ok) {
      setMsg(data.error ?? "LOAD_FAILED");
      return;
    }

    setTrainings(data.trainings);
    if (!selectedTrainingId && data.trainings.length > 0) {
      setSelectedTrainingId(data.trainings[0].id);
    }
  }

  useEffect(() => {
    loadTrainings();
    // eslint-disable-next-line
  }, []);

  async function grant() {
    setLoading(true);
    setMsg("");

    const payload: any = {
      email: grantEmail.trim().toLowerCase(),
      trainingId: selectedTrainingId,
      note: grantNote.trim() || null,
    };

    if (grantCredits.trim() === "") payload.credits = null;
    else payload.credits = Number(grantCredits);

    const res = await fetch("/api/admin/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.ok) {
      setMsg(data.error);
    } else {
      if (payload.credits !== null && Number(payload.credits) < 0) {
        setMsg("✅ Credits abgezogen");
      } else {
        setMsg("✅ Schulung hinzugefügt (Zertifikat & Credits vergeben)");
      }
      setGrantEmail("");
      setGrantCredits("");
      setGrantNote("");
    }

    setLoading(false);
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
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BackButton label="Zurück" />
          <h1 style={{ fontSize: 42, margin: 0 }}>Schulung hinzufügen</h1>
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

        <h2 style={{ marginTop: 40 }}>Teilnehmer zuordnen</h2>

        <div style={{ display: "grid", gap: 14 }}>
          <Input label="User E-Mail" value={grantEmail} onChange={setGrantEmail} />

          <label>
            Training
            <select
              value={selectedTrainingId}
              onChange={(e) => setSelectedTrainingId(e.target.value)}
              style={selectStyle}
            >
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} (default {t.creditsAward})
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Credits (leer = default, negativ = abziehen z.B. -5)"
            value={grantCredits}
            onChange={(v) => {
              if (v === "" || v === "-" || /^-?\d+$/.test(v)) setGrantCredits(v);
            }}
          />

          <Input label="Notiz" value={grantNote} onChange={setGrantNote} />

          <Button onClick={grant} disabled={loading || !selectedTrainingId}>
            Speichern
          </Button>

          {selectedTraining && (
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              Default Credits: {selectedTraining.creditsAward}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- UI COMPONENTS ---------- */

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

function Button({ children, onClick, disabled }: any) {
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
        cursor: "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: 15,
};

const selectStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
};
