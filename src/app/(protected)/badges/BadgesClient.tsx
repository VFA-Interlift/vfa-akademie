"use client";

const VFA_GREEN = "#007873";
const VFA_YELLOW = "#FFC100";

const STAR_PATH =
  "M0,-30 L7,-9.7 L28.5,-9.3 L11.4,3.7 L17.6,24.3 L0,12 L-17.6,24.3 L-11.4,3.7 L-28.5,-9.3 L-7,-9.7 Z";

type Center = { type: "star" } | { type: "text"; text: string };

type BadgeConfig = {
  key: string;
  title: string;
  sublabel: string;
  footnote: string;
  earned: boolean;
  color: string; // Text/Kontur
  accent: string; // Ring/Akzent
  tint: string; // Innenfläche
  center: Center;
  badgeImage?: string; // hochauflösendes Schild-PNG (Download)
  badgeThumb?: string; // verkleinerte Variante (Anzeige)
};

// ---------- Ränge (credit-basiert) ----------

const RANKS = [
  { key: "BRONZE", label: "Bronze", sublabel: "Einsteiger", min: 100, color: "#7C4F2A", accent: "#C87941", tint: "#FDF6F0", file: "bronze" },
  { key: "SILBER", label: "Silber", sublabel: "Fortgeschritten", min: 500, color: "#5A6472", accent: "#8E99A8", tint: "#F4F6F8", file: "silber" },
  { key: "GOLD", label: "Gold", sublabel: "Experte", min: 1500, color: "#7C5A0A", accent: "#C79A16", tint: "#FFFBEE", file: "gold" },
  { key: "EXPERTE", label: "VFA-Experte", sublabel: "Elite", min: 3500, color: "#0B4F4B", accent: VFA_GREEN, tint: "#EAF4F3", file: "vfa-experte" },
];

function rankConfigs(credits: number): BadgeConfig[] {
  return RANKS.map((rank) => ({
    key: `rang-${rank.key.toLowerCase()}`,
    title: rank.label,
    sublabel: rank.sublabel,
    footnote: credits >= rank.min ? `${credits.toLocaleString("de-DE")} Credits` : `ab ${rank.min.toLocaleString("de-DE")} Credits`,
    earned: credits >= rank.min,
    color: rank.color,
    accent: rank.accent,
    tint: rank.tint,
    center: { type: "star" },
    badgeImage: `/badges/${rank.file}.png`,
    badgeThumb: `/badges/${rank.file}-thumb.png`,
  }));
}

// ---------- Auszeichnungen (leistungsbasiert) ----------

function achievementConfigs(completedCount: number, vdiCompleted: string[]): BadgeConfig[] {
  const vdiDone = vdiCompleted.length;

  // Schulungs-Meilensteine 5/10/20 synchron zum Kompetenzpass (getAchievements).
  return [
    {
      key: "vdi-reihe",
      title: "VDI-Reihe",
      sublabel: "A1 · A2 · B · C",
      footnote: vdiDone >= 4 ? "Komplett abgeschlossen" : `${vdiDone} / 4 Kursen`,
      earned: vdiDone >= 4,
      color: "#0B4F4B",
      accent: VFA_GREEN,
      tint: "#EAF4F3",
      center: { type: "text", text: "VDI" },
    },
    {
      key: "5-schulungen",
      title: "5 Schulungen",
      sublabel: "Aktiv",
      footnote: completedCount >= 5 ? "Erreicht" : `${Math.min(completedCount, 5)} / 5`,
      earned: completedCount >= 5,
      color: "#0B4F4B",
      accent: VFA_GREEN,
      tint: "#EAF4F3",
      center: { type: "text", text: "5" },
    },
    {
      key: "10-schulungen",
      title: "10 Schulungen",
      sublabel: "Viellerner",
      footnote: completedCount >= 10 ? "Erreicht" : `${Math.min(completedCount, 10)} / 10`,
      earned: completedCount >= 10,
      color: "#7C5A0A",
      accent: VFA_YELLOW,
      tint: "#FFFBEE",
      center: { type: "text", text: "10" },
    },
    {
      key: "20-schulungen",
      title: "20 Schulungen",
      sublabel: "Profi",
      footnote: completedCount >= 20 ? "Erreicht" : `${Math.min(completedCount, 20)} / 20`,
      earned: completedCount >= 20,
      color: "#0B4F4B",
      accent: VFA_GREEN,
      tint: "#EAF4F3",
      center: { type: "text", text: "20" },
    },
  ];
}

// ---------- SVG-Siegel ----------

function generateBadgeSVG(config: BadgeConfig): string {
  const earned = config.earned;
  const color = earned ? config.color : "#A6A6A6";
  const accent = earned ? config.accent : "#C4C4C4";
  const tint = earned ? config.tint : "#F4F4F2";

  const centerMarkup =
    config.center.type === "star"
      ? `<path d="${STAR_PATH}" fill="${accent}" opacity="${earned ? 1 : 0.5}" />`
      : `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,sans-serif" font-size="${config.center.text.length > 2 ? 30 : 38}" font-weight="800" letter-spacing="0.5" fill="${color}">${config.center.text}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="360" viewBox="0 0 320 360">
  <defs>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="${accent}" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect x="1" y="1" width="318" height="358" rx="22" fill="#FFFFFF" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.35"/>
  <rect x="1" y="1" width="318" height="7" rx="3.5" fill="${accent}" fill-opacity="${earned ? 1 : 0.35}"/>

  <text x="160" y="50" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="800" letter-spacing="3.5" fill="${color}" opacity="0.55">VFA-AKADEMIE</text>

  <g transform="translate(160,150)" filter="url(#s)">
    <circle r="76" fill="${accent}" fill-opacity="0.08"/>
    <circle r="76" fill="none" stroke="${accent}" stroke-width="2" stroke-opacity="${earned ? 0.6 : 0.3}"/>
    <circle r="64" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="1.5 7" stroke-linecap="round" stroke-opacity="${earned ? 0.7 : 0.25}"/>
    <circle r="54" fill="${tint}" stroke="${accent}" stroke-width="1" stroke-opacity="0.25"/>
    ${centerMarkup}
  </g>

  <text x="160" y="266" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="26" font-weight="800" letter-spacing="-0.4" fill="${color}">${config.title}</text>
  <text x="160" y="290" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="700" letter-spacing="1.5" fill="${color}" opacity="0.55">${config.sublabel.toUpperCase()}</text>
  <line x1="124" y1="308" x2="196" y2="308" stroke="${accent}" stroke-width="1.5" stroke-opacity="${earned ? 0.5 : 0.2}"/>
  <text x="160" y="330" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="600" fill="${color}" opacity="0.7">${config.footnote}</text>
</svg>`;
}

function downloadBadge(config: BadgeConfig, format: "svg" | "png") {
  // Ränge: das echte hochauflösende Schild-PNG direkt ausliefern.
  if (config.badgeImage) {
    triggerDownload(config.badgeImage, `vfa-badge-${config.key}.png`);
    return;
  }

  const svg = generateBadgeSVG({ ...config, earned: true });
  if (format === "svg") {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    triggerDownload(URL.createObjectURL(blob), `vfa-badge-${config.key}.svg`);
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 640, 720);
    URL.revokeObjectURL(url);
    triggerDownload(canvas.toDataURL("image/png"), `vfa-badge-${config.key}.png`);
  };
  img.src = url;
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

// ---------- UI ----------

export default function BadgesClient({
  credits,
  completedCount,
  vdiCompleted,
}: {
  credits: number;
  completedCount: number;
  vdiCompleted: string[];
}) {
  const ranks = rankConfigs(credits);
  const achievements = achievementConfigs(completedCount, vdiCompleted);
  const earnedRank = [...ranks].reverse().find((r) => r.earned) ?? null;
  const earnedAchievements = achievements.filter((a) => a.earned).length;

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div
        style={{
          padding: "18px 22px",
          background: "#FFFFFF",
          border: "1px solid #E6E6E6",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "rgba(0,120,115,0.10)",
            border: "1px solid rgba(0,120,115,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            color: VFA_GREEN,
            flexShrink: 0,
          }}
        >
          ★
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "#888888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Dein aktueller Status
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: VFA_GREEN, marginTop: 2 }}>
            {earnedRank ? earnedRank.title : "Kein Rang"} · {credits.toLocaleString("de-DE")} Credits
          </div>
          <div style={{ fontSize: 13, color: "#888888", marginTop: 2 }}>
            {earnedAchievements} von {achievements.length} Auszeichnungen freigeschaltet
          </div>
        </div>
      </div>

      <BadgeSection title="Ränge" subtitle="Steigen mit deinen Credits" badges={ranks} highlightKey={earnedRank?.key} />

      <BadgeSection title="Auszeichnungen" subtitle="Für absolvierte Schulungen" badges={achievements} />

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
        Freigeschaltete Badges lassen sich als SVG oder PNG herunterladen – z. B. für LinkedIn,
        E-Mail-Signaturen oder die eigene Website.
      </div>
    </div>
  );
}

function BadgeSection({
  title,
  subtitle,
  badges,
  highlightKey,
}: {
  title: string;
  subtitle: string;
  badges: BadgeConfig[];
  highlightKey?: string;
}) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: VFA_GREEN, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "#999999", marginTop: 2 }}>{subtitle}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
        {badges.map((badge) => {
          const isCurrent = badge.key === highlightKey;
          const isImage = Boolean(badge.badgeThumb);
          const imgSrc = isImage
            ? (badge.badgeThumb as string)
            : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generateBadgeSVG(badge))}`;

          return (
            <div
              key={badge.key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: badge.earned ? 1 : 0.5 }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: isImage ? "1 / 1" : "320 / 360",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: isImage
                    ? (isCurrent ? `0 0 0 2px ${badge.accent}` : "none")
                    : isCurrent
                      ? `0 8px 26px rgba(0,0,0,0.13), 0 0 0 2px ${badge.accent}`
                      : "0 4px 12px rgba(0,0,0,0.07)",
                  transition: "box-shadow 200ms ease",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgSrc}
                  alt={`${badge.title} Badge`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: isImage ? "contain" : "cover",
                    display: "block",
                    filter: badge.earned ? "none" : "grayscale(1)",
                  }}
                />
                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: VFA_GREEN,
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

              {/* Beim echten Schild stehen Credits/Status nicht im Bild → als Caption darunter. */}
              {isImage && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: badge.color, letterSpacing: "0.04em" }}>
                    {badge.sublabel.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: "#888888", marginTop: 2 }}>{badge.footnote}</div>
                </div>
              )}

              {badge.earned && (
                isImage ? (
                  <button
                    type="button"
                    onClick={() => downloadBadge(badge, "png")}
                    style={{ ...downloadButtonStyle(badge.accent, "#FFFFFF", true), width: "100%" }}
                  >
                    ↓ PNG
                  </button>
                ) : (
                  <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <button type="button" onClick={() => downloadBadge(badge, "svg")} style={downloadButtonStyle(badge.accent, badge.color, false)}>
                      ↓ SVG
                    </button>
                    <button type="button" onClick={() => downloadBadge(badge, "png")} style={downloadButtonStyle(badge.accent, "#FFFFFF", true)}>
                      ↓ PNG
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function downloadButtonStyle(accent: string, color: string, filled: boolean): React.CSSProperties {
  return {
    padding: "9px 0",
    borderRadius: 999,
    border: `1px solid ${accent}`,
    background: filled ? accent : "transparent",
    color,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.02em",
  };
}
