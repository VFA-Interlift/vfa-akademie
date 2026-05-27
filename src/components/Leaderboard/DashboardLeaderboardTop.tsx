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
          Top 3 Credit-Ranking
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
          Die sichtbarsten Plätze im freiwilligen VFA-Credit-Ranking.
        </p>
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
        <div style={{ display: "grid", gap: 10 }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #E6E6E6",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: entry.rank === 1 ? "#FFC100" : "#F4F4F4",
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
      )}

      <Link
        href="/leaderboard"
        style={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 42,
          padding: "10px 18px",
          borderRadius: 999,
          background: "#007873",
          color: "#FFFFFF",
          fontWeight: 900,
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          textDecoration: "none",
          width: "fit-content",
        }}
      >
        Gesamtes Ranking ansehen
      </Link>
    </div>
  );
}