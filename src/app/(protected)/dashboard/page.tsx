import Link from "next/link";
import type { CSSProperties } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import StatusBadge from "@/components/ui/StatusBadge";
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
  {
    key: "BRONZE",
    label: "Bronze",
    min: 0,
    max: 499,
    color: "#A86C3D",
    softBackground: "rgba(168,108,61,0.10)",
    softBorder: "1px solid rgba(168,108,61,0.28)",
  },
  {
    key: "SILBER",
    label: "Silber",
    min: 500,
    max: 1499,
    color: "#8E99A8",
    softBackground: "rgba(142,153,168,0.12)",
    softBorder: "1px solid rgba(142,153,168,0.32)",
  },
  {
    key: "GOLD",
    label: "Gold",
    min: 1500,
    max: 3499,
    color: "#C79A16",
    softBackground: "rgba(199,154,22,0.12)",
    softBorder: "1px solid rgba(199,154,22,0.32)",
  },
  {
    key: "EXPERTE",
    label: "VFA-Experte",
    min: 3500,
    max: null,
    color: "#1F1F1F",
    softBackground: "rgba(31,31,31,0.08)",
    softBorder: "1px solid rgba(31,31,31,0.20)",
  },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      company: true,
      role: true,
      creditsTotal: true,
      enrollments: {
        where: {
          status: {
            in: ["PENDING", "CONFIRMED", "ATTENDED"],
          },
        },
        select: {
          id: true,
        },
      },
      certificates: {
        where: {
          status: "ISSUED",
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const leaderboardTop = await prisma.user.findMany({
    where: {
      leaderboardOptIn: true,
      leaderboardName: {
        not: null,
      },
    },
    orderBy: [
      {
        creditsTotal: "desc",
      },
      {
        updatedAt: "asc",
      },
    ],
    take: 3,
    select: {
      id: true,
      leaderboardName: true,
      creditsTotal: true,
    },
  });

  const displayName = getDisplayName(user);
  const rank = getRankInfo(user.creditsTotal);
  const progress = getRankProgress(user.creditsTotal);
  const nextRank = getNextRankInfo(user.creditsTotal);

  return (
    <main className="page-main">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <AnimatedSection delayMs={0}>
          <section style={{ marginBottom: 24 }}>
            <div
              style={{
                width: 56,
                height: 5,
                background: "#FFC100",
                marginBottom: 14,
              }}
            />

            <h2
              style={{
                margin: "0 0 0",
                color: "#1F1F1F",
                fontSize: "clamp(22px, 5vw, 30px)",
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              Hallo {displayName || "und willkommen"}
            </h2>

            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                maxWidth: 760,
                color: "#333333",
                lineHeight: 1.65,
                fontSize: 16,
              }}
            >
              Hier siehst du deinen aktuellen Stand in der VFA-Akademie –
              inklusive Credits, persönlichem Status, Schulungen und Ranking.
            </p>
          </section>
        </AnimatedSection>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <AnimatedSection delayMs={90} style={{ height: "100%" }}>
            <AppCard accent="green">
              <div
                style={{
                  display: "grid",
                  gap: 18,
                  height: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#007873",
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Dein Status
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 12px",
                        border: rank.softBorder,
                        background: rank.softBackground,
                        color: rank.color,
                        fontWeight: 900,
                        fontSize: 16,
                        lineHeight: 1.2,
                        borderRadius: 999,
                      }}
                    >
                      {rank.label} Status
                    </div>
                  </div>

                  <details
                    style={{
                      position: "relative",
                    }}
                  >
                    <summary
                      style={{
                        listStyle: "none",
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        border: "1px solid #D6D6D6",
                        background: "#FFFFFF",
                        color: "#007873",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: 18,
                        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                      }}
                      title="Infos zu den Rängen"
                    >
                      i
                    </summary>

                    <div
                      style={{
                        position: "absolute",
                        top: 46,
                        right: 0,
                        width: 300,
                        maxWidth: "calc(100vw - 80px)",
                        background: "#FFFFFF",
                        border: "1px solid #E6E6E6",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
                        padding: 16,
                        zIndex: 20,
                      }}
                    >
                      <div
                        style={{
                          color: "#007873",
                          fontWeight: 800,
                          fontSize: 14,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 12,
                        }}
                      >
                        Weiterbildungsstufen
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        {RANKS.map((item) => (
                          <div
                            key={item.key}
                            style={{
                              border: item.softBorder,
                              background: item.softBackground,
                              padding: "10px 12px",
                            }}
                          >
                            <div
                              style={{
                                color: item.color,
                                fontWeight: 900,
                                fontSize: 15,
                              }}
                            >
                              {item.label}
                            </div>

                            <div
                              style={{
                                marginTop: 4,
                                color: "#333333",
                                fontSize: 13,
                                lineHeight: 1.5,
                              }}
                            >
                              {item.max === null
                                ? `ab ${item.min.toLocaleString(
                                    "de-DE"
                                  )} Credits`
                                : `${item.min.toLocaleString(
                                    "de-DE"
                                  )} bis ${item.max.toLocaleString(
                                    "de-DE"
                                  )} Credits`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>

                <AnimatedProgressCircle
                  percent={progress.percent}
                  credits={user.creditsTotal}
                  color={rank.color}
                />

                <div
                  style={{
                    marginTop: -4,
                    color: "#666666",
                    fontSize: 13,
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}
                >
                  {nextRank
                    ? `Noch ${progress.remainingToNext.toLocaleString(
                        "de-DE"
                      )} Credits bis ${nextRank.label}.`
                    : "Du hast die höchste Stufe bereits erreicht."}
                </div>
              </div>
            </AppCard>
          </AnimatedSection>

          <AnimatedSection delayMs={160} style={{ height: "100%" }}>
            <AppCard accent="yellow">
              <div
                style={{
                  display: "grid",
                  gap: 16,
                  height: "100%",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#007873",
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Dein Überblick
                  </div>

                  <p
                    style={{
                      marginTop: 12,
                      marginBottom: 0,
                      color: "#333333",
                      lineHeight: 1.65,
                    }}
                  >
                    Deine wichtigsten Kennzahlen und Stammdaten auf einen Blick.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 10,
                  }}
                >
                  <MiniStat
                    label="Schulungen"
                    value={String(user.enrollments.length)}
                  />

                  <MiniStat
                    label="Zertifikate"
                    value={String(user.certificates.length)}
                  />

                  <MiniStat label="Rolle" value={user.role} />
                </div>

                {user.company ? (
                  <div
                    style={{
                      paddingTop: 4,
                    }}
                  >
                    <StatusBadge>Firma: {user.company}</StatusBadge>
                  </div>
                ) : null}
              </div>
            </AppCard>
          </AnimatedSection>
        </div>

        <AnimatedSection delayMs={230} style={{ marginTop: 18 }}>
          <AppCard>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#007873",
                    fontSize: "clamp(18px, 4vw, 24px)",
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  Top 3 im Credit-Ranking
                </h2>

                <p
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: "#333333",
                    lineHeight: 1.6,
                    maxWidth: 760,
                  }}
                >
                  Die aktuell führenden Plätze im freiwilligen
                  VFA-Credit-Ranking.
                </p>
              </div>

              <Link href="/leaderboard" style={secondaryLinkStyle}>
                Zum Ranking
              </Link>
            </div>

            {leaderboardTop.length === 0 ? (
              <div style={{ color: "#333333", lineHeight: 1.6 }}>
                Aktuell sind noch keine Teilnehmer im Ranking sichtbar.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {leaderboardTop.map((entry, index) => (
                  <div
                    key={entry.id}
                    style={{
                      border: "1px solid #E6E6E6",
                      background: "#FFFFFF",
                      padding: 14,
                      display: "grid",
                      gridTemplateColumns: "42px minmax(0, 1fr)",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background:
                          index === 0
                            ? "#C79A16"
                            : index === 1
                              ? "#8E99A8"
                              : "#A86C3D",
                        color: "#FFFFFF",
                        fontWeight: 900,
                        fontSize: 16,
                      }}
                    >
                      {index + 1}
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          color: "#007873",
                          fontSize: 18,
                          fontWeight: 800,
                          lineHeight: 1.3,
                          minWidth: 0,
                        }}
                      >
                        {entry.leaderboardName || "Ohne Namen"}
                      </div>

                      <div
                        style={{
                          color: "#333333",
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.creditsTotal.toLocaleString("de-DE")} Credits
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AppCard>
        </AnimatedSection>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #E6E6E6",
        background: "#FFFFFF",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          color: "#007873",
          fontSize: 12,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#1F1F1F",
          fontWeight: 800,
          fontSize: 18,
          lineHeight: 1.3,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function getDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
}) {
  const combined = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (combined) return combined;
  if (user.name?.trim()) return user.name.trim();
  return user.email;
}

function getRankInfo(credits: number) {
  if (credits >= 3500) {
    return RANKS[3];
  }

  if (credits >= 1500) {
    return RANKS[2];
  }

  if (credits >= 500) {
    return RANKS[1];
  }

  return RANKS[0];
}

function getNextRankInfo(credits: number) {
  if (credits < 500) return RANKS[1];
  if (credits < 1500) return RANKS[2];
  if (credits < 3500) return RANKS[3];
  return null;
}

function getRankProgress(credits: number) {
  if (credits < 500) {
    const currentMin = 0;
    const nextMin = 500;
    const range = nextMin - currentMin;
    const valueInRange = credits - currentMin;

    return {
      percent: clampPercent(Math.round((valueInRange / range) * 100)),
      remainingToNext: Math.max(0, nextMin - credits),
    };
  }

  if (credits < 1500) {
    const currentMin = 500;
    const nextMin = 1500;
    const range = nextMin - currentMin;
    const valueInRange = credits - currentMin;

    return {
      percent: clampPercent(Math.round((valueInRange / range) * 100)),
      remainingToNext: Math.max(0, nextMin - credits),
    };
  }

  if (credits < 3500) {
    const currentMin = 1500;
    const nextMin = 3500;
    const range = nextMin - currentMin;
    const valueInRange = credits - currentMin;

    return {
      percent: clampPercent(Math.round((valueInRange / range) * 100)),
      remainingToNext: Math.max(0, nextMin - credits),
    };
  }

  return {
    percent: 100,
    remainingToNext: 0,
  };
}

function clampPercent(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 42,
  padding: "10px 18px",
  borderRadius: 999,
  background: "#FFFFFF",
  color: "#007873",
  fontWeight: 800,
  fontSize: 14,
  textDecoration: "none",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  border: "1px solid #007873",
};