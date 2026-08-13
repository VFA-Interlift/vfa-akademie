import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import LeaderboardPageClient from "@/components/leaderboard/LeaderboardPageClient";

export const dynamic = "force-dynamic";

// Das Ranking ist anonym (nur Platz 1 ohne Namen, eigene Platzierung, Median) –
// die frühere Namens-/Opt-in-Karte wird daher nicht mehr angezeigt.
export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  return (
    <main className="page-main">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Ohne AnimatedSection: Das Band muss wie auf allen Seiten bündig an
            der Oberkante sitzen — die Einblend-Hülle verschob es (13.08.). */}
        <PageHeader title="Credit-Ranking" showTitle={true} />

        <AnimatedSection delayMs={60}>
          <div style={{
            padding: 20,
            borderRadius: 14,
            border: "1px solid #E8E8E8",
            background: "var(--vfa-karte)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <LeaderboardPageClient />
          </div>
        </AnimatedSection>
      </div>
    </main>
  );
}
