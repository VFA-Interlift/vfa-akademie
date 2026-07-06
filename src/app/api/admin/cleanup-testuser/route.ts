import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECRET = "vfa-cleanup-testuser-2026-07-06";
const EMAIL = "tobias-doehring99@web.de";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];

  try {
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            certificates: true,
            enrollments: true,
            creditTxs: true,
            trainingFeedbacks: true,
            documents: true,
            passwordResetTokens: true,
          },
        },
        documents: { select: { fileUrl: true } },
        certificates: { select: { pdfUrl: true } },
      },
    });

    if (!user) {
      log.push(`User ${EMAIL} nicht gefunden (evtl. schon gelöscht)`);
    } else {
      log.push(`User gefunden: ${user.name ?? "?"} (${user.email})`);

      // Blob-Dateien (Nachweise + evtl. gespeicherte Zertifikat-PDFs) entfernen.
      const blobUrls = [
        ...user.documents.map((d) => d.fileUrl),
        ...user.certificates
          .map((c) => c.pdfUrl)
          .filter((u): u is string => !!u && u.includes("blob.vercel-storage.com")),
      ];
      for (const url of blobUrls) {
        try {
          await del(url);
          log.push(`✓ Blob gelöscht: ${url}`);
        } catch {
          log.push(`⚠ Blob nicht löschbar (ignoriert): ${url}`);
        }
      }

      // User löschen — Cascade räumt Zertifikate, Enrollments, Credits,
      // Feedbacks, Nachweise und Reset-Tokens mit ab.
      await prisma.user.delete({ where: { id: user.id } });
      log.push(
        `✓ User gelöscht inkl. ${user._count.certificates} Zertifikate, ` +
          `${user._count.enrollments} Enrollments, ${user._count.creditTxs} Credit-Txs, ` +
          `${user._count.trainingFeedbacks} Feedbacks, ${user._count.documents} Nachweise, ` +
          `${user._count.passwordResetTokens} Reset-Tokens`
      );
    }

    // Staging-Einträge (Wix/Cobra-Teilnehmer) mit dieser E-Mail entfernen.
    const staging = await prisma.cobraTrainingParticipant.deleteMany({
      where: { email: EMAIL },
    });
    log.push(`✓ ${staging.count} Staging-Teilnehmer (CobraTrainingParticipant) gelöscht`);

    return NextResponse.json({ ok: true, log });
  } catch (e) {
    log.push(`✗ Fehler: ${e instanceof Error ? e.message : String(e)}`);
    return NextResponse.json({ ok: false, log }, { status: 500 });
  }
}
