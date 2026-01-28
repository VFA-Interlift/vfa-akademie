import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function parseGermanDate(s: string): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s.trim());
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = String(body.title ?? "").trim();
    const dateStr = String(body.date ?? "").trim();
    const creditsAward = Number(body.creditsAward ?? 0);
    const maxClaims = Number(body.maxClaims ?? 999999);

    if (!title || !dateStr) {
      return NextResponse.json({ error: "Titel und Datum sind Pflicht." }, { status: 400 });
    }

    const date = parseGermanDate(dateStr);
    if (!date) {
      return NextResponse.json({ error: "Datum muss TT.MM.JJJJ sein." }, { status: 400 });
    }

    // läuft 7 Tage nach Termin ab (kannst du später ändern)
    const expiresAt = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);

    // random Token für QR
    const token = crypto.randomBytes(16).toString("hex");

    const training = await prisma.training.create({
      data: {
        title,
        date,
        creditsAward,
        tokens: {
          create: {
            token,
            expiresAt,
            maxClaims: Number.isFinite(maxClaims) ? maxClaims : 999999,
          },
        },
      },
      include: { tokens: true },
    });

    return NextResponse.json({
      ok: true,
      trainingId: training.id,
      token: training.tokens[0]?.token,
      expiresAt: training.tokens[0]?.expiresAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Serverfehler." }, { status: 500 });
  }
}
