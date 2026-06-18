"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  rank: number;
  id: string;
  displayName: string;
  creditsTotal: number;
};

type LeaderboardResponse =
  | { ok: true; leaderboard: LeaderboardEntry[] }
  | { ok: false; error: string };

function getRankStyle(rank: number) {
  if (rank === 1) return { background: "#D4AF37", color: "#1F1F1F", border: "1px solid #B8921F" };
  if (rank === 2) return { background: "#C0C0C0", color: "#1F1F1F", border: "1px solid #A7A7A7" };
  if (rank === 3) return { background: "#CD7F32", color: "#FFFFFF", border: "1px solid #A96427" };
  return { background: "#F4F4F4", color: "#555555", border: "1px solid #E0E0E0" };
}

export default function LeaderboardPageClient() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setMsg("");

      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const data = (await res.json()) as LeaderboardResponse;

        if (cancelled) return;

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
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div style={{ color: "#888888", fontSize: 14, padding: "4px 0" }}>Wird geladen...</div>;
  }

  if (msg) {
    return (
      <div style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(176,0,32,0.28)", background: "rgba(176,0,32,0.08)", color: "#B00020", fontWeight: 700, fontSize: 14 }}>
        {msg}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ color: "#888888", fontSize: 14 }}>
        Noch keine freigegebenen Ranking-Einträge vorhanden.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", width: "100%", overflow: "hidden" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#007873", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
        Rangliste
      </div>

      {entries.map((entry, index) => {
        const rankStyle = getRankStyle(entry.rank);
        const isLast = index === entries.length - 1;

        return (
          <div
            key={entry.id}
            style={{
              display: "grid",
              gridTemplateColumns: "40px minmax(0, 1fr)",
              gap: 12,
              alignItems: "center",
              padding: "12px 0",
              borderBottom: isLast ? "none" : "1px solid #F0F0F0",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: rankStyle.background,
                color: rankStyle.color,
                border: rankStyle.border,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {entry.rank}
            </div>

            <div style={{ minWidth: 0, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  color: "#1F1F1F",
                  fontSize: 15,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
                title={entry.displayName}
              >
                {entry.displayName}
              </div>

              <div
                style={{
                  color: "#007873",
                  fontWeight: 800,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {entry.creditsTotal.toLocaleString("de-DE")} Cr.
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
