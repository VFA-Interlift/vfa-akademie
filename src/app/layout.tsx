import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "VFA-Akademie",
  applicationName: "VFA-Akademie",
  themeColor: "#0b0b0b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VFA-Akademie",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

// sorgt dafür, dass Header-Daten (Credits) nicht gecached werden
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  const email = session?.user?.email ?? null;

  const user = email
    ? await prisma.user.findUnique({
        where: { email },
        select: { creditsTotal: true },
      })
    : null;

  const credits = user?.creditsTotal ?? 0;

  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          background: "#0b0b0b",
          color: "#fff",
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 700,
            gap: 16,
          }}
        >
          <span>VFA-Akademie</span>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {email && (
              <>
                <span
                  style={{
                    padding: "6px 10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 14,
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(8px)",
                  }}
                  title="Gesamtcredits"
                >
                  Credits: {credits}
                </span>

                <span style={{ fontWeight: 400, color: "#aaa" }}>{email}</span>
              </>
            )}
          </div>
        </header>

        <main style={{ padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
