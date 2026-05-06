import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import StatusBadge from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

type CreditLevel = {
  currentLevel: string;
  nextLevel: string | null;
  currentMin: number;
  nextTarget: number | null;
  progressPercent: number;
  remaining: number;
};

function getCreditLevel(credits: number): CreditLevel {
  if (credits >= 10000) {
    return {
      currentLevel: "Platin",
      nextLevel: null,
      currentMin: 10000,
      nextTarget: null,
      progressPercent: 100,
      remaining: 0,
    };
  }

  if (credits >= 5000) {
    return {
      currentLevel: "Gold",
      nextLevel: "Platin",
      currentMin: 5000,
      nextTarget: 10000,
      progressPercent: Math.round(((credits - 5000) / 5000) * 100),
      remaining: 10000 - credits,
    };
  }

  if (credits >= 1000) {
    return {
      currentLevel: "Silber",
      nextLevel: "Gold",
      currentMin: 1000,
      nextTarget: 5000,
      progressPercent: Math.round(((credits - 1000) / 4000) * 100),
      remaining: 5000 - credits,
    };
  }

  return {
    currentLevel: "Bronze",
    nextLevel: "Silber",
    currentMin: 0,
    nextTarget: 1000,
    progressPercent: Math.round((credits / 1000) * 100),
    remaining: 1000 - credits,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const email = session.user.email.trim().toLowerCase();

  const me = await prisma.user.findUnique({
    where: { email },
    select: {
      role: true,
      name: true,
      firstName: true,
      lastName: true,
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

  if (!me) redirect("/login");

  const isAdmin = me.role === "ADMIN";
  const credits = me.creditsTotal ?? 0;
  const level = getCreditLevel(credits);

  const displayName =
    [me.firstName, me.lastName].filter(Boolean).join(" ").trim() ||
    me.name ||
    "Willkommen";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <section style={{ marginBottom: 28 }}>
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

          <p
            style={{
              color: "#333333",
              marginTop: 14,
              marginBottom: 0,
              lineHeight: 1.65,
              maxWidth: 760,
              fontSize: 16,
            }}
          >
            Willkommen, {displayName}. Hier siehst du deinen aktuellen
            Credit-Status und eine kurze Übersicht über deine Akademie-Daten.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <AppCard accent="green">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 18,
                alignItems: "center",
              }}
            >
              <CreditCircle percent={level.progressPercent} />

              <div>
                <StatusBadge variant="yellow">{level.currentLevel}</StatusBadge>

                <h2
                  style={{
                    marginTop: 12,
                    marginBottom: 8,
                    color: "#007873",
                    fontSize: 32,
                    lineHeight: 1,
                    fontWeight: 800,
                  }}
                >
                  {credits.toLocaleString("de-DE")} Credits
                </h2>

                {level.nextLevel && level.nextTarget ? (
                  <p
                    style={{
                      margin: 0,
                      color: "#333333",
                      lineHeight: 1.6,
                      fontSize: 15,
                    }}
                  >
                    {credits.toLocaleString("de-DE")} von{" "}
                    {level.nextTarget.toLocaleString("de-DE")} Credits bis{" "}
                    <strong>{level.nextLevel}</strong>. Es fehlen noch{" "}
                    <strong>{level.remaining.toLocaleString("de-DE")}</strong>{" "}
                    Credits.
                  </p>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      color: "#333333",
                      lineHeight: 1.6,
                      fontSize: 15,
                    }}
                  >
                    Höchste Stufe erreicht. Stark.
                  </p>
                )}
              </div>
            </div>
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
                label="Aktive Schulungen"
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

        <AppCard accent="yellow">
          <h2
            style={{
              margin: 0,
              color: "#007873",
              fontSize: 22,
              fontWeight: 500,
            }}
          >
            Navigation
          </h2>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              color: "#333333",
              lineHeight: 1.6,
            }}
          >
            Alle Bereiche findest du oben rechts im Menü. Dort kannst du deine
            Schulungen, Zertifikate, Profildaten und — falls freigeschaltet —
            den Adminbereich öffnen.
          </p>
        </AppCard>
      </div>
    </main>
  );
}

function CreditCircle({ percent }: { percent: number }) {
  const safePercent = Math.max(0, Math.min(100, percent));
  const background = `conic-gradient(#007873 ${safePercent}%, #E6E6E6 ${safePercent}% 100%)`;

  return (
    <div
      style={{
        width: 118,
        height: 118,
        borderRadius: "50%",
        background,
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
      }}
    >
      <div
        style={{
          width: 86,
          height: 86,
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
            fontSize: 22,
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