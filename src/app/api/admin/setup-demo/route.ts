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
    // ── 1. Admin: alle Credits löschen ──────────────────────
    const admin = await prisma.user.findUnique({
      where: { email: 'tobias.doehring@vfa-interlift.de' },
    });
    if (!admin) throw new Error('Admin-User nicht gefunden');

    await prisma.creditTransaction.deleteMany({ where: { userId: admin.id } });
    await prisma.user.update({ where: { id: admin.id }, data: { creditsTotal: 0 } });
    log.push('✓ Admin-Credits auf 0 gesetzt');

    // ── 2. Dummy-User finden oder anlegen ───────────────────
    let dummy = await prisma.user.findUnique({
      where: { email: 'tobias-doehring99@web.de' },
    });

    if (!dummy) {
      dummy = await prisma.user.create({
        data: {
          email: 'tobias-doehring99@web.de',
          passwordHash: '$2b$10$Kj9Qz8vXwL2mN5pR3tU6OuYhA4sE7fI1gH0jK8lM2nP5qT9rV3wX',
          firstName: 'Thomas',
          lastName: 'Mustermann',
          name: 'Thomas Mustermann',
          role: 'USER',
          isInstructor: true,
          creditsTotal: 0,
        },
      });
      log.push('✓ Dummy-User angelegt');
    } else {
      await prisma.user.update({
        where: { id: dummy.id },
        data: { isInstructor: true },
      });
      log.push('✓ Dummy-User als Dozent markiert');
    }

    // ── 3. Alte Demo-Daten des Dummy bereinigen ─────────────
    await prisma.creditTransaction.deleteMany({ where: { userId: dummy.id } });
    await prisma.certificate.deleteMany({ where: { userId: dummy.id } });
    await prisma.enrollment.deleteMany({ where: { userId: dummy.id } });
    await prisma.user.update({ where: { id: dummy.id }, data: { creditsTotal: 0 } });

    // ── 4. Trainings ermitteln ──────────────────────────────
    const pastTrainings = await prisma.training.findMany({
      where: { date: { lt: new Date() } },
      orderBy: { date: 'desc' },
      take: 3,
    });
    const futureTrainings = await prisma.training.findMany({
      where: { date: { gt: new Date() } },
      orderBy: { date: 'asc' },
      take: 2,
    });

    if (pastTrainings.length < 3) throw new Error(`Zu wenige vergangene Trainings (${pastTrainings.length})`);
    if (futureTrainings.length < 2) throw new Error(`Zu wenige kommende Trainings (${futureTrainings.length})`);

    // ── 5. Zertifikate + Credits anlegen ────────────────────
    let totalCredits = 0;

    for (const training of pastTrainings) {
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

      totalCredits += credits;
      log.push(`  + Zertifikat: "${training.title}" — ${credits} Credits`);
    }

    await prisma.user.update({ where: { id: dummy.id }, data: { creditsTotal: totalCredits } });
    log.push(`✓ Credits gesamt: ${totalCredits}`);

    // ── 6. Kommende Schulungen anlegen ──────────────────────
    for (const training of futureTrainings) {
      await prisma.enrollment.create({
        data: {
          userId: dummy.id,
          trainingId: training.id,
          status: 'CONFIRMED',
          attended: false,
          passed: false,
        },
      });
      log.push(`  + Kommende Schulung: "${training.title}"`);
    }

    log.push('✅ Demo-Daten erfolgreich eingerichtet!');
    return NextResponse.json({ success: true, log });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg, log }, { status: 500 });
  }
}
