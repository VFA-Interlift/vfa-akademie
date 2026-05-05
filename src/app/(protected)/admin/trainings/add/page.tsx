"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";

type Training = {
  id: string;
  title: string;
  date: string;
  endDate: string | null;
  creditsAward: number;
};

export default function AdminTrainingParticipantsPage() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState("");

  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  async function loadTrainings() {
    try {
      const res = await fetch("/api/admin/trainings", { cache: "no-store" });
      const data = await res.json();

      if (!data.ok) {
        setMsg(data.error ?? "LOAD_FAILED");
        return;
      }

      setTrainings(data.trainings);

      if (!selectedTrainingId && data.trainings.length > 0) {
        setSelectedTrainingId(data.trainings[0].id);
      }
    } catch {
      setMsg("⚠️ Schulungen konnten nicht geladen werden.");
    }
  }

  useEffect(() => {
    loadTrainings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addParticipant() {
    setLoading(true);
    setMsg("");

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        trainingId: selectedTrainingId,
        note: note.trim() || null,
      };

      const res = await fetch("/api/admin/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.error === "INVALID_EMAIL") {
          setMsg("⚠️ Bitte eine gültige E-Mail eingeben.");
        } else if (data.error === "INVALID_TRAINING_ID") {
          setMsg("⚠️ Bitte eine Schulung auswählen.");
        } else if (data.error === "USER_NOT_FOUND") {
          setMsg("⚠️ Nutzer wurde nicht gefunden.");
        } else if (data.error === "TRAINING_NOT_FOUND") {
          setMsg("⚠️ Schulung wurde nicht gefunden.");
        } else if (data.error === "UNAUTHENTICATED") {
          setMsg("⚠️ Du bist nicht eingeloggt.");
        } else if (data.error === "FORBIDDEN") {
          setMsg("⚠️ Du hast keine Berechtigung.");
        } else {
          setMsg(`⚠️ ${data.error}`);
        }

        return;
      }

      if (data.already) {
        setMsg("ℹ️ Diese Schulung war dem Teilnehmer bereits zugeordnet.");
      } else {
        setMsg("✅ Schulung wurde dem Teilnehmer zugeordnet.");
      }

      setEmail("");
      setNote("");
    } catch {
      setMsg("⚠️ Serverfehler beim Hinzufügen.");
    } finally {
      setLoading(false);
    }
  }

  async function removeParticipant() {
    if (!confirm("Diese Schulungszuordnung wirklich entfernen?")) return;

    setLoading(true);
    setMsg("");

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        trainingId: selectedTrainingId,
        note: note.trim() || null,
      };

      const res = await fetch("/api/admin/grants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.error === "INVALID_EMAIL") {
          setMsg("⚠️ Bitte eine gültige E-Mail eingeben.");
        } else if (data.error === "INVALID_TRAINING_ID") {
          setMsg("⚠️ Bitte eine Schulung auswählen.");
        } else if (data.error === "USER_NOT_FOUND") {
          setMsg("⚠️ Nutzer wurde nicht gefunden.");
        } else if (data.error === "ENROLLMENT_NOT_FOUND") {
          setMsg("⚠️ Diese Schulung ist dem Nutzer aktuell nicht zugeordnet.");
        } else if (data.error === "CERTIFICATE_ALREADY_ISSUED") {
          setMsg(
            "⚠️ Diese Zuordnung kann nicht entfernt werden, weil bereits ein Zertifikat erstellt wurde."
          );
        } else if (data.error === "UNAUTHENTICATED") {
          setMsg("⚠️ Du bist nicht eingeloggt.");
        } else if (data.error === "FORBIDDEN") {
          setMsg("⚠️ Du hast keine Berechtigung.");
        } else {
          setMsg(`⚠️ ${data.error}`);
        }

        return;
      }

      setMsg("✅ Schulungszuordnung wurde entfernt.");
      setEmail("");
      setNote("");
    } catch {
      setMsg("⚠️ Serverfehler beim Entfernen.");
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
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BackButton label="Zurück" />
          <h1 style={{ fontSize: 42, margin: 0 }}>Teilnehmer verwalten</h1>
        </div>

        <p style={{ marginTop: 14, color: "#aaa", lineHeight: 1.5 }}>
          Hier kannst du Teilnehmer einer Schulung zuordnen oder eine bestehende
          Zuordnung wieder entfernen. Credits und Zertifikate werden dabei nicht
          automatisch vergeben.
        </p>

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
          <Input label="User E-Mail" value={email} onChange={setEmail} />

          <label style={{ display: "grid", gap: 6 }}>
            Schulung
            <select
              value={selectedTrainingId}
              onChange={(event) => setSelectedTrainingId(event.target.value)}
              style={selectStyle}
            >
              {trainings.map((training) => (
                <option key={training.id} value={training.id}>
                  {training.title} · {formatDate(training.date)}
                  {training.endDate ? ` bis ${formatDate(training.endDate)}` : ""}
                  {` · ${training.creditsAward} Credits`}
                </option>
              ))}
            </select>
          </label>

          <Input label="Notiz optional" value={note} onChange={setNote} />

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <Button
              onClick={addParticipant}
              disabled={loading || !email.trim() || !selectedTrainingId}
            >
              {loading ? "Speichern..." : "Teilnehmer hinzufügen"}
            </Button>

            <Button
              onClick={removeParticipant}
              disabled={loading || !email.trim() || !selectedTrainingId}
              danger
            >
              {loading ? "Speichern..." : "Teilnehmer entfernen"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-DE");
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function Button({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 16px",
        borderRadius: 14,
        fontWeight: 800,
        background: danger ? "rgba(255,0,0,0.18)" : "#fff",
        color: danger ? "#fff" : "#000",
        border: danger ? "1px solid rgba(255,255,255,0.18)" : "none",
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

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: 15,
};