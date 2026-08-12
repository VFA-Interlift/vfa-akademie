-- Kurs-Absage: Zeitpunkt der Absage. Additiv und nullable, daher gefahrlos.
ALTER TABLE "Training" ADD COLUMN "cancelledAt" TIMESTAMP(3);
