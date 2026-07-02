import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cobraEndpointGet } from "@/lib/cobra/client";
import { CobraError } from "@/lib/cobra/types";
import { COBRA_LOCATION_KEYS } from "@/lib/cobra/sync-trainings";

export const dynamic = "force-dynamic";

/**
 * Admin-Diagnose: zeigt die rohen Feldnamen/-werte des Cobra-`app-schulung`-
 * Endpoints. Dient dazu, herauszufinden, unter welchem Schlüssel der Ort
 * geliefert wird (bzw. ob er in Cobra leer ist). Nur lesend, keine Änderung.
 */
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { ok: false as const, res: NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 }) };
  const me = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { role: true },
  });
  if (!me || me.role !== "ADMIN") {
    return { ok: false as const, res: NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.res;

  try {
    const data = await cobraEndpointGet<Record<string, unknown>[]>("app-schulung");
    const trainings = Array.isArray(data) ? data : [];

    // Vereinigung aller vorkommenden Feldnamen.
    const allKeys = new Set<string>();
    for (const t of trainings) {
      if (t && typeof t === "object") {
        for (const key of Object.keys(t)) allKeys.add(key);
      }
    }

    // Welche Kandidaten-Schlüssel sind tatsächlich (nicht leer) belegt?
    const locationKeysPresent = COBRA_LOCATION_KEYS.filter((key) =>
      trainings.some((t) => typeof t?.[key] === "string" && String(t[key]).trim())
    );

    // Alle Felder, deren Name auf einen Ort/eine Adresse hindeutet.
    const addressLikeKeys = Array.from(allKeys).filter((key) =>
      /(ort|adress|anschrift|standort|stadt|plz|straße|strasse|location|veranstalt|gastgeber|raum)/i.test(key)
    );

    return NextResponse.json({
      ok: true,
      endpoint: "app-schulung",
      count: trainings.length,
      allKeys: Array.from(allKeys).sort(),
      addressLikeKeys,
      locationKeysCurrentlyMatched: locationKeysPresent,
      samples: trainings.slice(0, 3),
    });
  } catch (error: unknown) {
    if (error instanceof CobraError) {
      return NextResponse.json(
        { ok: false, error: "COBRA_ERROR", message: error.message, status: error.status ?? 500, details: error.details },
        { status: error.status ?? 500 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "COBRA_RAW_FIELDS_FAILED", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
