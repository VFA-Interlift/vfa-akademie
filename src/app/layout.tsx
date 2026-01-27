import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

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
        {/* Minimal-Header */}
        <header
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 700,
          }}
        >
          <span>VFA-Akademie</span>

          {session?.user?.email && (
            <span style={{ fontWeight: 400, color: "#aaa" }}>
              {session.user.email}
            </span>
          )}
        </header>

        <main style={{ padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
