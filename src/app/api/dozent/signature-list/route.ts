import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPdfFromJpegs } from "@/lib/signature-list";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILES = 20;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB je Bild

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Eingeloggten Dozenten laden (Session → User). */
async function currentInstructor(email: string) {
  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, lastName: true, name: true, email: true, isInstructor: true },
  });
  if (!me || !me.isInstructor) return null;
  return me;
}

/**
 * Dozent lädt Fotos der unterschriebenen Teilnehmerliste hoch → mehrseitiges
 * PDF (Vercel Blob), der Schulung über den Kurscode zugeordnet.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return fail("UNAUTHENTICATED", 401);

  const me = await currentInstructor(email);
  if (!me) return fail("FORBIDDEN", 403);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("INVALID_FORM");
  }

  const kurscode = String(form.get("kurscode") ?? "").trim().toUpperCase();
  if (!kurscode) return fail("MISSING_KURSCODE");

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return fail("NO_FILES");
  if (files.length > MAX_FILES) return fail("TOO_MANY_FILES", 413);

  const images: Uint8Array[] = [];
  for (const file of files) {
    if (file.type !== "image/jpeg") return fail("UNSUPPORTED_TYPE", 415);
    if (file.size === 0) return fail("EMPTY_FILE");
    if (file.size > MAX_BYTES) return fail("FILE_TOO_LARGE", 413);
    images.push(new Uint8Array(await file.arrayBuffer()));
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await buildPdfFromJpegs(images);
  } catch {
    return fail("PDF_BUILD_FAILED", 500);
  }

  const kurscodeSlug = kurscode.toLowerCase().replace(/[^a-z0-9]+/gi, "_");
  let blob;
  try {
    blob = await put(`signature-lists/${kurscodeSlug}/${Date.now()}.pdf`, Buffer.from(pdfBytes), {
      access: "public",
      addRandomSuffix: true,
      contentType: "application/pdf",
    });
  } catch {
    return fail("UPLOAD_FAILED", 502);
  }

  const training = await prisma.training.findFirst({
    where: { code: { equals: kurscode, mode: "insensitive" } },
    select: { id: true },
  });

  const uploadedByName =
    [me.firstName, me.lastName].filter(Boolean).join(" ").trim() || me.name || me.email || "Dozent";

  const sheet = await prisma.signedParticipantList.create({
    data: {
      kurscode,
      trainingId: training?.id ?? null,
      uploadedById: me.id,
      uploadedByName,
      fileUrl: blob.url,
      filePathname: blob.pathname,
      pageCount: images.length,
    },
    select: { id: true, fileUrl: true, uploadedByName: true, pageCount: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, sheet });
}

/** Dozent löscht einen eigenen Upload (Row + Blob-Datei). */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return fail("UNAUTHENTICATED", 401);

  const me = await currentInstructor(email);
  if (!me) return fail("FORBIDDEN", 403);

  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return fail("MISSING_ID");

  const sheet = await prisma.signedParticipantList.findUnique({
    where: { id },
    select: { id: true, uploadedById: true, fileUrl: true },
  });
  if (!sheet) return fail("NOT_FOUND", 404);
  if (sheet.uploadedById !== me.id) return fail("FORBIDDEN", 403);

  try {
    await del(sheet.fileUrl);
  } catch {
    // Blob-Löschung fehlgeschlagen – Row trotzdem entfernen, Datei ist verwaist.
  }
  await prisma.signedParticipantList.delete({ where: { id: sheet.id } });

  return NextResponse.json({ ok: true });
}
