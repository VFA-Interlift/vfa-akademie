"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";

type Training = {
  id: string;
  title: string;
  date: string;
  creditsAward: number;
};

export default function AdminPage() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState("");

  // Grant
  const [grantEmail, setGrantEmail] = useState("");
  const [grantCredits, setGrantCredits] = useState("");
  const [grantNote, setGrantNote] = useState("");

  // Revoke (Badge/Training entfernen)
  const [revokeEmail, setRevokeEmail] = useState("");
  const [revokeNote, setRevokeNote] = useState("");

  // New Training
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCreditsAward, setNewCreditsAward] = useState("0");

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
        setMsg("✅ Zertifikat & Credits vergeben");
      }
      setGrantEmail("");
      setGrantCredits("");
      setGrantNote("");
    }

    setLoading(false);
  }

  async function revoke() {
    setLoading(true);
    setMsg("");

    const payload = {
      email: revokeEmail.trim().toLowerCase(),
      trainingId: selectedTrainingId,
      note: revokeNote.trim() || null,
    };

    const res = await fetch("/api/admin/grants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.ok) {
      setMsg(data.error);
    } else {
      setMsg("✅ Schulung/Zertifikat entfernt (Credits zurückgebucht)");
      setRevokeEmail("");
      setRevokeNote("");
    }

    setLoading(false);
  }

  async function createTraining() {
    setLoading(true);
    setMsg("");

    const res = await fetch("/api/admin/trainings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        date: newDate.trim(),
        creditsAward: Number(newCreditsAward),
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      setMsg(data.error);
    } else {
      setMsg("✅ Training erstellt");
      setNewTitle("");
      setNewDate("");
      setNewCreditsAward("0");
      await loadTrainings();
    }

    setLoading(false);
  }

  async function updateCredits(id: string, value: number) {
    setLoading(true);

    await fetch(`/api/admin/trainings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditsAward: value }),
    });

    await loadTrainings();
    setLoading(false);
  }

  async function removeTraining(id: string) {
    if (!confirm("Training wirklich löschen?")) return;

    setLoading(true);

    const res = await fetch(`/api/admin/trainings/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!data.ok) setMsg(data.error);
    else setMsg("✅ Training gelöscht");

    await loadTrainings();
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
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BackButton label="Zurück" />
          <h1 style={{ fontSize: 42, margin: 0 }}>Admin</h1>
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

        {/* Grant */}
        <h2 style={{ marginTop: 40 }}>Zertifikat & Credits vergeben</h2>

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
              // erlaubt nur: leer, "-" , oder Zahlen mit optionalem "-" vorne
              if (v === "" || v === "-" || /^-?\d+$/.test(v)) setGrantCredits(v);
            }}
          />

          <Input label="Notiz" value={grantNote} onChange={setGrantNote} />

          <Button onClick={grant} disabled={loading || !selectedTrainingId}>
            Vergeben
          </Button>
        </div>

        {/* Revoke */}
        <h2 style={{ marginTop: 40 }}>Schulung/Zertifikat entfernen</h2>

        <div style={{ display: "grid", gap: 14 }}>
          <Input label="User E-Mail" value={revokeEmail} onChange={setRevokeEmail} />

          <label>
            Training
            <select
              value={selectedTrainingId}
              onChange={(e) => setSelectedTrainingId(e.target.value)}
              style={selectStyle}
            >
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>

          <Input label="Notiz (optional)" value={revokeNote} onChange={setRevokeNote} />

          <Button onClick={revoke} disabled={loading || !selectedTrainingId}>
            Entfernen
          </Button>
        </div>

        {/* Trainings */}
        <h2 style={{ marginTop: 60 }}>Trainings verwalten</h2>

        <div style={{ marginBottom: 30 }}>
          <Input label="Titel" value={newTitle} onChange={setNewTitle} />
          <Input label="Datum" value={newDate} onChange={setNewDate} />
          <Input
            label="creditsAward"
            value={newCreditsAward}
            onChange={setNewCreditsAward}
          />
          <Button onClick={createTraining} disabled={loading}>
            Training erstellen
          </Button>
        </div>

        {/* List */}
        <div style={{ display: "grid", gap: 14 }}>
          {trainings.map((t) => (
            <div
              key={t.id}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: 14,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ fontWeight: 700 }}>{t.title}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                Credits: {t.creditsAward}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <ButtonSmall onClick={() => updateCredits(t.id, t.creditsAward - 1)}>
                  -1
                </ButtonSmall>
                <ButtonSmall onClick={() => updateCredits(t.id, t.creditsAward + 1)}>
                  +1
                </ButtonSmall>
                <ButtonSmall danger onClick={() => removeTraining(t.id)}>
                  Löschen
                </ButtonSmall>
              </div>
            </div>
          ))}
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

function ButtonSmall({ children, onClick, danger }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.2)",
        background: danger ? "rgba(255,0,0,0.15)" : "rgba(255,255,255,0.08)",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 700,
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
