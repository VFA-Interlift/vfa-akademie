/**
 * Quick test: renders certificate PDFs with sample data and saves to /tmp.
 * Usage: node scripts/test-pdf-render.mjs
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const outDir = os.tmpdir();

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function renderTest(templateFile, fields, label) {
  const templatePath = path.join(rootDir, "public", "certificate-templates", templateFile);
  if (!fs.existsSync(templatePath)) {
    console.error(`✗ Template not found: ${templateFile}`);
    return;
  }

  const pdfDoc = await PDFDocument.load(fs.readFileSync(templatePath));
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.getPages()[0];
  const { height } = page.getSize();

  console.log(`\n${label}: page height = ${height.toFixed(1)} PDF units`);

  for (const f of fields) {
    const usedFont = f.bold ? boldFont : font;
    const lines = wrapText(f.text, usedFont, f.size, f.maxWidth ?? 999);
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: f.x,
        y: f.y - i * (f.size * 1.25),
        size: f.size,
        font: usedFont,
        color: rgb(0, 0, 0),
      });
    });
    console.log(`  field y=${f.y}: "${f.text.slice(0, 60)}"`);
  }

  const outPath = path.join(outDir, `test-${label.replace(/\s+/g, "-")}.pdf`);
  fs.writeFileSync(outPath, await pdfDoc.save());
  console.log(`  → Saved: ${outPath}`);
}

// Standard layout test (ARB as reference) — coordinates match LAYOUT_STANDARD in pdf.ts
await renderTest(
  "ARB_TN-Zert App.pdf",
  [
    { x: 185, y: 647, size: 13, bold: true,  maxWidth: 300, text: "Max Mustermann" },
    { x: 185, y: 627, size: 11, bold: false, maxWidth: 300, text: "geb. 01.01.1980" },
    { x: 185, y: 609, size: 11, bold: false, maxWidth: 300, text: "am 14.04.2026 in Marburg" },
  ],
  "ARB-Standard"
);

// VDI A2 test — coordinates match LAYOUT_VDI_URKUNDE in pdf.ts
await renderTest(
  "VDI2168_A2_TN-Zert_VDI App.pdf",
  [
    { x: 90, y: 590, size: 14, bold: true,  maxWidth: 415, text: "Max Mustermann" },
    { x: 90, y: 568, size: 11, bold: false, maxWidth: 250, text: "geb. am 01.01.1980" },
    { x: 90, y: 548, size: 11, bold: false, maxWidth: 415, text: "hat vom 21.04.2026 bis 23.04.2026 in Düsseldorf" },
  ],
  "VDI-A2"
);

// VDI C test (larger blank area)
await renderTest(
  "VDI2168_C_TN-Zert_VDI App.pdf",
  [
    { x: 90, y: 590, size: 14, bold: true,  maxWidth: 415, text: "Max Mustermann" },
    { x: 90, y: 568, size: 11, bold: false, maxWidth: 250, text: "geb. am 01.01.1980" },
    { x: 90, y: 548, size: 11, bold: false, maxWidth: 415, text: "hat vom 21.04.2026 bis 23.04.2026 in Düsseldorf" },
  ],
  "VDI-C"
);

console.log("\nOpen the PDFs in a PDF viewer to check coordinates.");
