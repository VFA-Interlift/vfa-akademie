import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export default async function TrainingPage({
  params,
}: {
  params: { id: string };
}) {
  const training = await prisma.training.findUnique({
    where: { id: params.id },
    include: { tokens: true },
  });

  if (!training) {
    return (
      <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
        <h1>Training nicht gefunden</h1>
      </main>
    );
  }

  const claimToken = training.tokens[0];
  const tokenValue = claimToken?.token ?? "";

  const qrData = `${process.env.NEXT_PUBLIC_APP_URL}/scan?token=${encodeURIComponent(
    tokenValue
  )}`;

  const qrImage = tokenValue
    ? await QRCode.toDataURL(qrData, { width: 280, margin: 1 })
    : null;

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        {training.title}
      </h1>

      <div style={{ marginBottom: 16 }}>
        Datum: {training.date.toLocaleDateString("de-DE")}
      </div>

      {!qrImage ? (
        <p>Kein QR-Code vorhanden.</p>
      ) : (
        <div
          style={{
            border: "1px solid #999",
            borderRadius: 10,
            padding: 16,
            maxWidth: 360,
          }}
        >
          <strong>QR-Code für Teilnehmer</strong>
          <img
            src={qrImage}
            alt="QR Code"
            style={{ marginTop: 12, width: 280, height: 280 }}
          />
        </div>
      )}
    </main>
  );
}
