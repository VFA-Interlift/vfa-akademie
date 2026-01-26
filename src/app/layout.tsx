import "./globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="de">
      <body style={{ margin: 0, background: "#0b0b0b", color: "#fff" }}>
        <header
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            gap: 24,
            background: "#0b0b0b",
          }}
        >
          <strong style={{ fontSize: 18 }}>
            <Link href="/" style={{ color: "#fff", textDecoration: "none" }}>
              VFA-Akademie
            </Link>
          </strong>

          {session ? (
            <>
              <nav style={{ display: "flex", gap: 16 }}>
                <Link href="/dashboard" style={{ color: "#fff" }}>
                  Menü
                </Link>
                <Link href="/meine-badges" style={{ color: "#fff" }}>
                  Meine Zertifikate
                </Link>
                <Link href="/meine-daten" style={{ color: "#fff" }}>
                  Meine Daten
                </Link>
                <Link href="/scan" style={{ color: "#fff" }}>
                  QR scannen
                </Link>
              </nav>

              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: "#aaa",
                }}
              >
                <span>{session.user?.email}</span>
                <LogoutButton />
              </div>
            </>
          ) : (
            <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
              <Link href="/login" style={{ color: "#fff" }}>
                Anmelden
              </Link>
              <Link href="/register" style={{ color: "#fff" }}>
                Registrieren
              </Link>
            </div>
          )}
        </header>

        <main style={{ padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
