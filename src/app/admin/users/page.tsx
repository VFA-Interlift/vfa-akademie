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
  const [openId, setOpenId] = useState<string | null>(null);

  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [creditAmountByUser, setCreditAmountByUser] = useState<Record<string, string>>({});
  const [creditNoteByUser, setCreditNoteByUser] = useState<Record<string, string>>({});

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

  async function promote(user: AdminUser) {
    if (user.role === "ADMIN") {
      showMessage("Dieser Nutzer ist bereits Admin.", true);
      return;
    }

    setActionLoadingId(user.id);
    setMsg("");
    setMsgOk(false);

    try {
      const res = await fetch("/api/admin/users/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email.trim().toLowerCase(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        if (data?.error === "INVALID_EMAIL") {
          showMessage("Bitte eine gültige E-Mail eingeben.");
        } else if (data?.error === "USER_NOT_FOUND") {
          showMessage("User wurde nicht gefunden.");
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
          description="Hier verwaltest du registrierte Nutzer, Credits, Schulungsübersichten und Adminrechte zentral an einer Stelle."
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
                In der Liste werden zunächst nur Name und E-Mail angezeigt.
                Über das Plus öffnest du Credits, Rollen, Schulungen und
                Zertifikate.
              </p>
            </div>

            <StatusBadge variant="yellow">{users.length} Nutzer</StatusBadge>
          </div>

          <div style={{ marginBottom: 18 }}>
            <AppInput
              label="Suche"
              value={search}
              placeholder="Name, E-Mail, Firma oder Rolle suchen"
              onChange={setSearch}
            />
          </div>

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
              {filteredUsers.map((user) => {
                const isOpen = openId === user.id;
                const isLoading = actionLoadingId === user.id;

                return (
                  <div
                    key={user.id}
                    style={{
                      border: "1px solid #E6E6E6",
                      background: "#FFFFFF",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : user.id)}
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

                    {isOpen && (
                      <div
                        style={{
                          padding: "0 14px 14px",
                          borderTop: "1px solid #E6E6E6",
                        }}
                      >
                        <div
                          style={{
                            paddingTop: 14,
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
                            marginBottom: 18,
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

                        <div
                          style={{
                            display: "grid",
                            gap: 14,
                            paddingTop: 16,
                            borderTop: "1px solid #E6E6E6",
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

                        <div
                          style={{
                            marginTop: 18,
                            paddingTop: 16,
                            borderTop: "1px solid #E6E6E6",
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

                            <button
                              type="button"
                              disabled
                              title="Wird später mit isInstructor-Feld ergänzt"
                              style={{
                                minHeight: 42,
                                padding: "10px 18px",
                                borderRadius: 999,
                                border: "1px solid #C7C7C7",
                                background: "#F3F3F3",
                                color: "#777777",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                cursor: "not-allowed",
                              }}
                            >
                              Dozentenstatus folgt
                            </button>
                          </div>

                          <p
                            style={{
                              margin: 0,
                              color: "#666666",
                              lineHeight: 1.6,
                              fontSize: 14,
                            }}
                          >
                            Der Dozentenstatus wird als eigener Status ergänzt,
                            damit jemand gleichzeitig User, Admin und Dozent sein
                            kann.
                          </p>
                        </div>
                      </div>
                    )}
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