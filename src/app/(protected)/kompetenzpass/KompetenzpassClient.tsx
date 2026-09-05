"use client";

import { formatDate, formatDateRange } from "@/lib/trainings/format";
import { bewerteFrische, FRISCHE_FARBE } from "@/lib/kompetenz/frische";
import PageHeader from "@/components/ui/PageHeader";
import AppButton from "@/components/ui/AppButton";

type SerializableCertificate = {
  id: string;
  code: string | null;
  title: string;
  certificateKindLabel: string;
  credits: number;
  issuedAt: string;
  trainingTitle: string;
  trainingDate: string;
  trainingEndDate: string | null;
  location: string | null;
  instructor: string | null;
};

type RankKey = "STARTER" | "BRONZE" | "SILBER" | "GOLD" | "EXPERTE";

type RankInfo = {
  key: RankKey;
  label: string;
  sublabel: string;
  min: number;
  max: number | null;
  color: string;
  badge: string;
};

// Bronze beginnt erst ab 100 Credits (= eine abgeschlossene Standardschulung).
const RANKS: RankInfo[] = [
  { key: "BRONZE", label: "Bronze", sublabel: "Einsteiger", min: 100, max: 499, color: "#A86C3D", badge: "/badges/bronze-thumb.png" },
  { key: "SILBER", label: "Silber", sublabel: "Fortgeschritten", min: 500, max: 1499, color: "#8E99A8", badge: "/badges/silber-thumb.png" },
  { key: "GOLD", label: "Gold", sublabel: "Experte", min: 1500, max: 3499, color: "#C79A16", badge: "/badges/gold-thumb.png" },
  { key: "EXPERTE", label: "VFA-Experte", sublabel: "Elite", min: 3500, max: null, color: "#007873", badge: "/badges/vfa-experte-thumb.png" },
];

const STARTER_RANK: RankInfo = {
  key: "STARTER",
  label: "Kein Rang",
  sublabel: "Starter",
  min: 0,
  max: 99,
  color: "#9AA0A6",
  badge: "/badges/bronze-thumb.png",
};

function getRankInfo(credits: number): RankInfo {
  if (credits >= 3500) return RANKS[3];
  if (credits >= 1500) return RANKS[2];
  if (credits >= 500) return RANKS[1];
  if (credits >= 100) return RANKS[0];
  return STARTER_RANK;
}

function getNextRank(credits: number): RankInfo | null {
  if (credits < 100) return RANKS[0];
  if (credits < 500) return RANKS[1];
  if (credits < 1500) return RANKS[2];
  if (credits < 3500) return RANKS[3];
  return null;
}

function cleanTitle(value: string) {
  return value.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

function getCompetencyTitle(cert: SerializableCertificate) {
  if (cert.code?.trim()) return cert.code.trim();
  return cleanTitle(cert.trainingTitle || cert.title);
}

// Kürzel vor dem ersten Trenner („B-2701", „B_2701", „B 2701" → „B") — dieselbe
// Regel wie in badges/page.tsx, damit beide Seiten dieselben Module zählen
// (05.09.2026). coursePrefixOf aus recommendations.ts geht hier nicht: die
// Datei zieht Prisma in den Client-Bundle.
function kuerzelVon(code: string) {
  return code.split(/[-_ ]/)[0];
}

const VDI_MODULES: { level: string; matches: (code: string) => boolean }[] = [
  { level: "A1", matches: (c) => kuerzelVon(c) === "A1" },
  { level: "A2", matches: (c) => kuerzelVon(c) === "A2" },
  { level: "B", matches: (c) => kuerzelVon(c) === "B" },
  { level: "C", matches: (c) => kuerzelVon(c) === "C" },
];

/**
 * Derives a small set of human-readable achievements from the user's record.
 * Purely computed from existing data – no manual input needed.
 */
function getAchievements(
  certificates: SerializableCertificate[],
  creditsTotal: number,
  rank: RankInfo,
  memberSince: string
): string[] {
  const achievements: string[] = [];
  const count = certificates.length;
  const codes = certificates.map((c) => (c.code ?? "").toUpperCase());

  // VDI modules
  const presentLevels = VDI_MODULES.filter((m) =>
    codes.some((code) => m.matches(code))
  ).map((m) => m.level);

  // Nur die vollständige Reihe ist eine Auszeichnung — wie auf der
  // Badges-Seite. Einzelne Module stehen ohnehin unten unter „Absolvierte
  // Kompetenzen"; als Auszeichnung gezählt widersprachen sie der Angabe
  // „0 von 4 Auszeichnungen freigeschaltet" auf der Badges-Seite (05.09.2026).
  if (presentLevels.length === VDI_MODULES.length) {
    achievements.push("Alle VDI-Module (A1–C) absolviert");
  }

  // Schulungs-Meilensteine: dieselben Schwellen wie auf der Badges-Seite.
  // Unter fünf Schulungen stand hier bis zum 05.09.2026 ein Trostpreis
  // („3 Schulungen besucht"), während die Badges-Seite für denselben Stand
  // „0 von 4 Auszeichnungen freigeschaltet" meldete — derselbe Nutzer hatte
  // auf der einen Seite eine Auszeichnung und auf der anderen keine.
  if (count >= 20) achievements.push("20+ Schulungen besucht");
  else if (count >= 10) achievements.push("10+ Schulungen besucht");
  else if (count >= 5) achievements.push("5+ Schulungen besucht");

  // Rank (skip the entry rank to keep it meaningful)
  if (rank.key !== "BRONZE" && rank.key !== "STARTER") {
    achievements.push(`${rank.label}-Status erreicht`);
  }

  // Credit milestones — „erreicht" statt „über": die Schwelle zählt schon bei
  // genau 1.000 bzw. 3.000 (05.09.2026).
  if (creditsTotal >= 3000) achievements.push("3.000 Credits erreicht");
  else if (creditsTotal >= 1000) achievements.push("1.000 Credits erreicht");

  // Loyalty — „Dabei seit": das Datum ist die Kontoerstellung, keine
  // Verbandsmitgliedschaft (05.09.2026).
  const since = new Date(memberSince);
  if (!Number.isNaN(since.getTime())) {
    const years = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years >= 1) {
      achievements.push(`Dabei seit ${since.getFullYear()}`);
    }
  }

  return achievements;
}

export default function KompetenzpassClient({
  displayName,
  company,
  position,
  creditsTotal,
  memberSince,
  certificates,
}: {
  displayName: string;
  company: string | null;
  position: string | null;
  creditsTotal: number;
  memberSince: string;
  certificates: SerializableCertificate[];
}) {
  const rank = getRankInfo(creditsTotal);
  const nextRank = getNextRank(creditsTotal);
  const remainingToNext = nextRank ? nextRank.min - creditsTotal : 0;
  const totalCertificateCredits = certificates.reduce((sum, c) => sum + c.credits, 0);
  const achievements = getAchievements(certificates, creditsTotal, rank, memberSince);

  return (
    <main className="page-main kompetenzpass-page">
      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 16 }}>
        {/* Petrol-Band wie auf jeder Seite plus Aktionsleiste in EINEM Kind: globals.css
            gibt dem Container zwei Zeilen (auto 1fr), das Dokument muss das zweite Kind
            bleiben. Beides ist im Druck ausgeblendet (05.09.2026). */}
        <div className="kp-actions" style={{ display: "grid", gap: 16 }}>
          <PageHeader title="Kompetenzpass" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <p style={{ margin: 0, color: "var(--vfa-text-2)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
              Dein persönlicher Qualifikationsnachweis – zum Drucken oder als PDF speichern.
            </p>
            <AppButton onClick={() => window.print()}>↓ Als PDF / Drucken</AppButton>
          </div>
        </div>

        {/* The pass document — bleibt bewusst hell mit festen Farben: ein
            Dokument, das gedruckt wird, folgt nicht dem Dunkelmodus (20.08.2026). */}
        <div
          className="kp-document"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6E6E6",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Branded header */}
          <div
            style={{
              background: "linear-gradient(135deg, #007873 0%, #005f5b 100%)",
              color: "#FFFFFF",
              padding: "28px 30px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mark-light.png" alt="" width={22} height={22} style={{ display: "block", flexShrink: 0 }} />
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.7 }}>
                  VFA-Akademie
                </div>
              </div>
              <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 800, lineHeight: 1.1, marginTop: 6, letterSpacing: "-0.02em" }}>
                {displayName || "Mein Kompetenzpass"}
              </div>
              {(position || company) && (
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6, lineHeight: 1.4 }}>
                  {[position, company].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>

            <div
              style={{
                display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "12px 18px", borderRadius: 14,
                background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rank.badge}
                alt={`Rang: ${rank.label}`}
                width={66}
                height={66}
                style={{ display: "block", filter: rank.key === "STARTER" ? "grayscale(1)" : "none", opacity: rank.key === "STARTER" ? 0.55 : 1 }}
              />
              <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{rank.sublabel}</span>
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 1,
              background: "#EFEFEF",
              borderBottom: "1px solid #EFEFEF",
            }}
          >
            <StatCell label="Credits gesamt" value={creditsTotal.toLocaleString("de-DE")} highlight />
            <StatCell label="Zertifikate" value={String(certificates.length)} />
            <StatCell label="Credits aus Zertifikaten" value={totalCertificateCredits.toLocaleString("de-DE")} />
            <StatCell label="Dabei seit" value={formatMonthYear(memberSince)} />
          </div>

          {/* Rank progress (hidden on print to keep it document-like) */}
          {nextRank && (
            <div className="kp-progress" style={{ padding: "18px 30px", borderBottom: "1px solid #F0F0F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, color: "#666666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span>Fortschritt zu {nextRank.label}</span>
                <span>noch {remainingToNext.toLocaleString("de-DE")} Credits</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "#F0F0F0", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${getProgressPercent(creditsTotal)}%`,
                    background: rank.color,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          )}

          {/* Achievements / remarks */}
          {achievements.length > 0 && (
            <div style={{ padding: "20px 30px", borderBottom: "1px solid #F0F0F0" }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#007873", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Auszeichnungen
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {achievements.map((text) => (
                  <span
                    key={text}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 13px",
                      borderRadius: 999,
                      background: "rgba(0,120,115,0.07)",
                      border: "1px solid rgba(0,120,115,0.22)",
                      color: "#005f5b",
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    <span style={{ color: "#C79A16" }}>★</span>
                    {text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Competencies list */}
          <div className="kp-body" style={{ padding: "24px 30px 30px" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 700, color: "#007873", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Absolvierte Kompetenzen
            </h2>

            {certificates.length === 0 ? (
              <div style={{ color: "#888888", fontSize: 15, lineHeight: 1.55 }}>
                Sobald deine erste Schulung abgeschlossen ist, erscheint sie hier als Kompetenz.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 0 }}>
                {certificates.map((cert, i) => (
                  <div
                    key={cert.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: 14,
                      alignItems: "center",
                      padding: "13px 0",
                      borderBottom: i < certificates.length - 1 ? "1px solid #F0F0F0" : "none",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      {/* Fest dunkel statt var(--vfa-text): der Pass bleibt als Dokument immer hell,
                          die Variable stünde im Dunkelmodus weiß auf weiß (20.08.2026) */}
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#1F1F1F", lineHeight: 1.25 }}>
                        {getCompetencyTitle(cert)}
                      </div>
                      <div style={{ fontSize: 12, color: "#888888", marginTop: 3, lineHeight: 1.4 }}>
                        {cert.certificateKindLabel} · {formatDateRange(cert.trainingDate, cert.trainingEndDate)}
                      </div>
                      {(() => {
                        // Frische ab Kursende, nicht ab issuedAt: nachgezogene Alt-Kurse bekommen
                        // ihr issuedAt erst am Tag des Ausstellungslaufs und stünden sonst
                        // dauerhaft auf "aktuell" (20.08.2026)
                        const f = bewerteFrische(cert.code, new Date(cert.trainingEndDate ?? cert.trainingDate), new Date());
                        const farbe = FRISCHE_FARBE[f.status];
                        return (
                          <span
                            className="kp-frische"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6,
                              padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                              background: farbe.bg, color: farbe.fg,
                            }}
                          >
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: farbe.fg }} />
                            {f.label}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 800, fontSize: 17, color: "#007873", lineHeight: 1 }}>
                        +{cert.credits.toLocaleString("de-DE")}
                      </div>
                      <div style={{ fontSize: 12, color: "#AAAAAA", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
                        Credits
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 30px",
              borderTop: "1px solid #F0F0F0",
              background: "#FAFAFA",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 11,
              color: "#999999",
              lineHeight: 1.5,
            }}
          >
            <span>Ausgestellt von der VFA-Akademie</span>
            <span>Stand: {formatDate(new Date().toISOString())}</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCell({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: "#FFFFFF", padding: "16px 18px" }}>
      {/* Hervorhebung nur über die Farbe, eine Größe für alle Kennzahlen (05.09.2026) */}
      <div style={{ fontSize: 22, fontWeight: 800, color: highlight ? "#007873" : "#1F1F1F", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#888888", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 5 }}>
        {label}
      </div>
    </div>
  );
}

function getProgressPercent(credits: number) {
  const thresholds = [0, 100, 500, 1500, 3500];
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (credits < thresholds[i + 1]) {
      const range = thresholds[i + 1] - thresholds[i];
      const val = credits - thresholds[i];
      return Math.round((val / range) * 100);
    }
  }
  return 100;
}

function formatMonthYear(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("de-DE", { month: "2-digit", year: "numeric" });
}
