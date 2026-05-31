"use client";

import Link from "next/link";
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

export default function DashboardLeaderboardTop() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setLoading(true);

      try {
        const res = await fetch("/api/leaderboard", {
          cache: "no-store",
        });

        const data = (await res.json()) as LeaderboardResponse;

        if (cancelled) {
          return;
        }

        if (!data.ok) {
          setEntries([]);
          return;
        }

        setEntries(data.leaderboard.slice(0, 3));
      } catch {
        if (!cancelled) {
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

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#007873",
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          Top 3 Credit-Ranking
        </h2>

        <Link
          href="/leaderboard"
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 36,
            padding: "8px 14px",
            borderRadius: 999,
            background: "#007873",
            color: "#FFFFFF",
            fontWeight: 900,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Gesamtes Ranking
        </Link>
      </div>

      {loading ? (
        <div style={{ color: "#333333", lineHeight: 1.6 }}>
          Ranking wird geladen...
        </div>
      ) : entries.length === 0 ? (
        <div style={{ color: "#333333", lineHeight: 1.6 }}>
          Noch keine freigegebenen Ranking-Einträge vorhanden.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {entries.map((entry) => {
            const rankStyle = getRankStyle(entry.rank);

            return (
              <div
                key={entry.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "42px 1fr",
                  gap: 10,
                  alignItems: "center",
                  padding: 12,
                  border: "1px solid #E6E6E6",
                  background: "#FFFFFF",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: rankStyle.background,
                    color: rankStyle.color,
                    border: rankStyle.border,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                  }}
                >
                  {entry.rank}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: "#007873",
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
                      marginTop: 3,
                      color: "#1F1F1F",
                      fontWeight: 800,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.creditsTotal.toLocaleString("de-DE")} Credits
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}