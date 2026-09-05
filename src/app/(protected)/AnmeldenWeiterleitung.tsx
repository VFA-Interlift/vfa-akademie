"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Schickt Nichtangemeldete zur Anmeldung und gibt die gewünschte Seite als
 * callbackUrl mit, damit sie nach dem Anmelden dort landen und nicht auf dem
 * Dashboard (Befund f02-1, 05.09.2026). Die Mails verlinken direkt auf
 * /meine-zertifikate und /meine-schulungen.
 *
 * Bewusst im Browser statt per redirect() im Server-Layout: Ein Layout kennt
 * seinen Pfad auf dem Server nicht (kein Zugriff auf die URL, keine
 * Middleware). Das Layout rendert in diesem Fall NUR diese Komponente, die
 * geschützte Seite selbst bleibt ungerendert.
 */
export default function AnmeldenWeiterleitung() {
  const router = useRouter();
  const pfad = usePathname();

  useEffect(() => {
    const ziel = `${pfad}${window.location.search}`;
    router.replace(`/login?callbackUrl=${encodeURIComponent(ziel)}`);
  }, [pfad, router]);

  return null;
}
