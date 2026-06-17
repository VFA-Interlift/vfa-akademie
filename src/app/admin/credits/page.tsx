"use client";

import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppTextarea from "@/components/ui/AppTextarea";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AdminCreditsPage() {
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [loading, setLoading] = useState(false);

  function showMessage(message: string, ok = false) {
    setMsg(message);
    setMsgOk(ok);
  }

  async function saveCredits() {
    setLoading(true);
    setMsg("");
    setMsgOk(false);

    try {
      const amount = Number(credits);

      const payload = {
        email: email.trim().toLowerCase(),
        credits: amount,
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
          showMessage("Bitte eine gültige E-Mail eingeben.");
        } else if (data.error === "INVALID_CREDITS") {
          showMessage("Bitte eine ganze Zahl ungleich 0 eingeben.");
        } else if (data.error === "USER_NOT_FOUND") {
          showMessage("Nutzer wurde nicht gefunden.");
        } else if (data.error === "UNAUTHENTICATED") {
          showMessage("Du bist nicht eingeloggt.");
        } else if (data.error === "FORBIDDEN") {
          showMessage("Du hast keine Berechtigung.");
        } else {
          showMessage(data.error ?? "Fehler beim Speichern.");
        }

        return;
      }

      if (amount > 0) {
        showMessage(`${amount} Credits wurden erfolgreich vergeben.`, true);
      } else {
        showMessage(`${Math.abs(amount)} Credits wurden erfolgreich abgezogen.`, true);
      }

      setEmail("");
      setCredits("");
      setNote("");
    } catch {
      showMessage("Serverfehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  }

  const amount = Number(credits);
  const isPositive = Number.isFinite(amount) && amount > 0;
  const isNegative = Number.isFinite(amount) && amount < 0;

  return (
    <main className="page-main">
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ marginBottom: 10 }}>
          <a href="/admin" style={{ color: "#007873", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>← Adminbereich</a>
        </div>
        <PageHeader
          title="Credits verwalten"
          description="Hier kannst du Credits manuell vergeben oder abziehen. Jede Änderung wird als Credit-Transaktion gespeichert."
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
                  Manuelle Credit-Buchung
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
                  Positive Werte vergeben Credits. Negative Werte ziehen Credits ab.
                  Für reguläre Schulungen sollten Credits normalerweise automatisch
                  über die Zertifikatserstellung vergeben werden.
                </p>
              </div>

              <StatusBadge variant="yellow">Admin</StatusBadge>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <AppInput
                label="User E-Mail"
                value={email}
                placeholder="max@firma.de"
                type="email"
                onChange={setEmail}
              />

              <AppInput
                label="Credits"
                value={credits}
                placeholder="z. B. 100 oder -50"
                onChange={(value) => {
                  if (value === "" || value === "-" || /^-?\d+$/.test(value)) {
                    setCredits(value);
                  }
                }}
              />

              <AppTextarea
                label="Notiz"
                value={note}
                placeholder="Optional, z. B. Korrektur, Sondervergabe oder Nachtrag"
                rows={3}
                onChange={setNote}
              />

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <AppButton
                  onClick={saveCredits}
                  disabled={loading || !email.trim() || !credits.trim() || credits === "-"}
                  variant={isNegative ? "danger" : "primary"}
                >
                  {loading
                    ? "Speichern..."
                    : isNegative
                      ? "Credits abziehen"
                      : "Credits vergeben"}
                </AppButton>

                {credits && credits !== "-" && (
                  <StatusBadge
                    variant={isPositive ? "success" : isNegative ? "danger" : "default"}
                  >
                    {isPositive
                      ? `+${amount} Credits`
                      : isNegative
                        ? `${amount} Credits`
                        : "0 Credits"}
                  </StatusBadge>
                )}
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
              Hinweis zur Credit-Logik
            </h2>

            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              Automatische Credits aus Schulungen werden erst vergeben, wenn ein
              Zertifikat oder eine Teilnahmebestätigung erstellt wird. Diese manuelle
              Funktion ist für Korrekturen, Sonderfälle oder Nachträge gedacht.
            </p>
          </AppCard>
        </div>
      </div>
    </main>
  );
}