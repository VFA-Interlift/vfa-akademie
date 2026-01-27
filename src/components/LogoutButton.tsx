"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        // 1) Cookie löschen (ohne automatische Weiterleitung)
        await signOut({ redirect: false });

        // 2) Zur Login-Seite navigieren
        router.push("/login");

        // 3) Server Components (Header mit getServerSession) neu rendern
        router.refresh();
      }}
      style={{
        width: "100%",
        padding: 14,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,0,0,0.08)",
        color: "#fff",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Abmelden
    </button>
  );
}
