// TEMPORÄRE Debug-Route: Analyse, warum A1/A2-2026-Schulungen fehlen.
// Gibt nur Schulungsdaten zurück (keine Secrets). Nach der Analyse wieder löschen!
import { NextResponse } from "next/server";
import { cobraEndpointGet } from "@/lib/cobra/client";
import { prisma } from "@/lib/prisma";
import type { CobraTraining } from "@/lib/cobra/sync-trainings";

export const dynamic = "force-dynamic";

const DEBUG_KEY = "5dc08ff6a0fb01908d8d978f84bb7c08f7f57a3913937d9a";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");

  if (key !== DEBUG_KEY) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const cobraTrainings = await cobraEndpointGet<CobraTraining[]>("app-schulung");

  const rows = cobraTrainings.map((t) => ({
    id: t["Schulungs-ID"] ?? t.ID ?? null,
    code: String(t.Schulungscode ?? "").trim(),
    titel: String(t.Schulungstitel ?? t.Caption ?? "").trim(),
    start: t.Startdatum ?? null,
    ende: t.Enddatum ?? null,
  }));

  const a12 = rows
    .filter(
      (r) =>
        r.code.toUpperCase().startsWith("A1") ||
        r.code.toUpperCase().startsWith("A2")
    )
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

  const byCode = new Map<string, number>();
  for (const r of rows) {
    const c = r.code.toUpperCase();
    byCode.set(c, (byCode.get(c) ?? 0) + 1);
  }
  const duplicateCodes = [...byCode.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ code, count }));

  const byYear = new Map<string, number>();
  for (const r of rows) {
    const y = String(r.start ?? "").slice(0, 4) || "unbekannt";
    byYear.set(y, (byYear.get(y) ?? 0) + 1);
  }

  const invalid = rows.filter((r) => !r.id || !r.code || !r.start);

  const dbTrainings = await prisma.training.findMany({
    select: { id: true, cobraId: true, code: true, title: true, date: true },
    orderBy: { date: "asc" },
  });

  const dbA12 = dbTrainings.filter(
    (t) =>
      (t.code ?? "").toUpperCase().startsWith("A1") ||
      (t.code ?? "").toUpperCase().startsWith("A2")
  );

  return NextResponse.json({
    ok: true,
    cobra: {
      total: rows.length,
      firstRecordFields: Object.keys(cobraTrainings[0] ?? {}),
      byYear: Object.fromEntries([...byYear.entries()].sort()),
      a12Count: a12.length,
      a12,
      duplicateCodes,
      invalidCount: invalid.length,
      invalid: invalid.slice(0, 20),
    },
    db: {
      total: dbTrainings.length,
      a12Count: dbA12.length,
      a12: dbA12,
    },
  });
}
