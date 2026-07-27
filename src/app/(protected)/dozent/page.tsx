import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fetchWixKurse, kursDozentenOf, kursHospitationOf, kursLocationOf, parseKursBlocks, type WixKurs } from "@/lib/wix/kurse";
import { cleanOrgaText, SIGNATURE_IMAGE_MAX_BYTES } from "@/lib/resend-inbound";
import { isInstructorMatch, participantKurscode } from "@/lib/dozent/zuordnung";
import DozentKurseClient, { type DozentKurs } from "./DozentKurseClient";

export const dynamic = "force-dynamic";


export default async function DozentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true, firstName: true, lastName: true, name: true, isInstructor: true },
  });

  if (!user) redirect("/login");
  if (!user.isInstructor) redirect("/dashboard");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Kurse kommen von der Website (dort werden Dozent 1–4 gepflegt).
  let wixKurse: WixKurs[] = [];
  let websiteError = false;
  try {
    wixKurse = await fetchWixKurse();
  } catch {
    websiteError = true;
  }

  // Kurse, bei denen der Nutzer Dozent ODER Hospitant ist (Rolle merken).
  // Vergangene Kurse bleiben drin, damit Dozenten weiterhin ihr Feedback sehen.
  const meine: {
    kurs: WixKurs;
    rolle: "DOZENT" | "HOSPITATION";
    vergangen: boolean;
    sortDate: Date;
  }[] = [];
  for (const kurs of wixKurse) {
    const blocks = parseKursBlocks(kurs.startdatum);
    if (blocks.length === 0) continue;
    const last = blocks[blocks.length - 1];
    const endOfKurs = last.endDate ?? last.date;
    const vergangen = endOfKurs < today;

    const istDozent = kursDozentenOf(kurs).some((d) => isInstructorMatch(d, user));
    const istHospitant =
      !istDozent && kursHospitationOf(kurs).some((d) => isInstructorMatch(d, user));

    if (istDozent) meine.push({ kurs, rolle: "DOZENT", vergangen, sortDate: blocks[0].date });
    else if (istHospitant) meine.push({ kurs, rolle: "HOSPITATION", vergangen, sortDate: blocks[0].date });
  }

  // Bevorstehende zuerst (nächster Termin oben), danach vergangene (neueste oben).
  meine.sort((a, b) => {
    if (a.vergangen !== b.vergangen) return a.vergangen ? 1 : -1;
    return a.vergangen
      ? b.sortDate.getTime() - a.sortDate.getTime()
      : a.sortDate.getTime() - b.sortDate.getTime();
  });

  // Website-Anmeldungen (Staging) den Kursen per Kurscode zuordnen.
  const websiteParticipants = meine.length
    ? await prisma.cobraTrainingParticipant.findMany({
        where: { participantType: "WIX_WEBSITE" },
        select: { id: true, firstName: true, lastName: true, participantText: true, attendanceStatus: true, raw: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  // Feedback je Kurs: DB-Training per Kurscode matchen und Abgaben zählen.
  const codes = meine.map(({ kurs }) => kurs.kurscode.trim()).filter(Boolean);
  const dbTrainings = codes.length
    ? await prisma.training.findMany({
        where: { code: { in: codes, mode: "insensitive" } },
        select: { id: true, code: true, _count: { select: { feedbacks: true } } },
      })
    : [];
  const feedbackByCode = new Map(
    dbTrainings.map((t) => [String(t.code ?? "").toUpperCase(), { trainingId: t.id, count: t._count.feedbacks }])
  );

  // Orga-/Bestätigungsmails je Kurscode (kommen per Resend-Inbound rein).
  const codesUpper = codes.map((c) => c.toUpperCase());
  const orgaRows = codesUpper.length
    ? await prisma.kursOrgaMail.findMany({
        where: { kurscode: { in: codesUpper } },
        orderBy: { receivedAt: "desc" },
      })
    : [];
  const orgaFmt = new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });
  const orgaByCode = new Map<string, DozentKurs["orga"]>();
  for (const row of orgaRows) {
    const rawAtts = Array.isArray(row.attachments) ? row.attachments : [];
    const atts = rawAtts
      .map((a) => (a && typeof a === "object" ? (a as Record<string, unknown>) : null))
      .filter((a): a is Record<string, unknown> => !!a && typeof a.url === "string");
    const images = atts
      .filter((a) => {
        if (a.isImage !== true) return false;
        // Kleine Bilder = i. d. R. Signatur-Grafiken → auch bei bereits
        // gespeicherten Mails ausblenden.
        const size = typeof a.size === "number" ? a.size : Number(a.size);
        return !(Number.isFinite(size) && size < SIGNATURE_IMAGE_MAX_BYTES);
      })
      .map((a) => ({ url: String(a.url), filename: String(a.filename ?? "Bild") }));
    const files = atts
      .filter((a) => a.isImage !== true)
      .map((a) => ({ url: String(a.url), filename: String(a.filename ?? "Datei") }));

    const list = orgaByCode.get(row.kurscode) ?? [];
    list.push({
      id: row.id,
      subject: row.subject,
      fromAddress: row.fromAddress,
      receivedText: orgaFmt.format(row.receivedAt),
      text: cleanOrgaText(row.text),
      images,
      files,
    });
    orgaByCode.set(row.kurscode, list);
  }

  // Unterschriebene Teilnehmerlisten (Dozenten-Uploads) je Kurscode.
  const signatureRows = codesUpper.length
    ? await prisma.signedParticipantList.findMany({
        where: { kurscode: { in: codesUpper } },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const signaturesByCode = new Map<string, DozentKurs["signatureLists"]>();
  for (const row of signatureRows) {
    const list = signaturesByCode.get(row.kurscode) ?? [];
    list.push({
      id: row.id,
      url: row.fileUrl,
      uploadedByName: row.uploadedByName,
      uploadedText: orgaFmt.format(row.createdAt),
      pageCount: row.pageCount,
      mine: row.uploadedById === user.id,
    });
    signaturesByCode.set(row.kurscode, list);
  }

  const kurse: DozentKurs[] = meine.map(({ kurs, rolle, vergangen }) => {
    const code = kurs.kurscode.trim().toUpperCase();
    const participants = websiteParticipants
      .filter((p) => participantKurscode(p.raw) === code && code !== "")
      .map((p) => ({
        id: p.id,
        name: [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.participantText,
        attendanceStatus: p.attendanceStatus,
      }));

    const feedback = feedbackByCode.get(code) ?? null;

    return {
      id: kurs.id,
      title: kurs.title || kurs.kurscodeAnzeige || kurs.kurscode,
      code: kurs.kurscodeAnzeige || kurs.kurscode,
      datumText: kurs.startdatum,
      ort: kursLocationOf(kurs),
      rolle,
      vergangen,
      matchCode: code,
      feedback: feedback && feedback.count > 0 ? feedback : null,
      orga: orgaByCode.get(code) ?? [],
      signatureLists: signaturesByCode.get(code) ?? [],
      participants,
    };
  });

  return (
    <main className="page-main">
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <AnimatedSection delayMs={0}>
          <PageHeader title="Dozentenbereich" showTitle={true} />
        </AnimatedSection>

        {websiteError ? (
          <AnimatedSection delayMs={80}>
            <AppCard>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#B00020", marginBottom: 8 }}>
                Kurse konnten nicht geladen werden
              </div>
              <p style={{ color: "#555555", lineHeight: 1.6, margin: 0 }}>
                Die Website ist gerade nicht erreichbar. Bitte versuche es später erneut.
              </p>
            </AppCard>
          </AnimatedSection>
        ) : kurse.length === 0 ? (
          <AnimatedSection delayMs={80}>
            <AppCard>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#007873", marginBottom: 8 }}>
                Keine Schulungen gefunden
              </div>
              <p style={{ color: "#555555", lineHeight: 1.6, margin: 0 }}>
                Es wurden keine Schulungen gefunden, bei denen dein Name als Dozent
                oder Hospitant hinterlegt ist. Die Dozenten werden auf der Website (Felder
                „Dozent 1–4" bzw. „Hospitation" der Schulung) gepflegt – Vor- und Nachname
                müssen mit deinem Profil übereinstimmen.
              </p>
            </AppCard>
          </AnimatedSection>
        ) : (
          <AnimatedSection delayMs={80}>
            <DozentKurseClient kurse={kurse} />
          </AnimatedSection>
        )}
      </div>
    </main>
  );
}
