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

        .academyStatusCard {
          position: relative;
          display: grid;
          justify-items: center;
          text-align: center;
          gap: 14px;
          padding: 8px 0 4px;
        }

        .academyStatusHeader {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .academyEyebrow {
          color: #007873;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .infoDetails {
          position: relative;
          display: inline-block;
        }

        .infoDetails summary {
          list-style: none;
        }

        .infoDetails summary::-webkit-details-marker {
          display: none;
        }

        .infoButton {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          border: 1px solid rgba(0, 120, 115, 0.28);
          background: rgba(0, 120, 115, 0.08);
          color: #007873;
          display: inline-grid;
          place-items: center;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          user-select: none;
        }

        .infoPanel {
          position: absolute;
          z-index: 20;
          top: 34px;
          left: 50%;
          width: 310px;
          transform: translateX(-50%);
          text-align: left;
          background: #FFFFFF;
          border: 1px solid rgba(0, 120, 115, 0.22);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.14);
          padding: 14px;
        }

        .infoPanelTitle {
          margin: 0 0 10px;
          color: #007873;
          font-size: 15px;
          font-weight: 900;
        }

        .infoList {
          display: grid;
          gap: 8px;
        }

        .infoRow {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding-bottom: 8px;
          border-bottom: 1px solid #EFEFEF;
          color: #333333;
          font-size: 13px;
          line-height: 1.35;
        }

        .infoRow:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .infoRow strong {
          color: #007873;
        }

        .statusTitle {
          margin: 0;
          color: #007873;
          font-size: 34px;
          line-height: 1.08;
          font-weight: 850;
        }

        .creditValue {
          margin-top: 4px;
          color: #007873;
          font-size: 38px;
          line-height: 1;
          font-weight: 900;
        }

        .creditHint {
          margin: 0;
          color: #333333;
          line-height: 1.5;
          font-size: 15px;
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

        @media (max-width: 900px) {
          .dashboardGrid {
            grid-template-columns: 1fr;
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

          .statusTitle {
            font-size: 30px;
          }

          .creditValue {
            font-size: 34px;
          }

          .infoPanel {
            width: min(310px, calc(100vw - 44px));
            left: auto;
            right: -8px;
            transform: none;
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
            font-size: 31px;
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
            <div className="academyStatusCard">
              <div className="academyStatusHeader">
                <div className="academyEyebrow">VFA-Akademie Status</div>

                <details className="infoDetails">
                  <summary>
                    <span
                      className="infoButton"
                      aria-label="Informationen zu den Weiterbildungsstufen"
                      title="Weiterbildungsstufen anzeigen"
                    >
                      i
                    </span>
                  </summary>

                  <div className="infoPanel">
                    <p className="infoPanelTitle">Weiterbildungsstufen</p>

                    <div className="infoList">
                      {CREDIT_STATUSES.map((status) => (
                        <div key={status.key} className="infoRow">
                          <strong>{status.label}</strong>
                          <span>
                            {status.maxCredits === null
                              ? `ab ${status.minCredits.toLocaleString(
                                  "de-DE"
                                )} Credits`
                              : `${status.minCredits.toLocaleString(
                                  "de-DE"
                                )} bis ${status.maxCredits.toLocaleString(
                                  "de-DE"
                                )} Credits`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              </div>

              <CreditCircle percent={progress.progressPercent} />

              <div>
                <h2 className="statusTitle">{progress.status.label} Status</h2>

                <div style={{ marginTop: 10 }}>
                  <StatusBadge variant="yellow">
                    {progress.status.label}
                  </StatusBadge>
                </div>
              </div>

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
            </div>
          </AppCard>
        </div>

        <div className="dashboardGrid">
          <div className="dashboardColumn">
            <AppCard accent="green">
              <DashboardLeaderboardTop />
            </AppCard>
          </div>

          <div className="dashboardColumn">
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
          </div>
        </div>
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
        width: 178,
        height: 178,
        borderRadius: "50%",
        background,
        display: "grid",
        placeItems: "center",
        boxShadow: "0 18px 34px rgba(0,0,0,0.14)",
      }}
    >
      <div
        style={{
          width: 126,
          height: 126,
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
            fontSize: 34,
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