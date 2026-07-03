import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncWixTrainings } from "@/lib/wix/sync-trainings";

export const dynamic = "force-dynamic";

/** Admin: Website-Kurse (Wix-CMS) in die App-DB übernehmen. */
export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  try {
    const result = await syncWixTrainings();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: "WIX_SYNC_FAILED",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
