"use client";

import { useEffect, useMemo, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  company: string;
  role: "USER" | "ADMIN";
  isInstructor: boolean;
  creditsTotal: number;
  enrollmentsCount: number;
  certificatesCount: number;
  createdAt: string;
};

type AdminEnrollment = {
  id: string;
  status: string;
  attended: boolean;
  registeredAt: string;
  training: {
    id: string;
    title: string;
    code: string | null;
    date: string;
    endDate: string | null;
    creditsAward: number;
  };
  hasCertificate: boolean;
};

const ENROLLMENT_STATUSES = [
  { value: "PENDING", label: "Ausstehend" },
  { value: "CONFIRMED", label: "Bestätigt" },
  { value: "ATTENDED", label: "Teilgenommen" },
  { value: "NO_SHOW", label: "Nicht erschienen" },
  { value: "CANCELLED", label: "Storniert" },
] as const;

function statusColor(status: string) {
  if (status === "CONFIRMED") return { color: "#007873", bg: "rgba(0,120,115,0.08)", border: "1px solid rgba(0,120,115,0.25)" };
  if (status === "ATTENDED") return { color: "#005f5b", bg: "rgba(0,120,115,0.14)", border: "1px solid rgba(0,120,115,0.35)" };
  if (status === "CANCELLED" || status === "NO_SHOW") return { color: "#B00020", bg: "rgba(176,0,32,0.08)", border: "1px solid rgba(176,0,32,0.22)" };
  return { color: "#7C5A0A", bg: "rgba(255,193,0,0.10)", border: "1px solid rgba(255,193,0,0.35)" };
}

function statusLabel(status: string) {
  return ENROLLMENT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

type UsersResponse =
  | {
      ok: true;
      users: AdminUser[];
    }
  | {
      ok: false;
      error: string;
    };

type SortMode =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc"
  | "credits_desc"
  | "credits_asc"
  | "role_asc";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("created_desc");
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeTabByUser, setActiveTabByUser] = useState<Record<string, string>>({});

  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [creditAmountByUser, setCreditAmountByUser] = useState<Record<string, string>>({});
  const [creditNoteByUser, setCreditNoteByUser] = useState<Record<string, string>>({});

  const [enrollmentsByUser, setEnrollmentsByUser] = useState<Record<string, AdminEnrollment[]>>({});
  const [enrollmentsLoadingId, setEnrollmentsLoadingId] = useState<string | null>(null);
  const [enrollmentActionId, setEnrollmentActionId] = useState<string | null>(null);

  async function loadEnrollments(userId: string) {
    if (enrollmentsByUser[userId]) return;
    setEnrollmentsLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/enrollments`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setEnrollmentsByUser((prev) => ({ ...prev, [userId]: data.enrollments }));
    } catch { /* ignore */ }
    finally { setEnrollmentsLoadingId(null); }
  }

  async function changeEnrollmentStatus(enrollmentId: string, userId: string, newStatus: string) {
    setEnrollmentActionId(enrollmentId);
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        setEnrollmentsByUser((prev) => ({
          ...prev,
          [userId]: (prev[userId] ?? []).map((e) =>
            e.id === enrollmentId ? { ...e, status: newStatus, attended: newStatus === "ATTENDED" } : e
          ),
        }));
        showMessage(`Status auf "${statusLabel(newStatus)}" geändert.`, true);
      } else {
        showMessage(data.error ?? "Fehler beim Ändern des Status.");
      }
    } catch { showMessage("Serverfehler."); }
    finally { setEnrollmentActionId(null); }
  }

  function showMessage(message: string, ok = false) {
    setMsg(message);
    setMsgOk(ok);
  }

  async function loadUsers() {
    setLoadingUsers(true);

    try {
      const res = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const data = (await res.json()) as UsersResponse;

      if (!data.ok) {
        showMessage(data.error ?? "USERS_LOAD_FAILED");
        return;
      }

      setUsers(data.users);
    } catch {
      showMessage("Nutzer konnten nicht geladen werden.");
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredAndSortedUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = !q
      ? users
      : users.filter((user) => {
          return (
            user.email.toLowerCase().includes(q) ||
            user.name.toLowerCase().includes(q) ||
            user.company.toLowerCase().includes(q) ||
            user.role.toLowerCase().includes(q)
          );
        });

    return [...filtered].sort((a, b) => {
      if (sortMode === "created_desc") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      if (sortMode === "created_asc") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      if (sortMode === "name_asc") {
        return getUserDisplayName(a).localeCompare(getUserDisplayName(b), "de");
      }

      if (sortMode === "name_desc") {
        return getUserDisplayName(b).localeCompare(getUserDisplayName(a), "de");
      }

      if (sortMode === "credits_desc") {
        return b.creditsTotal - a.creditsTotal;
      }

      if (sortMode === "credits_asc") {
        return a.creditsTotal - b.creditsTotal;
      }

      if (sortMode === "role_asc") {
        return a.role.localeCompare(b.role, "de");
      }

      return 0;
    });
  }, [users, search, sortMode]);

  async function promote(user: AdminUser) {
    if (user.role === "ADMIN") {
      showMessage("Dieser Nutzer ist bereits Admin.", true);
      return;
    }

    setActionLoadingId(user.id);
    showMessage("Admin-Vergabe wird gestartet...", true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}/make-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        if (data?.error === "INVALID_USER_ID") {
          showMessage("Ungültige Nutzer-ID.");
        } else if (data?.error === "USER_NOT_FOUND") {
          showMessage("Nutzer wurde nicht gefunden.");
        } else if (data?.error === "UNAUTHENTICATED") {
          showMessage("Du bist nicht eingeloggt.");
        } else if (data?.error === "FORBIDDEN") {
          showMessage("Du hast keine Berechtigung.");
        } else {
          showMessage(data?.error ?? "Admin-Vergabe fehlgeschlagen.");
        }

        return;
      }

      showMessage(`${user.email} ist jetzt Admin.`, true);
      await loadUsers();
    } catch {
      showMessage("Serverfehler beim Ernennen des Admins.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function toggleInstructor(user: AdminUser) {
    const makeInstructor = !user.isInstructor;

    setActionLoadingId(user.id);
    showMessage(
      makeInstructor
        ? "Dozentenstatus wird vergeben..."
        : "Dozentenstatus wird entzogen...",
      true
    );

    try {
      const res = await fetch(`/api/admin/users/${user.id}/make-instructor`, {
        method: makeInstructor ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        if (data?.error === "INVALID_USER_ID") {
          showMessage("Ungültige Nutzer-ID.");
        } else if (data?.error === "USER_NOT_FOUND") {
          showMessage("Nutzer wurde nicht gefunden.");
        } else if (data?.error === "UNAUTHENTICATED") {
          showMessage("Du bist nicht eingeloggt.");
        } else if (data?.error === "FORBIDDEN") {
          showMessage("Du hast keine Berechtigung.");
        } else {
          showMessage(data?.error ?? "Dozentenstatus konnte nicht geändert werden.");
        }

        return;
      }

      showMessage(
        makeInstructor
          ? `${user.email} ist jetzt Dozent.`
          : `${user.email} ist kein Dozent mehr.`,
        true
      );
      await loadUsers();
    } catch {
      showMessage("Serverfehler beim Ändern des Dozentenstatus.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function changeCredits(user: AdminUser, direction: "add" | "remove") {
    const rawAmount = creditAmountByUser[user.id]?.trim() ?? "";
    const note = creditNoteByUser[user.id]?.trim() ?? "";

    const amount = Number(rawAmount);

    if (!Number.isInteger(amount) || amount <= 0) {
      showMessage("Bitte eine positive ganze Credit-Zahl eingeben.");
      return;
    }

    const signedAmount = direction === "add" ? amount : -amount;

    setActionLoadingId(user.id);
    setMsg("");
    setMsgOk(false);

    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email.trim().toLowerCase(),
          credits: signedAmount,
          note: note || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        if (data?.error === "INVALID_EMAIL") {
          showMessage("Bitte eine gültige E-Mail eingeben.");
        } else if (data?.error === "INVALID_CREDITS") {
          showMessage("Bitte eine ganze Zahl größer als 0 eingeben.");
        } else if (data?.error === "USER_NOT_FOUND") {
          showMessage("Nutzer wurde nicht gefunden.");
        } else if (data?.error === "UNAUTHENTICATED") {
          showMessage("Du bist nicht eingeloggt.");
        } else if (data?.error === "FORBIDDEN") {
          showMessage("Du hast keine Berechtigung.");
        } else {
          showMessage(data?.error ?? "Credits konnten nicht gespeichert werden.");
        }

        return;
      }

      if (direction === "add") {
        showMessage(`${amount} Credits wurden an ${user.email} vergeben.`, true);
      } else {
        showMessage(`${amount} Credits wurden bei ${user.email} abgezogen.`, true);
      }

      setCreditAmountByUser((current) => ({
        ...current,
        [user.id]: "",
      }));

      setCreditNoteByUser((current) => ({
        ...current,
        [user.id]: "",
      }));

      await loadUsers();
    } catch {
      showMessage("Serverfehler beim Bearbeiten der Credits.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function deleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `Nutzer wirklich löschen?\n\n${getUserDisplayName(user)}\n${user.email}\n\nDer Nutzer, seine Schulungszuordnungen, Zertifikate und Credit-Historie werden aus der Datenbank entfernt. Danach kann sich die Person mit dieser E-Mail erneut registrieren.`
    );

    if (!confirmed) {
      return;
    }

    setActionLoadingId(user.id);
    setMsg("");
    setMsgOk(false);

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        if (data?.error === "CANNOT_DELETE_SELF") {
          showMessage("Du kannst deinen eigenen Admin-Nutzer nicht löschen.");
        } else if (data?.error === "USER_NOT_FOUND") {
          showMessage("Nutzer wurde nicht gefunden.");
        } else if (data?.error === "UNAUTHENTICATED") {
          showMessage("Du bist nicht eingeloggt.");
        } else if (data?.error === "FORBIDDEN") {
          showMessage("Du hast keine Berechtigung.");
        } else {
          showMessage(data?.error ?? "Nutzer konnte nicht gelöscht werden.");
        }

        return;
      }

      showMessage(`${user.email} wurde gelöscht.`, true);
      setOpenId(null);
      await loadUsers();
    } catch {
      showMessage("Serverfehler beim Löschen des Nutzers.");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <main className="page-main"
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 10 }}>
          <a href="/admin" style={{ color: "#007873", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>← Adminbereich</a>
        </div>
        <PageHeader
          title="Nutzer verwalten"
          description="Profile prüfen, Credits bearbeiten, Rollen vergeben und Nutzer löschen."
        />

        {msg && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              border: msgOk
                ? "1px solid #007873"
                : "1px solid rgba(176,0,32,0.28)",
              background: msgOk
                ? "rgba(0,120,115,0.08)"
                : "rgba(176,0,32,0.08)",
              color: msgOk ? "#007873" : "#B00020",
              fontWeight: 800,
              lineHeight: 1.5,
            }}
          >
            {msg}
          </div>
        )}

        <AppCard accent="green">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#007873",
                  fontSize: 24,
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                Registrierte Nutzer
              </h2>

              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "#333333",
                  lineHeight: 1.6,
                  maxWidth: 760,
                }}
              >
                In der Liste werden zunächst nur Name und E-Mail angezeigt. Über
                das Plus öffnest du Credits, Rollen, Schulungen, Zertifikate und
                weitere Aktionen.
              </p>
            </div>

            <StatusBadge variant="yellow">{users.length} Nutzer</StatusBadge>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
              marginBottom: 18,
              alignItems: "end",
            }}
          >
            <AppInput
              label="Suche"
              value={search}
              placeholder="Name, E-Mail, Firma oder Rolle suchen"
              onChange={setSearch}
            />

            <div>
              <label
                style={{
                  display: "block",
                  color: "#007873",
                  fontWeight: 800,
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                Sortieren nach
              </label>

              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  border: "1px solid #C7C7C7",
                  background: "#FFFFFF",
                  color: "#1F1F1F",
                  padding: "10px 12px",
                  fontSize: 15,
                  fontWeight: 700,
                  outline: "none",
                }}
              >
                <option value="created_desc">Registrierung: neueste zuerst</option>
                <option value="created_asc">Registrierung: älteste zuerst</option>
                <option value="name_asc">Name: A-Z</option>
                <option value="name_desc">Name: Z-A</option>
                <option value="credits_desc">Credits: höchste zuerst</option>
                <option value="credits_asc">Credits: niedrigste zuerst</option>
                <option value="role_asc">Rolle</option>
              </select>
            </div>
          </div>

          {loadingUsers ? (
            <div style={{ color: "#333333", lineHeight: 1.6 }}>
              Nutzer werden geladen...
            </div>
          ) : filteredAndSortedUsers.length === 0 ? (
            <div style={{ color: "#333333", lineHeight: 1.6 }}>
              Keine Nutzer gefunden.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filteredAndSortedUsers.map((user) => {
                const isOpen = openId === user.id;
                const isLoading = actionLoadingId === user.id;

                return (
                  <div
                    key={user.id}
                    style={{
                      border: "1px solid #EFEFEF",
                      background: "#FFFFFF",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const next = isOpen ? null : user.id;
                        setOpenId(next);
                        if (next) {
                          loadEnrollments(next);
                          setActiveTabByUser((prev) =>
                            prev[next] ? prev : { ...prev, [next]: "überblick" }
                          );
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: 14,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 14,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              color: "#007873",
                              fontSize: 18,
                              fontWeight: 800,
                              lineHeight: 1.3,
                            }}
                          >
                            {user.name || "Ohne Namen"}
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              color: "#333333",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={user.email}
                          >
                            {user.email}
                          </div>
                        </div>

                        <div
                          style={{
                            color: "#007873",
                            fontWeight: 900,
                            fontSize: 24,
                          }}
                        >
                          {isOpen ? "−" : "+"}
                        </div>
                      </div>
                    </button>

                    {isOpen && (() => {
                      const activeTab = activeTabByUser[user.id] ?? "überblick";
                      const tabs = [
                        { id: "überblick", label: "Überblick" },
                        { id: "schulungen", label: "Schulungen" },
                        { id: "credits", label: "Credits" },
                        { id: "rollen", label: "Rollen" },
                        { id: "löschen", label: "Löschen" },
                      ];

                      return (
                      <div
                        style={{
                          padding: "0 14px 14px",
                          borderTop: "1px solid #E6E6E6",
                        }}
                      >
                        <div style={{ display: "flex", borderBottom: "1px solid #E6E6E6", marginBottom: 16, gap: 0, overflowX: "auto", paddingTop: 14 }}>
                          {tabs.map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() =>
                                setActiveTabByUser((prev) => ({ ...prev, [user.id]: tab.id }))
                              }
                              style={{
                                padding: "10px 16px",
                                border: "none",
                                borderBottom:
                                  activeTab === tab.id
                                    ? "2px solid #007873"
                                    : "2px solid transparent",
                                background: "transparent",
                                color: activeTab === tab.id ? "#007873" : "#888888",
                                fontWeight: activeTab === tab.id ? 800 : 600,
                                fontSize: 13,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {activeTab === "überblick" && (
                        <>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            marginBottom: 14,
                          }}
                        >
                          <StatusBadge
                            variant={user.role === "ADMIN" ? "yellow" : "default"}
                          >
                            Rolle: {user.role}
                          </StatusBadge>

                          {user.isInstructor && (
                            <StatusBadge variant="yellow">Dozent</StatusBadge>
                          )}

                          <StatusBadge>{user.creditsTotal} Credits</StatusBadge>

                          {user.company && (
                            <StatusBadge>Firma: {user.company}</StatusBadge>
                          )}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: 10,
                          }}
                        >
                          <MiniInfo
                            label="Credits"
                            value={String(user.creditsTotal)}
                          />
                          <MiniInfo
                            label="Schulungen"
                            value={String(user.enrollmentsCount)}
                          />
                          <MiniInfo
                            label="Zertifikate"
                            value={String(user.certificatesCount)}
                          />
                          <MiniInfo
                            label="Registriert"
                            value={formatDate(user.createdAt)}
                          />
                        </div>
                        </>
                        )}

                        {activeTab === "schulungen" && (
                        <div style={{ display: "grid", gap: 12 }}>
                          <h3 style={{ margin: 0, color: "#007873", fontSize: 18, fontWeight: 700 }}>
                            Schulungen & Status
                          </h3>
                          {enrollmentsLoadingId === user.id ? (
                            <div style={{ color: "#888888", fontSize: 13 }}>Wird geladen…</div>
                          ) : (enrollmentsByUser[user.id] ?? []).length === 0 ? (
                            <div style={{ color: "#888888", fontSize: 13 }}>Keine Schulungen zugeordnet.</div>
                          ) : (
                            <div style={{ display: "grid", gap: 8 }}>
                              {(enrollmentsByUser[user.id] ?? []).map((enr) => {
                                const sc = statusColor(enr.status);
                                const title = enr.training.code?.trim() || enr.training.title;
                                const date = new Date(enr.training.date).toLocaleDateString("de-DE");
                                return (
                                  <div key={enr.id} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #EFEFEF", background: "#FAFAFA", display: "grid", gap: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1F1F1F", lineHeight: 1.2 }}>{title}</div>
                                        <div style={{ fontSize: 12, color: "#888888", marginTop: 2 }}>{date} · {enr.training.creditsAward} Credits{enr.hasCertificate ? " · Zertifikat vorhanden" : ""}</div>
                                      </div>
                                      <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: sc.border, whiteSpace: "nowrap" }}>
                                        {statusLabel(enr.status)}
                                      </span>
                                    </div>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                      {ENROLLMENT_STATUSES.map((s) => (
                                        <button
                                          key={s.value}
                                          type="button"
                                          disabled={enr.status === s.value || enrollmentActionId === enr.id}
                                          onClick={() => changeEnrollmentStatus(enr.id, user.id, s.value)}
                                          style={{
                                            padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                                            border: enr.status === s.value ? "1px solid #007873" : "1px solid #D8D8D8",
                                            background: enr.status === s.value ? "#007873" : "#FFFFFF",
                                            color: enr.status === s.value ? "#FFFFFF" : "#555555",
                                            cursor: enr.status === s.value ? "default" : "pointer",
                                            opacity: enrollmentActionId === enr.id ? 0.6 : 1,
                                          }}
                                        >
                                          {s.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        )}

                        {activeTab === "credits" && (
                        <div
                          style={{
                            display: "grid",
                            gap: 14,
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              color: "#007873",
                              fontSize: 20,
                              fontWeight: 500,
                            }}
                          >
                            Credits bearbeiten
                          </h3>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(220px, 1fr))",
                              gap: 12,
                            }}
                          >
                            <AppInput
                              label="Credit-Betrag"
                              value={creditAmountByUser[user.id] ?? ""}
                              placeholder="z. B. 100"
                              onChange={(value) => {
                                if (value === "" || /^\d+$/.test(value)) {
                                  setCreditAmountByUser((current) => ({
                                    ...current,
                                    [user.id]: value,
                                  }));
                                }
                              }}
                            />

                            <AppInput
                              label="Notiz optional"
                              value={creditNoteByUser[user.id] ?? ""}
                              placeholder="z. B. Korrektur / Sondervergabe"
                              onChange={(value) =>
                                setCreditNoteByUser((current) => ({
                                  ...current,
                                  [user.id]: value,
                                }))
                              }
                            />
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <AppButton
                              onClick={() => changeCredits(user, "add")}
                              disabled={isLoading}
                              variant="primary"
                            >
                              {isLoading ? "Speichern..." : "Credits vergeben"}
                            </AppButton>

                            <AppButton
                              onClick={() => changeCredits(user, "remove")}
                              disabled={isLoading}
                              variant="danger"
                            >
                              {isLoading ? "Speichern..." : "Credits abziehen"}
                            </AppButton>
                          </div>
                        </div>
                        )}

                        {activeTab === "rollen" && (
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              color: "#007873",
                              fontSize: 20,
                              fontWeight: 500,
                            }}
                          >
                            Rollen verwalten
                          </h3>

                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <AppButton
                              onClick={() => promote(user)}
                              disabled={isLoading || user.role === "ADMIN"}
                              variant="primary"
                            >
                              {user.role === "ADMIN"
                                ? "Ist bereits Admin"
                                : "Zum Admin machen"}
                            </AppButton>

                            <AppButton
                              onClick={() => toggleInstructor(user)}
                              disabled={isLoading}
                              variant={user.isInstructor ? "danger" : "primary"}
                            >
                              {isLoading
                                ? "Speichern..."
                                : user.isInstructor
                                ? "Dozentenstatus entziehen"
                                : "Zum Dozenten machen"}
                            </AppButton>
                          </div>

                          <p
                            style={{
                              margin: 0,
                              color: "#666666",
                              lineHeight: 1.6,
                              fontSize: 14,
                            }}
                          >
                            Der Dozentenstatus ist ein eigener Status, damit jemand
                            gleichzeitig User, Admin und Dozent sein kann.
                          </p>
                        </div>
                        )}

                        {activeTab === "löschen" && (
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              color: "#B00020",
                              fontSize: 20,
                              fontWeight: 500,
                            }}
                          >
                            Nutzer löschen
                          </h3>

                          <p
                            style={{
                              margin: 0,
                              color: "#333333",
                              lineHeight: 1.6,
                              fontSize: 14,
                              maxWidth: 760,
                            }}
                          >
                            Löscht den Nutzer inklusive Schulungszuordnungen,
                            Zertifikaten und Credit-Historie aus der Datenbank.
                            Danach kann sich die Person mit dieser E-Mail erneut
                            registrieren.
                          </p>

                          <div>
                            <AppButton
                              onClick={() => deleteUser(user)}
                              disabled={isLoading}
                              variant="danger"
                            >
                              {isLoading ? "Löschen..." : "Nutzer löschen"}
                            </AppButton>
                          </div>
                        </div>
                        )}
                      </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </AppCard>
      </div>
    </main>
  );
}

function getUserDisplayName(user: AdminUser) {
  return user.name || user.email || "Ohne Namen";
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          color: "#007873",
          fontSize: 12,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 3,
        }}
      >
        {label}
      </div>

      <div style={{ color: "#1F1F1F", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("de-DE");
}