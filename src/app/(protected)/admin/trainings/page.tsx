"use client";

import { useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppSelect from "@/components/ui/AppSelect";
import AppTextarea from "@/components/ui/AppTextarea";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
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

const codeOptions = CERTIFICATE_TEMPLATE_CODES.map((code) => ({
  value: code,
  label: code,
}));

export default function AdminTrainingsPage() {
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
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
    } catch {
      showMessage("LOAD_FAILED");
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
          showMessage("Unbekanntes Kürzel. Bitte ein gültiges Kürzel auswählen oder leer lassen.");
        } else {
          showMessage(data.error ?? "CREATE_FAILED");
        }
        return;
      }

      showMessage("Schulung erstellt.", true);
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
      showMessage("CREATE_FAILED");
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
        showMessage(data.error ?? "UPDATE_FAILED");
        return;
      }

      showMessage("Credits aktualisiert.", true);
      await loadTrainings();
    } catch {
      showMessage("UPDATE_FAILED");
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
          showMessage("Unbekanntes Kürzel. Bitte ein gültiges Kürzel auswählen oder leer lassen.");
        } else {
          showMessage(data.error ?? "UPDATE_FAILED");
        }
        return;
      }

      showMessage("Kürzel aktualisiert.", true);
      await loadTrainings();
    } catch {
      showMessage("UPDATE_FAILED");
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
          showMessage("Diese Schulung kann nicht gelöscht werden, weil bereits Zertifikate existieren.");
        } else if (data.error === "TRAINING_NOT_FOUND") {
          showMessage("Schulung wurde nicht gefunden.");
        } else {
          showMessage(data.error ?? "DELETE_FAILED");
        }

        return;
      }

      showMessage("Schulung gelöscht.", true);
      await loadTrainings();
    } catch {
      showMessage("DELETE_FAILED");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <PageHeader
          title="Schulungen verwalten"
          description="Hier legst du Schulungen an, setzt das Schulungskürzel für die spätere Zertifikatsvorlage und verwaltest Credits sowie bestehende Schulungen."
        />

        {msg && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              border: msgOk ? "1px solid #007873" : "1px solid rgba(176,0,32,0.28)",
              background: msgOk ? "rgba(0,120,115,0.08)" : "rgba(176,0,32,0.08)",
              color: msgOk ? "#007873" : "#B00020",
              fontWeight: 800,
            }}
          >
            {msg}
          </div>
        )}

        <AppCard accent="green" style={{ marginBottom: 24 }}>
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
                Neue Schulung erstellen
              </h2>

              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  color: "#333333",
                  lineHeight: 1.6,
                }}
              >
                Das Kürzel ist optional. Später kommt es automatisch aus Cobra und bestimmt,
                welche Teilnahmebestätigung oder welches Zertifikat erzeugt wird.
              </p>
            </div>

            <StatusBadge variant="yellow">Admin</StatusBadge>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <AppInput
              label="Titel"
              value={newTitle}
              placeholder="z. B. Grundkurs A1"
              onChange={setNewTitle}
            />

            <AppSelect
              label="Kürzel optional, später automatisch aus Cobra"
              value={newCode}
              onChange={setNewCode}
              placeholder="Kein Kürzel auswählen"
              options={codeOptions}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <AppInput
                label="Startdatum (TT.MM.JJJJ)"
                value={newStartDate}
                placeholder="05.05.2026"
                onChange={setNewStartDate}
              />

              <AppInput
                label="Enddatum (TT.MM.JJJJ)"
                value={newEndDate}
                placeholder="07.05.2026"
                onChange={setNewEndDate}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <AppInput
                label="Ort"
                value={newLocation}
                placeholder="Hamburg"
                onChange={setNewLocation}
              />

              <AppInput
                label="Dozent"
                value={newInstructor}
                placeholder="Max Mustermann"
                onChange={setNewInstructor}
              />
            </div>

            <AppTextarea
              label="Beschreibung / Inhalte"
              value={newDescription}
              placeholder="Inhalte der Schulung"
              rows={4}
              onChange={setNewDescription}
            />

            <AppInput
              label="Credits nach Abschluss"
              value={newCreditsAward}
              placeholder="0"
              onChange={(value) => {
                if (value === "" || /^\d+$/.test(value)) {
                  setNewCreditsAward(value);
                }
              }}
            />

            <AppButton
              onClick={createTraining}
              disabled={
                loading ||
                !newTitle.trim() ||
                !newStartDate.trim() ||
                !newEndDate.trim()
              }
              variant="primary"
            >
              {loading ? "Speichern..." : "Schulung erstellen"}
            </AppButton>
          </div>
        </AppCard>

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-end",
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#007873",
                  fontSize: 26,
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}
              >
                Vorhandene Schulungen
              </h2>

              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  color: "#333333",
                  lineHeight: 1.6,
                }}
              >
                Bestehende Schulungen können hier geprüft, mit Kürzeln versehen oder gelöscht werden.
              </p>
            </div>

            <StatusBadge>{trainings.length} Schulungen</StatusBadge>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {trainings.length === 0 ? (
              <AppCard>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#007873" }}>
                  Noch keine Schulungen vorhanden.
                </div>
              </AppCard>
            ) : (
              trainings.map((training) => (
                <AppCard key={training.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          color: "#007873",
                          fontSize: 22,
                          fontWeight: 500,
                          lineHeight: 1.3,
                        }}
                      >
                        {training.title}
                      </h3>

                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <StatusBadge variant="yellow">
                          {formatCertificateKind(training.certificateKind)}
                        </StatusBadge>

                        {training.code ? (
                          <StatusBadge>Kürzel: {training.code}</StatusBadge>
                        ) : (
                          <StatusBadge variant="warning">Kein Kürzel</StatusBadge>
                        )}

                        <StatusBadge variant="success">
                          {training.creditsAward} Credits
                        </StatusBadge>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        color: "#333333",
                        textAlign: "right",
                        minWidth: 180,
                      }}
                    >
                      <strong>Zeitraum</strong>
                      <br />
                      {formatDate(training.date)}
                      {training.endDate ? ` bis ${formatDate(training.endDate)}` : ""}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {training.location && (
                      <Info label="Ort" value={training.location} />
                    )}

                    {training.instructor && (
                      <Info label="Dozent" value={training.instructor} />
                    )}

                    <Info
                      label="Dokumentart"
                      value={formatCertificateKind(training.certificateKind)}
                    />

                    <Info
                      label="Credits nach Abschluss"
                      value={String(training.creditsAward)}
                    />
                  </div>

                  {training.description && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: "1px solid #E6E6E6",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#007873",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 6,
                        }}
                      >
                        Inhalte
                      </div>

                      <div style={{ color: "#333333", lineHeight: 1.6 }}>
                        {training.description}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 18,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <select
                      value={training.code ?? ""}
                      onChange={(event) => updateCode(training.id, event.target.value)}
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

                    <AppButton
                      onClick={() =>
                        updateCredits(training.id, Math.max(0, training.creditsAward - 1))
                      }
                      disabled={loading}
                      variant="secondary"
                    >
                      -1 Credit
                    </AppButton>

                    <AppButton
                      onClick={() =>
                        updateCredits(training.id, training.creditsAward + 1)
                      }
                      disabled={loading}
                      variant="secondary"
                    >
                      +1 Credit
                    </AppButton>

                    <AppButton
                      onClick={() => removeTraining(training.id)}
                      disabled={loading}
                      variant="danger"
                    >
                      Schulung löschen
                    </AppButton>
                  </div>
                </AppCard>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-DE");
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#007873",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div style={{ color: "#1F1F1F", lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

const smallSelectStyle: React.CSSProperties = {
  minHeight: 42,
  padding: "9px 14px",
  borderRadius: 999,
  border: "1px solid #C7C7C7",
  background: "#F4F4F4",
  color: "#007873",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};