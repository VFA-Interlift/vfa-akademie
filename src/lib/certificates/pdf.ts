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

type RenderCertificatePdfOptions = {
  templateFileName: string;
  data: CertificatePdfData;
};

type DrawTextOptions = {
  page: PDFPage;
  font: PDFFont;
  text: string;
  x: number;
  y: number;
  size?: number;
  maxWidth?: number;
  lineHeight?: number;
};

export async function renderCertificatePdf({
  templateFileName,
  data,
}: RenderCertificatePdfOptions) {
  const templateBytes = await loadPdfTemplate(templateFileName);

  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  if (!firstPage) {
    throw new Error(`PDF_TEMPLATE_HAS_NO_PAGES: ${templateFileName}`);
  }

  drawA1Certificate({
    page: firstPage,
    font,
    boldFont,
    data,
  });

  return pdfDoc.save();
}

function drawA1Certificate({
  page,
  font,
  boldFont,
  data,
}: {
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  data: CertificatePdfData;
}) {
  const participantName = data.participantName || data.fullName || "";
  const participantBirthDate = data.participantBirthDate || data.birthDate || "";

  const trainingDateRange =
    data.trainingDateRange || data.trainingPeriod || data.trainingDate || "";

  const trainingLocation = data.trainingLocation || data.location || "";

  const participationDetails = [trainingDateRange, "in", trainingLocation]
    .filter(Boolean)
    .join(" ");

  drawText({
    page,
    font: boldFont,
    text: participantName,
    x: 185,
    y: 629,
    size: 13,
    maxWidth: 300,
  });

  drawText({
    page,
    font,
    text: participantBirthDate,
    x: 318,
    y: 606,
    size: 11,
    maxWidth: 180,
  });

  drawText({
    page,
    font,
    text: participationDetails,
    x: 192,
    y: 561,
    size: 11,
    maxWidth: 360,
  });
}

function drawText({
  page,
  font,
  text,
  x,
  y,
  size = 11,
  maxWidth,
  lineHeight,
}: DrawTextOptions) {
  const safeText = normalizePdfText(text);

  if (!safeText) {
    return;
  }

  if (!maxWidth) {
    page.drawText(safeText, {
      x,
      y,
      size,
      font,
      color: rgb(0, 0, 0),
    });

    return;
  }

  const lines = wrapText({
    text: safeText,
    font,
    size,
    maxWidth,
  });

  const resolvedLineHeight = lineHeight ?? size * 1.25;

  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * resolvedLineHeight,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  });
}

function wrapText({
  text,
  font,
  size,
  maxWidth,
}: {
  text: string;
  font: PDFFont;
  size: number;
  maxWidth: number;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];

  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    const nextWidth = font.widthOfTextAtSize(nextLine, size);

    if (nextWidth <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function loadPdfTemplate(templateFileName: string) {
  const localTemplate = loadTemplateFromFileSystem(templateFileName);

  if (localTemplate) {
    return localTemplate;
  }

  const remoteTemplate = await loadTemplateFromRemote(templateFileName);

  if (remoteTemplate) {
    return remoteTemplate;
  }

  throw new Error(`PDF_TEMPLATE_NOT_FOUND: ${templateFileName}`);
}

function loadTemplateFromFileSystem(templateFileName: string) {
  const candidates = [
    path.join(
      process.cwd(),
      "public",
      "certificate-templates",
      templateFileName
    ),
    path.join(
      process.cwd(),
      "src",
      "lib",
      "certificates",
      "templates",
      templateFileName
    ),
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
      const res = await fetch(url, {
        cache: "no-store",
      });

      if (!res.ok) {
        continue;
      }

      const arrayBuffer = await res.arrayBuffer();

      return Buffer.from(arrayBuffer);
    } catch {
      continue;
    }
  }

  return null;
}

function buildTemplateUrls(templateFileName: string) {
  const bases = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    "https://vfa-akademie.vercel.app",
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .map((value) => value.replace(/\/$/, ""));

  const uniqueBases = Array.from(new Set(bases));

  return uniqueBases.map((base) => {
    return `${base}/certificate-templates/${encodeURIComponent(
      templateFileName
    )}`;
  });
}

function normalizePdfText(value: string) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}