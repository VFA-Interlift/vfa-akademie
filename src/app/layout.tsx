import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import HeaderClient from "@/components/HeaderClient";
import Providers from "@/components/Providers";
import SocialFooter from "@/components/layout/SocialFooter";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VFA-Akademie",
  applicationName: "VFA-Akademie",
  appleWebApp: {
    capable: true,
    // "black-translucent" legt die Seite unter die Statusleiste, sodass Farben
    // und Muster bis über die Aussparung des iPhones durchlaufen. Die Symbole
    // dort werden dann weiß gezeichnet — damit sie überall lesbar bleiben,
    // liegt der Streifen .safe-top (globals.css) in Petrol darüber. Wer das
    // eine ändert, muss das andere mitändern.
    statusBarStyle: "black-translucent",
    title: "VFA-Akademie",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#007873",
  // Ohne viewport-fit=cover liefert env(safe-area-inset-top/-bottom) schlicht 0:
  // der Streifen .safe-top wäre unsichtbar, die Seiten hielten keinen Platz
  // unter der Uhr frei, und die Bottom-Nav ignorierte den Home-Indikator.
  // Gehört zwingend zu statusBarStyle "black-translucent" (siehe metadata).
  viewportFit: "cover",
  // Zoom bleibt erlaubt: Wer schlecht sieht, muss vergrößern können. Das
  // Sperren war gegen das versehentliche Aufziehen gedacht, nimmt aber allen
  // die Lupe — und die App wird überwiegend am Handy benutzt.
  userScalable: true,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable}>
      <body
        style={{
          margin: 0,
          background: "#F7F7F4",
          color: "#1F1F1F",
          minHeight: "100vh",
        }}
      >
        {/* Setzt die Dashboard-Markierung, BEVOR der Browser das erste Mal
            zeichnet. DashboardHero setzt sie erst nach dem Laden des Skripts —
            beim Öffnen der App (Startadresse ist /dashboard) blitzte dadurch
            der Streifen .safe-top kurz an der Oberkante auf, ehe er verschwand
            (Tobis Beobachtung vom 13.08.2026). Bei Seitenwechseln innerhalb
            der App übernimmt weiterhin DashboardHero das An- und Abmelden. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'if(location.pathname==="/dashboard"||location.pathname.indexOf("/dashboard/")===0)document.documentElement.classList.add("dashboard-aktiv");',
          }}
        />
        <Providers>
          <ServiceWorkerRegister />
          <div
            style={{
              minHeight: "100vh",
              background: "#F7F7F4",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Deckt den Bereich der Statusleiste ab, seit die Seite darunter
                läuft. Petrol mit denselben Streifen wie der Dashboard-Kopf,
                damit das Muster dort durchläuft; auf Geräten ohne Aussparung
                ist die Höhe 0 und der Streifen unsichtbar. */}
            <div className="safe-top" aria-hidden="true" />

            <HeaderClient />

            <div
              className="page-content"
              style={{ flex: "1 0 auto", paddingTop: "calc(78px + env(safe-area-inset-top, 0px))" }}
            >
              {children}
            </div>

            <SocialFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
