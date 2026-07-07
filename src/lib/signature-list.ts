import { PDFDocument } from "pdf-lib";

/** Größte Kantenlänge einer PDF-Seite (Punkte). Deckelt sehr große Fotos. */
const MAX_PAGE_EDGE = 1600;

/**
 * Baut aus mehreren JPEG-Bildern ein mehrseitiges PDF – eine Seite pro Bild,
 * Seitengröße = Bildgröße (auf MAX_PAGE_EDGE gedeckelt, Seitenverhältnis bleibt).
 * Erwartet bereits JPEG (der Client normalisiert Fotos vor dem Upload auf JPEG).
 */
export async function buildPdfFromJpegs(images: Uint8Array[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const bytes of images) {
    const img = await pdf.embedJpg(bytes);

    let { width, height } = img;
    const longest = Math.max(width, height);
    if (longest > MAX_PAGE_EDGE) {
      const scale = MAX_PAGE_EDGE / longest;
      width *= scale;
      height *= scale;
    }

    const page = pdf.addPage([width, height]);
    page.drawImage(img, { x: 0, y: 0, width, height });
  }

  return pdf.save();
}
