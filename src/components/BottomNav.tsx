"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

const MAIN_TABS = [
  { href: "/dashboard", label: "Home", icon: IconHome },
  { href: "/meine-schulungen", label: "Schulungen", icon: IconBook },
  { href: "/meine-zertifikate", label: "Zertifikate", icon: IconCert },
  { href: "/kurskalender", label: "Kalender", icon: IconCalendar },
];

type MeResponse =
  | { ok: false }
  | { ok: true; role: "USER" | "ADMIN" };

export default function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  useEffect(() => {
    document.body.classList.add("has-bottom-nav");
    return () => document.body.classList.remove("has-bottom-nav");
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json() as Promise<MeResponse>)
      .then((d) => { if (d.ok) setRole(d.role); })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  if (status !== "authenticated") return null;

  const mehrActive =
    pathname.startsWith("/meine-daten") ||
    pathname.startsWith("/badges") ||
    pathname.startsWith("/dozent") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/meine-credits") ||
    pathname.startsWith("/admin");

  return (
    <>
      <nav className="bottom-nav" aria-label="Navigation">
        {MAIN_TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`bottom-nav-item${active ? " active" : ""}`}>
              <Icon active={active} />
              <span className="bottom-nav-label">{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={`bottom-nav-item${mehrActive ? " active" : ""}`}
          onClick={() => setSheetOpen(true)}
          aria-label="Mehr"
        >
          <IconMore active={mehrActive} />
          <span className="bottom-nav-label">Mehr</span>
        </button>
      </nav>

      {sheetOpen && (
        <>
          <div className="mehr-backdrop" onClick={() => setSheetOpen(false)} />
          <div className="mehr-sheet" role="dialog" aria-label="Weitere Navigation">
            <div className="mehr-handle" />

            <div className="mehr-items">
              <SheetLink href="/meine-daten" active={pathname.startsWith("/meine-daten")} onClick={() => setSheetOpen(false)}>
                <IconPerson active={false} /> Profil
              </SheetLink>

              <SheetLink href="/badges" active={pathname.startsWith("/badges")} onClick={() => setSheetOpen(false)}>
                <IconBadge /> Badges
              </SheetLink>

              <SheetLink href="/meine-credits" active={pathname.startsWith("/meine-credits")} onClick={() => setSheetOpen(false)}>
                <IconCredits /> Meine Credits
              </SheetLink>

              <SheetLink href="/leaderboard" active={pathname.startsWith("/leaderboard")} onClick={() => setSheetOpen(false)}>
                <IconRanking /> Ranking
              </SheetLink>

              <SheetLink href="/dozent" active={pathname.startsWith("/dozent")} onClick={() => setSheetOpen(false)}>
                <IconChalk /> Dozenten
              </SheetLink>

              {role === "ADMIN" && (
                <SheetLink href="/admin" active={pathname.startsWith("/admin")} onClick={() => setSheetOpen(false)}>
                  <IconAdmin /> Adminbereich
                </SheetLink>
              )}

              <div className="mehr-divider" />

              <button
                type="button"
                className="mehr-logout"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <IconLogout /> Abmelden
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function SheetLink({ href, active, onClick, children }: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={onClick} className={`mehr-item${active ? " active" : ""}`}>
      {children}
    </Link>
  );
}

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconBook({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="13" y2="11" />
    </svg>
  );
}

function IconCert({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <circle cx="12" cy="17" r="3" />
      <path d="M10 20l-1 3 3-1.5L15 23l-1-3" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="12" y2="12" />
    </svg>
  );
}

function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="8" y="14" width="3" height="3" rx="0.5" />
    </svg>
  );
}

function IconMore({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconPerson({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 4.8L20 8l-4 3.9 1 5.6L12 15l-5 2.5 1-5.6L4 8l5.6-1.2z" />
    </svg>
  );
}

function IconChalk() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function IconAdmin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3 6.5H22l-5.5 4 2 6.5L12 15l-6.5 4 2-6.5L2 8.5h7z" />
    </svg>
  );
}

function IconRanking() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="14" width="4" height="8" rx="1" />
      <rect x="9" y="9" width="4" height="13" rx="1" />
      <rect x="16" y="4" width="4" height="18" rx="1" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconCredits() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5a3 3 0 00-5 2.2c0 1.7 1.3 2.8 3 3.3s3 1.6 3 3.3a3 3 0 01-5 .2" />
      <line x1="12" y1="6" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="18" />
    </svg>
  );
}
