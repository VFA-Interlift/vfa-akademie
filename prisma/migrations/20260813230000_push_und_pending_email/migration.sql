-- Nachgezogene Migration für die Änderungen vom 13.08.2026, die zunächst per
-- `prisma db push` auf der Live-DB landeten (Web Push, Erinnerungs-Tagesmarke,
-- E-Mail-Wechsel über pendingEmail). Bewusst idempotent (IF NOT EXISTS), damit
-- `migrate deploy` sie auf der Live-DB gefahrlos registriert und auf frischen
-- Datenbanken (Preview, Restore) alles vollständig aufbaut.

-- E-Mail-Wechsel: neue Adresse wartet am Token, bis der Link eingelöst ist.
ALTER TABLE "EmailVerificationToken" ADD COLUMN IF NOT EXISTS "pendingEmail" TEXT;

-- Web-Push-Abo je Gerät/Endpunkt.
CREATE TABLE IF NOT EXISTS "PushAbo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushAbo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PushAbo_endpoint_key" ON "PushAbo"("endpoint");
CREATE INDEX IF NOT EXISTS "PushAbo_userId_idx" ON "PushAbo"("userId");

-- Fremdschlüssel: Postgres kennt kein ADD CONSTRAINT IF NOT EXISTS, daher geprüft.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PushAbo_userId_fkey'
    ) THEN
        ALTER TABLE "PushAbo" ADD CONSTRAINT "PushAbo_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Ein Erinnerungslauf je Kalendertag (Cron-Doppellauf-Schutz).
CREATE TABLE IF NOT EXISTS "ErinnerungsLauf" (
    "datum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErinnerungsLauf_pkey" PRIMARY KEY ("datum")
);

-- VAPID-Schlüsselpaar, genau eine Zeile (id = 1).
CREATE TABLE IF NOT EXISTS "WebPushSchluessel" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebPushSchluessel_pkey" PRIMARY KEY ("id")
);
