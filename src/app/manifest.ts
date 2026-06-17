import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VFA-Akademie",
    short_name: "VFA-Akademie",
    description: "Schulungen, Zertifikate und Credits – digital verwaltet.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F7F7F4",
    theme_color: "#007873",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
