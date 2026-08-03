/**
 * Prüft die Zertifikatsstrecke ohne Datenbank: Für jeden Kurscode mit Vorlage
 * wird ein PDF wirklich erzeugt und die Seitenzahl geprüft.
 *
 * Findet genau den Fehler, an dem FRQ und MVO scheiterten: Vorlage eingetragen,
 * Schreibpositionen vergessen — der Build merkt davon nichts, der Teilnehmer
 * bekommt beim Herunterladen einen Serverfehler.
 *
 * Aufruf: node scripts/pruefe-zertifikatsvorlagen.mjs
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const wurzel = process.cwd();
const vorlagenOrdner = path.join(wurzel, "src", "lib", "certificates", "pdf-vorlagen");
const templatesQuelle = readFileSync(
  path.join(wurzel, "src", "lib", "certificates", "templates.ts"),
  "utf8"
);
const pdfQuelle = readFileSync(
  path.join(wurzel, "src", "lib", "certificates", "pdf.ts"),
  "utf8"
);

// Kurscode -> PDF-Vorlage aus templates.ts lesen (ohne TypeScript zu laden).
const eintraege = [
  ...templatesQuelle.matchAll(
    /code:\s*"([^"]+)",[\s\S]{0,400}?templateFileName:\s*"([^"]+)"(?:,\s*\n\s*pdfTemplateFileName:\s*"([^"]+)")?/g
  ),
].map((m) => ({ code: m[1], docx: m[2], pdf: m[3] ?? null }));

// Schlüssel des PDF_COORDS-Objekts.
const koordinatenBlock = pdfQuelle.slice(pdfQuelle.indexOf("const PDF_COORDS"));
const mitKoordinaten = new Set(
  [...koordinatenBlock.matchAll(/^\s*"([^"]+\.pdf)":/gm)].map((m) => m[1])
);

const beispieldaten = {
  participantName: "Erika Mustermann",
  participantBirthDate: "01.01.1990",
  participationDetails: "Musterkurs vom 01.01.2026 bis 03.01.2026 in Hamburg",
};

let fehler = 0;
let geprueft = 0;

console.log("Kurscode   Vorlage                                        Ergebnis");
console.log("-".repeat(96));

for (const eintrag of eintraege) {
  if (!eintrag.pdf) {
    console.log(
      `${eintrag.code.padEnd(10)} ${"(nur Word-Vorlage)".padEnd(46)} uebersprungen — kein PDF hinterlegt`
    );
    continue;
  }

  geprueft += 1;
  const datei = path.join(vorlagenOrdner, eintrag.pdf);

  if (!existsSync(datei)) {
    console.log(`${eintrag.code.padEnd(10)} ${eintrag.pdf.slice(0, 45).padEnd(46)} FEHLER — Datei fehlt`);
    fehler += 1;
    continue;
  }

  if (!mitKoordinaten.has(eintrag.pdf)) {
    console.log(
      `${eintrag.code.padEnd(10)} ${eintrag.pdf.slice(0, 45).padEnd(46)} FEHLER — keine Schreibpositionen`
    );
    fehler += 1;
    continue;
  }

  try {
    const doc = await PDFDocument.load(readFileSync(datei));
    const seiten = doc.getPageCount();
    if (seiten < 1) throw new Error("keine Seiten");

    // Wie im Betrieb: Schrift einbetten und Text schreiben.
    const schrift = await doc.embedFont(StandardFonts.Helvetica);
    const seite = doc.getPage(0);
    seite.drawText(beispieldaten.participantName, {
      x: 80,
      y: 400,
      size: 13,
      font: schrift,
      color: rgb(0, 0, 0),
    });
    const bytes = await doc.save();

    console.log(
      `${eintrag.code.padEnd(10)} ${eintrag.pdf.slice(0, 45).padEnd(46)} ok — ${seiten} Seite(n), ${Math.round(bytes.length / 1024)} kB`
    );
  } catch (e) {
    console.log(
      `${eintrag.code.padEnd(10)} ${eintrag.pdf.slice(0, 45).padEnd(46)} FEHLER — ${e.message}`
    );
    fehler += 1;
  }
}

// Vorlagendateien, die niemand benutzt.
const benutzt = new Set(eintraege.map((e) => e.pdf).filter(Boolean));
const verwaist = readdirSync(vorlagenOrdner).filter((d) => d.endsWith(".pdf") && !benutzt.has(d));

console.log("-".repeat(96));
console.log(`${geprueft} Vorlagen geprueft, ${fehler} fehlerhaft.`);
if (verwaist.length) console.log(`Nicht zugeordnete Dateien im Ordner: ${verwaist.join(", ")}`);

process.exit(fehler > 0 ? 1 : 0);
