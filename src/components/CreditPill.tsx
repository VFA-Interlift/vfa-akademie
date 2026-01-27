// src/components/CreditsPill.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function CreditsPill() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { creditsTotal: true },
  });

  const credits = user?.creditsTotal ?? 0;

  return (
    <div
      style={{
        padding: "6px 10px",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 14,
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(8px)",
      }}
      title="Gesamtcredits"
    >
      Credits: {credits}
    </div>
  );
}
