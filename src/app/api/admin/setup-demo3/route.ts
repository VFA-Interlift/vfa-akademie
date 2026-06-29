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

    // Bereits zugeordnete Trainings ermitteln (keine Doppelungen)
    const existing = await prisma.enrollment.findMany({
      where: { userId: dummy.id },
      select: { trainingId: true },
    });
    const existingIds = existing.map((e) => e.trainingId);

    // Nächstes noch nicht zugeordnetes vergangenes Training → 5. Zertifikat
    const training = await prisma.training.findFirst({
      where: {
        date: { lt: new Date() },
        id: { notIn: existingIds },
      },
      orderBy: { date: 'desc' },
    });

    if (!training) throw new Error('Kein weiteres vergangenes Training verfügbar');

    const credits = training.creditsAward > 0 ? training.creditsAward : 10;

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: dummy.id,
        trainingId: training.id,
        status: 'CERTIFICATE_ISSUED',
        attended: true,
        passed: true,
        completedAt: training.date,
      },
    });

    const cert = await prisma.certificate.create({
      data: {
        userId: dummy.id,
        trainingId: training.id,
        enrollmentId: enrollment.id,
        title: training.title,
        issuedAt: training.date,
        status: 'ISSUED',
        credits,
        certificateKind: training.certificateKind ?? 'ATTENDANCE_CONFIRMATION',
      },
    });

    await prisma.creditTransaction.create({
      data: {
        userId: dummy.id,
        amount: credits,
        type: 'AWARD',
        reason: 'CERTIFICATE_ISSUED',
        trainingId: training.id,
        certificateId: cert.id,
      },
    });

    await prisma.user.update({
      where: { id: dummy.id },
      data: { creditsTotal: { increment: credits } },
    });

    const certCount = await prisma.certificate.count({ where: { userId: dummy.id } });

    log.push(`✓ 5. Zertifikat: "${training.title}" — ${credits} Credits`);
    log.push(`✓ Zertifikate gesamt: ${certCount}`);
    log.push('✅ Fertig!');

    return NextResponse.json({ success: true, log });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg, log }, { status: 500 });
  }
}
