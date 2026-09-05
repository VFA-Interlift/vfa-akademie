import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Kennzahl from "@/components/ui/Kennzahl";
import Meldung from "@/components/ui/Meldung";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { formatEnrollmentStatus } from "@/lib/trainings/format";
import { fetchWixKurse, kursDozentenOf, kursLocationOf, parseKursBlocks, type WixKurs } from "@/lib/wix/kurse";
import AdminSchulungenClient, { type AdminKurs } from "./AdminSchulungenClient";
import { participantKurscode } from "@/lib/dozent/zuordnung";

export const dynamic = "force-dynamic";

export default async function AdminSchulungenPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  const me = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") redirect("/dashboard");

  let wixKurse: WixKurs[] = [];
  let websiteError = false;
  try {
    wixKurse = await fetchWixKurse();
  } catch {
    websiteError = true;
  }

  const [participants, dbTrainings] = await Promise.all([
    prisma.cobraTrainingParticipant.findMany({
      where: { participantType: "WIX_WEBSITE" },
      select: { firstName: true, lastName: true, participantText: true, company: true, email: true, attendanceStatus: true, raw: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.training.findMany({
      where: { code: { not: null } },
      select: {
        code: true,
        enrollments: {
          select: {
            status: true,
            user: { select: { firstName: true, lastName: true, name: true, email: true } },
          },
        },
      },
    }),
  ]);

  const enrollmentsByCode = new Map<string, { name: string; status: string }[]>();
  for (const t of dbTrainings) {
    const code = String(t.code ?? "").toUpperCase();
    if (!code || t.enrollments.length === 0) continue;
    // Gleicher Kurscode bei zwei Schulungen: Listen zusammenführen statt
    // überschreiben, sonst verschwinden die Anmeldungen der ersten (05.09.2026).
    enrollmentsByCode.set(code, [
      ...(enrollmentsByCode.get(code) ?? []),
      ...t.enrollments.map((e) => ({
        name:
          [e.user.firstName, e.user.lastName].filter(Boolean).join(" ").trim() ||
          e.user.name ||
          e.user.email,
        status: formatEnrollmentStatus(e.status),
      })),
    ]);
  }

  // Unterschriebene Teilnehmerlisten (Dozenten-Uploads) je Kurscode.
  const signatureRows = await prisma.signedParticipantList.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, kurscode: true, fileUrl: true, uploadedByName: true, pageCount: true, createdAt: true },
  });
  const sigFmt = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" });
  const signaturesByCode = new Map<string, AdminKurs["signatureLists"]>();
  for (const row of signatureRows) {
    const list = signaturesByCode.get(row.kurscode) ?? [];
    list.push({
      id: row.id,
      // Geschützte Route statt Blob-Adresse: die Datei liegt privat.
      url: `/api/dozent/signature-list/${row.id}/datei`,
      uploadedByName: row.uploadedByName,
      uploadedText: sigFmt.format(row.createdAt),
      pageCount: row.pageCount,
    });
    signaturesByCode.set(row.kurscode, list);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Rang der Anwesenheit: gepflegte Zeile schlägt ungepflegte, „anwesend“ schlägt alles.
  const rang = (status: string | null) => (status === "ANWESEND" ? 2 : status ? 1 : 0);

  const kurse: AdminKurs[] = wixKurse.map((kurs) => {
    const code = kurs.kurscode.trim().toUpperCase();
    const blocks = parseKursBlocks(kurs.startdatum);
    const start = blocks[0]?.date ?? null;
    const last = blocks[blocks.length - 1];
    const end = last ? (last.endDate ?? last.date) : null;

    const zeilen = participants.filter((p) => code && participantKurscode(p.raw) === code);

    // Doppelte Website-Anmeldungen derselben Person je E-Mail zusammenfassen —
    // dieselbe Regel wie im Dozentenbereich (dozent/page.tsx, 20.08.2026), sonst
    // zählt der Admin mehr Teilnehmer und eine andere Anwesenheitsquote als der
    // Dozent (05.09.2026). Ohne E-Mail wird nichts zusammengefasst.
    const jeMail = new Map<string, (typeof zeilen)[number]>();
    for (const p of zeilen) {
      const key = p.email?.toLowerCase();
      if (!key) continue;
      const bisher = jeMail.get(key);
      if (!bisher || rang(p.attendanceStatus) > rang(bisher.attendanceStatus)) {
        jeMail.set(key, p);
      }
    }

    return {
      id: kurs.id,
      code: kurs.kurscodeAnzeige || kurs.kurscode,
      title: kurs.title,
      datumText: kurs.startdatum,
      startIso: start ? start.toISOString() : null,
      vergangen: end ? end < today : false,
      ort: kursLocationOf(kurs),
      dozenten: kursDozentenOf(kurs),
      teilnehmer: zeilen
        .filter((p) => {
          const key = p.email?.toLowerCase();
          return !key || jeMail.get(key) === p;
        })
        .map((p) => ({
          name: [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.participantText,
          firma: p.company,
          email: p.email,
          attendanceStatus: p.attendanceStatus,
          angemeldetAm: p.createdAt.toISOString(),
        })),
      enrollments: enrollmentsByCode.get(code) ?? [],
      signatureLists: signaturesByCode.get(code) ?? [],
    };
  });

  const totalTeilnehmer = participants.length;

  return (
    <main className="page-main">
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <PageHeader title="Schulungen & Teilnehmer" showTitle />

        <div style={{ display: "grid", gap: 14 }}>
          <AnimatedSection delayMs={40}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              <Kennzahl label="Schulungen (Website)" value={wixKurse.length} />
              <Kennzahl label="Website-Anmeldungen" value={totalTeilnehmer} />
            </div>
          </AnimatedSection>

          {websiteError ? (
            <Meldung art="fehler">Website nicht erreichbar. Bitte später erneut versuchen.</Meldung>
          ) : (
            <AnimatedSection delayMs={80}>
              <AdminSchulungenClient kurse={kurse} />
            </AnimatedSection>
          )}
        </div>
      </div>
    </main>
  );
}

