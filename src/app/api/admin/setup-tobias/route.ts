import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SECRET = 'vfa-setup-tobias-2026-07-07';
const EMAIL = 'tobias.doehring@vfa-interlift.de';

async function getStatus() {
  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    include: {
      enrollments: {
        include: { training: { select: { title: true, code: true, date: true } } },
        orderBy: { createdAt: 'desc' },
      },
      certificates: {
        include: { training: { select: { title: true, code: true, date: true } } },
        orderBy: { issuedAt: 'desc' },
      },
    },
  });
  if (!user) return null;
  return {
    email: user.email,
    name: user.name,
    role: user.role,
    isInstructor: user.isInstructor,
    creditsTotal: user.creditsTotal,
    enrollments: user.enrollments.map((e) => ({
      training: e.training.title,
      code: e.training.code,
      date: e.training.date,
      status: e.status,
      attended: e.attended,
    })),
    certificates: user.certificates.map((c) => ({
      title: c.title,
      code: c.training.code,
      issuedAt: c.issuedAt,
      credits: c.credits,
      kind: c.certificateKind,
    })),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const status = await getStatus();
  if (!status) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
  return NextResponse.json({ success: true, status });
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log: string[] = [];

  try {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (!user) throw new Error('User nicht gefunden');

    const existing = await prisma.enrollment.findMany({
      where: { userId: user.id },
      select: { trainingId: true },
    });
    const existingIds = existing.map((e) => e.trainingId);

    // 1 kommende Schulung → Enrollment CONFIRMED
    const future = await prisma.training.findFirst({
      where: { date: { gt: new Date() }, id: { notIn: existingIds } },
      orderBy: { date: 'asc' },
    });
    if (!future) throw new Error('Kein kommendes Training verfügbar');

    await prisma.enrollment.create({
      data: {
        userId: user.id,
        trainingId: future.id,
        status: 'CONFIRMED',
        attended: false,
        passed: false,
      },
    });
    log.push(`✓ Schulung: "${future.title}" (${future.date.toISOString().slice(0, 10)})`);

    // 1 vergangenes Training → Enrollment + Zertifikat + Credits
    const past = await prisma.training.findFirst({
      where: { date: { lt: new Date() }, id: { notIn: [...existingIds, future.id] } },
      orderBy: { date: 'desc' },
    });
    if (!past) throw new Error('Kein vergangenes Training verfügbar');

    const credits = past.creditsAward > 0 ? past.creditsAward : 10;

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        trainingId: past.id,
        status: 'CERTIFICATE_ISSUED',
        attended: true,
        passed: true,
        completedAt: past.date,
      },
    });

    const cert = await prisma.certificate.create({
      data: {
        userId: user.id,
        trainingId: past.id,
        enrollmentId: enrollment.id,
        title: past.title,
        issuedAt: past.date,
        status: 'ISSUED',
        credits,
        certificateKind: past.certificateKind ?? 'ATTENDANCE_CONFIRMATION',
      },
    });

    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: credits,
        type: 'AWARD',
        reason: 'CERTIFICATE_ISSUED',
        trainingId: past.id,
        certificateId: cert.id,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { creditsTotal: { increment: credits } },
    });

    log.push(`✓ Zertifikat: "${past.title}" — ${credits} Credits`);
    log.push('✅ Fertig!');

    const status = await getStatus();
    return NextResponse.json({ success: true, log, status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: msg, log }, { status: 500 });
  }
}
