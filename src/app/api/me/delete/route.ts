import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Kontolöschung durch den Nutzer selbst (Art. 17 DSGVO).
 *
 * Verlangt das eigene Passwort — ein versehentlicher oder fremder Klick soll
 * nicht genügen. Die Teilnehmerzeilen aus Website und Cobra bleiben erhalten:
 * Sie gehören zur Kursdokumentation der Akademie und nicht zum App-Konto.
 * Alles am Konto Hängende (Anmeldungen, Zertifikate, Credits, Feedback,
 * Nachweise) entfernt Prisma per Cascade.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { passwort?: unknown } | null;
  const passwort = typeof body?.passwort === "string" ? body.passwort : "";

  if (!passwort) {
    return NextResponse.json({ ok: false, error: "PASSWORT_FEHLT" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "ADMIN_KONTO" },
      { status: 400 }
    );
  }

  const stimmt = user.passwordHash
    ? await bcrypt.compare(passwort, user.passwordHash)
    : false;

  if (!stimmt) {
    return NextResponse.json({ ok: false, error: "PASSWORT_FALSCH" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
