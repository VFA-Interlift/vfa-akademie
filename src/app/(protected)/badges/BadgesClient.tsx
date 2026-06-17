"use client";

type RankKey = "BRONZE" | "SILBER" | "GOLD" | "EXPERTE";

type RankDef = {
  key: RankKey;
  label: string;
  sublabel: string;
  min: number;
  max: number | null;
  color: string;
  bg: string;
  accent: string;
};

const RANKS: RankDef[] = [
  {
    key: "BRONZE",
    label: "Bronze",
    sublabel: "Einsteiger",
    min: 0,
    max: 499,
    color: "#7C4F2A",
    bg: "#FDF6F0",
    accent: "#C87941",
  },
  {
    key: "SILBER",
    label: "Silber",
    sublabel: "Fortgeschritten",
    min: 500,
    max: 1499,
    color: "#5A6472",
    bg: "#F4F6F8",
    accent: "#8E99A8",
  },
  {
    key: "GOLD",
    label: "Gold",
    sublabel: "Experte",
    min: 1500,
    max: 3499,
    color: "#7C5A0A",
    bg: "#FFFBEE",
    accent: "#C79A16",
  },
  {
    key: "EXPERTE",
    label: "VFA-Experte",
    sublabel: "Elite",
    min: 3500,
    max: null,
    color: "#1F1F1F",
    bg: "#F4F4F2",
    accent: "#007873",
  },
];

function getCurrentRank(credits: number): RankKey {
  if (credits >= 3500) return "EXPERTE";
  if (credits >= 1500) return "GOLD";
  if (credits >= 500) return "SILBER";
  return "BRONZE";
}

function generateBadgeSVG(rank: RankDef, credits: number, isEarned: boolean): string {
  const mainColor = isEarned ? rank.color : "#BBBBBB";
  const accentColor = isEarned ? rank.accent : "#CCCCCC";
  const bgColor = isEarned ? rank.bg : "#F5F5F5";
  const creditsText = isEarned ? `${credits.toLocaleString("de-DE")} Credits` : `ab ${rank.min.toLocaleString("de-DE")} Credits`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="360" viewBox="0 0 320 360">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bgColor}" />
      <stop offset="100%" stop-color="${isEarned ? rank.bg : "#EEEEEE"}" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="${mainColor}" flood-opacity="0.15"/>
    </filter>
  </defs>
  <!-- Card background -->
  <rect width="320" height="360" rx="20" fill="url(#bg)" />
  <rect width="320" height="360" rx="20" fill="none" stroke="${accentColor}" stroke-width="1.5" stroke-opacity="0.4"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="320" height="6" rx="3" fill="${accentColor}" fill-opacity="${isEarned ? 1 : 0.3}"/>

  <!-- Shield shape -->
  <g transform="translate(160, 145)" filter="url(#shadow)">
    <path d="M0,-78 L52,-40 L52,18 Q52,62 0,82 Q-52,62 -52,18 L-52,-40 Z"
      fill="${isEarned ? accentColor : "#DDDDDD"}" opacity="0.2"/>
    <path d="M0,-78 L52,-40 L52,18 Q52,62 0,82 Q-52,62 -52,18 L-52,-40 Z"
      fill="none" stroke="${mainColor}" stroke-width="2.5" stroke-opacity="${isEarned ? 0.8 : 0.3}"/>
    <!-- Star in shield -->
    <text x="0" y="14" text-anchor="middle" font-size="36" fill="${mainColor}" opacity="${isEarned ? 1 : 0.4}">★</text>
  </g>

  <!-- VFA Branding -->
  <text x="160" y="56" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif"
    font-size="11" font-weight="700" letter-spacing="3" fill="${mainColor}" opacity="0.6"
    text-transform="uppercase">VFA-AKADEMIE</text>

  <!-- Rank name -->
  <text x="160" y="260" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif"
    font-size="28" font-weight="800" letter-spacing="-0.5" fill="${mainColor}">${rank.label}</text>

  <!-- Sublabel -->
  <text x="160" y="285" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif"
    font-size="13" font-weight="600" letter-spacing="1" fill="${mainColor}" opacity="0.55"
    text-transform="uppercase">${rank.sublabel}</text>

  <!-- Divider -->
  <line x1="120" y1="305" x2="200" y2="305" stroke="${accentColor}" stroke-width="1.5" stroke-opacity="${isEarned ? 0.5 : 0.2}"/>

  <!-- Credits text -->
  <text x="160" y="328" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif"
    font-size="12" font-weight="600" fill="${mainColor}" opacity="0.6">${creditsText}</text>
</svg>`;
}

function downloadBadge(rank: RankDef, credits: number) {
  const svg = generateBadgeSVG(rank, credits, true);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vfa-badge-${rank.key.toLowerCase()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BadgesClient({ credits }: { credits: number }) {
  const currentRank = getCurrentRank(credits);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div
        style={{
          padding: "20px 24px",
          background: "#FFFFFF",
          border: "1px solid #E6E6E6",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(0,120,115,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flexShrink: 0,
          }}
        >
          ★
        </div>
        <div>
          <div style={{ fontSize: 13, color: "#888888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Dein aktueller Status
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#007873", marginTop: 2 }}>
            {RANKS.find((r) => r.key === currentRank)?.label} · {credits.toLocaleString("de-DE")} Credits
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 16,
        }}
      >
        {RANKS.map((rank) => {
          const isEarned = credits >= rank.min;
          const isCurrent = rank.key === currentRank;
          const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generateBadgeSVG(rank, credits, isEarned))}`;

          return (
            <div
              key={rank.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                opacity: isEarned ? 1 : 0.45,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "320 / 360",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: isCurrent
                    ? `0 8px 28px rgba(0,0,0,0.14), 0 0 0 2px ${rank.accent}`
                    : "0 4px 12px rgba(0,0,0,0.08)",
                  transition: "box-shadow 200ms ease",
                }}
              >
                <img
                  src={svgDataUrl}
                  alt={`${rank.label} Badge`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "#007873",
                      color: "#FFF",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      padding: "3px 7px",
                      borderRadius: 999,
                    }}
                  >
                    AKTUELL
                  </div>
                )}
              </div>

              {isEarned && (
                <button
                  type="button"
                  onClick={() => downloadBadge(rank, credits)}
                  style={{
                    width: "100%",
                    padding: "9px 0",
                    borderRadius: 999,
                    border: `1px solid ${rank.accent}`,
                    background: "transparent",
                    color: rank.color,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.03em",
                  }}
                >
                  ↓ Herunterladen
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: "14px 18px",
          background: "#F7F7F4",
          border: "1px solid #E6E6E6",
          borderRadius: 10,
          fontSize: 13,
          color: "#666666",
          lineHeight: 1.6,
        }}
      >
        Badges werden als SVG-Datei heruntergeladen und können auf LinkedIn, in E-Mail-Signaturen
        oder auf der eigenen Website eingebunden werden.
      </div>
    </div>
  );
}
