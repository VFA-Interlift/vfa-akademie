import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function parseGermanDate(d: string): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;

  return date;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    const birthDateStr = String(body.birthDate ?? "").trim();

    if (!email || !password || !name || !birthDateStr) {
      return NextResponse.json({ error: "Bitte alle Felder ausfüllen." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
    }

    const birthDate = parseGermanDate(birthDateStr);
    if (!birthDate) {
      return NextResponse.json({ error: "Geburtsdatum bitte als TT.MM.JJJJ eingeben." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "E-Mail ist bereits registriert." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
  data: {
    email,
    passwordHash,
    name,
    birthDate,
  },
});


    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Serverfehler." }, { status: 500 });
  }
}
