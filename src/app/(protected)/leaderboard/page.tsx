import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import LeaderboardPageClient from "@/components/leaderboard/LeaderboardPageClient";
import LeaderboardSettingsCard from "@/components/leaderboard/LeaderboardSettingsCard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  return (
    <main className="page-main">
      <div style={{ maxWidth: 860, margin: "0 auto", display: "grid", gap: 16 }}>
        <AnimatedSection delayMs={0}>
          <PageHeader
            title="Credit-Ranking"
            description="Das freiwillige VFA-Credit-Ranking. Nur Anzeigename und Credits werden sichtbar."
            showTitle={true}
          />
        </AnimatedSection>

        <AnimatedSection delayMs={80}>
          <AppCard accent="green">
            <LeaderboardSettingsCard />
          </AppCard>
        </AnimatedSection>

        <AnimatedSection delayMs={160}>
          <AppCard>
            <LeaderboardPageClient />
          </AppCard>
        </AnimatedSection>
      </div>
    </main>
  );
}
