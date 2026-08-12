-- Rueckmeldung der Testrunde zur App selbst.
--
-- TrainingFeedback haengt zwingend an einer Anmeldung (enrollmentId ist dort
-- unique und Pflicht). Das Testfeedback bezieht sich auf die App als Ganzes und
-- braucht deshalb eine eigene Tabelle. Eine Einsendung je Tester: userId ist
-- unique, ein erneutes Absenden ueberschreibt die Antworten.

CREATE TABLE "AppTestFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppTestFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppTestFeedback_userId_key" ON "AppTestFeedback"("userId");

CREATE INDEX "AppTestFeedback_createdAt_idx" ON "AppTestFeedback"("createdAt");

ALTER TABLE "AppTestFeedback"
    ADD CONSTRAINT "AppTestFeedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
