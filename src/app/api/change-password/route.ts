import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { passwortFehler } from "@/lib/passwort";
import { bremsePruefen, bremseZuruecksetzen } from "@/lib/bremse";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  // Gleiche Zugriffsbremse wie beim Konto-Löschen: Ohne sie war das Feld
  // "aktuelles Passwort" ein Prüf-Orakel für eine gekaperte Sitzung
  // (Ultracode-Befund 13.08.2026).
  const bremsSchluessel = `passwort-aendern:${session.user.email.trim().toLowerCase()}`;
  const bremse = bremsePruefen(bremsSchluessel, {
    versuche: 5,
    fensterSekunden: 300,
    sperreSekunden: 900,
  });
  if (!bremse.erlaubt) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte warte einen Moment." },
      { status: 429 }
    );
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  // Auch den Typ prüfen: eine Zahl oder ein Objekt lief sonst in
  // toLowerCase()/bcrypt.compare und kam als 500 zurück (05.09.2026).
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !currentPassword ||
    !newPassword
  ) {
    return NextResponse.json({ error: "Bitte alle Felder ausfüllen." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.trim().toLowerCase() },
    select: { id: true, passwordHash: true, email: true, name: true },
  });

  const passwortProblem = passwortFehler(newPassword, {
    email: user?.email,
    name: user?.name,
  });

  if (passwortProblem) {
    return NextResponse.json({ error: passwortProblem }, { status: 400 });
  }

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Kein Passwort hinterlegt." }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Aktuelles Passwort ist falsch." }, { status: 400 });
  }

  bremseZuruecksetzen(bremsSchluessel);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashed },
  });

  return NextResponse.json({ ok: true });
}
