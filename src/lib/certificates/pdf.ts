import fs from "node:fs";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { getCertificateTemplateByCode } from "@/lib/certificates/templates";

type CertificatePdfData = Record<string, string>;

type FieldConfig = {
  x?: number;
  y: number;
  size?: number;
  maxWidth?: number;
  bold?: boolean;
  prefix?: string;
  centered?: boolean;
};

type PdfTemplateCoords = {
  fields: Partial<Record<string, FieldConfig>>;
};

const LAYOUT_STANDARD: PdfTemplateCoords = {
  fields: {
    participantName:      { y: 647, size: 13, bold: true, maxWidth: 400, centered: true },
    participantBirthDate: { y: 627, size: 11,             maxWidth: 400, centered: true, prefix: "geb. " },
    participationDetails: { y: 609, size: 11,             maxWidth: 400, centered: true },
  },
};

const LAYOUT_VDI_URKUNDE: PdfTemplateCoords = {
  fields: {
    participantName:      { y: 590, size: 14, bold: true, maxWidth: 415, centered: true },
    participantBirthDate: { y: 568, size: 11,             maxWidth: 415, centered: true, prefix: "geb. am " },
    participationDetails: { y: 548, size: 11,             maxWidth: 415, centered: true },
  },
};

// Key = pdfTemplateFileName aus templates.ts
const PDF_COORDS: Record<string, PdfTemplateCoords> = {
  // VDI 2168 Teilnahmebestätigung
  "VDI2168_A1_Teilnahmebestätigung App.pdf": LAYOUT_STANDARD,

  // VDI 2168 Urkunden (Koordinaten geschätzt – nach erstem Test kalibrieren;
  // außerdem «EMail»-Seriendruckfeld in den Word-Originalen entfernen und neu als PDF exportieren)
  "VDI2168_A2_TN-Zert_VDI App.pdf": LAYOUT_VDI_URKUNDE,
  "VDI2168_B_TN-Zert_VDI App.pdf":  LAYOUT_VDI_URKUNDE,
  "VDI2168_C_TN-Zert_VDI App.pdf":  LAYOUT_VDI_URKUNDE,

  // Teilnahmebestätigungen
  "ARB_TN-Zert App.pdf":                      LAYOUT_STANDARD,
  "AZUBI_Teilnahmebestätigung App.pdf":        LAYOUT_STANDARD,
  "BETR_Teilnahmebestätigung App.pdf":         LAYOUT_STANDARD,
  "BRG_TN-Best App.pdf":                       LAYOUT_STANDARD,
  "DOK_TN-Zert App.pdf":                       LAYOUT_STANDARD,
  "EINST-Online_Teilnahmebestätigung App.pdf": LAYOUT_STANDARD,
  "FPFW-Teilnahmebest. App.pdf":               LAYOUT_STANDARD,
  "FRQ_Teilnahmebestätigung App.pdf":          LAYOUT_STANDARD,
  "IN-SER-TR_Teilnahmebestätigung App.pdf":    LAYOUT_STANDARD,
  "MOD_Teilnahmebestätigung App.pdf":          LAYOUT_STANDARD,
  "MVO_Teilnahmebestätigung App.pdf":          LAYOUT_STANDARD,
  "NuR-1_Teilnahmebestätigung App.pdf":        LAYOUT_STANDARD,
  "NuR-2_Teilnahmebestätigung App.pdf":        LAYOUT_STANDARD,
  "PLG TN-Best App.pdf":                       LAYOUT_STANDARD,
  "SCHALL_TN-Best App.pdf":                    LAYOUT_STANDARD,
  "SON-TN-Bestätigung App.pdf":                LAYOUT_STANDARD,

  // Zertifikate mit Prüfungsanteil
  "DGUV-TN-Zert. App.pdf": {
    fields: {
      participantName:      { y: 667, size: 13, bold: true, maxWidth: 400, centered: true },
      participantBirthDate: { y: 647, size: 11,             maxWidth: 400, centered: true, prefix: "geb. " },
      participationDetails: { y: 629, size: 11,             maxWidth: 400, centered: true },
    },
  },
  "EFK2-Zertifikat App.pdf":   LAYOUT_STANDARD,
  "GEF-TN-Zert._neu App.pdf": LAYOUT_STANDARD,

  // Young Leadership Day. Positionen aus der Hausvorlage gemessen (Grundlinien
  // der ausgefuellten Word-Fassung). Zusaetzlich zum Standard schreibt die App
  // hier den Veranstaltungstitel selbst - er traegt den Jahrgang und stammt
  // aus dem Training ("VFA-Young Leadership Day 2026").
  "YLD_TN-Best App.pdf": {
    fields: {
      participantName:      { y: 637, size: 13, bold: true, maxWidth: 440, centered: true },
      participantBirthDate: { y: 617, size: 11,             maxWidth: 440, centered: true, prefix: "geb. " },
      participationDetails: { y: 595, size: 11,             maxWidth: 440, centered: true },
      trainingTitle:        { y: 518, size: 14, bold: true, maxWidth: 440, centered: true },
    },
  },
};

/**
 * Lässt sich für diesen Kurscode wirklich ein Zertifikat erzeugen?
 *
 * Nicht dasselbe wie „eine Vorlage ist eingetragen": SER-SWB und SICH sind
 * eingetragen, ihre Word-Vorlagen existieren aber nirgends, und bei FRQ und MVO
 * fehlten die Schreibpositionen. In beiden Fällen legte der Zertifikatslauf
 * trotzdem eines an, das sich nicht öffnen ließ.
 *
 * Die zwei vorhandenen Word-Vorlagen (VDI A1 und A2) haben ohnehin eine
 * PDF-Fassung. Als Maßstab genügen deshalb die Schreibpositionen.
 *
 * Steht hier, nicht in templates.ts: templates.ts wird auch im Browser geladen,
 * diese Datei braucht Node-Module.
 */
export function istZertifikatErzeugbar(code: string | null | undefined): boolean {
  const template = getCertificateTemplateByCode(code);
  if (!template?.pdfTemplateFileName) return false;
  return Boolean(PDF_COORDS[template.pdfTemplateFileName]);
}

type RenderCertificatePdfOptions = {
  templateFileName: string;
  data: CertificatePdfData;
};

export async function renderCertificatePdf({
  templateFileName,
  data,
}: RenderCertificatePdfOptions): Promise<Uint8Array> {
  const coords = PDF_COORDS[templateFileName];

  if (!coords) {
    throw new Error(`PDF_COORDS_NOT_CONFIGURED: ${templateFileName}`);
  }

  const templateBytes = loadPdfTemplate(templateFileName);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const page = pages[0];

  if (!page) {
    throw new Error(`PDF_TEMPLATE_HAS_NO_PAGES: ${templateFileName}`);
  }

  for (const [fieldName, fieldCfg] of Object.entries(coords.fields)) {
    if (!fieldCfg) continue;

    const rawValue = data[fieldName] ?? "";

    if (!rawValue) continue;

    const value = fieldCfg.prefix ? `${fieldCfg.prefix}${rawValue}` : rawValue;

    drawText({
      page,
      font: fieldCfg.bold ? boldFont : font,
      text: value,
      x: fieldCfg.x,
      y: fieldCfg.y,
      size: fieldCfg.size ?? 11,
      maxWidth: fieldCfg.maxWidth,
      centered: fieldCfg.centered,
    });
  }

  return pdfDoc.save();
}

type DrawTextOptions = {
  page: PDFPage;
  font: PDFFont;
  text: string;
  x?: number;
  y: number;
  size?: number;
  maxWidth?: number;
  lineHeight?: number;
  centered?: boolean;
};

function drawText({ page, font, text, x = 0, y, size = 11, maxWidth, lineHeight, centered }: DrawTextOptions) {
  const safeText = normalizePdfText(text);

  if (!safeText) return;

  const pageWidth = page.getWidth();
  const resolvedLineHeight = lineHeight ?? size * 1.25;

  const lines = maxWidth
    ? wrapText({ text: safeText, font, size, maxWidth })
    : [safeText];

  lines.forEach((line, index) => {
    const lineWidth = font.widthOfTextAtSize(line, size);
    const drawX = centered ? (pageWidth - lineWidth) / 2 : x;
    page.drawText(line, {
      x: drawX,
      y: y - index * resolvedLineHeight,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  });
}

function wrapText({ text, font, size, maxWidth }: { text: string; font: PDFFont; size: number; maxWidth: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  return lines;
}

/**
 * Die Blanko-Vorlagen lagen bis August 2026 unter `public/` und waren damit für
 * jeden im Netz herunterladbar — Blanko-Urkunden eines Verbands, der
 * Qualifikationen bescheinigt. Sie liegen jetzt in `src/lib/certificates/
 * pdf-vorlagen/`, das Next.js über `outputFileTracingIncludes` (next.config.ts)
 * mit ausliefert, ohne es zu veröffentlichen.
 *
 * Der frühere Rückfall über eine HTTP-Abfrage der eigenen Adresse ist damit
 * ersatzlos entfallen: Er würde die Vorlagen wieder öffentlich voraussetzen.
 */
function loadPdfTemplate(templateFileName: string) {
  const datei = path.join(VORLAGEN_ORDNER, templateFileName);

  if (!fs.existsSync(datei)) {
    throw new Error(`PDF_TEMPLATE_NOT_FOUND: ${templateFileName}`);
  }

  return fs.readFileSync(datei);
}

const VORLAGEN_ORDNER = path.join(
  process.cwd(),
  "src",
  "lib",
  "certificates",
  "pdf-vorlagen"
);

function normalizePdfText(value: string) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}
