import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Admin-Gate für API-Routen. Liest die Rolle bewusst aus der Datenbank statt
 * aus dem JWT: eine entzogene Admin-Rolle wirkt damit sofort und nicht erst
 * beim nächsten Login.
 *
 * Verwendung:
 *   const gate = await requireAdmin();
 *   if (!gate.ok) return gate.response;
 */
export async function requireAdmin(): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }

  const me = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { role: true },
  });

  if (!me || me.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}
