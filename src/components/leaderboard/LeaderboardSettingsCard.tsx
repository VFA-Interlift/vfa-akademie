"use client";

import { useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";

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

type SaveResponse =
  | {
      ok: true;
      settings: {
        leaderboardOptIn: boolean;
        leaderboardName: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

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
        const res = await fetch("/api/leaderboard/settings", {
          cache: "no-store",
        });

        const data = (await res.json()) as LeaderboardSettingsResponse;

        if (cancelled) {
          return;
        }

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
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveSettings() {
    setSaving(true);
    setMsg("");
    setMsgOk(false);

    try {
      const res = await fetch("/api/leaderboard/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaderboardOptIn,
          leaderboardName,
        }),
      });

      const data = (await res.json().catch(() => null)) as SaveResponse | null;

      if (!res.ok || !data?.ok) {
        setMsg("Ranking-Einstellungen konnten nicht gespeichert werden.");
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
    <div
      style={{
        display: "grid",
        gap: 14,
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            color: "#007873",
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          VFA-Credit-Ranking
        </h2>

        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            color: "#333333",
            lineHeight: 1.6,
            fontSize: 15,
          }}
        >
          Du kannst freiwillig im Credit-Ranking erscheinen. Angezeigt werden
          nur dein gewählter Anzeigename und deine Credits.
        </p>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 12px",
            border: msgOk
              ? "1px solid #007873"
              : "1px solid rgba(176,0,32,0.28)",
            background: msgOk
              ? "rgba(0,120,115,0.08)"
              : "rgba(176,0,32,0.08)",
            color: msgOk ? "#007873" : "#B00020",
            fontWeight: 800,
            lineHeight: 1.5,
            fontSize: 14,
          }}
        >
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ color: "#333333", lineHeight: 1.6 }}>
          Ranking-Einstellungen werden geladen...
        </div>
      ) : (
        <>
          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              color: "#1F1F1F",
              lineHeight: 1.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={leaderboardOptIn}
              onChange={(event) => setLeaderboardOptIn(event.target.checked)}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
                accentColor: "#007873",
              }}
            />

            <span>Ich möchte im VFA-Credit-Ranking erscheinen.</span>
          </label>

          <AppInput
            label="Anzeigename im Ranking"
            value={leaderboardName}
            placeholder={suggestedName || "z. B. Max M."}
            onChange={setLeaderboardName}
          />

          <p
            style={{
              margin: 0,
              color: "#666666",
              lineHeight: 1.55,
              fontSize: 13,
            }}
          >
            Wenn du keinen Anzeigenamen einträgst, verwendet die App deinen
            Namen aus deinem Profil. Du kannst die Freigabe jederzeit wieder
            deaktivieren.
          </p>

          <div>
            <AppButton
              onClick={saveSettings}
              disabled={saving}
              variant="primary"
            >
              {saving ? "Speichern..." : "Ranking-Einstellungen speichern"}
            </AppButton>
          </div>
        </>
      )}
    </div>
  );
}