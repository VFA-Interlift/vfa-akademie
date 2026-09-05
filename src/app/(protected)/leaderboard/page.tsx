import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import AppCard from "@/components/ui/AppCard";
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
            der Oberkante sitzen — die Einblend-Hülle verschob es (13.08.).
            Ein Name überall: „Ranking" wie in Menü und Leiste (05.09.2026). */}
        <PageHeader title="Ranking" />

        <AnimatedSection delayMs={60}>
          <AppCard>
            <LeaderboardPageClient />
          </AppCard>
        </AnimatedSection>
      </div>
    </main>
  );
}
