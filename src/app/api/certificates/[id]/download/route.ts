import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCertificateDocumentData } from "@/lib/certificates/document-data";
import { renderCertificateDocx } from "@/lib/certificates/docx";
import { renderCertificatePdf } from "@/lib/certificates/pdf";
import { getCertificateTemplateByCode } from "@/lib/certificates/templates";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>;
};

function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error, details }, { status });
}

function encodeFileName(fileName: string) {
  return encodeURIComponent(fileName).replace(/['()]/g, escape);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
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
    where: { email },
    select: { id: true, role: true },
  });

  if (!me) return fail("USER_NOT_FOUND", 404);

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });

  if (!certificate) return fail("CERTIFICATE_NOT_FOUND", 404);

  const isOwner = certificate.userId === me.id;
  const isAdmin = me.role === "ADMIN";

  if (!isOwner && !isAdmin) return fail("FORBIDDEN", 403);

  if (certificate.status !== "ISSUED") {
    return fail("CERTIFICATE_NOT_DOWNLOADABLE", 400, { status: certificate.status });
  }

  const documentData = await getCertificateDocumentData(id);

  if (!documentData) return fail("CERTIFICATE_NOT_FOUND", 404);

  const certificateCode =
    documentData.certificate.code ||
    documentData.certificate.training.code ||
    documentData.data.code ||
    "";

  const templateConfig = getCertificateTemplateByCode(certificateCode);
  const pdfTemplateFileName = templateConfig?.pdfTemplateFileName ?? null;

  try {
    if (pdfTemplateFileName) {
      const pdfBytes = await renderCertificatePdf({
        templateFileName: pdfTemplateFileName,
        data: documentData.data,
      });

      const fileName = `${documentData.fileBaseName}.pdf`;

      return new NextResponse(new Uint8Array(pdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeFileName(fileName)}`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (!documentData.templateFileName) {
      return fail("CERTIFICATE_TEMPLATE_NOT_CONFIGURED", 400, {
        code: documentData.certificate.code,
        trainingCode: documentData.certificate.training.code,
      });
    }

    const buffer = await renderCertificateDocx({
      templateFileName: documentData.templateFileName,
      data: documentData.data,
    });

    const fileName = `${documentData.fileBaseName}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeFileName(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (message.startsWith("PDF_COORDS_NOT_CONFIGURED")) return fail("PDF_COORDS_NOT_CONFIGURED", 500, message);
    if (message.startsWith("PDF_TEMPLATE_NOT_FOUND")) return fail("PDF_TEMPLATE_NOT_FOUND", 404, message);
    if (message.startsWith("TEMPLATE_NOT_FOUND")) return fail("TEMPLATE_NOT_FOUND", 404, message);
    if (message.startsWith("PDF_TEMPLATE_HAS_NO_PAGES")) return fail("PDF_TEMPLATE_HAS_NO_PAGES", 500, message);

    return fail("CERTIFICATE_RENDER_FAILED", 500, message);
  }
}
