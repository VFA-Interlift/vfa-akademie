import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { holeVapid } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Web-Push-Verwaltung für das eigene Konto.
 *
 *   GET    → öffentlicher VAPID-Schlüssel (fürs Abonnieren im Browser)
 *   POST   → Abo speichern   { endpoint, keys: { p256dh, auth } }
 *   DELETE → Abo löschen     { endpoint }
 */
async function eigeneNutzerId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function GET() {
  const userId = await eigeneNutzerId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const vapid = await holeVapid();
  return NextResponse.json({ ok: true, publicKey: vapid.publicKey });
}

export async function POST(req: Request) {
  const userId = await eigeneNutzerId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const daten = (await req.json().catch(() => null)) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  } | null;

  const endpoint = daten?.endpoint;
  const p256dh = daten?.keys?.p256dh;
  const auth = daten?.keys?.auth;
  if (!endpoint || !p256dh || !auth || !endpoint.startsWith("https://")) {
    return NextResponse.json({ ok: false, error: "UNGUELTIGES_ABO" }, { status: 400 });
  }

  // upsert über den Endpunkt: Meldet sich dasselbe Gerät erneut (neuer Login,
  // anderes Konto), wandert das Abo zum aktuellen Nutzer statt zu verdoppeln.
  await prisma.pushAbo.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth },
    update: { userId, p256dh, auth },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await eigeneNutzerId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const daten = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!daten?.endpoint) {
    return NextResponse.json({ ok: false, error: "ENDPOINT_FEHLT" }, { status: 400 });
  }

  // Nur das eigene Abo — deleteMany mit userId statt delete, damit niemand
  // fremde Endpunkte abmelden kann.
  await prisma.pushAbo.deleteMany({ where: { endpoint: daten.endpoint, userId } });
  return NextResponse.json({ ok: true });
}
