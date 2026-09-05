import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Die Startadresse leitet nur noch weiter (Launch-Runde 05.09.2026): mit
 * Sitzung ins Dashboard, ohne zur Anmeldung. Die frühere Werbeseite hatte für
 * Eingeloggte am Handy weder Kopf noch Leiste und zeigte ihnen „Zur Anmeldung“,
 * obwohl sie angemeldet waren.
 */
export default async function HomePage() {
  const session = await getServerSession(authOptions);
  redirect(session?.user?.email ? "/dashboard" : "/login");
}
