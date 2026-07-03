import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppCard from "@/components/ui/AppCard";
import PageHeader from "@/components/ui/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { formatEnrollmentStatus } from "@/lib/trainings/format";
import { fetchWixKurse, kursDozentenOf, kursLocationOf, parseKursBlocks, type WixKurs } from "@/lib/wix/kurse";

export const dynamic = "force-dynamic";

const TEAL = "#007873";

function participantKurscode(raw: unknown): string {
  if (raw && typeof raw === "object" && "kurscode" in raw) {
    return String((raw as { kurscode?: unknown }).kurscode ?? "").trim().toUpperCase();
  }
  return "";
}

function attendanceLabel(status: string | null): { text: string; color: string } {
  if (status === "ANWESEND") return { text: "✓ Da", color: "#005f5b" };
  if (status === "NICHT_DA") return { text: "✗ Nicht da", color: "#B00020" };
  if (status === "KRANK") return { text: "🤒 Krank", color: "#7C5A0A" };
  return { text: "offen", color: "#999999" };
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

  // Nach erstem Termin sortieren (bevorstehende zuerst, vergangene ans Ende).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sorted = wixKurse
    .map((kurs) => {
      const blocks = parseKursBlocks(kurs.startdatum);
      const start = blocks[0]?.date ?? null;
      const last = blocks[blocks.length - 1];
      const end = last ? (last.endDate ?? last.date) : null;
      return { kurs, start, vergangen: end ? end < today : false };
    })
    .sort((a, b) => {
      if (a.vergangen !== b.vergangen) return a.vergangen ? 1 : -1;
      return (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0);
    });

  const [participants, dbTrainings] = await Promise.all([
    prisma.cobraTrainingParticipant.findMany({
      where: { participantType: "WIX_WEBSITE" },
      select: { firstName: true, lastName: true, participantText: true, company: true, email: true, attendanceStatus: true, raw: true },
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
          <div style={{ display: "grid", gap: 8 }}>
            {sorted.map(({ kurs, vergangen }) => {
              const code = kurs.kurscode.trim().toUpperCase();
              const kursTeilnehmer = participants.filter((p) => code && participantKurscode(p.raw) === code);
              const kursEnrollments = enrollmentsByCode.get(code) ?? [];
              const dozenten = kursDozentenOf(kurs);
              const ort = kursLocationOf(kurs);

              return (
                <details
                  key={kurs.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #EFEFEF",
                    borderRadius: 12,
                    opacity: vergangen ? 0.55 : 1,
                  }}
                >
                  <summary
                    style={{
                      listStyle: "none",
                      cursor: "pointer",
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: 15.5, color: TEAL }}>{kurs.kurscodeAnzeige || kurs.kurscode}</span>
                      <span style={{ color: "#666666", fontSize: 13.5, marginLeft: 10 }}>{kurs.title}</span>
                      <div style={{ fontSize: 12.5, color: "#888888", marginTop: 3 }}>
                        📅 {kurs.startdatum || "–"}
                        {ort ? <> · 📍 {ort.split(",")[0]}</> : null}
                        {dozenten.length > 0 && <> · 👤 {dozenten.join(", ")}</>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <CountPill label="Teilnehmer" value={kursTeilnehmer.length} strong />
                      <CountPill label="App" value={kursEnrollments.length} />
                    </div>
                  </summary>

                  <div style={{ borderTop: "1px solid #F0F0F0", padding: "12px 18px 16px", display: "grid", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: TEAL, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                        Website-Anmeldungen ({kursTeilnehmer.length})
                      </div>
                      {kursTeilnehmer.length === 0 ? (
                        <div style={{ color: "#999999", fontSize: 13.5 }}>Noch keine Anmeldungen.</div>
                      ) : (
                        <div style={{ display: "grid", gap: 4 }}>
                          {kursTeilnehmer.map((p, i) => {
                            const att = attendanceLabel(p.attendanceStatus);
                            const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.participantText;
                            return (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 10px", background: "#FAFAF8", border: "1px solid #F0F0F0", borderRadius: 8, fontSize: 13.5, flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 700, color: "#1F1F1F" }}>
                                  {name}
                                  {p.company && <span style={{ color: "#999999", fontWeight: 500 }}> · {p.company}</span>}
                                  {p.email && <span style={{ color: "#B0B0B0", fontWeight: 500 }}> · {p.email}</span>}
                                </span>
                                <span style={{ fontWeight: 800, color: att.color, fontSize: 12.5 }}>{att.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: "#7C5A0A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                        App-Anmeldungen ({kursEnrollments.length})
                      </div>
                      {kursEnrollments.length === 0 ? (
                        <div style={{ color: "#999999", fontSize: 13.5 }}>Keine App-Anmeldungen.</div>
                      ) : (
                        <div style={{ display: "grid", gap: 4 }}>
                          {kursEnrollments.map((e, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 10px", background: "#FFFBEE", border: "1px solid rgba(255,193,0,0.25)", borderRadius: 8, fontSize: 13.5, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, color: "#1F1F1F" }}>{e.name}</span>
                              <span style={{ fontWeight: 700, color: "#7C5A0A", fontSize: 12.5 }}>{e.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
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

function CountPill({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div style={{
      padding: "6px 12px",
      borderRadius: 999,
      background: strong ? "rgba(0,120,115,0.08)" : "#F4F4F2",
      border: strong ? "1px solid rgba(0,120,115,0.25)" : "1px solid #E6E6E6",
      fontSize: 12,
      fontWeight: 800,
      color: strong ? TEAL : "#666666",
      whiteSpace: "nowrap",
    }}>
      {value} {label}
    </div>
  );
}
