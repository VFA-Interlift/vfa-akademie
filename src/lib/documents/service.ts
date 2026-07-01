import { prisma } from "@/lib/prisma";

// Erlaubte Dateitypen für hochgeladene Nachweise.
export const ALLOWED_DOC_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};

// Serverless-Body-Limit auf Vercel liegt bei ~4,5 MB → wir bleiben darunter.
export const MAX_DOC_BYTES = 4 * 1024 * 1024;

// Vorschlagskategorien (im UI als Auswahl, frei überschreibbar).
export const DOC_CATEGORIES = [
  "Weiterbildung",
  "Zertifikat",
  "Abschluss",
  "Schulungsnachweis",
  "Sonstiges",
];

export type SerializableDocument = {
  id: string;
  title: string;
  category: string | null;
  issuer: string | null;
  issuedDate: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
};

export async function getMyDocuments(userId: string): Promise<SerializableDocument[]> {
  const docs = await prisma.userDocument.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return docs.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    issuer: d.issuer,
    issuedDate: d.issuedDate ? d.issuedDate.toISOString() : null,
    fileUrl: d.fileUrl,
    fileType: d.fileType,
    fileSize: d.fileSize,
    createdAt: d.createdAt.toISOString(),
  }));
}
