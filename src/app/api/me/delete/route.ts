import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bremsePruefen, bremseZuruecksetzen } from "@/lib/bremse";

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

  // Diese Route antwortet unterschiedlich, je nachdem ob das Passwort stimmt —
  // ungebremst wäre sie damit ein Passwort-Orakel.
  const bremse = bremsePruefen(`konto-loeschen:${email}`, {
    versuche: 5,
    fensterSekunden: 300,
    sperreSekunden: 900,
  });

  if (!bremse.erlaubt) {
    return NextResponse.json(
      { ok: false, error: "ZU_VIELE_VERSUCHE" },
      { status: 429 }
    );
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

  bremseZuruecksetzen(`konto-loeschen:${email}`);

  // Hochgeladene Nachweis-Dateien VOR dem Löschen einsammeln (die DB-Zeilen
  // reißt die Kaskade mit), die Blobs aber erst NACH dem erfolgreichen
  // DB-Löschen entfernen: Scheitert der Blob-Store, scheitert nicht die
  // Kontolöschung — Art. 17 verspricht das Konto, nicht die Speicherinterna
  // (Ultracode-Befund 13.08.2026). Fehler werden geloggt, damit Verwaiste
  // auffallen.
  const dokumente = await prisma.userDocument.findMany({
    where: { userId: user.id },
    select: { fileUrl: true },
  });

  await prisma.user.delete({ where: { id: user.id } });

  if (dokumente.length > 0) {
    try {
      await del(dokumente.map((d) => d.fileUrl));
    } catch (fehler) {
      console.error("KONTOLOESCHUNG_BLOB_FEHLER", fehler);
    }
  }

  return NextResponse.json({ ok: true });
}
