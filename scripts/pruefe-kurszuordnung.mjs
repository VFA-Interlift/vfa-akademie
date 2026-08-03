/**
 * Prüft für JEDEN Kurs der Website, ob die App daraus ein Zertifikat erzeugen
 * kann und wie viele Credits sie vergibt.
 *
 * Findet die Sorte Fehler, die im Build nicht auffällt: ein Kurscode, für den
 * keine Vorlage hinterlegt ist, oder ein Kalender, der Credits verspricht, die
 * nie gebucht werden.
 *
 * Aufruf: node scripts/pruefe-kurszuordnung.mjs
 * Braucht keine Datenbank, nur die öffentliche Kursliste.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const wurzel = process.cwd();
const templatesQuelle = readFileSync(
  path.join(wurzel, "src/lib/certificates/templates.ts"),
  "utf8"
);
const pdfQuelle = readFileSync(path.join(wurzel, "src/lib/certificates/pdf.ts"), "utf8");

// Vorlagen je Kurscode. Der Block darf nicht über die Objektgrenze hinausgehen:
// Einträge ohne PDF-Vorlage (SER-SWB, SICH) würden sonst die Datei des nächsten
// Eintrags erben und diesen selbst verschlucken.
const vorlagen = new Map();
for (const m of templatesQuelle.matchAll(
  /^\s{2}"?([A-Za-z0-9/_-]+)"?:\s*\{([^{}]*)\}/gm
)) {
  const datei = /pdfTemplateFileName:\s*"([^"]+)"/.exec(m[2]);
  if (datei) vorlagen.set(m[1].toUpperCase(), datei[1]);
}

// Vorlagen mit Schreibpositionen
const koordBlock = pdfQuelle.slice(pdfQuelle.indexOf("const PDF_COORDS"));
const mitKoordinaten = new Set(
  [...koordBlock.matchAll(/^\s*"([^"]+\.pdf)":/gm)].map((m) => m[1])
);

/** Bildet einen vollen Kurscode auf einen Vorlagenschlüssel ab (wie templates.ts). */
function schluesselFuer(code) {
  const normal = String(code ?? "").trim().toUpperCase();
  if (!normal) return null;
  if (vorlagen.has(normal)) return normal;
  if (normal.startsWith("NUR")) {
    if (normal.startsWith("NUR2")) return "NUR2";
    if (normal.startsWith("NUR1")) return "NUR1";
    if (/[.\-]2(\D|$)/.test(normal)) return "NUR2";
    return "NUR1";
  }
  const basis = normal.split("-")[0].trim();
  return vorlagen.has(basis) ? basis : null;
}

const antwort = await fetch("https://vfa-akademie.vercel.app/api/trainings/public");
const { trainings } = await antwort.json();

const heute = new Date();
const kommend = trainings.filter((t) => new Date(t.endDate ?? t.date) >= heute);

// Je Kurscode zusammenfassen (mehrteilige Kurse tragen denselben Code).
const proCode = new Map();
for (const t of kommend) {
  const code = String(t.code ?? "(ohne)");
  const eintrag = proCode.get(code) ?? { termine: 0, credits: t.creditsAward, titel: t.title };
  eintrag.termine += 1;
  proCode.set(code, eintrag);
}

console.log("Kurscode        Termine  Credits  Vorlage                Ergebnis");
console.log("-".repeat(92));

let ohneZertifikat = 0;
let widerspruch = 0;

for (const [code, info] of [...proCode].sort()) {
  const schluessel = schluesselFuer(code);
  const datei = schluessel ? vorlagen.get(schluessel) : null;
  const erzeugbar = Boolean(datei && mitKoordinaten.has(datei));

  let ergebnis;
  if (erzeugbar) {
    ergebnis = `ok — Zertifikat + ${info.credits} Credits`;
  } else if (info.credits > 0) {
    ergebnis = `WIDERSPRUCH — Kalender verspricht ${info.credits} Credits, es kommt nichts`;
    widerspruch += 1;
  } else {
    ergebnis = "ohne Zertifikat (gewollt, 0 Credits)";
    ohneZertifikat += 1;
  }

  console.log(
    code.padEnd(15),
    String(info.termine).padStart(4),
    String(info.credits).padStart(8),
    " ",
    (schluessel ?? "—").padEnd(21),
    ergebnis
  );
}

console.log("-".repeat(92));
console.log(
  `${proCode.size} Kurse, ${widerspruch} mit Widerspruch, ${ohneZertifikat} bewusst ohne Zertifikat.`
);

// Kein process.exit: Node beschwert sich sonst über das noch offene fetch.
process.exitCode = widerspruch > 0 ? 1 : 0;
