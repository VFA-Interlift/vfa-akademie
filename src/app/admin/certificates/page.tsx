"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminCertificatesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/cobra");
  }, [router]);

  return (
    <main className="page-main">
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24, color: "#555555" }}>
        Weiterleitung zu Cobra/WebConnect...
      </div>
    </main>
  );
}
