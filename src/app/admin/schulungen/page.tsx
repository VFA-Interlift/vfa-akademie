import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { formatEnrollmentStatus } from "@/lib/trainings/format";
import { fetchWixKurse, kursDozentenOf, kursLocationOf, parseKursBlocks, type WixKurs } from "@/lib/wix/kurse";
import AdminSchulungenClient, { type AdminKurs } from "./AdminSchulungenClient";

export const dynamic = "force-dynamic";

const TEAL = "#007873";

function participantKurscode(raw: unknown): string {
  if (raw && typeof raw === "object" && "kurscode" in raw) {
    return String((raw as { kurscode?: unknown }).kurscode ?? "").trim().toUpperCase();
  }
  return "";
}

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
    enrollmentsByCode.set(
      code,
      t.enrollments.map((e) => ({
        name:
          [e.user.firstName, e.user.lastName].filter(Boolean).join(" ").trim() ||
          e.user.name ||
          e.user.email,
        status: formatEnrollmentStatus(e.status),
      }))
    );
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

  const kurse: AdminKurs[] = wixKurse.map((kurs) => {
    const code = kurs.kurscode.trim().toUpperCase();
    const blocks = parseKursBlocks(kurs.startdatum);
    const start = blocks[0]?.date ?? null;
    const last = blocks[blocks.length - 1];
    const end = last ? (last.endDate ?? last.date) : null;

    return {
      id: kurs.id,
      code: kurs.kurscodeAnzeige || kurs.kurscode,
      title: kurs.title,
      datumText: kurs.startdatum,
      startIso: start ? start.toISOString() : null,
      vergangen: end ? end < today : false,
      ort: kursLocationOf(kurs),
      dozenten: kursDozentenOf(kurs),
      teilnehmer: participants
        .filter((p) => code && participantKurscode(p.raw) === code)
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
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 14 }}>
        <div>
          <a href="/admin" style={{ color: TEAL, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>← Adminbereich</a>
        </div>
        <AnimatedSection delayMs={0}>
          <PageHeader title="Schulungen & Teilnehmer" showTitle />
        </AnimatedSection>

        <AnimatedSection delayMs={40}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <StatBox label="Schulungen (Website)" value={wixKurse.length} />
            <StatBox label="Website-Anmeldungen" value={totalTeilnehmer} />
          </div>
        </AnimatedSection>

        {websiteError ? (
          <AppCard>
            <div style={{ color: "#B00020", fontWeight: 700 }}>Website nicht erreichbar – bitte später erneut versuchen.</div>
          </AppCard>
        ) : (
          <AnimatedSection delayMs={80}>
            <AdminSchulungenClient kurse={kurse} />
          </AnimatedSection>
        )}
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: "14px 16px", background: "#FFFFFF", border: "1px solid #EFEFEF", borderRadius: 12 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: TEAL, lineHeight: 1 }}>{value.toLocaleString("de-DE")}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#888888", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{label}</div>
    </div>
  );
}
