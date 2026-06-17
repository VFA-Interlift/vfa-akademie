import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import HeaderClient from "@/components/HeaderClient";
import Providers from "@/components/Providers";
import SocialFooter from "@/components/layout/SocialFooter";

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
    statusBarStyle: "default",
    title: "VFA-Akademie",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#007873",
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
        <Providers>
          <div
            style={{
              minHeight: "100vh",
              background: "#F7F7F4",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <HeaderClient />

            <div
              style={{
                flex: "1 0 auto",
                paddingTop: 78,
              }}
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
