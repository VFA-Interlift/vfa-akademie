"use client";

import { useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

type Training = {
  id: string;
  title: string;
  date: string;
  endDate: string | null;
  creditsAward: number;
  code?: string | null;
  certificateKind?: string | null;
};

export default function AdminTrainingParticipantsPage() {
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState("");

  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  function showMessage(message: string, ok = false) {
    setMsg(message);
    setMsgOk(ok);
  }

  async function loadTrainings() {
    try {
      const res = await fetch("/api/admin/trainings", { cache: "no-store" });
      const data = await res.json();

      if (!data.ok) {
        showMessage(data.error ?? "LOAD_FAILED");
        return;
      }

      setTrainings(data.trainings);

      if (!selectedTrainingId && data.trainings.length > 0) {
        setSelectedTrainingId(data.trainings[0].id);
      }
    } catch {
      showMessage("Schulungen konnten nicht geladen werden.");
    }
  }

  useEffect(() => {
    loadTrainings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addParticipant() {
    setLoading(true);
    setMsg("");
    setMsgOk(false);

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
          showMessage("Bitte eine gültige E-Mail eingeben.");
        } else if (data.error === "INVALID_TRAINING_ID") {
          showMessage("Bitte eine Schulung auswählen.");
        } else if (data.error === "USER_NOT_FOUND") {
          showMessage("Nutzer wurde nicht gefunden.");
        } else if (data.error === "TRAINING_NOT_FOUND") {
          showMessage("Schulung wurde nicht gefunden.");
        } else if (data.error === "UNAUTHENTICATED") {
          showMessage("Du bist nicht eingeloggt.");
        } else if (data.error === "FORBIDDEN") {
          showMessage("Du hast keine Berechtigung.");
        } else {
          showMessage(data.error ?? "Fehler beim Hinzufügen.");
        }

        return;
      }

      if (data.already) {
        showMessage("Diese Schulung war dem Teilnehmer bereits zugeordnet.", true);
      } else {
        showMessage("Schulung wurde dem Teilnehmer zugeordnet.", true);
      }

      setEmail("");
      setNote("");
    } catch {
      showMessage("Serverfehler beim Hinzufügen.");
    } finally {
      setLoading(false);
    }
  }

  async function removeParticipant() {
    if (!confirm("Diese Schulungszuordnung wirklich entfernen?")) return;

    setLoading(true);
    setMsg("");
    setMsgOk(false);

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
          showMessage("Bitte eine gültige E-Mail eingeben.");
        } else if (data.error === "INVALID_TRAINING_ID") {
          showMessage("Bitte eine Schulung auswählen.");
        } else if (data.error === "USER_NOT_FOUND") {
          showMessage("Nutzer wurde nicht gefunden.");
        } else if (data.error === "ENROLLMENT_NOT_FOUND") {
          showMessage("Diese Schulung ist dem Nutzer aktuell nicht zugeordnet.");
        } else if (data.error === "CERTIFICATE_ALREADY_ISSUED") {
          showMessage(
            "Diese Zuordnung kann nicht entfernt werden, weil bereits ein Zertifikat erstellt wurde."
          );
        } else if (data.error === "UNAUTHENTICATED") {
          showMessage("Du bist nicht eingeloggt.");
        } else if (data.error === "FORBIDDEN") {
          showMessage("Du hast keine Berechtigung.");
        } else {
          showMessage(data.error ?? "Fehler beim Entfernen.");
        }

        return;
      }

      showMessage("Schulungszuordnung wurde entfernt.", true);
      setEmail("");
      setNote("");
    } catch {
      showMessage("Serverfehler beim Entfernen.");
    } finally {
      setLoading(false);
    }
  }

  const selectedTraining = trainings.find(
    (training) => training.id === selectedTrainingId
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader
          title="Teilnehmer verwalten"
          description="Hier kannst du Teilnehmer einer Schulung zuordnen oder eine bestehende Zuordnung entfernen. Credits und Zertifikate werden dabei nicht direkt vergeben."
        />

        {msg && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              border: msgOk
                ? "1px solid #007873"
                : "1px solid rgba(176,0,32,0.28)",
              background: msgOk
                ? "rgba(0,120,115,0.08)"
                : "rgba(176,0,32,0.08)",
              color: msgOk ? "#007873" : "#B00020",
              fontWeight: 800,
              lineHeight: 1.5,
            }}
          >
            {msg}
          </div>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          <AppCard accent="green">
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
                  Teilnehmer zuordnen oder entfernen
                </h2>

                <p
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: "#333333",
                    lineHeight: 1.6,
                    maxWidth: 720,
                  }}
                >
                  Gib die E-Mail-Adresse eines registrierten Users ein und wähle
                  die passende Schulung aus. Die Zuordnung erzeugt noch kein
                  Zertifikat und vergibt noch keine Credits.
                </p>
              </div>

              <StatusBadge variant="yellow">Enrollment</StatusBadge>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <AppInput
                label="User E-Mail"
                value={email}
                placeholder="user@example.com"
                type="email"
                onChange={setEmail}
              />

              <label style={{ display: "grid", gap: 7 }}>
                <span
                  style={{
                    color: "#333333",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Schulung
                </span>

                <select
                  value={selectedTrainingId}
                  onChange={(event) => setSelectedTrainingId(event.target.value)}
                  style={selectStyle}
                >
                  {trainings.length === 0 ? (
                    <option value="">Keine Schulungen vorhanden</option>
                  ) : (
                    trainings.map((training) => (
                      <option key={training.id} value={training.id}>
                        {training.title} · {formatDate(training.date)}
                        {training.endDate
                          ? ` bis ${formatDate(training.endDate)}`
                          : ""}
                        {` · ${training.creditsAward} Credits`}
                      </option>
                    ))
                  )}
                </select>
              </label>

              {selectedTraining && (
                <AppCard accent="none" style={{ boxShadow: "none" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          color: "#007873",
                          fontSize: 20,
                          fontWeight: 500,
                          lineHeight: 1.3,
                        }}
                      >
                        {selectedTraining.title}
                      </h3>

                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {selectedTraining.code && (
                          <StatusBadge>Kürzel: {selectedTraining.code}</StatusBadge>
                        )}

                        <StatusBadge variant="success">
                          {selectedTraining.creditsAward} Credits
                        </StatusBadge>
                      </div>
                    </div>

                    <div
                      style={{
                        color: "#333333",
                        fontSize: 14,
                        textAlign: "right",
                        minWidth: 180,
                      }}
                    >
                      <strong>Zeitraum</strong>
                      <br />
                      {formatDate(selectedTraining.date)}
                      {selectedTraining.endDate
                        ? ` bis ${formatDate(selectedTraining.endDate)}`
                        : ""}
                    </div>
                  </div>
                </AppCard>
              )}

              <AppInput
                label="Notiz optional"
                value={note}
                placeholder="Optional, z. B. manuell zugeordnet"
                onChange={setNote}
              />

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginTop: 4,
                }}
              >
                <AppButton
                  onClick={addParticipant}
                  disabled={loading || !email.trim() || !selectedTrainingId}
                  variant="primary"
                >
                  {loading ? "Speichern..." : "Teilnehmer hinzufügen"}
                </AppButton>

                <AppButton
                  onClick={removeParticipant}
                  disabled={loading || !email.trim() || !selectedTrainingId}
                  variant="danger"
                >
                  {loading ? "Speichern..." : "Teilnehmer entfernen"}
                </AppButton>
              </div>
            </div>
          </AppCard>

          <AppCard>
            <h2
              style={{
                margin: 0,
                color: "#007873",
                fontSize: 24,
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              Hinweis zur Teilnehmerzuordnung
            </h2>

            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              Diese Funktion erstellt nur eine Schulungszuordnung. Zertifikate
              und Credits entstehen erst später nach Schulungsabschluss über die
              automatische Zertifikatserstellung. Wenn bereits ein Zertifikat
              existiert, kann die Zuordnung nicht mehr entfernt werden.
            </p>
          </AppCard>
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 0,
  border: "1px solid #C7C7C7",
  background: "#FFFFFF",
  color: "#1F1F1F",
  fontSize: 15,
  outlineColor: "#007873",
};