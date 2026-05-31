import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import StatusBadge from "@/components/ui/StatusBadge";
import DashboardLeaderboardTop from "@/components/leaderboard/DashboardLeaderboardTop";

export const dynamic = "force-dynamic";

type CreditLevel = {
  currentLevel: string;
  nextLevel: string | null;
  progressPercent: number;
  remaining: number;
  description: string;
};

function getCreditLevel(credits: number): CreditLevel {
  if (credits >= 3500) {
    return {
      currentLevel: "VFA-Experte",
      nextLevel: null,
      progressPercent: 100,
      remaining: 0,
      description:
        "Du hast ein sehr hohes Weiterbildungsniveau innerhalb der VFA-Akademie erreicht.",
    };
  }

  if (credits >= 1500) {
    return {
      currentLevel: "Gold",
      nextLevel: "VFA-Experte",
      progressPercent: Math.round(((credits - 1500) / 2000) * 100),
      remaining: 3500 - credits,
      description:
        "Du verfügst über umfangreiche Weiterbildungserfahrung und kannst deinen Qualifikationsstand nachvollziehbar dokumentieren.",
    };
  }

  if (credits >= 500) {
    return {
      currentLevel: "Silber",
      nextLevel: "Gold",
      progressPercent: Math.round(((credits - 500) / 1000) * 100),
      remaining: 1500 - credits,
      description:
        "Du bildest dich regelmäßig weiter und baust dein Fachwissen in mehreren Themenbereichen aus.",
    };
  }

  return {
    currentLevel: "Bronze",
    nextLevel: "Silber",
    progressPercent: Math.round((credits / 500) * 100),
    remaining: 500 - credits,
    description:
      "Du hast erste Schulungen absolviert und sammelst Grundlagenwissen in der Aufzugsbranche.",
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.trim().toLowerCase();

  const me = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      role: true,
      creditsTotal: true,
      enrollments: {
        where: {
          status: {
            in: ["PENDING", "CONFIRMED", "ATTENDED", "COMPLETED"],
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

  if (!me) {
    redirect("/login");
  }

  const isAdmin = me.role === "ADMIN";
  const credits = me.creditsTotal ?? 0;
  const level = getCreditLevel(credits);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px 28px",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <section style={{ marginBottom: 22 }}>
          <div
            style={{
              width: 58,
              height: 5,
              background: "#FFC100",
              marginBottom: 12,
            }}
          />

          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 400,
              letterSpacing: "0.02em",
              color: "#007873",
              textTransform: "uppercase",
            }}
          >
            Dashboard
          </h1>
        </section>

        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          <AppCard accent="green">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <StatusBadge variant="yellow">{level.currentLevel}</StatusBadge>
              <CreditInfo description={level.description} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 14,
                alignItems: "center",
              }}
            >
              <CreditCircle percent={level.progressPercent} />

              <div>
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: 6,
                    color: "#007873",
                    fontSize: 28,
                    lineHeight: 1,
                    fontWeight: 800,
                  }}
                >
                  {credits.toLocaleString("de-DE")} Credits
                </h2>

                {level.nextLevel ? (
                  <p
                    style={{
                      margin: 0,
                      color: "#333333",
                      lineHeight: 1.5,
                      fontSize: 14,
                    }}
                  >
                    Noch{" "}
                    <strong>{level.remaining.toLocaleString("de-DE")}</strong>{" "}
                    Credits bis <strong>{level.nextLevel}</strong>.
                  </p>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      color: "#333333",
                      lineHeight: 1.5,
                      fontSize: 14,
                    }}
                  >
                    Höchste Credit-Stufe erreicht.
                  </p>
                )}
              </div>
            </div>
          </AppCard>

          <AppCard accent="green">
            <DashboardLeaderboardTop />
          </AppCard>

          <AppCard>
            <h2
              style={{
                margin: 0,
                color: "#007873",
                fontSize: 22,
                fontWeight: 500,
              }}
            >
              Dein Überblick
            </h2>

            <div
              style={{
                marginTop: 16,
                display: "grid",
                gap: 12,
              }}
            >
              <MiniStat
                label="Bevorstehende Schulungen"
                value={String(me.enrollments.length)}
              />

              <MiniStat
                label="Ausgestellte Zertifikate"
                value={String(me.certificates.length)}
              />

              <MiniStat label="Rolle" value={isAdmin ? "Admin" : "User"} />
            </div>
          </AppCard>
        </div>
      </div>
    </main>
  );
}

function CreditInfo({ description }: { description: string }) {
  return (
    <details style={{ position: "relative" }}>
      <summary
        style={{
          listStyle: "none",
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1px solid #C7C7C7",
          background: "#FFFFFF",
          color: "#007873",
          display: "grid",
          placeItems: "center",
          fontWeight: 900,
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
        }}
        title="Credit-Ränge anzeigen"
      >
        i
      </summary>

      <div
        style={{
          position: "absolute",
          right: 0,
          top: 40,
          zIndex: 20,
          width: "min(340px, calc(100vw - 48px))",
          padding: 16,
          background: "#FFFFFF",
          border: "1px solid #FFC100",
          boxShadow: "0 14px 34px rgba(0,0,0,0.12)",
          color: "#1F1F1F",
        }}
      >
        <div
          style={{
            color: "#007873",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          Credit-Status
        </div>

        <p
          style={{
            marginTop: 0,
            marginBottom: 14,
            color: "#333333",
            lineHeight: 1.55,
            fontSize: 14,
          }}
        >
          {description}
        </p>

        <div style={{ display: "grid", gap: 10 }}>
          <Rank label="Bronze" range="0 bis 499 Credits" />
          <Rank label="Silber" range="500 bis 1.499 Credits" />
          <Rank label="Gold" range="1.500 bis 3.499 Credits" />
          <Rank label="VFA-Experte" range="ab 3.500 Credits" />
        </div>
      </div>
    </details>
  );
}

function Rank({ label, range }: { label: string; range: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        paddingBottom: 8,
        borderBottom: "1px solid #E6E6E6",
      }}
    >
      <strong style={{ color: "#007873" }}>{label}</strong>
      <span style={{ color: "#333333", textAlign: "right" }}>{range}</span>
    </div>
  );
}

function CreditCircle({ percent }: { percent: number }) {
  const safePercent = Math.max(0, Math.min(100, percent));
  const background = `conic-gradient(#007873 ${safePercent}%, #E6E6E6 ${safePercent}% 100%)`;

  return (
    <div
      style={{
        width: 88,
        height: 88,
        borderRadius: "50%",
        background,
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#FFFFFF",
          display: "grid",
          placeItems: "center",
          border: "1px solid #EFEFEF",
        }}
      >
        <div
          style={{
            color: "#007873",
            fontWeight: 900,
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          {safePercent}%
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        paddingBottom: 10,
        borderBottom: "1px solid #E6E6E6",
      }}
    >
      <span
        style={{
          color: "#555555",
          fontWeight: 700,
        }}
      >
        {label}
      </span>

      <strong style={{ color: "#007873" }}>{value}</strong>
    </div>
  );
}