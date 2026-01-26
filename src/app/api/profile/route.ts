import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

function parseGermanDate(s: string): Date | null {
  const t = s.trim();
  if (!t) return null;
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(t);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) return null;
  return d;
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const name = String(body.name ?? "").trim() || null;
    const email = String(body.email ?? "").trim().toLowerCase();
    const company = String(body.company ?? "").trim() || null;
    const gender = String(body.gender ?? "").trim() || null;
    const companyAddress = String(body.companyAddress ?? "").trim() || null;

    const birthDateStr = String(body.birthDate ?? "").trim();
    const birthDate = birthDateStr ? parseGermanDate(birthDateStr) : null;
    if (birthDateStr && !birthDate) {
      return NextResponse.json(
        { error: "Geburtsdatum muss TT.MM.JJJJ sein." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: "E-Mail ist Pflicht." }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "User nicht gefunden." }, { status: 404 });
    }

    // E-Mail uniqueness check (nur wenn geändert)
    if (email !== currentUser.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "Diese E-Mail ist bereits vergeben." },
          { status: 409 }
        );
      }
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name,
        email,
        company,
        gender,
        companyAddress,
        birthDate,
      },
    });

    return NextResponse.json({
      ok: true,
      emailChanged: email !== currentUser.email,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Serverfehler." }, { status: 500 });
  }
}
