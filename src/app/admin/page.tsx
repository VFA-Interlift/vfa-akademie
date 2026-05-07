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
  creditsTotal: number;
  enrollmentsCount: number;
  certificatesCount: number;
  createdAt: string;
};

type UsersResponse =
  | {
      ok: true;
      users: AdminUser[];
    }
  | {
      ok: false;
      error: string;
    };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [usersOpen, setUsersOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

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

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return users;

    return users.filter((user) => {
      return (
        user.email.toLowerCase().includes(q) ||
        user.name.toLowerCase().includes(q) ||
        user.company.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  async function promote() {
    setLoading(true);
    setMsg("");
    setMsgOk(false);

    try {
      const res = await fetch("/api/admin/users/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const text = await res.text();

      let data: any = null;

      try {
        data = JSON.parse(text);
      } catch {
        showMessage("Serverantwort konnte nicht gelesen werden.");
        return;
      }

      if (!res.ok || !data?.ok) {
        if (data?.error === "INVALID_EMAIL") {
          showMessage("Bitte eine gültige E-Mail eingeben.");
        } else if (data?.error === "USER_NOT_FOUND") {
          showMessage("User wurde nicht gefunden. Der User muss zuerst registriert sein.");
        } else if (data?.error === "UNAUTHENTICATED") {
          showMessage("Du bist nicht eingeloggt.");
        } else if (data?.error === "FORBIDDEN") {
          showMessage("Du hast keine Berechtigung.");
        } else {
          showMessage(data?.error ?? "Admin-Vergabe fehlgeschlagen.");
        }

        return;
      }

      showMessage(`${data.email} ist jetzt Admin.`, true);
      setEmail("");
      await loadUsers();
    } catch {
      showMessage("Serverfehler beim Ernennen des Admins.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F7F4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <PageHeader
          title="Nutzer verwalten"
          description="Hier kannst du registrierte Nutzer prüfen und ausgewählte Nutzer zum Admin machen."
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

        <div style={{ display: "grid", gap: 16 }}>
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
                  User zum Admin machen
                </h2>

                <p
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: "#333333",
                    lineHeight: 1.6,
                    maxWidth: 720,
                  }}
                >
                  Gib die E-Mail-Adresse eines bereits registrierten Users ein.
                  Danach hat der User Zugriff auf den Adminbereich.
                </p>
              </div>

              <StatusBadge variant="yellow">Adminrechte</StatusBadge>
            </div>

            <div style={{ display: "grid", gap: 14, maxWidth: 620 }}>
              <AppInput
                label="User E-Mail"
                value={email}
                placeholder="user@example.com"
                type="email"
                onChange={setEmail}
              />

              <AppButton
                onClick={promote}
                disabled={loading || !email.trim()}
                variant="primary"
              >
                {loading ? "Wird verarbeitet..." : "Zum Admin machen"}
              </AppButton>
            </div>
          </AppCard>

          <AppCard accent="yellow">
            <button
              type="button"
              onClick={() => setUsersOpen((value) => !value)}
              style={{
                width: "100%",
                padding: 0,
                border: "none",
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
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
                      maxWidth: 720,
                    }}
                  >
                    Aufklappen, um alle registrierten Nutzer, Rollen, Credits,
                    Schulungen und Zertifikate zu sehen.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <StatusBadge>{users.length} Nutzer</StatusBadge>
                  <StatusBadge variant="yellow">
                    {usersOpen ? "Schließen ▲" : "Öffnen ▼"}
                  </StatusBadge>
                </div>
              </div>
            </button>

            {usersOpen && (
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop: "1px solid #E6E6E6",
                  display: "grid",
                  gap: 18,
                }}
              >
                <AppInput
                  label="Suche"
                  value={search}
                  placeholder="Name, E-Mail, Firma oder Rolle suchen"
                  onChange={setSearch}
                />

                {loadingUsers ? (
                  <div style={{ color: "#333333", lineHeight: 1.6 }}>
                    Nutzer werden geladen...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div style={{ color: "#333333", lineHeight: 1.6 }}>
                    Keine Nutzer gefunden.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {filteredUsers.map((user) => (
                      <UserRow key={user.id} user={user} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </AppCard>
        </div>
      </div>
    </main>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <div
      style={{
        border: "1px solid #E6E6E6",
        background: "#FFFFFF",
        padding: 14,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "flex-start",
          flexWrap: "wrap",
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

          {user.company && (
            <div
              style={{
                marginTop: 4,
                color: "#666666",
                fontSize: 14,
              }}
            >
              {user.company}
            </div>
          )}
        </div>

        <StatusBadge variant={user.role === "ADMIN" ? "yellow" : "default"}>
          {user.role}
        </StatusBadge>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          paddingTop: 10,
          borderTop: "1px solid #E6E6E6",
        }}
      >
        <MiniInfo label="Credits" value={String(user.creditsTotal)} />
        <MiniInfo label="Schulungen" value={String(user.enrollmentsCount)} />
        <MiniInfo label="Zertifikate" value={String(user.certificatesCount)} />
        <MiniInfo label="Registriert" value={formatDate(user.createdAt)} />
      </div>
    </div>
  );
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