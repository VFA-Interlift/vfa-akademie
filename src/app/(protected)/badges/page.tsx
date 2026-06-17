import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import BadgesClient from "./BadgesClient";

export const dynamic = "force-dynamic";

export default async function BadgesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { creditsTotal: true },
  });

  const credits = user?.creditsTotal ?? 0;

  return (
    <main className="page-main">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <AnimatedSection delayMs={0}>
          <PageHeader
            title="Badges"
            description="Lade deine persönlichen Weiterbildungs-Badges herunter und teile deinen Fortschritt."
            showTitle={true}
          />
        </AnimatedSection>

        <AnimatedSection delayMs={80}>
          <BadgesClient credits={credits} />
        </AnimatedSection>
      </div>
    </main>
  );
}
