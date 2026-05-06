import "./globals.css";
import type { Metadata } from "next";
import HeaderClient from "@/components/HeaderClient";
import Providers from "@/components/Providers";
import SplashGate from "@/components/SplashGate";

export const metadata: Metadata = {
  title: "VFA-Akademie",
  applicationName: "VFA-Akademie",
  themeColor: "#007873",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
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
          background: "#F7F7F4",
          color: "#1F1F1F",
          minHeight: "100vh",
        }}
      >
        <Providers>
          <SplashGate durationMs={2000} logoSrc="/logo.png" title="VFA Akademie" />

          <div
            style={{
              minHeight: "100vh",
              background: "#F7F7F4",
            }}
          >
            <HeaderClient />

            <main
              style={{
                minHeight: "calc(100vh - 104px)",
                paddingTop: 104,
              }}
            >
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}