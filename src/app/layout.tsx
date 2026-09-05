import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import HeaderClient from "@/components/HeaderClient";
import Providers from "@/components/Providers";
import SocialFooter from "@/components/layout/SocialFooter";
import SafeTop from "@/components/SafeTop";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VFA-Akademie",
  // Derselbe Satz wie im Manifest (manifest.ts) — vorher fehlte die
  // Beschreibung im ausgelieferten HTML (Befund f10-9, 05.09.2026).
  description: "Schulungen, Zertifikate und Credits an einem Ort.",
  applicationName: "VFA-Akademie",
  appleWebApp: {
    capable: true,
    // "black-translucent" legt die Seite unter die Statusleiste, sodass Farben
    // und Muster bis über die Aussparung des iPhones durchlaufen. Die Symbole
    // dort werden dann weiß gezeichnet — damit sie überall lesbar bleiben,
    // gibt ihnen das Petrol-Band jeder Seite (PageHeader) den Grund; der
    // frühere Deckstreifen .safe-top ist seit dem 05.09.2026 überall aus.
    // Wer das eine ändert, muss das andere mitändern.
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
  // das Band liefe nicht bis unter die Uhr, die Seiten hielten keinen Platz
  // dafür frei, und die Bottom-Nav ignorierte den Home-Indikator.
  // Gehört zwingend zu statusBarStyle "black-translucent" (siehe metadata).
  viewportFit: "cover",
  // Zoom ist AUS — Tobis Entscheidung vom 13.08.2026 („ich möchte nicht,
  // dass man ranzoomen kann"): kein versehentliches Aufziehen, die App soll
  // sich nativ anfühlen. Wer vergrößern muss, hat die System-Lupe der
  // Bedienungshilfen. (Safari am Mac/PC ignoriert die Sperre ohnehin.)
  userScalable: false,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable} suppressHydrationWarning>
      <body
        style={{
          margin: 0,
          background: "var(--vfa-light)",
          color: "var(--vfa-text)",
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
              'if(location.pathname==="/dashboard"||location.pathname.indexOf("/dashboard/")===0)document.documentElement.classList.add("dashboard-aktiv");' +
              // Dark Mode ist ein App-Schalter (Einstellungen), kein System-
              // Automatismus: Grundzustand hell, die Wahl liegt im localStorage
              // und muss vor dem ersten Zeichnen an <html>, sonst blitzt beim
              // Start die falsche Fassung auf.
              'try{if(localStorage.getItem("vfa-dunkel")==="1")document.documentElement.classList.add("dunkel")}catch(e){}',
          }}
        />
        <Providers>
          <ServiceWorkerRegister />
          <div
            style={{
              minHeight: "100vh",
              background: "var(--vfa-light)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SafeTop />

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
