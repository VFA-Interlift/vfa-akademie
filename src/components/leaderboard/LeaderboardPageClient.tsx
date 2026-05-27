"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  rank: number;
  id: string;
  displayName: string;
  creditsTotal: number;
};

type LeaderboardResponse =
  | {
      ok: true;
      leaderboard: LeaderboardEntry[];
    }
  | {
      ok: false;
      error: string;
    };

export default function LeaderboardPageClient() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setLoading(true);
      setMsg("");

      try {
        const res = await fetch("/api/leaderboard", {
          cache: "no-store",
        });

        const data = (await res.json()) as LeaderboardResponse;

        if (cancelled) {
          return;
        }

        if (!data.ok) {
          setMsg("Ranking konnte nicht geladen werden.");
          setEntries([]);
          return;
        }

        setEntries(data.leaderboard);
      } catch {
        if (!cancelled) {
          setMsg("Ranking konnte nicht geladen werden.");
          setEntries([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ color: "#333333", lineHeight: 1.6 }}>
        Ranking wird geladen...
      </div>
    );
  }

  if (msg) {
    return (
      <div
        style={{
          padding: "12px 14px",
          border: "1px solid rgba(176,0,32,0.28)",
          background: "rgba(176,0,32,0.08)",
          color: "#B00020",
          fontWeight: 800,
          lineHeight: 1.5,
        }}
      >
        {msg}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ color: "#333333", lineHeight: 1.6 }}>
        Noch keine freigegebenen Ranking-Einträge vorhanden.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {entries.map((entry) => (
        <div
          key={entry.id}
          style={{
            display: "grid",
            gridTemplateColumns: "56px 1fr auto",
            gap: 14,
            alignItems: "center",
            padding: "14px 0",
            borderBottom: "1px solid #E6E6E6",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              background: entry.rank <= 3 ? "#FFC100" : "#F4F4F4",
              color: "#1F1F1F",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              border: "1px solid #C7C7C7",
            }}
          >
            {entry.rank}
          </div>

          <div
            style={{
              minWidth: 0,
              color: "#007873",
              fontSize: 18,
              fontWeight: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={entry.displayName}
          >
            {entry.displayName}
          </div>

          <div
            style={{
              color: "#1F1F1F",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {entry.creditsTotal.toLocaleString("de-DE")} Credits
          </div>
        </div>
      ))}
    </div>
  );
}