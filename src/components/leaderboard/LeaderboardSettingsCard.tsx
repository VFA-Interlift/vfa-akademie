"use client";

import { useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";

type LeaderboardSettingsResponse =
  | {
      ok: true;
      settings: {
        leaderboardOptIn: boolean;
        leaderboardName: string;
        suggestedName: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

type SaveSuccessResponse = {
  ok: true;
  settings: {
    leaderboardOptIn: boolean;
    leaderboardName: string;
  };
};

type SaveErrorResponse = {
  ok: false;
  error: string;
};

type SaveResponse = SaveSuccessResponse | SaveErrorResponse;

export default function LeaderboardSettingsCard() {
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [leaderboardName, setLeaderboardName] = useState("");
  const [suggestedName, setSuggestedName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setMsg("");

      try {
        const res = await fetch("/api/leaderboard/settings", { cache: "no-store" });
        const data = (await res.json()) as LeaderboardSettingsResponse;

        if (cancelled) return;

        if (!data.ok) {
          setMsg("Ranking-Einstellungen konnten nicht geladen werden.");
          setMsgOk(false);
          return;
        }

        setLeaderboardOptIn(data.settings.leaderboardOptIn);
        setLeaderboardName(data.settings.leaderboardName);
        setSuggestedName(data.settings.suggestedName);
      } catch {
        if (!cancelled) {
          setMsg("Ranking-Einstellungen konnten nicht geladen werden.");
          setMsgOk(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();
    return () => { cancelled = true; };
  }, []);

  async function saveSettings() {
    const cleanedName = leaderboardName.trim();

    if (leaderboardOptIn && !cleanedName) {
      setMsg("Bitte einen Anzeigenamen eintragen, wenn du im Ranking erscheinen möchtest.");
      setMsgOk(false);
      return;
    }

    setSaving(true);
    setMsg("");
    setMsgOk(false);

    try {
      const res = await fetch("/api/leaderboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaderboardOptIn, leaderboardName: cleanedName }),
      });

      const data = (await res.json().catch(() => null)) as SaveResponse | null;

      if (!res.ok || !data) {
        setMsg("Ranking-Einstellungen konnten nicht gespeichert werden.");
        setMsgOk(false);
        return;
      }

      if (!data.ok) {
        setMsg(
          data.error === "LEADERBOARD_NAME_REQUIRED"
            ? "Bitte einen Anzeigenamen eintragen, wenn du im Ranking erscheinen möchtest."
            : "Ranking-Einstellungen konnten nicht gespeichert werden."
        );
        setMsgOk(false);
        return;
      }

      setLeaderboardOptIn(data.settings.leaderboardOptIn);
      setLeaderboardName(data.settings.leaderboardName);
      setMsg("Ranking-Einstellungen gespeichert.");
      setMsgOk(true);
    } catch {
      setMsg("Serverfehler beim Speichern der Ranking-Einstellungen.");
      setMsgOk(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16, width: "100%" }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#007873", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          Meine Einstellungen
        </div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1F1F1F", letterSpacing: "-0.01em" }}>
          Im Ranking erscheinen?
        </h2>
        <p style={{ margin: "8px 0 0", color: "#666666", fontSize: 14, lineHeight: 1.55 }}>
          Du kannst freiwillig im Credit-Ranking erscheinen. Angezeigt werden nur dein Anzeigename und deine Credits.
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: msgOk ? "1px solid rgba(0,120,115,0.4)" : "1px solid rgba(176,0,32,0.28)",
            background: msgOk ? "rgba(0,120,115,0.08)" : "rgba(176,0,32,0.08)",
            color: msgOk ? "#007873" : "#B00020",
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ color: "#888888", fontSize: 14 }}>Wird geladen...</div>
      ) : (
        <>
          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={leaderboardOptIn}
              onChange={(e) => setLeaderboardOptIn(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: "#007873", flexShrink: 0 }}
            />
            <span style={{ color: "#1F1F1F", fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>
              Ich möchte im VFA-Credit-Ranking erscheinen.
            </span>
          </label>

          <label style={{ display: "grid", gap: 6, width: "100%" }}>
            <span style={{ color: "#444444", fontSize: 13, fontWeight: 600, letterSpacing: "0.01em" }}>
              Anzeigename im Ranking
            </span>
            <input
              value={leaderboardName}
              placeholder={suggestedName || "z. B. Max M."}
              onChange={(e) => setLeaderboardName(e.target.value)}
              maxLength={60}
              style={{
                width: "100%",
                boxSizing: "border-box",
                minHeight: 44,
                border: "1px solid #D4D4D4",
                borderRadius: 8,
                background: "#FFFFFF",
                color: "#1F1F1F",
                padding: "10px 14px",
                fontSize: 15,
                fontWeight: 600,
                outline: "none",
              }}
            />
          </label>

          <div>
            <AppButton onClick={saveSettings} disabled={saving} variant="primary">
              {saving ? "Speichern..." : "Einstellungen speichern"}
            </AppButton>
          </div>
        </>
      )}
    </div>
  );
}
