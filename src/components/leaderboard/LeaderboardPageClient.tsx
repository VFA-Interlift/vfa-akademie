"use client";

import { useEffect, useState } from "react";

type LeaderboardData = {
  participants: number;
  first: { credits: number; isMe: boolean } | null;
  me: { rank: number | null; credits: number };
  median: number;
};

type LeaderboardResponse =
  | ({ ok: true } & LeaderboardData)
  | { ok: false; error: string };

const TEAL = "#007873";

export default function LeaderboardPageClient() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setMsg("");

      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const json = (await res.json()) as LeaderboardResponse;

        if (cancelled) return;

        if (!json.ok) {
          setMsg("Ranking konnte nicht geladen werden.");
          return;
        }

        setData(json);
      } catch {
        if (!cancelled) setMsg("Ranking konnte nicht geladen werden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div style={{ color: "var(--vfa-text-3)", fontSize: 14, padding: "4px 0" }}>Wird geladen...</div>;
  }

  if (msg || !data) {
    return (
      <div style={{ padding: "12px 14px", borderRadius: 8, border: "1px solid rgba(176,0,32,0.28)", background: "rgba(176,0,32,0.08)", color: "#B00020", fontWeight: 700, fontSize: 14 }}>
        {msg || "Ranking konnte nicht geladen werden."}
      </div>
    );
  }

  if (!data.first || data.participants === 0) {
    return (
      <div style={{ color: "var(--vfa-text-2)", fontSize: 14 }}>
        Noch keine Teilnehmer im Ranking – sammle die ersten Credits!
      </div>
    );
  }

  const diffToMedian = data.me.credits - data.median;
  const iAmFirst = data.first.isMe;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Credit-Ranking · {data.participants.toLocaleString("de-DE")} Teilnehmer
      </div>

      {/* Platz 1 (anonym) */}
      <RankRow
        rankLabel="1"
        rankStyle={{ background: "#D4AF37", color: "#1F1F1F", border: "1px solid #B8921F" }}
        title={iAmFirst ? "Du 🎉" : "Anonym"}
        subtitle="Spitzenreiter"
        credits={data.first.credits}
        highlight={iAmFirst}
        anonymous={!iAmFirst}
      />

      {/* Trenner, wenn dazwischen Plätze liegen */}
      {!iAmFirst && data.me.rank !== null && data.me.rank > 2 && (
        <div style={{ textAlign: "center", color: "#C0C0C0", fontWeight: 900, letterSpacing: "0.3em", lineHeight: 0.6 }}>
          ⋮
        </div>
      )}

      {/* Eigene Platzierung */}
      {!iAmFirst && (
        data.me.rank !== null ? (
          <RankRow
            rankLabel={String(data.me.rank)}
            rankStyle={{ background: TEAL, color: "#FFFFFF", border: `1px solid ${TEAL}` }}
            title="Du"
            subtitle={`Platz ${data.me.rank} von ${data.participants}`}
            credits={data.me.credits}
            highlight
          />
        ) : (
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "#F7F7F4", border: "1px solid #E6E6E6", color: "#666666", fontSize: 14, lineHeight: 1.55 }}>
            Du bist noch nicht im Ranking – sammle deine ersten Credits über Schulungen und Feedback.
          </div>
        )
      )}

      {/* Median-Vergleich */}
      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,120,115,0.06)", border: "1px solid rgba(0,120,115,0.2)", display: "grid", gap: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Median aller Teilnehmer
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--vfa-text)" }}>
          {data.median.toLocaleString("de-DE")} Credits
        </div>
        {data.me.credits > 0 && (
          <div style={{ fontSize: 13, color: diffToMedian >= 0 ? "#005f5b" : "#7C5A0A", fontWeight: 700 }}>
            {diffToMedian === 0
              ? "Du liegst genau im Mittelfeld."
              : diffToMedian > 0
                ? `Du liegst ${diffToMedian.toLocaleString("de-DE")} Credits über der Mitte. 💪`
                : `Noch ${Math.abs(diffToMedian).toLocaleString("de-DE")} Credits bis zur Mitte.`}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: "var(--vfa-text-3)", lineHeight: 1.5 }}>
        Aus Datenschutzgründen werden keine Namen angezeigt – du siehst den Spitzenreiter, deine eigene Platzierung und den Median.
      </div>
    </div>
  );
}

function RankRow({
  rankLabel,
  rankStyle,
  title,
  subtitle,
  credits,
  highlight = false,
  anonymous = false,
}: {
  rankLabel: string;
  rankStyle: React.CSSProperties;
  title: string;
  subtitle: string;
  credits: number;
  highlight?: boolean;
  anonymous?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1fr) auto",
        gap: 12,
        alignItems: "center",
        padding: "12px 14px",
        borderRadius: 12,
        background: highlight ? "rgba(0,120,115,0.06)" : "#FFFFFF",
        border: highlight ? "1px solid rgba(0,120,115,0.3)" : "1px solid #EFEFEF",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          fontWeight: 900,
          fontSize: 15,
          ...rankStyle,
        }}
      >
        {rankLabel}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "#1F1F1F",
            fontSize: 15,
            fontWeight: 800,
            // „Unkenntlicher" Spitzenreiter: Name bewusst verwischt darstellen.
            filter: anonymous ? "blur(0px)" : undefined,
            letterSpacing: anonymous ? "0.04em" : undefined,
          }}
        >
          {anonymous ? "🏆 Anonym" : title}
        </div>
        <div style={{ color: "#999999", fontSize: 12, fontWeight: 600, marginTop: 1 }}>{subtitle}</div>
      </div>

      <div style={{ color: TEAL, fontWeight: 900, fontSize: 15, whiteSpace: "nowrap" }}>
        {credits.toLocaleString("de-DE")} Cr.
      </div>
    </div>
  );
}
