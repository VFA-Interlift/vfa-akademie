"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import {
  CERTIFICATE_TEMPLATE_CODES,
  formatCertificateKind,
} from "@/lib/certificates/templates";
import type { CertificateKind } from "@prisma/client";

type Training = {
  id: string;
  title: string;
  code: string | null;
  certificateKind: CertificateKind | null;
  date: string;
  endDate: string | null;
  location: string | null;
  instructor: string | null;
  description: string | null;
  creditsAward: number;
};

export default function AdminTrainingsPage() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [trainings, setTrainings] = useState<Training[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newInstructor, setNewInstructor] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCreditsAward, setNewCreditsAward] = useState("0");

  async function loadTrainings() {
    try {
      const res = await fetch("/api/admin/trainings", { cache: "no-store" });
      const data = await res.json();

      if (!data.ok) {
        setMsg(data.error ?? "LOAD_FAILED");
        return;
      }

      setTrainings(data.trainings);
    } catch {
      setMsg("LOAD_FAILED");
    }
  }

  useEffect(() => {
    loadTrainings();
  }, []);

  async function createTraining() {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/trainings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          code: newCode.trim() || null,
          date: newStartDate.trim(),
          endDate: newEndDate.trim(),
          location: newLocation.trim() || null,
          instructor: newInstructor.trim() || null,
          description: newDescription.trim() || null,
          creditsAward: Number(newCreditsAward),
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.error === "UNKNOWN_CERTIFICATE_CODE") {
          setMsg("⚠️ Unbekanntes Kürzel. Bitte ein gültiges Kürzel auswählen oder leer lassen.");
        } else {
          setMsg(data.error ?? "CREATE_FAILED");
        }
        return;
      }

      setMsg("✅ Schulung erstellt");
      setNewTitle("");
      setNewCode("");
      setNewStartDate("");
      setNewEndDate("");
      setNewLocation("");
      setNewInstructor("");
      setNewDescription("");
      setNewCreditsAward("0");

      await loadTrainings();
    } catch {
      setMsg("CREATE_FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function updateCredits(id: string, value: number) {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`/api/admin/trainings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsAward: value }),
      });

      const data = await res.json();

      if (!data.ok) {
        setMsg(data.error ?? "UPDATE_FAILED");
        return;
      }

      await loadTrainings();
    } catch {
      setMsg("UPDATE_FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function updateCode(id: string, value: string) {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`/api/admin/trainings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value.trim() || "" }),
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.error === "UNKNOWN_CERTIFICATE_CODE") {
          setMsg("⚠️ Unbekanntes Kürzel. Bitte ein gültiges Kürzel auswählen oder leer lassen.");
        } else {
          setMsg(data.error ?? "UPDATE_FAILED");
        }
        return;
      }

      setMsg("✅ Kürzel aktualisiert");
      await loadTrainings();
    } catch {
      setMsg("UPDATE_FAILED");
    } finally {
      setLoading(false);
    }
  }

  async function removeTraining(id: string) {
    if (
      !confirm(
        "Schulung wirklich löschen? Das sollte nur gemacht werden, wenn noch keine Zertifikate dafür erstellt wurden."
      )
    ) {
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`/api/admin/trainings/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.error === "CERTIFICATES_EXIST") {
          setMsg("⚠️ Diese Schulung kann nicht gelöscht werden, weil bereits Zertifikate existieren.");
        } else if (data.error === "TRAINING_NOT_FOUND") {
          setMsg("⚠️ Schulung wurde nicht gefunden.");
        } else {
          setMsg(data.error ?? "DELETE_FAILED");
        }

        return;
      }

      setMsg("✅ Schulung gelöscht");
      await loadTrainings();
    } catch {
      setMsg("DELETE_FAILED");
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
          <h1 style={{ fontSize: 42, margin: 0 }}>Schulungen verwalten</h1>
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

        <h2 style={{ marginTop: 40 }}>Neue Schulung erstellen</h2>

        <div style={{ marginBottom: 30, display: "grid", gap: 14 }}>
          <Input label="Titel" value={newTitle} onChange={setNewTitle} />

          <Select
            label="Kürzel optional, später automatisch aus Cobra"
            value={newCode}
            onChange={setNewCode}
          />

          <Input
            label="Startdatum (TT.MM.JJJJ)"
            value={newStartDate}
            onChange={setNewStartDate}
          />

          <Input
            label="Enddatum (TT.MM.JJJJ)"
            value={newEndDate}
            onChange={setNewEndDate}
          />

          <Input label="Ort" value={newLocation} onChange={setNewLocation} />

          <Input
            label="Dozent"
            value={newInstructor}
            onChange={setNewInstructor}
          />

          <TextArea
            label="Beschreibung / Inhalte"
            value={newDescription}
            onChange={setNewDescription}
          />

          <Input
            label="Credits nach Abschluss"
            value={newCreditsAward}
            onChange={(value) => {
              if (value === "" || /^\d+$/.test(value)) {
                setNewCreditsAward(value);
              }
            }}
          />

          <Button
            onClick={createTraining}
            disabled={
              loading ||
              !newTitle.trim() ||
              !newStartDate.trim() ||
              !newEndDate.trim()
            }
          >
            {loading ? "Speichern..." : "Schulung erstellen"}
          </Button>
        </div>

        <h2 style={{ marginTop: 40 }}>Vorhandene Schulungen</h2>

        <div style={{ display: "grid", gap: 14 }}>
          {trainings.length === 0 ? (
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: 14,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              Noch keine Schulungen vorhanden.
            </div>
          ) : (
            trainings.map((t) => (
              <div
                key={t.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: 14,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18 }}>{t.title}</div>

                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                  Zeitraum: {formatDate(t.date)}
                  {t.endDate ? ` bis ${formatDate(t.endDate)}` : ""}
                </div>

                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                  Kürzel: {t.code || "nicht gesetzt"}
                </div>

                <div style={{ marginTop: 4, fontSize: 13, opacity: 0.8 }}>
                  Dokumentart: {formatCertificateKind(t.certificateKind)}
                </div>

                {t.location && (
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.8 }}>
                    Ort: {t.location}
                  </div>
                )}

                {t.instructor && (
                  <div style={{ marginTop: 4, fontSize: 13, opacity: 0.8 }}>
                    Dozent: {t.instructor}
                  </div>
                )}

                {t.description && (
                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                    Inhalte: {t.description}
                  </div>
                )}

                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                  Credits nach Abschluss: {t.creditsAward}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <select
                    value={t.code ?? ""}
                    onChange={(event) => updateCode(t.id, event.target.value)}
                    disabled={loading}
                    style={smallSelectStyle}
                  >
                    <option value="">Kürzel setzen</option>
                    {CERTIFICATE_TEMPLATE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>

                  <ButtonSmall
                    onClick={() =>
                      updateCredits(t.id, Math.max(0, t.creditsAward - 1))
                    }
                  >
                    -1 Credit
                  </ButtonSmall>

                  <ButtonSmall onClick={() => updateCredits(t.id, t.creditsAward + 1)}>
                    +1 Credit
                  </ButtonSmall>

                  <ButtonSmall danger onClick={() => removeTraining(t.id)}>
                    Schulung löschen
                  </ButtonSmall>
                </div>
              </div>
            ))
          )}
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

function Select({
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
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      >
        <option value="">Kein Kürzel auswählen</option>
        {CERTIFICATE_TEMPLATE_CODES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
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
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        style={{
          ...inputStyle,
          resize: "vertical",
          fontFamily: "inherit",
        }}
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

function ButtonSmall({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: 15,
};

const smallSelectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};