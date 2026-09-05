"use client";

import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppTextarea from "@/components/ui/AppTextarea";
import Meldung from "@/components/ui/Meldung";
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
          showMessage("Fehler beim Speichern.");
        }

        return;
      }

      // Gebuchten Betrag und neuen Saldo aus der Antwort nennen: Bei einem
      // Abzug über den Saldo hinaus kappt der Server auf 0 und bucht nur den
      // Rest (Befund f03-4, 05.09.2026).
      const angewendet = typeof data.angewendet === "number" ? data.angewendet : amount;
      const saldo = typeof data.creditsTotal === "number" ? ` Neuer Saldo: ${data.creditsTotal} Credits.` : "";
      const gekappt = angewendet !== amount ? ` (angefordert waren ${Math.abs(amount)}, mehr war nicht auf dem Konto)` : "";
      if (angewendet > 0) {
        showMessage(`${angewendet} Credits wurden vergeben.${saldo}`, true);
      } else {
        showMessage(`${Math.abs(angewendet)} Credits wurden abgezogen${gekappt}.${saldo}`, true);
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
        <PageHeader title="Credits verwalten" />
        {/* PageHeader zeigt description nicht an — der Satz steht deshalb hier. */}
        <p style={{ margin: "0 0 20px", fontSize: "var(--t-basis)", color: "var(--vfa-text-2)" }}>
          Hier kannst du Credits manuell vergeben oder abziehen. Jede Änderung wird als Credit-Transaktion gespeichert.
        </p>

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
                    color: "var(--vfa-gruen-text)",
                    fontSize: "var(--t-gross)",
                    fontWeight: 700,
                    lineHeight: "var(--lh-eng)",
                  }}
                >
                  Manuelle Credit-Buchung
                </h2>

                <p
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: "var(--vfa-text-2)",
                    fontSize: "var(--t-basis)",
                    lineHeight: "var(--lh-weit)",
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
                label="E-Mail des Nutzers"
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
                    ? "Speichern …"
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

              {/* Die Meldung steht beim Knopf, nicht über dem Formular — am
                  Handy lag sie sonst außerhalb des Bildes (Befund f03-15). */}
              {msg && <Meldung art={msgOk ? "erfolg" : "fehler"}>{msg}</Meldung>}
            </div>
          </AppCard>

          <AppCard>
            <h2
              style={{
                margin: 0,
                color: "var(--vfa-gruen-text)",
                fontSize: "var(--t-gross)",
                fontWeight: 700,
                lineHeight: "var(--lh-eng)",
              }}
            >
              Hinweis zur Credit-Logik
            </h2>

            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "var(--vfa-text-2)",
                fontSize: "var(--t-basis)",
                lineHeight: "var(--lh-weit)",
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
