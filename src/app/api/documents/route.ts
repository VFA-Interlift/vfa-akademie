import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_DOC_TYPES, MAX_DOC_BYTES, getMyDocuments } from "@/lib/documents/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

async function currentUser(email: string) {
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return fail("UNAUTHENTICATED", 401);

  const me = await currentUser(session.user.email.trim().toLowerCase());
  if (!me) return fail("USER_NOT_FOUND", 404);

  return NextResponse.json({ ok: true, documents: await getMyDocuments(me.id) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return fail("UNAUTHENTICATED", 401);

  const me = await currentUser(session.user.email.trim().toLowerCase());
  if (!me) return fail("USER_NOT_FOUND", 404);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("INVALID_FORM", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return fail("NO_FILE", 400);

  if (!ALLOWED_DOC_TYPES[file.type]) return fail("UNSUPPORTED_TYPE", 415);
  if (file.size === 0) return fail("EMPTY_FILE", 400);
  if (file.size > MAX_DOC_BYTES) return fail("FILE_TOO_LARGE", 413);

  const title = String(form.get("title") ?? "").trim().slice(0, 200);
  if (!title) return fail("MISSING_TITLE", 400);

  const category = String(form.get("category") ?? "").trim().slice(0, 80) || null;
  const issuer = String(form.get("issuer") ?? "").trim().slice(0, 200) || null;
  const issuedRaw = String(form.get("issuedDate") ?? "").trim();
  let issuedDate: Date | null = null;
  if (issuedRaw) {
    const d = new Date(issuedRaw);
    if (!Number.isNaN(d.getTime())) issuedDate = d;
  }

  // In Vercel Blob ablegen (öffentlich, aber mit unrätselbarem Zufalls-Suffix).
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-120) || "nachweis";
  let blob;
  try {
    blob = await put(`documents/${me.id}/${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
  } catch {
    return fail("UPLOAD_FAILED", 502);
  }

  const doc = await prisma.userDocument.create({
    data: {
      userId: me.id,
      title,
      category,
      issuer,
      issuedDate,
      fileUrl: blob.url,
      filePathname: blob.pathname,
      fileType: file.type,
      fileSize: file.size,
    },
  });

  return NextResponse.json({
    ok: true,
    document: {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      issuer: doc.issuer,
      issuedDate: doc.issuedDate ? doc.issuedDate.toISOString() : null,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      createdAt: doc.createdAt.toISOString(),
    },
  });
}
