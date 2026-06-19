import fs from "node:fs";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

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
    participationDetails: { y: 548, size: 11,             maxWidth: 415, centered: true, prefix: "hat " },
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
  "FFPW-Teilnahmebest. App.pdf":               LAYOUT_STANDARD,
  "MOD_Teilnahmebestätigung App.pdf":          LAYOUT_STANDARD,
  "NuR-1_Teilnahmebestätigung App.pdf":        LAYOUT_STANDARD,
  "NuR-2_Teilnahmebestätigung App.pdf":        LAYOUT_STANDARD,
  "PLG TN-Best App.pdf":                       LAYOUT_STANDARD,
  "SCHALL_TN-Best App.pdf":                    LAYOUT_STANDARD,
  "SON-TN-Bestätigung App.pdf":                LAYOUT_STANDARD,

  // Zertifikate mit Prüfungsanteil (gleicher Blank-Bereich wie Teilnahmebestätigung)
  "DGUV-TN-Zert. App.pdf":    LAYOUT_STANDARD,
  "EFK2-Zertifikat App.pdf":   LAYOUT_STANDARD,
  "GEF-TN-Zert._neu App.pdf": LAYOUT_STANDARD,
};

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

  const templateBytes = await loadPdfTemplate(templateFileName);
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

async function loadPdfTemplate(templateFileName: string) {
  const local = loadTemplateFromFileSystem(templateFileName);
  if (local) return local;

  const remote = await loadTemplateFromRemote(templateFileName);
  if (remote) return remote;

  throw new Error(`PDF_TEMPLATE_NOT_FOUND: ${templateFileName}`);
}

function loadTemplateFromFileSystem(templateFileName: string) {
  const candidates = [
    path.join(process.cwd(), "public", "certificate-templates", templateFileName),
    path.join(process.cwd(), "src", "lib", "certificates", "templates", templateFileName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate);
    }
  }

  return null;
}

async function loadTemplateFromRemote(templateFileName: string) {
  const urls = buildTemplateUrls(templateFileName);

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      continue;
    }
  }

  return null;
}

function buildTemplateUrls(templateFileName: string) {
  const bases = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    "https://vfa-akademie.vercel.app",
  ]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .map((v) => v.replace(/\/$/, ""));

  return Array.from(new Set(bases)).map(
    (base) => `${base}/certificate-templates/${encodeURIComponent(templateFileName)}`
  );
}

function normalizePdfText(value: string) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}
