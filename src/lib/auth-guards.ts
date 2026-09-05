import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Vergleicht zwei Geheimnisse in gleichbleibender Zeit. Ein einfaches `===`
 * bricht beim ersten falschen Zeichen ab; aus den Laufzeitunterschieden lässt
 * sich ein Geheimnis Zeichen für Zeichen erraten. Ungleiche Längen werden
 * vorher abgefangen, weil timingSafeEqual sonst wirft.
 */
export function geheimnisStimmt(erwartet: string, gegeben: string | null): boolean {
  if (!gegeben) return false;
  const a = Buffer.from(erwartet, "utf8");
  const b = Buffer.from(gegeben, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Torwächter der nächtlichen Läufe. Vercel ruft sie mit dem Kopf
 * `Authorization: Bearer <CRON_SECRET>` auf.
 *
 * Bis zum 05.09.2026 stand diese Prüfung in fünf Routen einzeln — eine
 * Verbesserung hätte fünfmal nachgezogen werden müssen. Fehlt das Geheimnis in
 * der Umgebung, antwortet die Route bewusst mit 500 statt durchzulassen.
 *
 * Verwendung:
 *   const tor = cronGeprueft(req);
 *   if (!tor.ok) return tor.response;
 */
export function cronGeprueft(req: Request):
  | { ok: true }
  | { ok: false; response: NextResponse } {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "CRON_SECRET_NOT_CONFIGURED" },
        { status: 500 }
      ),
    };
  }

  if (!geheimnisStimmt(`Bearer ${cronSecret}`, req.headers.get("authorization"))) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 }),
    };
  }

  return { ok: true };
}

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
