"use client";

import { useEffect, useMemo, useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppSelect from "@/components/ui/AppSelect";
import Meldung from "@/components/ui/Meldung";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatEnrollmentStatus, formatDate } from "@/lib/trainings/format";

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
  lastLoginAt: string | null;
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
  certificateId?: string | null;
  certificateStatus?: string | null;
};

// Die fünf Status, die ein Admin von Hand setzt; die Bezeichnungen kommen aus
// formatEnrollmentStatus, das auch COMPLETED und CERTIFICATE_ISSUED kennt —
// vorher standen die als englischer Rohwert in der Liste (Befund f12-4).
const ENROLLMENT_STATUSES = ["PENDING", "CONFIRMED", "ATTENDED", "NO_SHOW", "CANCELLED"] as const;

function statusVariant(status: string): "success" | "danger" | "warning" {
  if (status === "CONFIRMED" || status === "ATTENDED" || status === "COMPLETED" || status === "CERTIFICATE_ISSUED") return "success";
  if (status === "CANCELLED" || status === "NO_SHOW") return "danger";
  return "warning";
}

function rolleText(user: AdminUser) {
  return user.role === "ADMIN" ? "Admin" : "Nutzer";
}

// Eine Übersetzung für alle Fehlercodes der Admin-Routen — vorher übersetzte
// jede Aktion ihre eigenen und die Liste zeigte rohe Codes (Befund d17-28).
const FEHLERTEXTE: Record<string, string> = {
  UNAUTHENTICATED: "Du bist nicht eingeloggt.",
  FORBIDDEN: "Du hast keine Berechtigung.",
  USER_NOT_FOUND: "Nutzer wurde nicht gefunden.",
  INVALID_USER_ID: "Ungültige Nutzer-ID.",
  INVALID_EMAIL: "Bitte eine gültige E-Mail eingeben.",
  INVALID_CREDITS: "Bitte eine ganze Zahl größer als 0 eingeben.",
  CANNOT_DELETE_SELF: "Du kannst deinen eigenen Admin-Nutzer nicht löschen.",
  ALREADY_ENROLLED: "Ist bereits in dieser Schulung eingetragen.",
  TRAINING_NOT_FOUND: "Schulung nicht gefunden.",
  TRAINING_CANCELLED: "Diese Schulung ist abgesagt. Dort lässt sich niemand mehr eintragen.",
  TRAINING_REQUIRED: "Bitte eine Schulung auswählen.",
  NOT_FOUND: "Der Eintrag wurde nicht gefunden.",
  INVALID_STATUS: "Ungültiger Status.",
  ALREADY_REVOKED: "Dieses Zertifikat ist bereits zurückgezogen.",
  INTERNAL_ERROR: "Serverfehler.",
};

function fehlerText(data: { error?: unknown; message?: unknown } | null, fallback: string) {
  if (typeof data?.message === "string" && data.message) return data.message;
  const code = typeof data?.error === "string" ? data.error : "";
  return FEHLERTEXTE[code] ?? fallback;
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
  | "role_asc"
  | "lastlogin_desc";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "created_desc", label: "Registrierung: neueste zuerst" },
  { value: "created_asc", label: "Registrierung: älteste zuerst" },
  { value: "name_asc", label: "Name: A–Z" },
  { value: "name_desc", label: "Name: Z–A" },
  { value: "credits_desc", label: "Credits: höchste zuerst" },
  { value: "credits_asc", label: "Credits: niedrigste zuerst" },
  { value: "lastlogin_desc", label: "Zuletzt online: neueste zuerst" },
  { value: "role_asc", label: "Rolle" },
];

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

  // Schulungsliste für das Nachtragen (einmal geladen, sobald ein Nutzer offen ist).
  const [alleTrainings, setAlleTrainings] = useState<{ id: string; title: string; code: string | null; date: string; cancelledAt: string | null }[]>([]);
  const [nachtragTrainingByUser, setNachtragTrainingByUser] = useState<Record<string, string>>({});

  async function ladeTrainings() {
    if (alleTrainings.length > 0) return;
    try {
      const res = await fetch("/api/admin/trainings", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setAlleTrainings(data.trainings);
    } catch { /* still */ }
  }

  async function enrollUser(userId: string) {
    const trainingId = nachtragTrainingByUser[userId];
    if (!trainingId) { showMessage("Bitte eine Schulung auswählen."); return; }
    setEnrollmentActionId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId }),
      });
      const data = await res.json();
      if (data.ok) {
        // Liste neu laden statt die Zeile lokal zu erfinden — die zeigte bis
        // zum Neuladen „0 Credits“ (Befund f12-5, 05.09.2026).
        await loadEnrollments(userId, true);
        setNachtragTrainingByUser((prev) => ({ ...prev, [userId]: "" }));
        showMessage("Teilnehmer in die Schulung eingetragen.", true);
      } else {
        showMessage(fehlerText(data, "Fehler beim Eintragen."));
      }
    } catch { showMessage("Serverfehler."); }
    finally { setEnrollmentActionId(null); }
  }

  async function loadEnrollments(userId: string, erzwingen = false) {
    void ladeTrainings();
    if (!erzwingen && enrollmentsByUser[userId]) return;
    setEnrollmentsLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/enrollments`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setEnrollmentsByUser((prev) => ({ ...prev, [userId]: data.enrollments }));
      } else {
        throw new Error(data.error ?? "LADEN_FEHLGESCHLAGEN");
      }
    } catch (fehler) {
      // Vorher wurde der Fehler verschluckt: Die Oberfläche zeigte dann
      // „Keine Schulungen zugeordnet" — ein Ladefehler sah aus wie ein leeres
      // Ergebnis und wurde entsprechend falsch gemeldet.
      console.error("ADMIN_ENROLLMENTS_LOAD_ERROR", fehler);
      showMessage("Die Schulungen dieses Nutzers ließen sich nicht laden.", false);
    } finally {
      setEnrollmentsLoadingId(null);
    }
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
        const attended = newStatus === "ATTENDED" || newStatus === "COMPLETED" || newStatus === "CERTIFICATE_ISSUED";
        setEnrollmentsByUser((prev) => ({
          ...prev,
          [userId]: (prev[userId] ?? []).map((e) =>
            e.id === enrollmentId ? { ...e, status: newStatus, attended } : e
          ),
        }));
        showMessage(`Status auf „${formatEnrollmentStatus(newStatus)}“ geändert.`, true);
      } else {
        showMessage(fehlerText(data, "Fehler beim Ändern des Status."));
      }
    } catch { showMessage("Serverfehler."); }
    finally { setEnrollmentActionId(null); }
  }

  async function revokeCertificate(certificateId: string, userId: string) {
    if (!window.confirm("Zertifikat wirklich zurückziehen? Die dafür gutgeschriebenen Credits werden zurückgebucht.")) {
      return;
    }
    setEnrollmentActionId(certificateId);
    try {
      const res = await fetch(`/api/admin/certificates/${certificateId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setEnrollmentsByUser((prev) => ({
          ...prev,
          [userId]: (prev[userId] ?? []).map((e) =>
            e.certificateId === certificateId
              ? { ...e, status: "NO_SHOW", hasCertificate: false, certificateId: null, certificateStatus: "REVOKED" }
              : e
          ),
        }));
        showMessage(`Zertifikat zurückgezogen, ${data.creditsZurueck} Credits zurückgebucht.`, true);
      } else {
        showMessage(fehlerText(data, "Fehler beim Zurückziehen."));
      }
    } catch { showMessage("Serverfehler."); }
    finally { setEnrollmentActionId(null); }
  }

  function showMessage(message: string, ok = false) {
    setMsg(message);
    setMsgOk(ok);
  }

  // Nachladen nach einer Aktion: Ladezustand zeigen, dann holen.
  async function loadUsers() {
    setLoadingUsers(true);
    await nutzerHolen();
  }

  // Erstes Laden beim Öffnen — der Ladezustand steht da schon auf true, deshalb
  // ohne vorheriges setState (react-hooks/set-state-in-effect, 05.09.2026).
  async function nutzerHolen() {
    try {
      const res = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const data = (await res.json()) as UsersResponse;

      if (!data.ok) {
        showMessage(fehlerText(data, "Nutzer konnten nicht geladen werden."));
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
    void nutzerHolen();
    // Einmal beim Öffnen laden; die Funktion ändert sich nicht sinnvoll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAndSortedUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = !q
      ? users
      : users.filter((user) => {
          // Rolle so suchen, wie sie angezeigt wird („Nutzer“, „Admin“,
          // „Dozent“), nicht über den englischen Enum-Wert (Befund d17-30).
          const rollen = [rolleText(user), user.isInstructor ? "Dozent" : ""].join(" ").toLowerCase();
          return (
            user.email.toLowerCase().includes(q) ||
            user.name.toLowerCase().includes(q) ||
            user.company.toLowerCase().includes(q) ||
            rollen.includes(q)
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

      if (sortMode === "lastlogin_desc") {
        const at = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const bt = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        return bt - at;
      }

      return 0;
    });
  }, [users, search, sortMode]);

  async function promote(user: AdminUser) {
    if (user.role === "ADMIN") {
      showMessage("Dieser Nutzer ist bereits Admin.", true);
      return;
    }

    // Rückfrage: Admin-Rechte umfassen alle Nutzerdaten, Zertifikate und
    // Credits — und lassen sich in dieser Oberfläche nicht wieder entziehen.
    const sicher = window.confirm(
      `${user.email} zum Admin machen? Damit bekommt die Person Zugriff auf alle Nutzerdaten, Zertifikate und Credits. Zurücknehmen lässt sich das hier nicht.`
    );
    if (!sicher) return;

    setActionLoadingId(user.id);
    showMessage("Admin-Vergabe wird gestartet …", true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}/make-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        showMessage(fehlerText(data, "Admin-Vergabe fehlgeschlagen."));
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
        ? "Dozentenstatus wird vergeben …"
        : "Dozentenstatus wird entzogen …",
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
        showMessage(fehlerText(data, "Dozentenstatus konnte nicht geändert werden."));
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
        showMessage(fehlerText(data, "Credits konnten nicht gespeichert werden."));
        return;
      }

      // Gebuchten Betrag und neuen Saldo aus der Antwort nennen: Bei einem
      // Abzug über den Saldo hinaus kappt der Server auf 0 (Befund f12-6).
      const angewendet = Math.abs(typeof data.angewendet === "number" ? data.angewendet : signedAmount);
      const saldo = typeof data.creditsTotal === "number" ? ` Neuer Saldo: ${data.creditsTotal} Credits.` : "";
      if (direction === "add") {
        showMessage(`${angewendet} Credits wurden an ${user.email} vergeben.${saldo}`, true);
      } else {
        const gekappt = angewendet !== amount ? ` (angefordert waren ${amount}, mehr war nicht auf dem Konto)` : "";
        showMessage(`${angewendet} Credits wurden bei ${user.email} abgezogen${gekappt}.${saldo}`, true);
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
        showMessage(fehlerText(data, "Nutzer konnte nicht gelöscht werden."));
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
    <main className="page-main">
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <PageHeader title="Nutzer verwalten" />
        {/* PageHeader zeigt description nicht an — der Satz steht deshalb hier. */}
        <p style={{ margin: "0 0 20px", fontSize: "var(--t-basis)", color: "var(--vfa-text-2)" }}>
          Profile prüfen, Credits bearbeiten, Rollen vergeben und Nutzer löschen.
        </p>

        {msg && (
          <Meldung art={msgOk ? "erfolg" : "fehler"} style={{ marginBottom: 18 }}>
            {msg}
          </Meldung>
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
                  color: "var(--vfa-gruen-text)",
                  fontSize: "var(--t-gross)",
                  fontWeight: 700,
                  lineHeight: "var(--lh-eng)",
                }}
              >
                Registrierte Nutzer
              </h2>

              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "var(--vfa-text-2)",
                  fontSize: "var(--t-basis)",
                  lineHeight: "var(--lh-weit)",
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

            {/* AppSelect führt immer eine leere Platzhalter-Option; die wird
                hier ignoriert, weil eine Sortierung immer gesetzt ist. */}
            <AppSelect
              label="Sortieren nach"
              value={sortMode}
              placeholder="Sortierung wählen"
              options={SORT_OPTIONS}
              onChange={(value) => { if (value) setSortMode(value as SortMode); }}
            />
          </div>

          {loadingUsers ? (
            <div style={{ color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
              Nutzer werden geladen …
            </div>
          ) : filteredAndSortedUsers.length === 0 ? (
            <div style={{ color: "var(--vfa-text-2)", lineHeight: "var(--lh-weit)" }}>
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
                      border: "1px solid var(--vfa-linie)",
                      background: "var(--vfa-karte)",
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
                        color: "inherit",
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
                              color: "var(--vfa-gruen-text)",
                              fontSize: "var(--t-gross)",
                              fontWeight: 700,
                              lineHeight: "var(--lh-eng)",
                            }}
                          >
                            {user.name || "Ohne Namen"}
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              color: "var(--vfa-text-2)",
                              fontSize: "var(--t-basis)",
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
                            color: "var(--vfa-gruen-text)",
                            fontWeight: 700,
                            fontSize: "var(--t-titel)",
                          }}
                          aria-hidden
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
                          borderTop: "1px solid var(--vfa-linie)",
                        }}
                      >
                        <div style={{ display: "flex", borderBottom: "1px solid var(--vfa-linie)", marginBottom: 16, gap: 0, overflowX: "auto", paddingTop: 14 }}>
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
                                    ? "2px solid var(--vfa-gruen-text)"
                                    : "2px solid transparent",
                                background: "transparent",
                                color: activeTab === tab.id ? "var(--vfa-gruen-text)" : "var(--vfa-text-3)",
                                fontWeight: activeTab === tab.id ? 700 : 600,
                                fontSize: "var(--t-klein)",
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
                            Rolle: {rolleText(user)}
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
                          <MiniInfo
                            label="Zuletzt online"
                            value={formatLastLogin(user.lastLoginAt)}
                          />
                        </div>
                        </>
                        )}

                        {activeTab === "schulungen" && (
                        <div style={{ display: "grid", gap: 12 }}>
                          <h3 style={{ margin: 0, color: "var(--vfa-gruen-text)", fontSize: "var(--t-gross)", fontWeight: 700, lineHeight: "var(--lh-eng)" }}>
                            Schulungen und Status
                          </h3>

                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", padding: "12px 14px", borderRadius: 10, border: "1px dashed var(--vfa-linie)", background: "var(--vfa-karte-2)" }}>
                            <div style={{ flex: 1, minWidth: 220 }}>
                              <AppSelect
                                label="Nachtragen"
                                value={nachtragTrainingByUser[user.id] ?? ""}
                                placeholder="Schulung wählen …"
                                onChange={(value) => setNachtragTrainingByUser((prev) => ({ ...prev, [user.id]: value }))}
                                options={alleTrainings.map((t) => ({
                                  value: t.id,
                                  label: `${t.code?.trim() || t.title} · ${formatDate(t.date)}${t.cancelledAt ? " · abgesagt" : ""}`,
                                }))}
                              />
                            </div>
                            <AppButton
                              onClick={() => enrollUser(user.id)}
                              disabled={enrollmentActionId === user.id || !nachtragTrainingByUser[user.id]}
                              variant="primary"
                            >
                              Eintragen
                            </AppButton>
                          </div>
                          {enrollmentsLoadingId === user.id ? (
                            <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-klein)" }}>Wird geladen …</div>
                          ) : (enrollmentsByUser[user.id] ?? []).length === 0 ? (
                            <div style={{ color: "var(--vfa-text-3)", fontSize: "var(--t-klein)" }}>Keine Schulungen zugeordnet.</div>
                          ) : (
                            <div style={{ display: "grid", gap: 8 }}>
                              {(enrollmentsByUser[user.id] ?? []).map((enr) => {
                                const title = enr.training.code?.trim() || enr.training.title;
                                const zertifikat = enr.hasCertificate
                                  ? " · Zertifikat vorhanden"
                                  : enr.certificateStatus === "REVOKED"
                                    ? " · Zertifikat zurückgezogen"
                                    : "";
                                return (
                                  <div key={enr.id} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--vfa-linie)", background: "var(--vfa-karte-2)", display: "grid", gap: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: "var(--t-basis)", color: "var(--vfa-text)", lineHeight: "var(--lh-eng)" }}>{title}</div>
                                        <div style={{ fontSize: "var(--t-klein)", color: "var(--vfa-text-3)", marginTop: 2 }}>{formatDate(enr.training.date)} · {enr.training.creditsAward} Credits{zertifikat}</div>
                                      </div>
                                      <StatusBadge variant={statusVariant(enr.status)}>
                                        {formatEnrollmentStatus(enr.status)}
                                      </StatusBadge>
                                    </div>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                      {ENROLLMENT_STATUSES.map((s) => (
                                        <AppButton
                                          key={s}
                                          disabled={enr.status === s || enrollmentActionId === enr.id}
                                          onClick={() => changeEnrollmentStatus(enr.id, user.id, s)}
                                          variant={enr.status === s ? "primary" : "secondary"}
                                        >
                                          {formatEnrollmentStatus(s)}
                                        </AppButton>
                                      ))}
                                    </div>
                                    {enr.certificateId ? (
                                      <div>
                                        <AppButton
                                          disabled={enrollmentActionId === enr.certificateId}
                                          onClick={() => revokeCertificate(enr.certificateId!, user.id)}
                                          variant="danger"
                                        >
                                          Zertifikat zurückziehen
                                        </AppButton>
                                      </div>
                                    ) : null}
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
                              color: "var(--vfa-gruen-text)",
                              fontSize: "var(--t-gross)",
                              fontWeight: 700,
                              lineHeight: "var(--lh-eng)",
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
                              {isLoading ? "Speichern …" : "Credits vergeben"}
                            </AppButton>

                            <AppButton
                              onClick={() => changeCredits(user, "remove")}
                              disabled={isLoading}
                              variant="danger"
                            >
                              {isLoading ? "Speichern …" : "Credits abziehen"}
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
                              color: "var(--vfa-gruen-text)",
                              fontSize: "var(--t-gross)",
                              fontWeight: 700,
                              lineHeight: "var(--lh-eng)",
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
                                ? "Speichern …"
                                : user.isInstructor
                                ? "Dozentenstatus entziehen"
                                : "Zum Dozenten machen"}
                            </AppButton>
                          </div>

                          <p
                            style={{
                              margin: 0,
                              color: "var(--vfa-text-2)",
                              lineHeight: "var(--lh-weit)",
                              fontSize: "var(--t-basis)",
                            }}
                          >
                            Der Dozentenstatus ist ein eigener Status, damit jemand
                            gleichzeitig Nutzer, Admin und Dozent sein kann.
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
                              color: "var(--vfa-rot-text)",
                              fontSize: "var(--t-gross)",
                              fontWeight: 700,
                              lineHeight: "var(--lh-eng)",
                            }}
                          >
                            Nutzer löschen
                          </h3>

                          <p
                            style={{
                              margin: 0,
                              color: "var(--vfa-text-2)",
                              lineHeight: "var(--lh-weit)",
                              fontSize: "var(--t-basis)",
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
                              {isLoading ? "Löschen …" : "Nutzer löschen"}
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
      <div className="etikett" style={{ marginBottom: 3 }}>
        {label}
      </div>

      <div style={{ color: "var(--vfa-text)", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function formatLastLogin(value: string | null) {
  if (!value) return "Noch nie";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Noch nie";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std.`;

  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Gestern";
  if (diffD < 7) return `vor ${diffD} Tagen`;

  return formatDate(value);
}
