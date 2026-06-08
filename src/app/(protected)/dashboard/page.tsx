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

        .statusHeader {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          margin-bottom: 26px;
        }

        .statusEyebrow {
          color: #007873;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .statusTitle {
          margin: 0;
          color: #007873;
          font-size: 38px;
          line-height: 1.05;
          font-weight: 850;
        }

        .creditValue {
          margin-top: 8px;
          color: #1F1F1F;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 850;
        }

        .creditHintBox {
          min-width: 230px;
          padding: 16px;
          background: rgba(0, 120, 115, 0.07);
          border: 1px solid rgba(0, 120, 115, 0.20);
        }

        .creditHintLabel {
          color: #555555;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .creditHintValue {
          color: #007873;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.2;
        }

        .creditHintSub {
          margin-top: 4px;
          color: #333333;
          font-size: 14px;
          line-height: 1.45;
        }

        .statusPath {
          display: grid;
          gap: 10px;
        }

        .statusPathTrack {
          position: relative;
          height: 10px;
          border-radius: 999px;
          background: #E4E4E0;
          overflow: hidden;
        }

        .statusPathFill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #007873 0%, #FFC100 100%);
        }

        .statusSteps {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .statusStep {
          min-width: 0;
          display: grid;
          gap: 5px;
          justify-items: center;
          text-align: center;
        }

        .statusDot {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 3px solid #D9D9D3;
          background: #FFFFFF;
          margin-top: -24px;
          position: relative;
          z-index: 2;
        }

        .statusDotActive,
        .statusDotReached {
          border-color: #007873;
          background: #007873;
        }

        .statusDotActive {
          box-shadow: 0 0 0 5px rgba(0, 120, 115, 0.14);
        }

        .statusStepLabel {
          color: #333333;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.2;
        }

        .statusStepLabelActive {
          color: #007873;
        }

        .statusStepCredits {
          color: #666666;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.2;
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

          .statusHeader {
            display: grid;
          }

          .creditHintBox {
            min-width: 0;
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
            font-size: 32px;
          }

          .creditValue {
            font-size: 22px;
          }

          .statusSteps {
            gap: 4px;
          }

          .statusStepLabel {
            font-size: 11px;
          }

          .statusStepCredits {
            font-size: 11px;
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
            font-size: 29px;
          }

          .creditHintValue {
            font-size: 20px;
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
            <div className="statusHeader">
              <div>
                <div className="statusEyebrow">VFA-Akademie Status</div>

                <h2 className="statusTitle">
                  {progress.status.label} Status
                </h2>

                <div className="creditValue">
                  {credits.toLocaleString("de-DE")} Credits gesammelt
                </div>

                <div style={{ marginTop: 12 }}>
                  <StatusBadge variant="yellow">
                    {progress.status.label}
                  </StatusBadge>
                </div>
              </div>

              <div className="creditHintBox">
                <div className="creditHintLabel">Nächste Stufe</div>

                {progress.nextStatus ? (
                  <>
                    <div className="creditHintValue">
                      {progress.nextStatus.label}
                    </div>

                    <div className="creditHintSub">
                      Noch{" "}
                      <strong>
                        {progress.remainingCredits.toLocaleString("de-DE")}
                      </strong>{" "}
                      Credits erforderlich.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="creditHintValue">Erreicht</div>

                    <div className="creditHintSub">
                      Höchste VFA-Weiterbildungsstufe erreicht.
                    </div>
                  </>
                )}
              </div>
            </div>

            <StatusPath
              currentKey={progress.status.key}
              credits={credits}
              progressPercent={progress.progressPercent}
            />
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

function StatusPath({
  currentKey,
  credits,
  progressPercent,
}: {
  currentKey: string;
  credits: number;
  progressPercent: number;
}) {
  const currentIndex = CREDIT_STATUSES.findIndex(
    (status) => status.key === currentKey
  );

  const fillPercent =
    currentKey === "vfa-experte"
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            Math.round((currentIndex / (CREDIT_STATUSES.length - 1)) * 100)
          )
        );

  return (
    <div className="statusPath" aria-label="VFA-Akademie Weiterbildungsstufen">
      <div className="statusPathTrack">
        <div
          className="statusPathFill"
          style={{
            width: `${Math.max(fillPercent, progressPercent > 0 ? 8 : 0)}%`,
          }}
        />
      </div>

      <div className="statusSteps">
        {CREDIT_STATUSES.map((status, index) => {
          const isActive = status.key === currentKey;
          const isReached =
            credits >= status.minCredits || index <= currentIndex;

          return (
            <div key={status.key} className="statusStep">
              <div
                className={[
                  "statusDot",
                  isActive ? "statusDotActive" : "",
                  isReached ? "statusDotReached" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />

              <div
                className={[
                  "statusStepLabel",
                  isActive ? "statusStepLabelActive" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {status.label}
              </div>

              <div className="statusStepCredits">
                {status.maxCredits === null
                  ? `ab ${status.minCredits.toLocaleString("de-DE")}`
                  : status.minCredits.toLocaleString("de-DE")}
              </div>
            </div>
          );
        })}
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