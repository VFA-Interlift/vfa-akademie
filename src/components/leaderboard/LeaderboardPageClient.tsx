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

function getRankStyle(rank: number) {
  if (rank === 1) {
    return {
      background: "#D4AF37",
      color: "#1F1F1F",
      border: "1px solid #B8921F",
    };
  }

  if (rank === 2) {
    return {
      background: "#C0C0C0",
      color: "#1F1F1F",
      border: "1px solid #A7A7A7",
    };
  }

  if (rank === 3) {
    return {
      background: "#CD7F32",
      color: "#FFFFFF",
      border: "1px solid #A96427",
    };
  }

  return {
    background: "#F4F4F4",
    color: "#1F1F1F",
    border: "1px solid #C7C7C7",
  };
}

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
    <div
      style={{
        display: "grid",
        gap: 10,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {entries.map((entry) => {
        const rankStyle = getRankStyle(entry.rank);

        return (
          <div
            key={entry.id}
            style={{
              display: "grid",
              gridTemplateColumns: "44px minmax(0, 1fr)",
              gap: 12,
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid #E6E6E6",
              width: "100%",
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: rankStyle.background,
                color: rankStyle.color,
                border: rankStyle.border,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                flex: "0 0 auto",
              }}
            >
              {entry.rank}
            </div>

            <div
              style={{
                minWidth: 0,
                width: "100%",
                display: "grid",
                gap: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  color: "#007873",
                  fontSize: 17,
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
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {entry.creditsTotal.toLocaleString("de-DE")} Credits
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}