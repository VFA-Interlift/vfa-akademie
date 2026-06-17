import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";

export const dynamic = "force-dynamic";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isInstructorMatch(
  instructorField: string | null,
  firstName: string | null,
  lastName: string | null,
  fullName: string | null
): boolean {
  if (!instructorField) return false;
  const field = normalize(instructorField);

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

function formatDate(value: string | Date | null) {
  if (!value) return "";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("de-DE");
}

function formatDateRange(start: Date | string, end: Date | string | null) {
  const s = formatDate(start);
  const e = end ? formatDate(end) : null;
  if (!e || e === s) return `am ${s}`;
  return `${s} – ${e}`;
}

export default async function DozentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { firstName: true, lastName: true, name: true },
  });

  if (!user) redirect("/login");

  const allTrainings = await prisma.training.findMany({
    where: {
      instructor: { not: null },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      code: true,
      date: true,
      endDate: true,
      location: true,
      instructor: true,
      creditsAward: true,
    },
  });

  const myTrainings = allTrainings.filter((t) =>
    isInstructorMatch(t.instructor, user.firstName, user.lastName, user.name)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = myTrainings.filter((t) => new Date(t.date) >= today);
  const past = myTrainings.filter((t) => new Date(t.date) < today);

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.name ||
    session.user.email;

  return (
    <main className="page-main">
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <AnimatedSection delayMs={0}>
          <PageHeader title="Dozenten" showTitle={true} />
        </AnimatedSection>

        {myTrainings.length === 0 ? (
          <AnimatedSection delayMs={80}>
            <AppCard>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#007873", marginBottom: 8 }}>
                Keine Schulungen gefunden
              </div>
              <p style={{ color: "#555555", lineHeight: 1.6, margin: 0 }}>
                Es wurden keine Schulungen gefunden, bei denen dein Name als Dozent hinterlegt ist.
                Bitte prüfe dein Profil – Vor- und Nachname müssen mit den Cobra-Daten übereinstimmen.
              </p>
            </AppCard>
          </AnimatedSection>
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            {upcoming.length > 0 && (
              <AnimatedSection delayMs={80}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#007873", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Bevorstehend ({upcoming.length})
                  </div>
                  {upcoming.map((t, i) => (
                    <TrainingCard key={t.id} training={t} index={i} highlight />
                  ))}
                </div>
              </AnimatedSection>
            )}

            {past.length > 0 && (
              <AnimatedSection delayMs={160}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#888888", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Vergangen ({past.length})
                  </div>
                  {past.map((t, i) => (
                    <TrainingCard key={t.id} training={t} index={i} highlight={false} />
                  ))}
                </div>
              </AnimatedSection>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function TrainingCard({
  training,
  highlight,
}: {
  training: {
    id: string;
    title: string;
    code: string | null;
    date: Date;
    endDate: Date | null;
    location: string | null;
    creditsAward: number;
  };
  index: number;
  highlight: boolean;
}) {
  const displayTitle = training.code?.trim() || training.title;
  const dateText = formatDateRange(training.date, training.endDate);
  const location = training.location?.split(",")[0]?.trim() ?? null;

  return (
    <AppCard
      accent={highlight ? "green" : "none"}
      style={{ opacity: highlight ? 1 : 0.7 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          gap: 14,
          alignItems: "start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "clamp(15px, 4vw, 18px)",
              fontWeight: 750,
              color: highlight ? "#007873" : "#444444",
              lineHeight: 1.25,
              marginBottom: 8,
            }}
          >
            {displayTitle}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <InfoChip label="Datum" value={dateText} />
            {location && <InfoChip label="Ort" value={location} />}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: highlight ? "#007873" : "#888888", lineHeight: 1 }}>
            {training.creditsAward}
          </div>
          <div style={{ fontSize: 11, color: "#888888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Credits
          </div>
        </div>
      </div>
    </AppCard>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 800, color: "#007873", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}:{" "}
      </span>
      <span style={{ fontSize: 13, color: "#444444" }}>{value}</span>
    </div>
  );
}
