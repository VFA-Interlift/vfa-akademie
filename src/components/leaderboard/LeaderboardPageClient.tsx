"use client";

import { useEffect, useState } from "react";
import Meldung from "@/components/ui/Meldung";

type LeaderboardData = {
  participants: number;
  first: { credits: number; isMe: boolean } | null;
  me: { rank: number | null; credits: number };
  median: number;
};

type LeaderboardResponse =
  | ({ ok: true } & LeaderboardData)
  | { ok: false; error: string };

// Petrol nur als Fläche (Rangkreis); als Textfarbe gilt var(--vfa-gruen-text).
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
    return <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-klein)", padding: "4px 0" }}>Wird geladen…</div>;
  }

  if (msg || !data) {
    return <Meldung art="fehler">{msg || "Ranking konnte nicht geladen werden."}</Meldung>;
  }

  if (!data.first || data.participants === 0) {
    return (
      <div style={{ color: "var(--vfa-text-2)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
        Noch keine Teilnehmer im Ranking – sammle die ersten Credits!
      </div>
    );
  }

  const diffToMedian = data.me.credits - data.median;
  const iAmFirst = data.first.isMe;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="etikett">
        Ranking · {data.participants.toLocaleString("de-DE")} Teilnehmer
      </div>

      {/* Platz 1 (anonym) — Gold als Fläche mit fest dunkler Schrift, wie die Gelb-Regel */}
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
        <div style={{ textAlign: "center", color: "var(--vfa-text-3)", fontWeight: 800, letterSpacing: "0.3em", lineHeight: 0.6 }}>
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
          <Meldung art="hinweis">
            Du bist noch nicht im Ranking – sammle deine ersten Credits über Schulungen und Feedback.
          </Meldung>
        )
      )}

      {/* Median-Vergleich: Etikett oben, Kennzahl darunter (Kanon 05.09.2026) */}
      <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(0,120,115,0.06)", border: "1px solid rgba(0,120,115,0.2)", display: "grid", gap: 4 }}>
        <div className="etikett">Median aller Teilnehmer</div>
        <div className="kennzahl">
          {data.median.toLocaleString("de-DE")} Credits
        </div>
        {data.me.credits > 0 && (
          <div style={{ fontSize: "var(--t-klein)", color: diffToMedian >= 0 ? "var(--vfa-gruen-text)" : "var(--vfa-text-2)", fontWeight: 700 }}>
            {diffToMedian === 0
              ? "Du liegst genau im Mittelfeld."
              : diffToMedian > 0
                ? `Du liegst ${diffToMedian.toLocaleString("de-DE")} Credits über der Mitte. 💪`
                : `Noch ${Math.abs(diffToMedian).toLocaleString("de-DE")} Credits bis zur Mitte.`}
          </div>
        )}
      </div>

      <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)", lineHeight: "var(--lh-weit)" }}>
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
        background: highlight ? "rgba(0,120,115,0.06)" : "var(--vfa-karte-2)",
        border: highlight ? "1px solid rgba(0,120,115,0.3)" : "1px solid var(--vfa-linie-2)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
          fontSize: "var(--t-basis)",
          ...rankStyle,
        }}
      >
        {rankLabel}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: "var(--vfa-text)",
            fontSize: "var(--t-basis)",
            fontWeight: 800,
            letterSpacing: anonymous ? "0.04em" : undefined,
          }}
        >
          {anonymous ? "🏆 Anonym" : title}
        </div>
        <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-label)", fontWeight: 600, marginTop: 1 }}>{subtitle}</div>
      </div>

      <div style={{ color: "var(--vfa-gruen-text)", fontWeight: 800, fontSize: "var(--t-basis)", whiteSpace: "nowrap" }}>
        {credits.toLocaleString("de-DE")} Credits
      </div>
    </div>
  );
}
