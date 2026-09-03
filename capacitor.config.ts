import type { CapacitorConfig } from "@capacitor/cli";

// Huelle fuer den App Store: Die iPhone-App laedt die laufende Web-App von
// Vercel; ein Deploy der Website aktualisiert damit auch die App. Ein neuer
// Store-Stand ist nur noetig, wenn sich die Huelle selbst aendert (Symbol,
// Name, Adresse der Website, native Mitteilungen). Angelegt am 03.09.2026.
const config: CapacitorConfig = {
  appId: "de.vfaakademie.app",
  appName: "VFA-Akademie",
  webDir: "capacitor-www",
  server: {
    url: "https://vfa-akademie.vercel.app",
    allowNavigation: ["vfa-akademie.vercel.app"],
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
