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

type ApiErrorResponse = {
  ok: false;
  error: string;
  message: string;
  details?: unknown;
};

const DOWNLOADABLE_CERTIFICATE_STATUSES = ["ISSUED"];

function fail(
  error: string,
  status = 400,
  message = "Das Zertifikat konnte nicht geladen werden.",
  details?: unknown
) {
  const body: ApiErrorResponse = {
    ok: false,
    error,
    message,
    details,
  };

  return NextResponse.json(body, { status });
}

function encodeFileName(fileName: string) {
  return encodeURIComponent(fileName);
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
    return fail(
      "UNAUTHENTICATED",
      401,
      "Bitte melde dich an, um das Dokument herunterzuladen."
    );
  }

  const { id } = await context.params;

  if (!id) {
    return fail("MISSING_CERTIFICATE_ID", 400, "Die Zertifikats-ID fehlt.");
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
    return fail(
      "USER_NOT_FOUND",
      404,
      "Der angemeldete Nutzer wurde nicht gefunden."
    );
  }

  const certificate = await prisma.certificate.findUnique({
    where: {
      id,
    },
    select: {
      userId: true,
      status: true,
    },
  });

  if (!certificate) {
    return fail(
      "CERTIFICATE_NOT_FOUND",
      404,
      "Das Zertifikat wurde nicht gefunden."
    );
  }

  const isOwner = certificate.userId === me.id;
  const isAdmin = me.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return fail(
      "FORBIDDEN",
      403,
      "Du hast keine Berechtigung, dieses Zertifikat herunterzuladen."
    );
  }

  if (!DOWNLOADABLE_CERTIFICATE_STATUSES.includes(certificate.status)) {
    return fail(
      "CERTIFICATE_NOT_DOWNLOADABLE",
      400,
      "Dieses Zertifikat ist aktuell nicht für den Download freigegeben.",
      {
        status: certificate.status,
      }
    );
  }

  const documentData = await getCertificateDocumentData(id);

  if (!documentData) {
    return fail(
      "CERTIFICATE_DOCUMENT_DATA_NOT_FOUND",
      404,
      "Die Zertifikatsdaten konnten nicht geladen werden."
    );
  }

  if (!documentData.templateFileName) {
    return fail(
      "CERTIFICATE_TEMPLATE_NOT_CONFIGURED",
      400,
      "Für diesen Zertifikatstyp ist noch keine Vorlage hinterlegt.",
      {
        code: documentData.certificate.code,
        trainingCode: documentData.certificate.training.code,
      }
    );
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
      return fail(
        "TEMPLATE_NOT_FOUND",
        404,
        "Die hinterlegte Zertifikatsvorlage wurde nicht gefunden.",
        message
      );
    }

    return fail(
      "CERTIFICATE_RENDER_FAILED",
      500,
      "Das Zertifikat konnte nicht erstellt werden.",
      message
    );
  }
}

