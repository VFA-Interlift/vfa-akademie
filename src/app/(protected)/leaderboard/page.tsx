import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
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
      <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 16 }}>
        <AnimatedSection delayMs={0}>
          <PageHeader title="Credit-Ranking" showTitle={true} />
        </AnimatedSection>

        <AnimatedSection delayMs={60}>
          <div style={{
            padding: 20,
            borderRadius: 14,
            border: "1px solid #E8E8E8",
            background: "#FFFFFF",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <LeaderboardSettingsCard />
          </div>
        </AnimatedSection>

        <AnimatedSection delayMs={130}>
          <div style={{
            padding: 20,
            borderRadius: 14,
            border: "1px solid #E8E8E8",
            background: "#FFFFFF",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <LeaderboardPageClient />
          </div>
        </AnimatedSection>
      </div>
    </main>
  );
}
