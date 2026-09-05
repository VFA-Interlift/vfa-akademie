import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import AnmeldenWeiterleitung from "./AnmeldenWeiterleitung";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Zur Anmeldung mit Rücksprungziel statt redirect("/login") ohne Ziel
  // (Befund f02-1). Die Seite selbst wird dabei nicht gerendert.
  if (!session?.user?.email) {
    return <AnmeldenWeiterleitung />;
  }

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