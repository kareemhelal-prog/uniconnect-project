import { useState, useEffect, useCallback } from "react";
import "../styles/AccountReview.css";
import api from "../api/axios";

/* ─── Icons ─── */
const Ico = {
  user: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
  mail: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" /><path d="m22 6-10 7L2 6" /></svg>),
  phone: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>),
  id: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M15 8h3M15 12h3M7 16h10" /></svg>),
  year: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>),
  track: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>),
  check: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>),
  x: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>),
  refresh: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>),
  inbox: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>),
};

const ROLE_LABEL = { student: "Student", doctor: "Doctor", investor: "Investor" };
const YEAR_LABEL = { 1: "First Year", 2: "Second Year", 3: "Third Year", 4: "Fourth Year" };
const fmtDate = (s) => s ? new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return <div className={`ar-toast ar-toast-${type}`}>{message}</div>;
}

/* A submitted value paired with the registry value, so the admin sees matches. */
function VerifyRow({ icon: Icon, label, submitted, registry }) {
  const match = registry == null || String(submitted ?? "").toLowerCase().trim() === String(registry ?? "").toLowerCase().trim();
  return (
    <div className="ar-field">
      <span className="ar-field-icon"><Icon /></span>
      <div className="ar-field-body">
        <span className="ar-field-label">{label}</span>
        <span className="ar-field-value">{submitted ?? "—"}</span>
      </div>
      {registry != null && (
        <span className={`ar-verify ${match ? "ok" : "bad"}`} title={`University record: ${registry}`}>
          {match ? <Ico.check /> : <Ico.x />}
          {match ? "Matches" : `Record: ${registry}`}
        </span>
      )}
    </div>
  );
}

function ReviewCard({ u, onApprove, onReject, busy }) {
  const [confirmReject, setConfirmReject] = useState(false);
  const [reason, setReason] = useState("");
  const isStudent = u.role === "student";

  return (
    <div className="ar-card">
      <div className="ar-card-head">
        <div className="ar-avatar">{(u.name || "?").charAt(0).toUpperCase()}</div>
        <div className="ar-head-info">
          <h3 className="ar-name">{u.name || "Unnamed"}</h3>
          <span className="ar-username">@{u.username}</span>
        </div>
        <span className={`ar-role-badge ar-role-${u.role}`}>{ROLE_LABEL[u.role] || u.role}</span>
      </div>

      <div className="ar-fields">
        <VerifyRow icon={Ico.mail}  label="Email"        submitted={u.email} registry={null} />
        <VerifyRow icon={Ico.phone} label="Phone"        submitted={u.phone_number} registry={null} />
        {isStudent && <>
          <VerifyRow icon={Ico.id}    label="Academic ID"   submitted={u.academic_id} registry={null} />
          <VerifyRow icon={Ico.user}  label="Name on record" submitted={u.name} registry={u.registry_name} />
          <VerifyRow icon={Ico.year}  label="Year"          submitted={YEAR_LABEL[u.academic_year] || u.academic_year} registry={u.registry_year ? YEAR_LABEL[u.registry_year] : null} />
          {(u.academic_year === "3" || u.academic_year === "4" || u.track) &&
            <VerifyRow icon={Ico.track} label="Specialization" submitted={cap(u.track)} registry={u.registry_track ? cap(u.registry_track) : null} />}
        </>}
      </div>

      <div className="ar-card-foot">
        <span className="ar-date">Submitted {fmtDate(u.created_at)}</span>
        {!confirmReject ? (
          <div className="ar-actions">
            <button className="ar-btn ar-btn-reject" disabled={busy} onClick={() => setConfirmReject(true)}><Ico.x /> Reject</button>
            <button className="ar-btn ar-btn-approve" disabled={busy} onClick={() => onApprove(u)}><Ico.check /> Approve</button>
          </div>
        ) : (
          <div className="ar-reject-box">
            <input className="ar-reason" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button className="ar-btn ar-btn-ghost" disabled={busy} onClick={() => { setConfirmReject(false); setReason(""); }}>Cancel</button>
            <button className="ar-btn ar-btn-reject" disabled={busy} onClick={() => onReject(u, reason)}>Confirm delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountReview() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const notify = (message, type = "success") => setToast({ message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/pending");
      setUsers(data.users || []);
    } catch (e) {
      notify("Failed to load pending accounts", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { document.title = "Account Review - UniConnect Admin"; load(); }, [load]);

  const handleApprove = async (u) => {
    setBusyId(u.id);
    try {
      await api.put(`/admin/users/${u.id}/approve`);
      setUsers((list) => list.filter((x) => x.id !== u.id));
      notify(`${u.name || "Account"} approved ✓`, "success");
    } catch (e) {
      notify("Approval failed", "error");
    } finally { setBusyId(null); }
  };

  const handleReject = async (u, reason) => {
    setBusyId(u.id);
    try {
      await api.put(`/admin/users/${u.id}/reject`, { reason });
      setUsers((list) => list.filter((x) => x.id !== u.id));
      notify(`${u.name || "Account"} rejected & removed`, "error");
    } catch (e) {
      notify("Rejection failed", "error");
    } finally { setBusyId(null); }
  };

  return (
    <div className="ar-page">
      <div className="ar-header">
        <div>
          <h1 className="ar-title">Account Review</h1>
          <p className="ar-subtitle">Verify new sign-ups against university records, then approve or reject.</p>
        </div>
        <div className="ar-header-right">
          <span className="ar-count">{users.length} pending</span>
          <button className="ar-refresh" onClick={load} disabled={loading}><Ico.refresh /> Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="ar-state"><div className="ar-spinner" /><p>Loading pending accounts…</p></div>
      ) : users.length === 0 ? (
        <div className="ar-state ar-empty">
          <span className="ar-empty-icon"><Ico.inbox /></span>
          <h3>All caught up</h3>
          <p>There are no accounts waiting for review right now.</p>
        </div>
      ) : (
        <div className="ar-grid">
          {users.map((u) => (
            <ReviewCard key={u.id} u={u} busy={busyId === u.id} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
