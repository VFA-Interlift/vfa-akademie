import Link from "next/link";
import type { CSSProperties } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedProgressCircle from "@/components/ui/AnimatedProgressCircle";
import Kennzahl from "@/components/ui/Kennzahl";
import CreditsZuwachs from "@/components/CreditsZuwachs";
import DashboardHero from "@/components/DashboardHero";
import RangUebersicht from "@/components/RangUebersicht";
import RangAufstieg from "@/components/RangAufstieg";
import type { Hinweis } from "@/components/HeroGlocke";
import TesterWelcome from "@/components/TesterWelcome";
import { istTester } from "@/lib/app-test/tester";
import { getOpenFeedbackCount } from "@/lib/feedback/service";
import { formatDateRange } from "@/lib/trainings/format";
import { RAENGE, OHNE_RANG, rangFuer, naechsterRang, rangFortschritt, type RangSchluessel } from "@/lib/credits/raenge";

export const dynamic = "force-dynamic";

/** Farbwerte je Rang — Schlüssel, Beschriftung und Schwellen kommen aus der
    gemeinsamen Rangleiter (@/lib/credits/raenge). */
type RangFarben = { color: string; softBackground: string; softBorder: string };

const FARBEN: Record<RangSchluessel, RangFarben> = {
  STARTER: { color: "#9AA0A6", softBackground: "rgba(154,160,166,0.12)", softBorder: "1px solid rgba(154,160,166,0.30)" },
  BRONZE: { color: "#A86C3D", softBackground: "rgba(168,108,61,0.10)", softBorder: "1px solid rgba(168,108,61,0.28)" },
  SILBER: { color: "#8E99A8", softBackground: "rgba(142,153,168,0.12)", softBorder: "1px solid rgba(142,153,168,0.32)" },
  GOLD: { color: "#C79A16", softBackground: "rgba(199,154,22,0.12)", softBorder: "1px solid rgba(199,154,22,0.32)" },
  // Petrol wie im Kompetenzpass — derselbe Rang muss überall gleich aussehen.
  EXPERTE: { color: "#007873", softBackground: "rgba(0,120,115,0.08)", softBorder: "1px solid rgba(0,120,115,0.20)" },
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
      appTestFeedback: { select: { id: true } },
      creditsTotal: true,
      createdAt: true,
      enrollments: {
        // Gleiche Statusmenge wie getMyTrainings ("Meine Schulungen") — sonst
        // widersprechen sich Dashboard-Zaehler und Schulungs-Seite (20.08.2026).
        where: { status: { in: ["PENDING", "CONFIRMED", "ATTENDED", "COMPLETED"] } },
        select: {
          id: true,
          status: true,
          training: {
            select: { id: true, title: true, code: true, date: true, endDate: true, location: true, cancelledAt: true },
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

  // Anonymes Ranking: Platz 1 (ohne Namen), eigene Platzierung, Median.
  const rankingParticipants = await prisma.user.findMany({
    where: { creditsTotal: { gt: 0 } },
    orderBy: [{ creditsTotal: "desc" }, { updatedAt: "asc" }],
    select: { id: true, creditsTotal: true },
  });
  const rankingCredits = rankingParticipants.map((p) => p.creditsTotal);
  const rankingFirst = rankingParticipants[0] ?? null;
  const rankingMedian = rankingCredits.length === 0
    ? 0
    : rankingCredits.length % 2 === 1
      ? rankingCredits[(rankingCredits.length - 1) / 2]
      : Math.round((rankingCredits[rankingCredits.length / 2 - 1] + rankingCredits[rankingCredits.length / 2]) / 2);
  const myRankIndex = rankingParticipants.findIndex((p) => p.id === user.id);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;

  const displayName = getDisplayName(user);
  const rank = rangFuer(user.creditsTotal);
  const progress = rangFortschritt(user.creditsTotal);
  const nextRank = naechsterRang(user.creditsTotal);

  // Abgesagte Kurse zaehlen nicht als "naechste Schulung", und ein laufender
  // Mehrtageskurs bleibt bis zu seinem Ende die naechste (Ultracode 13.08.).
  // Kein Status-Ausschluss mehr: die Kachel zeigt dieselbe Menge wie der
  // Zaehler darunter und wie "Meine Schulungen" — ein laufender Kurs blieb
  // sonst verschwunden, sobald der Dozent die Anwesenheit erfasst hatte (20.08.2026).
  const nextTraining = user.enrollments.find(
    (e) =>
      !e.training.cancelledAt &&
      new Date(e.training.endDate ?? e.training.date) >= today
  );

  // Nur tatsächlich bevorstehende/laufende Schulungen zählen (gleiche Logik wie
  // „Meine Schulungen": endDate bzw. date >= heute). Vergangene, noch nicht vom
  // Cron in Zertifikate umgewandelte Anmeldungen sollen hier nicht mitzählen.
  const upcomingEnrollments = user.enrollments.filter(
    (e) => !e.training.cancelledAt && new Date(e.training.endDate ?? e.training.date) >= today
  );
  const enrollmentCount = upcomingEnrollments.length;
  const certCount = user.certificates.length;

  const openFeedbackCount = await getOpenFeedbackCount(user.id);

  // Erinnerungen sitzen seit dem 19.08.2026 als Glocke oben in der grünen
  // Leiste, nicht mehr als Kachel über dem Inhalt — so beginnt die weiße
  // Fläche gleich mit dem Diagramm (Tobis Ansage).
  const hinweise: Hinweis[] = [];

  if (openFeedbackCount > 0) {
    hinweise.push({
      titel: openFeedbackCount === 1 ? "Feedback steht aus" : `${openFeedbackCount}× Feedback steht aus`,
      text: "Je Schulung gibt es dafür 10 Credits.",
      href: "/meine-zertifikate",
    });
  }

  if (!user.firstName || !user.lastName) {
    hinweise.push({
      titel: "Profil unvollständig",
      text: "Vor- und Nachname fehlen, sie stehen später auf dem Zertifikat.",
      href: "/meine-daten",
    });
  }

  return (
    <main className="page-main dashboard-page">
      <DashboardHero
        name={displayName || "Willkommen"}
        rangLabel={rank.label}
        hinweise={hinweise}
      />

      <RangAufstieg
        userId={user.id}
        rangKey={rank.key}
        rangLabel={rank.label}
        rangFarbe={FARBEN[rank.key].color}
      />

      <div className="dash-inhalt">
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 18 }}>

        {istTester(user.email) && (
          <TesterWelcome
            vorname={user.firstName}
            feedbackGesendet={Boolean(user.appTestFeedback)}
          />
        )}

        {/* Offenes Feedback und ein unvollstaendiges Profil melden sich seit
            dem 19.08.2026 ueber die Glocke im gruenen Kopf. */}

        {/* Next upcoming training */}
        {nextTraining && (
          <AnimatedSection delayMs={100}>
            <div style={{ padding: "16px 18px", background: "#007873", borderRadius: 14, display: "grid", gap: 6 }}>
              <Link href="/meine-schulungen" style={{ textDecoration: "none", display: "grid", gap: 6 }}>
                {/* Etikett und Kartentitel in der Staffel; Weiß bleibt, weil
                    die Kachel in beiden Modi Petrol ist. */}
                <div style={{ fontSize: "var(--t-label)", fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Nächste Schulung
                </div>
                <div style={{ fontSize: "var(--t-gross)", fontWeight: 700, color: "#FFFFFF", lineHeight: "var(--lh-eng)" }}>
                  {nextTraining.training.code?.trim() || nextTraining.training.title}
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 2 }}>
                  <span style={{ fontSize: "var(--t-klein)", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                    📅 {formatDateRange(nextTraining.training.date.toISOString(), nextTraining.training.endDate?.toISOString() ?? null)}
                  </span>
                  {nextTraining.training.location && (
                    <span style={{ fontSize: "var(--t-klein)", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                      📍 {nextTraining.training.location.split(",")[0]?.trim()}
                    </span>
                  )}
                </div>
              </Link>

              {/* Direkt in den Handy-Kalender bzw. zur Route — ohne den Umweg
                  über "Meine Schulungen". */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                <a href={`/api/trainings/${nextTraining.training.id}/calendar`} style={heroChipStyle}>
                  📅 In meinen Kalender
                </a>
                {nextTraining.training.location && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextTraining.training.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={heroChipStyle}
                  >
                    🗺️ Route
                  </a>
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
                  <div className="etikett">Mein Status</div>
                </div>

                <AnimatedProgressCircle
                  percent={progress.percent}
                  credits={user.creditsTotal}
                  color={FARBEN[rank.key].color}
                />

                <CreditsZuwachs userId={user.id} credits={user.creditsTotal} />

                <div style={{ color: "var(--vfa-text-2)", fontSize: "var(--t-klein)", textAlign: "center", lineHeight: "var(--lh-weit)" }}>
                  {nextRank
                    ? `Noch ${progress.remainingToNext.toLocaleString("de-DE")} Credits bis ${nextRank.label}`
                    : "Höchste Stufe erreicht ✓"}
                </div>

                {/* Ränge als schlichte Liste — die Etagenanzeige mit Schacht
                    und Kabine ist auf Tobis Ansage vom 05.09.2026 entfallen. */}
                <RangUebersicht
                  aktuellKey={rank.key}
                  farben={{
                    STARTER: FARBEN.STARTER.color,
                    BRONZE: FARBEN.BRONZE.color,
                    SILBER: FARBEN.SILBER.color,
                    GOLD: FARBEN.GOLD.color,
                    EXPERTE: FARBEN.EXPERTE.color,
                  }}
                />
              </div>
            </AppCard>
          </AnimatedSection>

          {/* Stats card */}
          <AnimatedSection delayMs={200} style={{ height: "100%" }}>
            <AppCard accent="yellow" style={{ height: "100%" }}>
              <div style={{ display: "grid", gap: 14 }}>
                <div className="etikett">Mein Überblick</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Kennzahl label="Bevorstehende Schulungen" value={enrollmentCount} />
                  <Kennzahl label="Zertifikate" value={certCount} />
                  <Kennzahl label="Mein Rang" value={rank.label} />
                  {/* „Dabei seit“: der Wert ist die Kontoanlage in der App,
                      nicht die Verbandsmitgliedschaft (Launch-Runde 05.09.2026). */}
                  <Kennzahl label="Dabei seit" value={String(new Date(user.createdAt).getFullYear())} />
                </div>

                {enrollmentCount === 0 ? (
                  <div
                    style={{
                      padding: "12px 14px",
                      background: "rgba(255,193,0,0.12)",
                      border: "1px solid #FFC100",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "var(--vfa-text)", fontSize: "var(--t-basis)" }}>
                      Noch keine Schulung geplant
                    </div>
                    <div style={{ color: "var(--vfa-text-2)", fontSize: "var(--t-klein)", marginTop: 3, lineHeight: "var(--lh-weit)" }}>
                      Im Kurskalender findest du alle kommenden Termine samt Preisen.
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <AppButton href="/kurskalender">Schulungen entdecken →</AppButton>
                    </div>
                  </div>
                ) : null}

                <Link href="/meine-schulungen" style={linkStyle}>
                  Alle Schulungen →
                </Link>
              </div>
            </AppCard>
          </AnimatedSection>
        </div>

        {/* Ranking (anonym: Platz 1, eigene Platzierung, Median) */}
        <AnimatedSection delayMs={260}>
          <AppCard>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <div className="etikett">Ranking</div>
              <AppButton href="/leaderboard" variant="secondary">
                Zum Ranking
              </AppButton>
            </div>

            {!rankingFirst ? (
              <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-basis)", lineHeight: "var(--lh-weit)" }}>
                Noch keine Teilnehmer im Ranking. Sammle die ersten Credits!
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                <RankingRow
                  rankLabel="1"
                  rankColor="#C79A16"
                  name={rankingFirst.id === user.id ? "Du 🎉" : "🏆 Anonym"}
                  credits={rankingFirst.creditsTotal}
                  highlight={rankingFirst.id === user.id}
                />
                {rankingFirst.id !== user.id && (
                  myRank !== null ? (
                    <RankingRow
                      rankLabel={String(myRank)}
                      rankColor="#007873"
                      name={`Du · Platz ${myRank} von ${rankingParticipants.length}`}
                      credits={user.creditsTotal}
                      highlight
                    />
                  ) : (
                    <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-klein)", lineHeight: "var(--lh-weit)", padding: "10px 12px", background: "var(--vfa-karte-2)", borderRadius: 10, border: "1px solid var(--vfa-linie-2)" }}>
                      Du bist noch nicht im Ranking. Sammle deine ersten Credits.
                    </div>
                  )
                )}
                {/* „Credits“ ausgeschrieben statt „Cr.“ — ein Begriff je Sache (05.09.2026). */}
                <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-2)", padding: "8px 12px", background: "rgba(0,120,115,0.05)", borderRadius: 10, border: "1px solid rgba(0,120,115,0.15)" }}>
                  Median aller Teilnehmer: <strong style={{ color: "var(--vfa-gruen-text)" }}>{rankingMedian.toLocaleString("de-DE")} Credits</strong>
                  {user.creditsTotal > 0 && user.creditsTotal !== rankingMedian && (
                    <> · du liegst {Math.abs(user.creditsTotal - rankingMedian).toLocaleString("de-DE")} Credits {user.creditsTotal > rankingMedian ? "darüber" : "darunter"}</>
                  )}
                </div>
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
      </div>
    </main>
  );
}


function RankingRow({
  rankLabel,
  rankColor,
  name,
  credits,
  highlight = false,
}: {
  rankLabel: string;
  rankColor: string;
  name: string;
  credits: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        border: highlight ? "1px solid rgba(0,120,115,0.3)" : "1px solid var(--vfa-linie-2)",
        background: highlight ? "rgba(0,120,115,0.05)" : "var(--vfa-karte-2)",
        padding: "12px 14px",
        borderRadius: 10,
        display: "grid",
        gridTemplateColumns: "36px minmax(0, 1fr)",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: rankColor, color: "#FFFFFF", fontWeight: 800, fontSize: "var(--t-klein)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {rankLabel}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
        <div style={{ color: "var(--vfa-text)", fontSize: "var(--t-basis)", fontWeight: 700, lineHeight: "var(--lh-eng)", minWidth: 0 }}>
          {name}
        </div>
        <div style={{ color: "var(--vfa-gruen-text)", fontWeight: 800, fontSize: "var(--t-basis)", whiteSpace: "nowrap" }}>
          {credits.toLocaleString("de-DE")} Credits
        </div>
      </div>
    </div>
  );
}

function getDisplayName(user: { firstName: string | null; lastName: string | null; name: string | null; email: string }) {
  const combined = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  if (user.name?.trim()) return user.name.trim();
  return "";
}

// Helle Chips auf der Petrol-Karte "Nächste Schulung".
const heroChipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 999,
  background: "rgba(255, 255, 255, 0.14)",
  border: "1px solid rgba(255, 255, 255, 0.32)",
  color: "#FFFFFF",
  fontSize: "var(--t-klein)",
  fontWeight: 800,
  textDecoration: "none",
};

const socialLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: 999,
  color: "var(--vfa-text-3)",
  textDecoration: "none",
};

const linkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  color: "var(--vfa-gruen-text)",
  fontWeight: 700,
  fontSize: "var(--t-klein)",
  textDecoration: "none",
  letterSpacing: "0.01em",
};
