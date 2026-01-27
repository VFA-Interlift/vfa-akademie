import "./globals.css";
import type { Metadata } from "next";
import HeaderClient from "@/components/HeaderClient";
import Providers from "@/components/Providers";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <Providers>
          <HeaderClient />
          <main style={{ padding: 24 }}>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
