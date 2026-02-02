import "./globals.css";
import type { Metadata } from "next";
import HeaderClient from "@/components/HeaderClient";
import Providers from "@/components/Providers";
import SplashGate from "@/components/SplashGate";

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
          background: "#000",
          color: "#fff",
          minHeight: "100vh",
          position: "relative",
        }}
      >
        {/* ✅ Background Image Layer (liegt hinter allem) */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,

            backgroundImage: "url('/background.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",

            // ✅ macht Text/UI lesbar
            filter: "brightness(0.35)",
            transform: "scale(1.02)",
          }}
        />

        {/* ✅ Optionaler Dark Overlay für noch bessere Lesbarkeit */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            background: "rgba(0,0,0,0.45)",
          }}
        />

        <Providers>
          {/* ✅ Splash immer beim Start */}
          <SplashGate durationMs={2000} logoSrc="/logo.png" title="VFA Akademie" />

          {/* ✅ Alles UI über dem Hintergrund */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <HeaderClient />

            {/* ✅ App-Content: fix, nicht scrollbar */}
            <main
              style={{
                padding: 24,
                paddingTop: 104,

                height: "calc(100vh - 104px)",
                overflow: "hidden",
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
