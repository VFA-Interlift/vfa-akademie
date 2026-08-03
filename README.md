# VFA-Akademie App

Schulungsverwaltung der VFA-Akademie: Kurskalender, Anmeldungen, Anwesenheit,
Zertifikate und Credits. Next.js (App Router) mit Prisma und PostgreSQL, betrieben
auf Vercel, als installierbare Handy-App ausgelegt.

Live: https://vfa-akademie.vercel.app

## Woher die Daten kommen

Es gibt drei Quellen, und sie haben klare Zuständigkeiten:

| Quelle | Liefert | Wie |
|---|---|---|
| **Website vfa-interlift.de** (Wix) | Kurse mit Terminen, Orten, Preisen, Dozenten | `_functions/appKurse`, abgefragt in `src/lib/wix/kurse.ts` |
| **Website, Anmeldeformular** | einzelne Anmeldungen, sofort beim Absenden | Webhook auf `/api/webhooks/wix-anmeldung` |
| **Cobra** (Verbandsverwaltung) | Altbestand an Schulungen und Teilnehmern | nur von Hand über den Adminbereich |

Der Kurskalender liest direkt von der Website. Fällt sie aus, fällt er auf die
eigene Datenbank zurück.

## Wie ein Zertifikat entsteht

1. Der Teilnehmer ist über Website-Anmeldung oder Cobra-Abgleich eingeschrieben.
2. Der Dozent pflegt im Dozentenbereich die Anwesenheit.
3. Nachts prüft `/api/cron/certificates` alle abgelaufenen Schulungen und stellt
   für Anwesende ein Zertifikat aus, bucht die Credits und setzt den Status.
4. Der Teilnehmer lädt es herunter; das PDF wird bei jedem Abruf frisch aus der
   Vorlage erzeugt und nicht gespeichert.

**Ohne erzeugbare Vorlage entsteht kein Zertifikat** — geprüft über
`istZertifikatErzeugbar` in `src/lib/certificates/pdf.ts`. Das betrifft
absichtlich EFK1 und YLD (dort zertifiziert erst EFK2). Ohne diese Prüfung
entstünden Zertifikate, die sich nicht öffnen lassen.

Die Blanko-Vorlagen liegen in `src/lib/certificates/pdf-vorlagen/` — **nicht**
unter `public/`, dort wären sie öffentlich herunterladbar. Damit Vercel sie
mitliefert, sind sie in `next.config.ts` unter `outputFileTracingIncludes`
eingetragen.

Neue Kursart aufnehmen: Eintrag in `CERTIFICATE_TEMPLATES` (`templates.ts`), PDF
in `pdf-vorlagen/` legen, Schreibpositionen in `PDF_COORDS` (`pdf.ts`) ergänzen,
danach `node scripts/pruefe-zertifikatsvorlagen.mjs`.

## Rollen

- **Teilnehmer** sehen ihre Schulungen, Zertifikate, Credits und geben Feedback.
- **Dozenten** (`isInstructor`) sehen die Teilnehmer *ihrer* Kurse, pflegen die
  Anwesenheit und laden die unterschriebene Teilnehmerliste hoch. Die Zuordnung
  läuft über das Dozentenfeld der Website, nicht über eine Datenbankrelation
  (`src/lib/dozent/zuordnung.ts`).
- **Admins** verwalten Nutzer, Schulungen, Credits und den Datenabgleich. Die
  Rolle wird bei jeder Prüfung frisch aus der Datenbank gelesen, nie aus dem
  Anmeldetoken — ein Entzug wirkt sofort.

## Entwickeln

```bash
npm install
npx prisma generate
npm run dev          # http://localhost:3000
```

Prüfen vor jedem Commit:

```bash
npx tsc --noEmit
npx next build
npm run lint
node scripts/pruefe-zertifikatsvorlagen.mjs
```

`npm run build` führt zuerst `prisma migrate deploy` aus und verändert damit die
Datenbank — für eine reine Bauprüfung `npx next build` verwenden.

## Umgebungsvariablen

Pflicht, sonst startet die jeweilige Funktion nicht:

| Variable | Wofür |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | PostgreSQL |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Anmeldung |
| `RESEND_API_KEY` | Mailversand |
| `MAIL_FROM` | Absender. **Fehlt sie, versendet Resend über die Sandbox und stellt nur an freigegebene Empfänger zu — ohne Fehlermeldung.** |
| `CRON_SECRET` | Nachtläufe |
| `WIX_WEBHOOK_SECRET` | Kursabfrage und Anmelde-Webhook |
| `RESEND_INBOUND_WEBHOOK_SECRET` | Orga-Mail-Webhook |
| `BLOB_READ_WRITE_TOKEN` | Dateiablage |
| `COBRA_BASE_URL`, `COBRA_API_KEY`, `COBRA_USERNAME`, `COBRA_PASSWORD` | Cobra-Abgleich |

Mit Rückfallwert: `NEXT_PUBLIC_APP_URL`, `WIX_SITE_BASE_URL`, `REPLY_TO`,
`FEEDBACK_EMAIL`, `REGISTRATION_NOTIFY_EMAIL`.

## Nachtläufe (`vercel.json`)

| Zeit (UTC) | Lauf | Zweck |
|---|---|---|
| 00:05 | `/api/cron/wix/trainings` | Kurse von der Website holen |
| 00:20 | `/api/cron/certificates` | Zertifikate für abgelaufene Schulungen |
| 07:00 | `/api/cron/reminders` | Erinnerung drei Tage vor der Schulung |

Die Reihenfolge ist wichtig: Erst die Kurse holen, dann Zertifikate ausstellen —
sonst arbeitet der Zertifikatslauf mit veralteten Enddaten.

Die Routen unter `/api/cron/cobra/` stehen nicht im Zeitplan und laufen nie. Sie
stammen aus der Zeit vor der Website-Anbindung.

## Was bewusst so ist

- **E-Mail-Bestätigung ist Pflicht.** Erst danach werden vorhandene
  Kursanmeldungen mit dem Konto verbunden. Vorher konnte sich jemand mit einer
  fremden Adresse registrieren und erbte deren Zertifikate und Credits.
- **Hochgeladene Dateien liegen privat** und werden nur über geprüfte Routen
  ausgeliefert (`src/lib/blob-auslieferung.ts`). Vor August 2026 waren sie
  öffentlich abrufbar; Dateien aus dieser Zeit sind es weiterhin.
- **Das Ranking ist anonym** — nur Platz 1 ohne Namen, die eigene Platzierung und
  der Mittelwert. Deshalb gibt es keine Opt-in-Einstellung mehr.
- **Der QR-Code auf der Schulungsseite führt ins Leere.** Einlösen ist nie
  gebaut worden, die Seite `/scan` gibt es nicht.
