"use client";

import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [loading, setLoading] = useState(false);

  function showMessage(message: string, ok = false) {
    setMsg(message);
    setMsgOk(ok);
  }

  async function promote() {
    setLoading(true);
    setMsg("");
    setMsgOk(false);

    try {
      const res = await fetch("/api/admin/users/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const text = await res.text();

      let data: any = null;

      try {
        data = JSON.parse(text);
      } catch {
        showMessage("Serverantwort konnte nicht gelesen werden.");
        return;
      }

      if (!res.ok || !data?.ok) {
        if (data?.error === "INVALID_EMAIL") {
          showMessage("Bitte eine gültige E-Mail eingeben.");
        } else if (data?.error === "USER_NOT_FOUND") {
          showMessage("User wurde nicht gefunden. Der User muss zuerst registriert sein.");
        } else if (data?.error === "UNAUTHENTICATED") {
          showMessage("Du bist nicht eingeloggt.");
        } else if (data?.error === "FORBIDDEN") {
          showMessage("Du hast keine Berechtigung.");
        } else {
          showMessage(data?.error ?? "Admin-Vergabe fehlgeschlagen.");
        }

        return;
      }

      showMessage(`${data.email} ist jetzt Admin.`, true);
      setEmail("");
    } catch {
      showMessage("Serverfehler beim Ernennen des Admins.");
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
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader
          title="Admin verwalten"
          description="Hier kannst du registrierte Nutzer per E-Mail zum Admin machen. Danach sehen sie den Admin-Menüpunkt und können Verwaltungsfunktionen nutzen."
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
                  User zum Admin machen
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
                  Gib die E-Mail-Adresse eines bereits registrierten Users ein.
                  Nach erfolgreicher Änderung hat der User Zugriff auf den Adminbereich.
                </p>
              </div>

              <StatusBadge variant="yellow">Adminrechte</StatusBadge>
            </div>

            <div style={{ display: "grid", gap: 14, maxWidth: 620 }}>
              <AppInput
                label="User E-Mail"
                value={email}
                placeholder="user@example.com"
                type="email"
                onChange={setEmail}
              />

              <AppButton
                onClick={promote}
                disabled={loading || !email.trim()}
                variant="primary"
              >
                {loading ? "Wird verarbeitet..." : "Zum Admin machen"}
              </AppButton>
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
              Hinweis
            </h2>

            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                color: "#333333",
                lineHeight: 1.6,
              }}
            >
              Adminrechte sollten nur an Personen vergeben werden, die wirklich
              Schulungen, Teilnehmer, Zertifikate und Credits verwalten dürfen.
              Der User muss vor der Admin-Vergabe bereits registriert sein.
            </p>
          </AppCard>
        </div>
      </div>
    </main>
  );
}