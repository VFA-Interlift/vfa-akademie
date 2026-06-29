import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SECRET = 'vfa-demo-setup-2026';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log: string[] = [];

  try {
    const dummy = await prisma.user.findUnique({
      where: { email: 'tobias-doehring99@web.de' },
    });
    if (!dummy) throw new Error('Dummy-User nicht gefunden');

    // ── 1. EFK-Zertifikat → A1 umbenennen ──────────────────
    const efkCert = await prisma.certificate.findFirst({
      where: {
        userId: dummy.id,
        title: { contains: 'EFK', mode: 'insensitive' },
      },
    });

    if (efkCert) {
      await prisma.certificate.update({
        where: { id: efkCert.id },
        data: {
          title: 'VDI 2168 Grundkurs A1',
          code: 'A1',
          certificateKind: 'ATTENDANCE_CONFIRMATION',
        },
      });
      log.push('✓ EFK-Zertifikat → A1 umbenannt');
    } else {
      log.push('⚠ Kein EFK-Zertifikat gefunden');
    }

    // ── 2. Bereits enrollte Trainings des Dummy ermitteln ──
    const existing = await prisma.enrollment.findMany({
      where: { userId: dummy.id },
      select: { trainingId: true },
    });
    const existingIds = existing.map(e => e.trainingId);

    // ── 3. Viertes vergangenes Training finden ─────────────
    const fourthTraining = await prisma.training.findFirst({
      where: {
        date: { lt: new Date() },
        id: { notIn: existingIds },
      },
      orderBy: { date: 'desc' },
    });

    if (!fourthTraining) throw new Error('Kein weiteres vergangenes Training gefunden');

    const credits = fourthTraining.creditsAward > 0 ? fourthTraining.creditsAward : 10;

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: dummy.id,
        trainingId: fourthTraining.id,
        status: 'CERTIFICATE_ISSUED',
        attended: true,
        passed: true,
        completedAt: fourthTraining.date,
      },
    });

    const cert = await prisma.certificate.create({
      data: {
        userId: dummy.id,
        trainingId: fourthTraining.id,
        enrollmentId: enrollment.id,
        title: fourthTraining.title,
        issuedAt: fourthTraining.date,
        status: 'ISSUED',
        credits,
        certificateKind: fourthTraining.certificateKind ?? 'ATTENDANCE_CONFIRMATION',
      },
    });

    await prisma.creditTransaction.create({
      data: {
        userId: dummy.id,
        amount: credits,
        type: 'AWARD',
        reason: 'CERTIFICATE_ISSUED',
        trainingId: fourthTraining.id,
        certificateId: cert.id,
      },
    });

    await prisma.user.update({
      where: { id: dummy.id },
      data: { creditsTotal: { increment: credits } },
    });

    log.push(`✓ 4. Zertifikat: "${fourthTraining.title}" — ${credits} Credits`);
    log.push('✅ Fertig!');

    return NextResponse.json({ success: true, log });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg, log }, { status: 500 });
  }
}
