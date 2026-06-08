import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import StatusBadge from "@/components/ui/StatusBadge";
import DashboardLeaderboardTop from "@/components/leaderboard/DashboardLeaderboardTop";
import {
  CREDIT_STATUSES,
  getCreditStatusProgress,
} from "@/lib/credits/status";

export const dynamic = "force-dynamic";

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
  const progress = getCreditStatusProgress(credits);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px 28px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
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

          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              maxWidth: 760,
              color: "#555555",
              lineHeight: 1.6,
              fontSize: 15,
            }}
          >
            Dein persönlicher Überblick über Schulungen, Credits, Zertifikate
            und deinen VFA-Akademie Status.
          </p>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.65fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <AppCard accent="green">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(180px, 260px) 1fr",
                  gap: 22,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    justifyItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "min(220px, 100%)",
                      aspectRatio: "1 / 1",
                      filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.16))",
                    }}
                  >
                    <Image
                      src={progress.status.badgeSrc}
                      alt={`${progress.status.label} Badge`}
                      fill
                      sizes="220px"
                      priority
                      style={{
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  <StatusBadge variant="yellow">
                    {progress.status.label}
                  </StatusBadge>
                </div>

                <div>
                  <div
                    style={{
                      color: "#007873",
                      fontSize: 13,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    VFA-Akademie Status
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      color: "#007873",
                      fontSize: 34,
                      lineHeight: 1.08,
                      fontWeight: 850,
                    }}
                  >
                    {progress.status.label}
                  </h2>

                  <p
                    style={{
                      marginTop: 10,
                      marginBottom: 0,
                      color: "#333333",
                      lineHeight: 1.6,
                      fontSize: 15,
                    }}
                  >
                    {progress.status.description}
                  </p>

                  <div
                    style={{
                      marginTop: 18,
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                    <CreditCircle percent={progress.progressPercent} />

                    <div>
                      <div
                        style={{
                          color: "#007873",
                          fontSize: 30,
                          lineHeight: 1,
                          fontWeight: 900,
                        }}
                      >
                        {credits.toLocaleString("de-DE")} Credits
                      </div>

                      {progress.nextStatus ? (
                        <p
                          style={{
                            marginTop: 8,
                            marginBottom: 0,
                            color: "#333333",
                            lineHeight: 1.5,
                            fontSize: 14,
                          }}
                        >
                          Noch{" "}
                          <strong>
                            {progress.remainingCredits.toLocaleString("de-DE")}
                          </strong>{" "}
                          Credits bis{" "}
                          <strong>{progress.nextStatus.label}</strong>.
                        </p>
                      ) : (
                        <p
                          style={{
                            marginTop: 8,
                            marginBottom: 0,
                            color: "#333333",
                            lineHeight: 1.5,
                            fontSize: 14,
                          }}
                        >
                          Höchste VFA-Weiterbildungsstufe erreicht.
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      height: 12,
                      borderRadius: 999,
                      background: "#E6E6E6",
                      overflow: "hidden",
                    }}
                    aria-label={`Fortschritt ${progress.progressPercent} Prozent`}
                  >
                    <div
                      style={{
                        width: `${progress.progressPercent}%`,
                        height: "100%",
                        borderRadius: 999,
                        background:
                          "linear-gradient(90deg, #007873 0%, #FFC100 100%)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </AppCard>

            <AppCard accent="yellow">
              <h2
                style={{
                  margin: 0,
                  color: "#007873",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                Was bringt mir mein Status?
              </h2>

              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "#333333",
                  lineHeight: 1.6,
                  fontSize: 15,
                }}
              >
                {progress.status.benefit}
              </p>

              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "#555555",
                  lineHeight: 1.6,
                  fontSize: 14,
                }}
              >
                Perspektivisch kann dein Status als digitales Badge für
                Signatur, Nachweis oder Profil genutzt werden. Feste Rabatte
                oder Ansprüche sind damit aktuell nicht verbunden.
              </p>
            </AppCard>

            <AppCard accent="green">
              <DashboardLeaderboardTop />
            </AppCard>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <AppCard>
              <h2
                style={{
                  margin: 0,
                  color: "#007873",
                  fontSize: 22,
                  fontWeight: 600,
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

            <AppCard>
              <h2
                style={{
                  margin: 0,
                  color: "#007873",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                Weiterbildungsstufen
              </h2>

              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {CREDIT_STATUSES.map((status) => (
                  <Rank
                    key={status.key}
                    label={status.label}
                    range={
                      status.maxCredits === null
                        ? `ab ${status.minCredits.toLocaleString(
                            "de-DE"
                          )} Credits`
                        : `${status.minCredits.toLocaleString(
                            "de-DE"
                          )} bis ${status.maxCredits.toLocaleString(
                            "de-DE"
                          )} Credits`
                    }
                    active={status.key === progress.status.key}
                  />
                ))}
              </div>
            </AppCard>
          </div>
        </div>
      </div>
    </main>
  );
}

function Rank({
  label,
  range,
  active,
}: {
  label: string;
  range: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid #E6E6E6",
      }}
    >
      <strong style={{ color: active ? "#007873" : "#333333" }}>
        {label}
      </strong>

      <span
        style={{
          color: active ? "#007873" : "#555555",
          textAlign: "right",
          fontWeight: active ? 800 : 500,
        }}
      >
        {range}
      </span>
    </div>
  );
}

function CreditCircle({ percent }: { percent: number }) {
  const safePercent = Math.max(0, Math.min(100, percent));
  const background = `conic-gradient(#007873 ${safePercent}%, #E6E6E6 ${safePercent}% 100%)`;

  return (
    <div
      style={{
        width: 92,
        height: 92,
        borderRadius: "50%",
        background,
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
        boxShadow: "0 10px 26px rgba(0,0,0,0.10)",
      }}
    >
      <div
        style={{
          width: 66,
          height: 66,
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