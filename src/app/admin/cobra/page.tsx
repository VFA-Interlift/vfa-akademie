import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CobraAdminClient from "@/components/admin/CobraAdminClient";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";

export const dynamic = "force-dynamic";

export default async function AdminCobraPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.trim().toLowerCase();

  const me = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  if (!me || me.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="page-main">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <AnimatedSection delayMs={0}>
          <PageHeader title="Cobra/WebConnect" />
        </AnimatedSection>

        <AnimatedSection delayMs={80}>
          <CobraAdminClient />
        </AnimatedSection>
      </div>
    </main>
  );
}
