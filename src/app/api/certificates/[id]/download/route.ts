import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCertificateDocumentData } from "@/lib/certificates/document-data";
import { renderCertificateDocx } from "@/lib/certificates/docx";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error,
      details,
    },
    { status }
  );
}

function encodeFileName(fileName: string) {
  return encodeURIComponent(fileName).replace(/['()]/g, escape);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function GET(_req: Request, context: Ctx) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return fail("UNAUTHENTICATED", 401);
  }

  const { id } = await context.params;

  if (!id) {
    return fail("MISSING_CERTIFICATE_ID", 400);
  }

  const email = session.user.email.trim().toLowerCase();

  const me = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!me) {
    return fail("USER_NOT_FOUND", 404);
  }

  const certificate = await prisma.certificate.findUnique({
    where: {
      id,
    },
    select: {
      userId: true,
    },
  });

  if (!certificate) {
    return fail("CERTIFICATE_NOT_FOUND", 404);
  }

  const isOwner = certificate.userId === me.id;
  const isAdmin = me.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return fail("FORBIDDEN", 403);
  }

  const documentData = await getCertificateDocumentData(id);

  if (!documentData) {
    return fail("CERTIFICATE_NOT_FOUND", 404);
  }

  if (!documentData.templateFileName) {
    return fail("CERTIFICATE_TEMPLATE_NOT_CONFIGURED", 400, {
      code: documentData.certificate.code,
      trainingCode: documentData.certificate.training.code,
    });
  }

  try {
    const buffer = await renderCertificateDocx({
      templateFileName: documentData.templateFileName,
      data: documentData.data,
    });

    const fileName = `${documentData.fileBaseName}.docx`;
    const body = new Uint8Array(buffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeFileName(
          fileName
        )}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.startsWith("TEMPLATE_NOT_FOUND")) {
      return fail("TEMPLATE_NOT_FOUND", 404, message);
    }

    return fail("CERTIFICATE_RENDER_FAILED", 500, message);
  }
}