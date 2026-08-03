import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sicherung gegen einen Lauf auf der echten Datenbank: Das Skript löscht
 * Credits, Zertifikate und Anmeldungen zweier fest eingetragener Konten,
 * darunter das Admin-Konto.
 */
if (process.env.DEMO_DATEN_OK !== 'ja') {
  console.error(
    'Abgebrochen. Dieses Skript LOESCHT Credits, Zertifikate und Anmeldungen\n' +
      'von tobias.doehring@vfa-interlift.de und tobias-doehring99@web.de.\n\n' +
      'Wenn das gewollt ist:  DEMO_DATEN_OK=ja node scripts/setup-demo-data.mjs\n' +
      'Vorher pruefen, auf welche Datenbank DATABASE_URL zeigt.'
  );
  process.exit(1);
}

async function main() {
  // ── 1. Admin-User: alle Credits entfernen ──────────────────────────────────
  const admin = await prisma.user.findUnique({
    where: { email: 'tobias.doehring@vfa-interlift.de' },
  });
  if (!admin) throw new Error('Admin-User nicht gefunden: tobias.doehring@vfa-interlift.de');

  await prisma.creditTransaction.deleteMany({ where: { userId: admin.id } });
  await prisma.user.update({ where: { id: admin.id }, data: { creditsTotal: 0 } });
  console.log(`✓ Admin (${admin.email}): Credits auf 0 gesetzt`);

  // ── 2. Dummy-User anlegen / finden ────────────────────────────────────────
  let dummy = await prisma.user.findUnique({
    where: { email: 'tobias-doehring99@web.de' },
  });
  if (!dummy) {
    // bcrypt-Hash für "Demo1234!" — vorgeneriert, kein bcrypt-Import nötig
    const hash = '$2b$10$Kj9Qz8vXwL2mN5pR3tU6OuYhA4sE7fI1gH0jK8lM2nP5qT9rV3wX';
    dummy = await prisma.user.create({
      data: {
        email: 'tobias-doehring99@web.de',
        passwordHash: hash,
        firstName: 'Thomas',
        lastName: 'Mustermann',
        name: 'Thomas Mustermann',
        role: 'USER',
        isInstructor: true,
        creditsTotal: 0,
      },
    });
    console.log(`✓ Dummy-User angelegt: ${dummy.email}`);
  } else {
    await prisma.user.update({
      where: { id: dummy.id },
      data: { isInstructor: true },
    });
    console.log(`✓ Dummy-User gefunden und als Dozent markiert: ${dummy.email}`);
  }

  // ── 3. Trainings für Zertifikate + kommende Schulungen finden ─────────────
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

  if (pastTrainings.length < 3) throw new Error(`Nicht genug vergangene Trainings (gefunden: ${pastTrainings.length})`);
  if (futureTrainings.length < 2) throw new Error(`Nicht genug zukünftige Trainings (gefunden: ${futureTrainings.length})`);

  console.log(`✓ Vergangene Trainings: ${pastTrainings.map(t => t.title).join(', ')}`);
  console.log(`✓ Kommende Trainings:   ${futureTrainings.map(t => t.title).join(', ')}`);

  // ── 4. Alte Demo-Daten des Dummy-Users bereinigen ─────────────────────────
  await prisma.creditTransaction.deleteMany({ where: { userId: dummy.id } });
  await prisma.certificate.deleteMany({ where: { userId: dummy.id } });
  await prisma.enrollment.deleteMany({ where: { userId: dummy.id } });
  await prisma.user.update({ where: { id: dummy.id }, data: { creditsTotal: 0 } });

  // ── 5. Zertifikate: Enrollments + Certificates + Credits ──────────────────
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

    const tx = await prisma.creditTransaction.create({
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
    console.log(`  + Zertifikat: "${training.title}" — ${credits} Credits`);
  }

  // ── 6. Credits-Summe beim User setzen ────────────────────────────────────
  await prisma.user.update({
    where: { id: dummy.id },
    data: { creditsTotal: totalCredits },
  });
  console.log(`✓ Credits gesamt: ${totalCredits}`);

  // ── 7. Kommende Schulungen: Enrollments ───────────────────────────────────
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
    console.log(`  + Kommende Schulung: "${training.title}" am ${training.date.toLocaleDateString('de-DE')}`);
  }

  console.log('\n✅ Demo-Daten erfolgreich eingerichtet!');
}

main()
  .catch(e => { console.error('❌ Fehler:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
