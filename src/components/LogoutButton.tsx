"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.3)",
        color: "#fff",
        padding: "6px 12px",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
}
