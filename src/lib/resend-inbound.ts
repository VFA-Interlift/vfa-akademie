import { put } from "@vercel/blob";

/** In Blob abgelegter Anhang einer Orga-Mail (als Json auf KursOrgaMail). */
export type OrgaAttachment = {
  url: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
  isImage: boolean;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Der längste bekannte Code, der als eigenständiges Token im Text vorkommt. */
function matchKnownCode(text: string, candidates: string[]): string | null {
  for (const code of candidates) {
    const re = new RegExp(`(^|[^A-Z0-9])${escapeRegExp(code)}([^A-Z0-9]|$)`);
    if (re.test(text)) return code;
  }
  return null;
}

/**
 * Ermittelt den Kurscode aus Betreff und Mailtext.
 *
 * Reihenfolge (erster Treffer gewinnt):
 *  1. bekannter `Training.code` im Betreff (Betreff ist die vom Büro
 *     zugesagte, autoritative Quelle),
 *  2. bekannter `Training.code` im Body (falls im Betreff vergessen),
 *  3. grob code-artiges Token als Fallback (z. B. „A1-2604", „A22602").
 *
 * Bekannte Codes werden mit Wort-Grenzen gematcht (damit „A1" nicht in „A12"
 * trifft) und der längste zuerst (spezifischere Codes bevorzugt). Rückgabe
 * immer UPPERCASE, `null` wenn nichts erkennbar.
 */
export function extractKurscode(subject: string, body: string, knownCodes: string[]): string | null {
  const subj = subject.toUpperCase();
  const bod = body.toUpperCase();

  const candidates = knownCodes
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const fromSubject = matchKnownCode(subj, candidates);
  if (fromSubject) return fromSubject;

  const fromBody = matchKnownCode(bod, candidates);
  if (fromBody) return fromBody;

  // Fallback: typisches Kurscode-Muster (Buchstabenpräfix + Zahlenblock, opt.
  // Bindestrich), erst im Betreff, dann im Body.
  const codeRe = /[A-Z]{1,3}\d{0,2}-?\d{3,4}/;
  const fallback = subj.match(codeRe) ?? bod.match(codeRe);
  return fallback ? fallback[0] : null;
}

/**
 * Lädt die pre-signed Anhänge herunter und legt sie in Vercel Blob ab.
 * Bilder werden inline anzeigbar, andere Dateien (v. a. PDFs wie Teilnehmerliste
 * & Ablaufplan) als Download bereitgestellt. Fehlerhafte einzelne Anhänge werden
 * übersprungen, damit ein kaputter Anhang nicht die ganze Mail blockiert.
 */
export async function uploadInboundAttachments(
  emailId: string,
  kurscode: string,
  attachments: { download_url: string; filename?: string; content_type: string; size: number }[]
): Promise<OrgaAttachment[]> {
  const stored: OrgaAttachment[] = [];
  const kurscodeSlug = kurscode.toLowerCase().replace(/[^a-z0-9]+/gi, "_");

  for (const att of attachments) {
    const contentType = att.content_type || "application/octet-stream";
    try {
      const res = await fetch(att.download_url);
      if (!res.ok) continue;
      const blobData = await res.blob();

      const rawName = att.filename?.trim() || "anhang";
      const safeName = rawName.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-120) || "anhang";

      const blob = await put(`orga-mails/${kurscodeSlug}/${emailId}/${safeName}`, blobData, {
        access: "public",
        addRandomSuffix: true,
        contentType,
      });

      stored.push({
        url: blob.url,
        pathname: blob.pathname,
        filename: rawName,
        contentType,
        size: att.size,
        isImage: contentType.toLowerCase().startsWith("image/"),
      });
    } catch {
      // Einzelnen Anhang überspringen.
    }
  }

  return stored;
}
