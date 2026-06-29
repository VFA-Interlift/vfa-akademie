-- ============================================================
-- VFA-Akademie Demo-Daten Setup
-- Ausführen im Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  admin_id TEXT;
  dummy_id TEXT;
  t        RECORD;
  enroll   RECORD;
  cert_id  TEXT;
  total_credits INT := 0;
  credits_for_training INT;
  past_trainings TEXT[] := ARRAY[]::TEXT[];
  future_trainings TEXT[] := ARRAY[]::TEXT[];
  tid TEXT;
BEGIN

-- ── 1. Admin: alle Credits löschen ──────────────────────────
SELECT id INTO admin_id FROM "User" WHERE email = 'tobias.doehring@vfa-interlift.de';
IF admin_id IS NULL THEN
  RAISE EXCEPTION 'Admin-User nicht gefunden: tobias.doehring@vfa-interlift.de';
END IF;

DELETE FROM "CreditTransaction" WHERE "userId" = admin_id;
UPDATE "User" SET "creditsTotal" = 0 WHERE id = admin_id;
RAISE NOTICE '✓ Admin-Credits auf 0 gesetzt';

-- ── 2. Dummy-User anlegen oder finden ──────────────────────
SELECT id INTO dummy_id FROM "User" WHERE email = 'tobias-doehring99@web.de';

IF dummy_id IS NULL THEN
  dummy_id := gen_random_uuid()::TEXT;
  INSERT INTO "User" (
    id, email, "passwordHash",
    "firstName", "lastName", name,
    role, "isInstructor", "creditsTotal",
    "createdAt", "updatedAt"
  ) VALUES (
    dummy_id,
    'tobias-doehring99@web.de',
    '$2b$10$Kj9Qz8vXwL2mN5pR3tU6OuYhA4sE7fI1gH0jK8lM2nP5qT9rV3wX',
    'Thomas', 'Mustermann', 'Thomas Mustermann',
    'USER', TRUE, 0,
    NOW(), NOW()
  );
  RAISE NOTICE '✓ Dummy-User angelegt';
ELSE
  UPDATE "User" SET "isInstructor" = TRUE, "updatedAt" = NOW()
  WHERE id = dummy_id;
  RAISE NOTICE '✓ Dummy-User als Dozent markiert';
END IF;

-- ── 3. Alte Demo-Daten des Dummy bereinigen ────────────────
DELETE FROM "CreditTransaction" WHERE "userId" = dummy_id;
DELETE FROM "Certificate"        WHERE "userId" = dummy_id;
DELETE FROM "Enrollment"         WHERE "userId" = dummy_id;
UPDATE "User" SET "creditsTotal" = 0 WHERE id = dummy_id;

-- ── 4. Vergangene Trainings ermitteln (für Zertifikate) ────
SELECT ARRAY(
  SELECT id FROM "Training"
  WHERE date < NOW()
  ORDER BY date DESC
  LIMIT 3
) INTO past_trainings;

IF array_length(past_trainings, 1) < 3 THEN
  RAISE EXCEPTION 'Nicht genug vergangene Trainings (gefunden: %)', array_length(past_trainings, 1);
END IF;

-- ── 5. Kommende Trainings ermitteln ────────────────────────
SELECT ARRAY(
  SELECT id FROM "Training"
  WHERE date > NOW()
  ORDER BY date ASC
  LIMIT 2
) INTO future_trainings;

IF array_length(future_trainings, 1) < 2 THEN
  RAISE EXCEPTION 'Nicht genug kommende Trainings (gefunden: %)', array_length(future_trainings, 1);
END IF;

-- ── 6. Zertifikate + Enrollments + Credits anlegen ─────────
FOREACH tid IN ARRAY past_trainings LOOP
  SELECT * INTO t FROM "Training" WHERE id = tid;

  credits_for_training := CASE WHEN t."creditsAward" > 0 THEN t."creditsAward" ELSE 10 END;

  -- Enrollment
  INSERT INTO "Enrollment" (
    id, "userId", "trainingId",
    status, attended, passed,
    "completedAt", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid()::TEXT, dummy_id, tid,
    'CERTIFICATE_ISSUED', TRUE, TRUE,
    t.date, NOW(), NOW()
  ) RETURNING id INTO enroll;

  -- Certificate
  INSERT INTO "Certificate" (
    id, "userId", "trainingId", "enrollmentId",
    title, "issuedAt", status, credits,
    "certificateKind", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid()::TEXT, dummy_id, tid, enroll.id,
    t.title, t.date, 'ISSUED', credits_for_training,
    COALESCE(t."certificateKind", 'ATTENDANCE_CONFIRMATION'),
    NOW(), NOW()
  ) RETURNING id INTO cert_id;

  -- Credit-Transaktion
  INSERT INTO "CreditTransaction" (
    id, "userId", amount, type, reason,
    "trainingId", "certificateId", "createdAt"
  ) VALUES (
    gen_random_uuid()::TEXT, dummy_id,
    credits_for_training, 'AWARD', 'CERTIFICATE_ISSUED',
    tid, cert_id, NOW()
  );

  total_credits := total_credits + credits_for_training;
  RAISE NOTICE '  + Zertifikat: % — % Credits', t.title, credits_for_training;
END LOOP;

-- Credits-Summe setzen
UPDATE "User" SET "creditsTotal" = total_credits WHERE id = dummy_id;
RAISE NOTICE '✓ Credits gesamt: %', total_credits;

-- ── 7. Kommende Schulungen anlegen ─────────────────────────
FOREACH tid IN ARRAY future_trainings LOOP
  SELECT * INTO t FROM "Training" WHERE id = tid;

  INSERT INTO "Enrollment" (
    id, "userId", "trainingId",
    status, attended, passed,
    "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid()::TEXT, dummy_id, tid,
    'CONFIRMED', FALSE, FALSE,
    NOW(), NOW()
  );
  RAISE NOTICE '  + Kommende Schulung: %', t.title;
END LOOP;

RAISE NOTICE '';
RAISE NOTICE '✅ Demo-Daten erfolgreich eingerichtet!';

END $$;
