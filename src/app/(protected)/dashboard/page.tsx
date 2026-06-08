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
    <main className="dashboardPage">
      <style>{`
        .dashboardPage {
          min-height: 100vh;
          background: #F7F7F4;
          padding: 40px 24px 28px;
          overflow-x: hidden;
        }

        .dashboardShell {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .dashboardHero {
          margin-bottom: 22px;
        }

        .dashboardTitle {
          margin: 0;
          font-size: 36px;
          font-weight: 400;
          letter-spacing: 0.02em;
          color: #007873;
          text-transform: uppercase;
        }

        .dashboardIntro {
          margin-top: 8px;
          margin-bottom: 0;
          max-width: 760px;
          color: #555555;
          line-height: 1.6;
          font-size: 15px;
        }

        .dashboardGrid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
          gap: 16px;
          align-items: start;
        }

        .dashboardColumn {
          display: grid;
          gap: 16px;
          min-width: 0;
        }

        .statusCardGrid {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 26px;
          align-items: center;
        }

        .eyebrow {
          color: #007873;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .statusTitleRow {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .statusTitle {
          margin: 0;
          color: #007873;
          font-size: 34px;
          line-height: 1.08;
          font-weight: 850;
        }

        .statusDescription {
          margin-top: 10px;
          margin-bottom: 0;
          color: #333333;
          line-height: 1.6;
          font-size: 15px;
          max-width: 640px;
        }

        .creditValue {
          margin-top: 18px;
          color: #007873;
          font-size: 36px;
          line-height: 1;
          font-weight: 900;
        }

        .creditHint {
          margin-top: 8px;
          margin-bottom: 0;
          color: #333333;
          line-height: 1.5;
          font-size: 14px;
        }

        .badgeDownloadHint {
          margin-top: 14px;
          padding: 12px 14px;
          border: 1px solid rgba(0, 120, 115, 0.22);
          background: rgba(0, 120, 115, 0.06);
          color: #333333;
          line-height: 1.5;
          font-size: 14px;
        }

        .sectionTitle {
          margin: 0;
          color: #007873;
          font-size: 22px;
          font-weight: 600;
        }

        .miniStats {
          margin-top: 16px;
          display: grid;
          gap: 12px;
        }

        .rankList {
          margin-top: 16px;
          display: grid;
          gap: 10px;
        }

        @media (max-width: 900px) {
          .dashboardGrid {
            grid-template-columns: 1fr;
          }

          .dashboardColumnSide {
            order: 0;
          }
        }

        @media (max-width: 680px) {
          .dashboardPage {
            padding: 26px 14px 24px;
          }

          .dashboardTitle {
            font-size: 30px;
            line-height: 1.05;
          }

          .dashboardIntro {
            font-size: 15px;
          }

          .statusCardGrid {
            grid-template-columns: 1fr;
            gap: 18px;
            justify-items: start;
          }

          .statusTitle {
            font-size: 30px;
          }

          .creditValue {
            font-size: 32px;
          }
        }

        @media (max-width: 420px) {
          .dashboardPage {
            padding-left: 10px;
            padding-right: 10px;
          }

          .dashboardTitle {
            font-size: 27px;
          }

          .sectionTitle {
            font-size: 20px;
          }

          .statusTitle {
            font-size: 28px;
          }

          .creditValue {
            font-size: 30px;
          }
        }
      `}</style>

      <div className="dashboardShell">
        <section className="dashboardHero">
          <h1 className="dashboardTitle">Dashboard</h1>

          <p className="dashboardIntro">
            Dein persönlicher Überblick über Schulungen, Credits, Zertifikate
            und deinen VFA-Akademie Status.
          </p>
        </section>

        <div className="dashboardColumn" style={{ marginBottom: 16 }}>
          <AppCard accent="green">
            <div className="statusCardGrid">
              <CreditCircle percent={progress.progressPercent} />

              <div style={{ minWidth: 0 }}>
                <div className="eyebrow">VFA-Akademie Status</div>

                <div className="statusTitleRow">
                  <h2 className="statusTitle">{progress.status.label}</h2>
                  <StatusBadge variant="yellow">
                    {progress.status.label}
                  </StatusBadge>
                </div>

                <p className="statusDescription">
                  {progress.status.description}
                </p>

                <div className="creditValue">
                  {credits.toLocaleString("de-DE")} Credits
                </div>

                {progress.nextStatus ? (
                  <p className="creditHint">
                    Noch{" "}
                    <strong>
                      {progress.remainingCredits.toLocaleString("de-DE")}
                    </strong>{" "}
                    Credits bis <strong>{progress.nextStatus.label}</strong>.
                  </p>
                ) : (
                  <p className="creditHint">
                    Höchste VFA-Weiterbildungsstufe erreicht.
                  </p>
                )}

                <div className="badgeDownloadHint">
                  Dein digitales Status-Badge wird perspektivisch als Download
                  für Signatur, Nachweis oder Profil verfügbar sein.
                </div>
              </div>
            </div>
          </AppCard>
        </div>

        <div className="dashboardGrid">
          <div className="dashboardColumn">
            <AppCard accent="green">
              <DashboardLeaderboardTop />
            </AppCard>
          </div>

          <div className="dashboardColumn dashboardColumnSide">
            <AppCard>
              <h2 className="sectionTitle">Dein Überblick</h2>

              <div className="miniStats">
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
              <h2 className="sectionTitle">Weiterbildungsstufen</h2>

              <div className="rankList">
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
        minWidth: 0,
      }}
    >
      <strong
        style={{
          color: active ? "#007873" : "#333333",
          minWidth: 0,
        }}
      >
        {label}
      </strong>

      <span
        style={{
          color: active ? "#007873" : "#555555",
          textAlign: "right",
          fontWeight: active ? 800 : 500,
          minWidth: 0,
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
        width: 128,
        height: 128,
        borderRadius: "50%",
        background,
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
        boxShadow: "0 14px 30px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          width: 92,
          height: 92,
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
            fontSize: 24,
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
        minWidth: 0,
      }}
    >
      <span
        style={{
          color: "#555555",
          fontWeight: 700,
          minWidth: 0,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: "#007873",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </strong>
    </div>
  );
}