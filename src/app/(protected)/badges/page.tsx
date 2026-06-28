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
    select: {
      creditsTotal: true,
      certificates: {
        where: { status: "ISSUED" },
        select: { code: true },
      },
    },
  });

  const credits = user?.creditsTotal ?? 0;
  const certs = user?.certificates ?? [];
  const completedCount = certs.length;

  const VDI_KEYS = ["A1", "A2", "B", "C"];
  const vdiCompleted = VDI_KEYS.filter((key) =>
    certs.some((cert) => (cert.code ?? "").split(/[-_ ]/)[0].toUpperCase() === key)
  );

  return (
    <main className="page-main">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <AnimatedSection delayMs={0}>
          <PageHeader title="Badges" showTitle={true} />
        </AnimatedSection>

        <AnimatedSection delayMs={80}>
          <BadgesClient
            credits={credits}
            completedCount={completedCount}
            vdiCompleted={vdiCompleted}
          />
        </AnimatedSection>
      </div>
    </main>
  );
}
