import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import "../styles/GroupRequests.css";

const parseAud = (s) => (!s ? [] : String(s).split(",").map(p => { const [year, track] = p.split(":"); return { year, track }; }));
const TR = { software: "Software", networks: "Networks" };
const audLabel = (s) => {
  const a = parseAud(s);
  if (a.length === 0) return "Everyone";
  return a.map(p => `Year ${p.year}${p.track && p.track !== "all" ? ` · ${TR[p.track]}` : ""}`).join(" · ");
};

export default function GroupRequests() {
  const [groups, setGroups] = useState(null);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => api.get("/groups/admin/pending").then(r => setGroups(r.data.data || [])).catch(() => setGroups([])), []);
  useEffect(() => { document.title = "Group Requests - UniConnect Admin"; load(); }, [load]);
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const act = async (g, kind) => {
    setBusy(g.id);
    try {
      const res = await api.post(`/groups/admin/${g.id}/${kind}`);
      setGroups(prev => prev.filter(x => x.id !== g.id));
      flash(kind === "approve" ? `Approved "${g.name}" — ${res.data.notified || 0} students notified` : `Rejected "${g.name}"`);
    } catch { flash("Something went wrong"); }
    finally { setBusy(null); }
  };

  return (
    <div className="grq">
      {toast && <div className="grq-toast">{toast}</div>}
      <header className="grq-head">
        <div>
          <h1>Group Requests</h1>
          <p>Review student-created groups. Approving notifies the targeted students.</p>
        </div>
        {groups && <span className="grq-count">{groups.length} pending</span>}
      </header>

      {!groups ? (
        <div className="grq-loading"><div className="grq-spin" /></div>
      ) : groups.length === 0 ? (
        <div className="grq-empty">No pending group requests.</div>
      ) : (
        <div className="grq-list">
          {groups.map(g => (
            <div key={g.id} className="grq-card">
              <div className="grq-card-main">
                <div className="grq-avatar">{(g.name || "G").slice(0, 1).toUpperCase()}</div>
                <div className="grq-info">
                  <h3>{g.name}</h3>
                  <p className="grq-desc">{g.description}</p>
                  <div className="grq-meta">
                    <span className="grq-tag">by {g.creator_name}</span>
                    <span className="grq-tag audience">{audLabel(g.audience)}</span>
                    <span className="grq-tag date">{new Date(g.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="grq-actions">
                <button className="grq-reject" disabled={busy === g.id} onClick={() => act(g, "reject")}>Reject</button>
                <button className="grq-approve" disabled={busy === g.id} onClick={() => act(g, "approve")}>{busy === g.id ? "…" : "Approve"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
