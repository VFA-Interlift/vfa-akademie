-- Registrierung ohne vorab angelegtes Konto.
--
-- Bisher entstand das Konto sofort und wurde spaeter bestaetigt. Damit konnte
-- jemand eines auf eine fremde Adresse eroeffnen: Der echte Adressinhaber
-- schaltete es beim Bestaetigen frei, das hinterlegte Passwort gehoerte aber
-- dem anderen. Jetzt haengen die Daten am Token, und das Konto entsteht erst
-- beim Einloesen.

CREATE TABLE "OffeneRegistrierung" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OffeneRegistrierung_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OffeneRegistrierung_token_key" ON "OffeneRegistrierung"("token");
CREATE INDEX "OffeneRegistrierung_token_idx" ON "OffeneRegistrierung"("token");
CREATE INDEX "OffeneRegistrierung_email_idx" ON "OffeneRegistrierung"("email");
