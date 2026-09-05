import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateiAusBlob } from "@/lib/blob-auslieferung";
import { fehlerSeite } from "@/lib/dateikopf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Lesbare Seite statt JSON: Der Ansehen-Knopf öffnet die Route in einem
// eigenen Tab (05.09.2026).
function fail(text: string, status = 400) {
  return fehlerSeite(text, status);
}

/**
 * Liefert einen selbst hochgeladenen Nachweis aus — nur an den Eigentümer.
 * Ersetzt den direkten Link auf die Blob-Adresse, die ohne Anmeldung
 * erreichbar war.
 */
export async function GET(_req: Request, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return fail("Bitte melde dich an und ruf den Nachweis noch einmal auf.", 401);

  const me = await prisma.user.findUnique({
    where: { email: session.user.email.trim().toLowerCase() },
    select: { id: true },
  });
  if (!me) return fail("Zu deiner Anmeldung gibt es kein Konto mehr.", 404);

  const { id } = await context.params;
  const doc = await prisma.userDocument.findUnique({
    where: { id },
    select: { userId: true, fileUrl: true, filePathname: true, title: true, fileType: true },
  });

  if (!doc) return fail("Diesen Nachweis gibt es nicht.", 404);
  if (doc.userId !== me.id) return fail("Dieser Nachweis gehört nicht zu deinem Konto.", 403);

  return dateiAusBlob({
    pathname: doc.filePathname,
    fallbackUrl: doc.fileUrl,
    dateiname: doc.title,
  });
}
