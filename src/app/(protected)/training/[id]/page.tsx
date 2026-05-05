import BackButton from "@/components/BackButton";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const training = await prisma.training.findUnique({
    where: { id },
    include: {
      tokens: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!training) {
    return (
      <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BackButton label="Zurück" />
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
            Schulung nicht gefunden
          </h1>
        </div>

        <p style={{ marginTop: 20, color: "#aaa" }}>
          Diese Schulung existiert nicht oder wurde gelöscht.
        </p>
      </main>
    );
  }

  const claimToken = training.tokens[0];
  const tokenValue = claimToken?.token ?? "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const qrData = `${appUrl}/scan?token=${encodeURIComponent(tokenValue)}`;

  const qrImage = tokenValue
    ? await QRCode.toDataURL(qrData, { width: 280, margin: 1 })
    : null;

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <BackButton label="Zurück" />
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>
          {training.title}
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <InfoCard label="Zeitraum">
          {training.date.toLocaleDateString("de-DE")}
          {training.endDate
            ? ` bis ${training.endDate.toLocaleDateString("de-DE")}`
            : ""}
        </InfoCard>

        {training.location && (
          <InfoCard label="Ort">
            {training.location}
          </InfoCard>
        )}

        {training.instructor && (
          <InfoCard label="Dozent">
            {training.instructor}
          </InfoCard>
        )}

        {training.description && (
          <InfoCard label="Inhalte">
            {training.description}
          </InfoCard>
        )}

        <InfoCard label="Credits nach Abschluss">
          {training.creditsAward}
        </InfoCard>
      </div>

      <section
        style={{
          padding: 18,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 22, fontWeight: 800 }}>
          Teilnahme / QR-Code
        </h2>

        <p style={{ color: "#aaa", lineHeight: 1.6 }}>
          Dieser QR-Code kann für die Teilnahmebestätigung genutzt werden.
          Später wird die Teilnahme automatisch über Cobra und den Schulungsabschluss verarbeitet.
        </p>

        {!qrImage ? (
          <p style={{ color: "#aaa" }}>Kein QR-Code vorhanden.</p>
        ) : (
          <div
            style={{
              marginTop: 16,
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 14,
              padding: 16,
              maxWidth: 360,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <strong>QR-Code für Teilnehmer</strong>

            <img
              src={qrImage}
              alt="QR Code"
              style={{
                display: "block",
                marginTop: 12,
                width: 280,
                height: 280,
                borderRadius: 8,
                background: "#fff",
              }}
            />

            {claimToken?.expiresAt && (
              <div style={{ marginTop: 10, color: "#aaa", fontSize: 13 }}>
                Gültig bis: {claimToken.expiresAt.toLocaleDateString("de-DE")}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ fontSize: 13, color: "#aaa", marginBottom: 6 }}>
        {label}
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}