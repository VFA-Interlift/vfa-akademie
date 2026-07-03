import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fetchWixKurse, kursDozentenOf, kursLocationOf, parseKursBlocks, type WixKurs } from "@/lib/wix/kurse";
import DozentKurseClient, { type DozentKurs } from "./DozentKurseClient";

export const dynamic = "force-dynamic";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Prüft, ob der eingeloggte Dozent in einem der Dozent-Felder des Kurses steht. */
function isInstructorMatch(
  dozentField: string,
  firstName: string | null,
  lastName: string | null,
  fullName: string | null
): boolean {
  const field = normalize(dozentField);
  if (!field) return false;

  if (firstName && lastName) {
    const first = normalize(firstName);
    const last = normalize(lastName);
    if (field.includes(first) && field.includes(last)) return true;
  }

  if (fullName) {
    const full = normalize(fullName);
    const parts = full.split(" ").filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => field.includes(p))) return true;
  }

  return false;
}

function participantKurscode(raw: unknown): string {
  if (raw && typeof raw === "object" && "kurscode" in raw) {
    return String((raw as { kurscode?: unknown }).kurscode ?? "").trim().toUpperCase();
  }
  return "";
}

export default async function DozentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { firstName: true, lastName: true, name: true, isInstructor: true },
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

  const meine = wixKurse.filter((kurs) => {
    const blocks = parseKursBlocks(kurs.startdatum);
    if (blocks.length === 0) return false;
    const last = blocks[blocks.length - 1];
    const endOfKurs = last.endDate ?? last.date;
    if (endOfKurs < today) return false;
    return kursDozentenOf(kurs).some((d) =>
      isInstructorMatch(d, user.firstName, user.lastName, user.name)
    );
  });

  // Website-Anmeldungen (Staging) den Kursen per Kurscode zuordnen.
  const websiteParticipants = meine.length
    ? await prisma.cobraTrainingParticipant.findMany({
        where: { participantType: "WIX_WEBSITE" },
        select: { id: true, firstName: true, lastName: true, participantText: true, attendanceStatus: true, raw: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const kurse: DozentKurs[] = meine.map((kurs) => {
    const code = kurs.kurscode.trim().toUpperCase();
    const participants = websiteParticipants
      .filter((p) => participantKurscode(p.raw) === code && code !== "")
      .map((p) => ({
        id: p.id,
        name: [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.participantText,
        attendanceStatus: p.attendanceStatus,
      }));

    return {
      id: kurs.id,
      title: kurs.title || kurs.kurscodeAnzeige || kurs.kurscode,
      code: kurs.kurscodeAnzeige || kurs.kurscode,
      datumText: kurs.startdatum,
      ort: kursLocationOf(kurs),
      participants,
    };
  });

  return (
    <main className="page-main">
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <AnimatedSection delayMs={0}>
          <PageHeader title="Dozenten" showTitle={true} />
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
                Keine bevorstehenden Schulungen
              </div>
              <p style={{ color: "#555555", lineHeight: 1.6, margin: 0 }}>
                Es wurden keine zukünftigen Schulungen gefunden, bei denen dein Name als Dozent
                hinterlegt ist. Die Dozenten werden auf der Website (Felder „Dozent 1–4" der
                Schulung) gepflegt – Vor- und Nachname müssen mit deinem Profil übereinstimmen.
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
