import Link from "next/link";
import type { CSSProperties } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedProgressCircle from "@/components/ui/AnimatedProgressCircle";
import FeedbackReminder from "@/components/FeedbackReminder";
import { getOpenFeedbackCount } from "@/lib/feedback/service";

export const dynamic = "force-dynamic";

type RankKey = "STARTER" | "BRONZE" | "SILBER" | "GOLD" | "EXPERTE";
type RankInfo = {
  key: RankKey;
  label: string;
  min: number;
  max: number | null;
  color: string;
  softBackground: string;
  softBorder: string;
};

// Bronze beginnt erst ab 100 Credits (= eine abgeschlossene Standardschulung).
// Darunter hat man noch keinen Rang.
const RANKS: RankInfo[] = [
  { key: "BRONZE", label: "Bronze", min: 100, max: 499, color: "#A86C3D", softBackground: "rgba(168,108,61,0.10)", softBorder: "1px solid rgba(168,108,61,0.28)" },
  { key: "SILBER", label: "Silber", min: 500, max: 1499, color: "#8E99A8", softBackground: "rgba(142,153,168,0.12)", softBorder: "1px solid rgba(142,153,168,0.32)" },
  { key: "GOLD", label: "Gold", min: 1500, max: 3499, color: "#C79A16", softBackground: "rgba(199,154,22,0.12)", softBorder: "1px solid rgba(199,154,22,0.32)" },
  { key: "EXPERTE", label: "VFA-Experte", min: 3500, max: null, color: "#1F1F1F", softBackground: "rgba(31,31,31,0.08)", softBorder: "1px solid rgba(31,31,31,0.20)" },
];

const STARTER_RANK: RankInfo = {
  key: "STARTER",
  label: "Kein Rang",
  min: 0,
  max: 99,
  color: "#9AA0A6",
  softBackground: "rgba(154,160,166,0.12)",
  softBorder: "1px solid rgba(154,160,166,0.30)",
};

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
      createdAt: true,
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

  // Nur tatsächlich bevorstehende/laufende Schulungen zählen (gleiche Logik wie
  // „Meine Schulungen": endDate bzw. date >= heute). Vergangene, noch nicht vom
  // Cron in Zertifikate umgewandelte Anmeldungen sollen hier nicht mitzählen.
  const upcomingEnrollments = user.enrollments.filter(
    (e) => new Date(e.training.endDate ?? e.training.date) >= today
  );
  const enrollmentCount = upcomingEnrollments.length;
  const certCount = user.certificates.length;

  const openFeedbackCount = await getOpenFeedbackCount(user.id);

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

        <FeedbackReminder openCount={openFeedbackCount} />

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
            <Link href="/meine-schulungen" style={{ textDecoration: "none", display: "block" }}>
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
            </Link>
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
                  <StatBox label="Bevorstehende Schulungen" value={enrollmentCount} />
                  <StatBox label="Zertifikate" value={certCount} />
                  <StatBox label="Mein Rang" value={rank.label} />
                  <StatBox label="Mitglied seit" value={new Date(user.createdAt).getFullYear()} />
                </div>

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

        {/* Social media (dezent) */}
        <AnimatedSection delayMs={320}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "4px 0 8px" }}>
            <a
              href="https://www.instagram.com/vfaakademie/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="VFA-Akademie auf Instagram"
              style={socialLinkStyle}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/vfa-interlift-e-v/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="VFA-Interlift e.V. auf LinkedIn"
              style={socialLinkStyle}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9.5h4v11H3v-11Zm6 0h3.8v1.5h.05c.53-.95 1.83-1.95 3.77-1.95C20.2 9.05 21 11 21 14v6.5h-4v-5.8c0-1.38-.02-3.16-1.93-3.16-1.93 0-2.22 1.5-2.22 3.06v5.9H9v-11Z" />
              </svg>
            </a>
          </div>
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
  if (credits >= 100) return RANKS[0];
  return STARTER_RANK;
}

function getNextRankInfo(credits: number) {
  if (credits < 100) return RANKS[0];
  if (credits < 500) return RANKS[1];
  if (credits < 1500) return RANKS[2];
  if (credits < 3500) return RANKS[3];
  return null;
}

function getRankProgress(credits: number) {
  const thresholds = [0, 100, 500, 1500, 3500];
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

const socialLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: 999,
  color: "#B0B0B0",
  textDecoration: "none",
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
