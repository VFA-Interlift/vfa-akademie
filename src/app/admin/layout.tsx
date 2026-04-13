import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!me || me.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}