import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BottomNav from "@/components/BottomNav";
import AnmeldenWeiterleitung from "@/app/(protected)/AnmeldenWeiterleitung";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  // Zur Anmeldung mit Rücksprungziel (Befund f02-1); die Seite selbst wird
  // dabei nicht gerendert.
  if (!session?.user?.email) return <AnmeldenWeiterleitung />;

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!me || me.role !== "ADMIN") redirect("/dashboard");

  return (
    <>
            {/* Setzt die Leisten-Klasse VOR dem ersten Zeichnen — BottomNav tat es
          erst nach dem Laden des Skripts, der Inhalt sprang dadurch beim
          App-Start um die Leistenhöhe (Ultracode-Befund 13.08.2026). Das
          Aufräumen beim Verlassen übernimmt weiter der Effekt in BottomNav. */}
      <script
        dangerouslySetInnerHTML={{
          __html: 'document.body.classList.add("has-bottom-nav");',
        }}
      />
      {children}
      <BottomNav />
    </>
  );
}
