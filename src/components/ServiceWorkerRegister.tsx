"use client";

import { useEffect } from "react";

/**
 * Registriert den Service Worker (public/sw.js) nach dem Laden. Erst dadurch
 * hat die installierte PWA einen Offline-Fallback statt der Browser-Fehlerseite.
 * Rendert nichts.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const registrieren = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((fehler) => console.error("SW_REGISTER_ERROR", fehler));
    };
    if (document.readyState === "complete") {
      registrieren();
    } else {
      window.addEventListener("load", registrieren, { once: true });
    }
  }, []);

  return null;
}
