import Link from "next/link";
import type { CSSProperties } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedProgressCircle from "@/components/ui/AnimatedProgressCircle";

export const dynamic = "force-dynamic";

type RankKey = "BRONZE" | "SILBER" | "GOLD" | "EXPERTE";
type RankInfo = {
  key: RankKey;
  label: string;
  min: number;
  max: number | null;
  color: string;
  softBackground: string;
  softBorder: string;
};

const RANKS: RankInfo[] = [
  { key: "BRONZE", label: "Bronze", min: 0, max: 499, color: "#A86C3D", softBackground: "rgba(168,108,61,0.10)", softBorder: "1px solid rgba(168,108,61,0.28)" },
  { key: "SILBER", label: "Silber", min: 500, max: 1499, color: "#8E99A8", softBackground: "rgba(142,153,168,0.12)", softBorder: "1px solid rgba(142,153,168,0.32)" },
  { key: "GOLD", label: "Gold", min: 1500, max: 3499, color: "#C79A16", softBackground: "rgba(199,154,22,0.12)", softBorder: "1px solid rgba(199,154,22,0.32)" },
  { key: "EXPERTE", label: "VFA-Experte", min: 3500, max: null, color: "#1F1F1F", softBackground: "rgba(31,31,31,0.08)", softBorder: "1px solid rgba(31,31,31,0.20)" },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const email = session.user.email.trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      company: true,
      creditsTotal: true,
      enrollments: {
        where: { status: { in: ["PENDING", "CONFIRMED", "ATTENDED"] } },
        select: {
          id: true,
          status: true,
          training: {
            select: { id: true, title: true, code: true, date: true, endDate: true, location: true },
          },
        },
        orderBy: { training: { date: "asc" } },
      },
      certificates: {
        where: { status: "ISSUED" },
        select: { id: true },
      },
    },
  });

  if (!user) redirect("/login");

  const leaderboardTop = await prisma.user.findMany({
    where: { leaderboardOptIn: true, leaderboardName: { not: null } },
    orderBy: [{ creditsTotal: "desc" }, { updatedAt: "asc" }],
    take: 3,
    select: { id: true, leaderboardName: true, creditsTotal: true },
  });

  const displayName = getDisplayName(user);
  const rank = getRankInfo(user.creditsTotal);
  const progress = getRankProgress(user.creditsTotal);
  const nextRank = getNextRankInfo(user.creditsTotal);

  const nextTraining = user.enrollments.find(
    (e) => new Date(e.training.date) >= today && e.status !== "ATTENDED"
  );

  const enrollmentCount = user.enrollments.length;
  const certCount = user.certificates.length;

  return (
    <main className="page-main">
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 18 }}>

        {/* Greeting */}
        <AnimatedSection delayMs={0}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, color: "#1F1F1F", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                Hallo{displayName ? `, ${displayName}` : ""}
              </h2>
              <p style={{ margin: "4px 0 0", color: "#888888", fontSize: 14, lineHeight: 1.5 }}>
                {nextTraining ? "Du hast eine Schulung in Kürze." : "Dein aktueller Stand."}
              </p>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: rank.softBackground, border: rank.softBorder, color: rank.color, fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>
              ★ {rank.label}
            </div>
          </div>
        </AnimatedSection>

        {/* Profile completeness hint */}
        {(!user.firstName || !user.lastName) && (
          <AnimatedSection delayMs={80}>
            <Link
              href="/meine-daten"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                background: "rgba(255,193,0,0.10)",
                border: "1px solid rgba(255,193,0,0.45)",
                borderRadius: 12,
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#7C5A0A", lineHeight: 1.25 }}>
                  Profil unvollständig
                </div>
                <div style={{ fontSize: 13, color: "#7C5A0A", opacity: 0.8, marginTop: 2, lineHeight: 1.4 }}>
                  Vor- und Nachname fehlen – werden für Zertifikate benötigt. Jetzt ausfüllen →
                </div>
              </div>
            </Link>
          </AnimatedSection>
        )}

        {/* Next upcoming training */}
        {nextTraining && (
          <AnimatedSection delayMs={100}>
            <div style={{ padding: "16px 18px", background: "#007873", borderRadius: 14, display: "grid", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Nächste Schulung
              </div>
              <div style={{ fontSize: "clamp(15px, 4vw, 18px)", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.25 }}>
                {nextTraining.training.code?.trim() || nextTraining.training.title}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 2 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                  📅 {formatDateRange(nextTraining.training.date, nextTraining.training.endDate)}
                </span>
                {nextTraining.training.location && (
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                    📍 {nextTraining.training.location.split(",")[0]?.trim()}
                  </span>
                )}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Status + Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, alignItems: "stretch" }}>

          {/* Status card */}
          <AnimatedSection delayMs={140} style={{ height: "100%" }}>
            <AppCard accent="green" style={{ height: "100%" }}>
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ color: "#007873", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Mein Status
                  </div>
                </div>

                <AnimatedProgressCircle
                  percent={progress.percent}
                  credits={user.creditsTotal}
                  color={rank.color}
                />

                <div style={{ color: "#666666", fontSize: 13, textAlign: "center", lineHeight: 1.5 }}>
                  {nextRank
                    ? `Noch ${progress.remainingToNext.toLocaleString("de-DE")} Credits bis ${nextRank.label}`
                    : "Höchste Stufe erreicht ✓"}
                </div>

                {/* Rank overview */}
                <div style={{ display: "grid", gap: 6 }}>
                  {RANKS.map((r) => (
                    <div
                      key={r.key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: r.key === rank.key ? r.softBorder : "1px solid #F0F0F0",
                        background: r.key === rank.key ? r.softBackground : "transparent",
                        transition: "all 140ms",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: r.key === rank.key ? 800 : 600, color: r.key === rank.key ? r.color : "#999999" }}>
                        {r.label}
                      </span>
                      <span style={{ fontSize: 12, color: "#AAAAAA" }}>
                        {r.max === null ? `ab ${r.min.toLocaleString("de-DE")}` : `${r.min.toLocaleString("de-DE")}–${r.max.toLocaleString("de-DE")}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AppCard>
          </AnimatedSection>

          {/* Stats card */}
          <AnimatedSection delayMs={200} style={{ height: "100%" }}>
            <AppCard accent="yellow" style={{ height: "100%" }}>
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ color: "#007873", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Mein Überblick
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <StatBox label="Schulungen" value={enrollmentCount} />
                  <StatBox label="Zertifikate" value={certCount} />
                  <StatBox label="Credits gesamt" value={user.creditsTotal.toLocaleString("de-DE")} wide />
                </div>

                {user.company && (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "#FFFFFF", border: "1px solid #E6E6E6", fontSize: 13, color: "#555555", fontWeight: 600 }}>
                    🏢 {user.company}
                  </div>
                )}

                <Link href="/meine-schulungen" style={linkStyle}>
                  Alle Schulungen →
                </Link>
              </div>
            </AppCard>
          </AnimatedSection>
        </div>

        {/* Leaderboard */}
        <AnimatedSection delayMs={260}>
          <AppCard>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ color: "#007873", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Top 3 im Credit-Ranking
              </div>
              <Link href="/leaderboard" style={secondaryLinkStyle}>
                Zum Ranking
              </Link>
            </div>

            {leaderboardTop.length === 0 ? (
              <div style={{ color: "#888888", fontSize: 14, lineHeight: 1.6 }}>
                Noch keine Teilnehmer im Ranking sichtbar.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {leaderboardTop.map((entry, index) => {
                  const medalColors = ["#C79A16", "#8E99A8", "#A86C3D"];
                  return (
                    <div
                      key={entry.id}
                      style={{
                        border: "1px solid #EFEFEF",
                        background: index === 0 ? "rgba(199,154,22,0.04)" : "#FFFFFF",
                        padding: "12px 14px",
                        borderRadius: 10,
                        display: "grid",
                        gridTemplateColumns: "36px minmax(0, 1fr)",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: medalColors[index], color: "#FFFFFF", fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {index + 1}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
                        <div style={{ color: "#1F1F1F", fontSize: 16, fontWeight: 700, lineHeight: 1.25, minWidth: 0 }}>
                          {entry.leaderboardName}
                        </div>
                        <div style={{ color: "#007873", fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" }}>
                          {entry.creditsTotal.toLocaleString("de-DE")} Cr.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AppCard>
        </AnimatedSection>

      </div>
    </main>
  );
}


function StatBox({ label, value, wide }: { label: string; value: string | number; wide?: boolean }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid #EFEFEF",
        background: "#FFFFFF",
        gridColumn: wide ? "1 / -1" : undefined,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: "#007873", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#1F1F1F", lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}

function formatDateRange(start: Date | string, end: Date | null | string) {
  const fmt = (d: Date | string) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const s = fmt(start);
  const e = end ? fmt(end) : null;
  if (!e || e === s) return s;
  return `${s} – ${e}`;
}

function getDisplayName(user: { firstName: string | null; lastName: string | null; name: string | null; email: string }) {
  const combined = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  if (user.name?.trim()) return user.name.trim();
  return "";
}

function getRankInfo(credits: number) {
  if (credits >= 3500) return RANKS[3];
  if (credits >= 1500) return RANKS[2];
  if (credits >= 500) return RANKS[1];
  return RANKS[0];
}

function getNextRankInfo(credits: number) {
  if (credits < 500) return RANKS[1];
  if (credits < 1500) return RANKS[2];
  if (credits < 3500) return RANKS[3];
  return null;
}

function getRankProgress(credits: number) {
  const thresholds = [0, 500, 1500, 3500];
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (credits < thresholds[i + 1]) {
      const range = thresholds[i + 1] - thresholds[i];
      const val = credits - thresholds[i];
      return { percent: Math.round((val / range) * 100), remainingToNext: thresholds[i + 1] - credits };
    }
  }
  return { percent: 100, remainingToNext: 0 };
}

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 14px",
  borderRadius: 999,
  background: "transparent",
  color: "#007873",
  fontWeight: 700,
  fontSize: 13,
  textDecoration: "none",
  border: "1px solid #007873",
};

const linkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  color: "#007873",
  fontWeight: 700,
  fontSize: 13,
  textDecoration: "none",
  letterSpacing: "0.01em",
};
