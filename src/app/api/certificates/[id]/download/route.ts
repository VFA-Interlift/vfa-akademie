import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateiKopfzeile, fehlerSeite } from "@/lib/dateikopf";
import { getCertificateDocumentData } from "@/lib/certificates/document-data";
import { renderCertificateDocx } from "@/lib/certificates/docx";
import { renderCertificatePdf } from "@/lib/certificates/pdf";
import { getCertificateTemplateByCode } from "@/lib/certificates/templates";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>;
};

/**
 * Die Route wird seit dem 05.09.2026 direkt aufgerufen — der Knopf ist ein
 * echter Link, der einen eigenen Tab öffnet. Ein Fehler landet damit vor den
 * Augen des Nutzers und braucht einen Satz, den man lesen kann; die früheren
 * Fehlerschlüssel wertete nur die App selbst aus.
 */
function fail(text: string, status = 400) {
  return fehlerSeite(text, status);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function GET(_req: Request, context: Ctx) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return fail("Bitte melde dich an und ruf das Dokument noch einmal auf.", 401);
  }

  const { id } = await context.params;

  if (!id) {
    return fail("Zu diesem Aufruf fehlt die Kennung des Zertifikats.", 400);
  }

  const email = session.user.email.trim().toLowerCase();

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!me) return fail("Zu deiner Anmeldung gibt es kein Konto mehr.", 404);

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    select: { userId: true, status: true },
  });

  if (!certificate) return fail("Dieses Zertifikat gibt es nicht.", 404);

  const isOwner = certificate.userId === me.id;
  const isAdmin = me.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return fail("Du hast keine Berechtigung, dieses Zertifikat zu öffnen.", 403);
  }

  if (certificate.status !== "ISSUED") {
    return fail("Dieses Zertifikat ist aktuell nicht freigegeben.", 400);
  }

  try {
    // Im try, damit ein Aussetzer beim Laden der Dokumentdaten als lesbare
    // Seite zurückkommt statt als HTML-500 des Servers (Befund f05-12,
    // 05.09.2026).
    const documentData = await getCertificateDocumentData(id);

    if (!documentData) return fail("Dieses Zertifikat gibt es nicht.", 404);

    const certificateCode =
      documentData.certificate.code ||
      documentData.certificate.training.code ||
      documentData.data.code ||
      "";

    const templateConfig = getCertificateTemplateByCode(certificateCode);
    const pdfTemplateFileName = templateConfig?.pdfTemplateFileName ?? null;

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
          // Leseansicht des Geräts statt Ordner „Downloads".
          "Content-Disposition": dateiKopfzeile(fileName),
          "Cache-Control": "no-store",
        },
      });
    }

    if (!documentData.templateFileName) {
      return fail("Für diese Schulung ist noch keine Zertifikatsvorlage hinterlegt.", 400);
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
        // Word-Dokumente kann kein Browser anzeigen — die gehen weiter in den
        // Download (Altbestand, für den es noch keine PDF-Vorlage gibt).
        "Content-Disposition": dateiKopfzeile(fileName, false),
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    if (
      message.startsWith("PDF_COORDS_NOT_CONFIGURED") ||
      message.startsWith("PDF_TEMPLATE_NOT_FOUND") ||
      message.startsWith("PDF_TEMPLATE_HAS_NO_PAGES") ||
      message.startsWith("TEMPLATE_NOT_FOUND")
    ) {
      return fail("Die Vorlage zu diesem Zertifikat fehlt oder passt nicht. Bitte melde dich bei der Akademie.", 500);
    }

    return fail("Das Zertifikat ließ sich gerade nicht erzeugen. Bitte versuch es später noch einmal.", 500);
  }
}
