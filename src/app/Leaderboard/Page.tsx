import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import LeaderboardPageClient from "@/components/leaderboard/LeaderboardPageClient";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <PageHeader
          title="VFA-Credit-Ranking"
          description="Das freiwillige Ranking zeigt die Nutzer mit den meisten freigegebenen VFA-Credits."
        />

        <AppCard accent="green">
          <LeaderboardPageClient />
        </AppCard>
      </div>
    </main>
  );
}