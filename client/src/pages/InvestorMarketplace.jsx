import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/InvestorMarketplace.css";

const getCurrentUser = () => { try { return JSON.parse(atob(localStorage.getItem("token").split(".")[1])); } catch { return null; } };

const PROJECT_TYPES = ["IoT", "Software Application", "Mechatronics", "Robotics", "AI/ML", "Embedded Systems", "Web/Mobile App", "Data Science", "Game Dev", "AR/VR", "Other"];
const TYPE_ICON = { IoT: "📡", "Software Application": "💻", Mechatronics: "⚙️", Robotics: "🤖", "AI/ML": "🧠", "Embedded Systems": "🔌", "Web/Mobile App": "📱", "Data Science": "📊", "Game Dev": "🎮", "AR/VR": "🕶️", Other: "🚀" };
const STAGES = { idea: "Idea", prototype: "Prototype", mvp: "MVP", launched: "Launched" };
const STAGE_COLOR = { idea: "#f59e0b", prototype: "#38bdf8", mvp: "#a855f7", launched: "#22c55e" };
const LOOKING = { funding: "💰 Funding", mentorship: "🎓 Mentorship", partner: "🤝 Partner" };
const parseLooking = (s) => (s ? String(s).split(",").map((x) => x.trim()).filter(Boolean) : []);
const imgSrc = (u) => (!u ? "" : u.startsWith("http") || u.startsWith("data:") ? u : `/${u.replace(/^\//, "")}`);
const money = (n) => (Number(n) > 0 ? `$${Number(n).toLocaleString()}` : "—");

const I = {
  search: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>),
  bookmark: ({ filled, ...p }) => (<svg viewBox="0 0 24 24" width="15" height="15" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>),
  close: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>),
  logout: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>),
  user: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>),
};
const Stars = ({ value }) => <span className="inv-stars">{[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= Math.round(value || 0) ? "on" : ""}>★</span>)}</span>;
const FundingBar = ({ raised, goal }) => {
  if (!Number(goal)) return null;
  const pct = Math.min(100, Math.round((Number(raised) / Number(goal)) * 100));
  return (<div className="inv-fund"><div className="inv-fund-bar"><span style={{ width: `${pct}%` }} /></div><div className="inv-fund-txt">{money(raised)} / {money(goal)} · {pct}%</div></div>);
};

/* ── Detail modal ── */
function ProjectModal({ id, onClose, onChange, toast }) {
  const [p, setP] = useState(null);
  const [busy, setBusy] = useState(false);
  const [offer, setOffer] = useState({ amount: "", message: "" });
  const [meet, setMeet] = useState({ proposed_time: "", message: "" });
  const [question, setQuestion] = useState("");
  const [tab, setTab] = useState("about"); // about | invest | qa

  const load = useCallback(async () => {
    try { const r = await api.get(`/projects/${id}`); setP(r.data); if (r.data.my_offer) setOffer({ amount: r.data.my_offer.amount, message: r.data.my_offer.message || "" }); }
    catch { toast("Couldn't load project", "error"); onClose(); }
  }, [id, onClose, toast]);
  useEffect(() => { load(); }, [load]);

  const toggleInterest = async () => {
    setBusy(true);
    try {
      if (p.my_interested) { await api.delete(`/projects/${id}/interest`); setP((x) => ({ ...x, my_interested: false, creator_contact: null })); }
      else { const r = await api.post(`/projects/${id}/interest`); setP((x) => ({ ...x, my_interested: true, creator_contact: r.data.creator_contact })); toast("Interest sent"); }
      onChange();
    } catch { toast("Failed", "error"); } finally { setBusy(false); }
  };
  const toggleBookmark = async () => {
    try { if (p.my_bookmarked) { await api.delete(`/projects/${id}/bookmark`); setP((x) => ({ ...x, my_bookmarked: false })); } else { await api.post(`/projects/${id}/bookmark`); setP((x) => ({ ...x, my_bookmarked: true })); } onChange(); }
    catch { toast("Failed", "error"); }
  };
  const sendOffer = async () => {
    if (!Number(offer.amount)) { toast("Enter an amount", "error"); return; }
    setBusy(true);
    try { await api.post(`/projects/${id}/offer`, offer); toast("Offer sent to the student"); load(); }
    catch { toast("Failed", "error"); } finally { setBusy(false); }
  };
  const sendMeeting = async () => {
    setBusy(true);
    try { await api.post(`/projects/${id}/meeting`, meet); toast("Meeting request sent"); setMeet({ proposed_time: "", message: "" }); }
    catch { toast("Failed", "error"); } finally { setBusy(false); }
  };
  const ask = async () => {
    if (!question.trim()) return;
    try { await api.post(`/projects/${id}/questions`, { question: question.trim() }); setQuestion(""); toast("Question posted"); load(); }
    catch { toast("Failed", "error"); }
  };

  return (
    <div className="inv-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="inv-modal">
        {!p ? <div className="inv-modal-loading"><div className="inv-spinner" /></div> : (
          <>
            <button className="inv-modal-close" onClick={onClose}><I.close /></button>
            {p.image_url && <img className="inv-modal-cover" src={imgSrc(p.image_url)} alt="" />}
            <div className="inv-modal-head">
              <span className="inv-stage" style={{ "--sc": STAGE_COLOR[p.status] || "#64748b" }}>{STAGES[p.status] || p.status}</span>
              <span className="inv-cat">{TYPE_ICON[p.project_type]} {p.project_type}</span>
              {p.supervisor_name && <span className="inv-endorsed">✔ Supervised by {p.supervisor_name}</span>}
              {Number(p.rating) > 0 && <Stars value={p.rating} />}
            </div>
            <h2 className="inv-modal-title">{p.title}</h2>
            <div className="inv-modal-by">by <b>{p.creator_name}</b>{Number(p.members_count) > 1 ? ` · ${p.members_count} members` : ""}</div>

            <FundingBar raised={p.funding_raised} goal={p.required_funding} />

            {parseLooking(p.looking_for).length > 0 && (
              <div className="inv-looking">{parseLooking(p.looking_for).map((l) => <span key={l} className="inv-look-badge">{LOOKING[l] || l}</span>)}</div>
            )}

            <div className="inv-tabs2">
              <button className={tab === "about" ? "on" : ""} onClick={() => setTab("about")}>About</button>
              <button className={tab === "invest" ? "on" : ""} onClick={() => setTab("invest")}>Invest</button>
              <button className={tab === "qa" ? "on" : ""} onClick={() => setTab("qa")}>Q&A {p.questions?.length ? `(${p.questions.length})` : ""}</button>
            </div>

            {tab === "about" && (<>
              <p className="inv-modal-desc">{p.description}</p>
              <div className="inv-modal-stats">
                {p.github_link && <a href={p.github_link} target="_blank" rel="noreferrer">🔗 Code</a>}
                {p.demo_url && <a href={p.demo_url} target="_blank" rel="noreferrer">🌐 Demo</a>}
                {p.video_url && <a href={p.video_url} target="_blank" rel="noreferrer">🎬 Video</a>}
                {p.pitch_deck_url && <a href={imgSrc(p.pitch_deck_url)} target="_blank" rel="noreferrer">📑 Pitch Deck</a>}
              </div>
              {p.files?.length > 0 && (
                <div className="inv-block"><h4>Files</h4>{p.files.map((f) => <a key={f.id} className="inv-file" href={imgSrc(f.file_url)} target="_blank" rel="noreferrer">📎 {f.file_name}</a>)}</div>
              )}
              {p.members?.length > 0 && (
                <div className="inv-block"><h4>Team</h4><div className="inv-team">{p.members.map((m) => <span key={m.id} className="inv-team-member">{m.name}</span>)}</div></div>
              )}
              {p.updates?.length > 0 && (
                <div className="inv-block"><h4>Updates</h4>{p.updates.map((u) => <div key={u.id} className="inv-update">{u.content}</div>)}</div>
              )}
              {p.my_interested && p.creator_contact && (
                <div className="inv-contact"><h4>Contact the student</h4>
                  <a href={`mailto:${p.creator_contact.email}`}>✉ {p.creator_contact.email}</a>
                  {p.creator_contact.phone_number && <a href={`tel:${p.creator_contact.phone_number}`}>📞 {p.creator_contact.phone_number}</a>}
                </div>
              )}
            </>)}

            {tab === "invest" && (<>
              <div className="inv-block">
                <h4>{p.my_offer ? `Your offer: ${money(p.my_offer.amount)} (${p.my_offer.status})` : "Make an investment offer"}</h4>
                <input className="inv-input" type="number" placeholder="Amount ($)" value={offer.amount} onChange={(e) => setOffer({ ...offer, amount: e.target.value })} />
                <textarea className="inv-input" rows={2} placeholder="Message to the student (optional)" value={offer.message} onChange={(e) => setOffer({ ...offer, message: e.target.value })} />
                <button className="inv-btn-interest on" disabled={busy} onClick={sendOffer}>{p.my_offer ? "Update offer" : "Send offer"}</button>
              </div>
              <div className="inv-block">
                <h4>Request a meeting</h4>
                <input className="inv-input" type="datetime-local" value={meet.proposed_time} onChange={(e) => setMeet({ ...meet, proposed_time: e.target.value })} />
                <textarea className="inv-input" rows={2} placeholder="What would you like to discuss?" value={meet.message} onChange={(e) => setMeet({ ...meet, message: e.target.value })} />
                <button className="inv-btn-save" disabled={busy} onClick={sendMeeting}>Request meeting</button>
              </div>
            </>)}

            {tab === "qa" && (<>
              <div className="inv-qa-ask"><input className="inv-input" placeholder="Ask the student a question..." value={question} onChange={(e) => setQuestion(e.target.value)} /><button onClick={ask}>Ask</button></div>
              {p.questions?.length ? p.questions.map((q) => (
                <div key={q.id} className="inv-qa"><div className="inv-qa-q"><b>{q.asker_name}:</b> {q.question}</div>{q.answer && <div className="inv-qa-a">↳ {q.answer}</div>}</div>
              )) : <div className="inv-empty" style={{ minHeight: 80 }}>No questions yet — be the first.</div>}
            </>)}

            <div className="inv-modal-actions">
              <button className={`inv-btn-interest ${p.my_interested ? "on" : ""}`} onClick={toggleInterest} disabled={busy}>{p.my_interested ? "Interested ✓" : "I'm interested"}</button>
              <button className={`inv-btn-save ${p.my_bookmarked ? "on" : ""}`} onClick={toggleBookmark}><I.bookmark filled={p.my_bookmarked} /> {p.my_bookmarked ? "Saved" : "Save"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Card ── */
function ProjectCard({ p, onOpen, onQuickSave }) {
  const looking = parseLooking(p.looking_for);
  return (
    <div className="inv-card" onClick={() => onOpen(p.id)}>
      {p.featured ? <span className="inv-featured">★ Featured</span> : null}
      <div className="inv-card-cover" style={p.image_url ? { backgroundImage: `url(${imgSrc(p.image_url)})` } : undefined}>
        {!p.image_url && <span className="inv-cover-fallback">{TYPE_ICON[p.project_type] || "🚀"}</span>}
        <span className="inv-stage inv-cover-stage" style={{ "--sc": STAGE_COLOR[p.status] || "#64748b" }}>{STAGES[p.status] || p.status}</span>
        <button className={`inv-card-save ${p.my_bookmarked ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); onQuickSave(p); }}><I.bookmark filled={p.my_bookmarked} /></button>
      </div>
      <div className="inv-card-body">
        <h3 className="inv-card-title">{p.title}</h3>
        <div className="inv-card-by">by {p.creator_name}</div>
        {p.supervisor_name && <div className="inv-card-sup">✔ Supervised by {p.supervisor_name} {Number(p.rating) > 0 && <Stars value={p.rating} />}</div>}
        <p className="inv-card-desc">{p.description}</p>
        {looking.length > 0 && <div className="inv-looking sm">{looking.map((l) => <span key={l} className="inv-look-badge">{LOOKING[l] || l}</span>)}</div>}
        <FundingBar raised={p.funding_raised} goal={p.required_funding} />
        <div className="inv-card-tags"><span className="inv-cat">{TYPE_ICON[p.project_type]} {p.project_type}</span></div>
        <div className="inv-card-foot">
          <span>👥 {p.interest_count} interested</span>
          {p.my_interested ? <span className="inv-interested">you're in ✓</span> : null}
        </div>
      </div>
    </div>
  );
}

/* ── Investor profile modal ── */
function ProfileModal({ onClose, toast }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get("/projects/investor-profile").then((r) => setForm({ name: r.data.name || "", phone_number: r.data.phone_number || "", company_name: r.data.company_name || "", investment_field: r.data.investment_field || "", verified: r.data.verified }))
      .catch(() => setForm({ name: "", phone_number: "", company_name: "", investment_field: "" }));
  }, []);
  const save = async () => { setSaving(true); try { await api.put("/projects/investor-profile", form); toast("Profile saved"); onClose(); } catch { toast("Failed", "error"); } finally { setSaving(false); } };
  return (
    <div className="inv-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="inv-modal inv-modal-sm">
        <button className="inv-modal-close" onClick={onClose}><I.close /></button>
        <h2 className="inv-modal-title" style={{ fontSize: "1.3rem" }}>My investor profile {form?.verified ? <span className="inv-endorsed">✔ Verified</span> : ""}</h2>
        <p className="inv-modal-by">Students see this when you show interest.</p>
        {!form ? <div className="inv-modal-loading"><div className="inv-spinner" /></div> : (
          <div className="inv-form">
            <label>Full name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label>Phone</label><input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            <label>Company / fund</label><input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="e.g. Nile Ventures" />
            <label>Investment field</label><input value={form.investment_field} onChange={(e) => setForm({ ...form, investment_field: e.target.value })} placeholder="e.g. Tech, Healthcare" />
            <div className="inv-modal-actions"><button className="inv-btn-save" onClick={onClose} disabled={saving}>Cancel</button><button className="inv-btn-interest on" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvestorMarketplace() {
  const me = getCurrentUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState("discover");
  const [showProfile, setShowProfile] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [ptype, setPtype] = useState("");
  const [sort, setSort] = useState("trending");
  const [q, setQ] = useState("");

  const toast = (msg, type = "success") => { setToastMsg({ msg, type }); setTimeout(() => setToastMsg(null), 2600); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "saved") { const r = await api.get("/projects/bookmarks"); setProjects(r.data || []); }
      else {
        const params = { sort }; if (ptype) params.project_type = ptype; if (q) params.q = q;
        const r = await api.get("/projects/marketplace", { params });
        let list = r.data || [];
        if (tab === "interested") list = list.filter((x) => x.my_interested);
        setProjects(list);
      }
    } catch { toast("Couldn't load projects", "error"); } finally { setLoading(false); }
  }, [tab, ptype, sort, q]);

  useEffect(() => { document.title = "Investor Portal | UniConnect"; }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const o = new URLSearchParams(window.location.search).get("open"); if (o) { setOpenId(Number(o)); window.history.replaceState({}, "", "/HomeInvestor"); } }, []);

  const quickSave = async (p) => { try { if (p.my_bookmarked) await api.delete(`/projects/${p.id}/bookmark`); else await api.post(`/projects/${p.id}/bookmark`); fetchData(); } catch { toast("Failed", "error"); } };
  const logout = () => { localStorage.removeItem("token"); navigate("/login"); };

  return (
    <div className="inv-page">
      {toastMsg && <div className={`inv-toast inv-toast-${toastMsg.type}`}>{toastMsg.msg}</div>}
      <header className="inv-header">
        <div className="inv-brand"><img src="/logo.png" alt="" className="inv-logo" /><div><span className="inv-brand-name">UniConnect</span><span className="inv-brand-sub">Investor Portal</span></div></div>
        <div className="inv-header-right">
          <span className="inv-user">{me?.email}</span>
          <button className="inv-logout" onClick={() => setShowProfile(true)}><I.user /> Profile</button>
          <button className="inv-logout" onClick={logout}><I.logout /> Logout</button>
        </div>
      </header>

      <main className="inv-main">
        <div className="inv-hero"><h1>Discover student projects</h1><p>Supervised, approved projects from students — invest, meet the founders, and follow their progress.</p></div>

        <div className="inv-tabs">
          <button className={tab === "discover" ? "on" : ""} onClick={() => setTab("discover")}>Discover</button>
          <button className={tab === "interested" ? "on" : ""} onClick={() => setTab("interested")}>My Interests</button>
          <button className={tab === "saved" ? "on" : ""} onClick={() => setTab("saved")}>Saved</button>
        </div>

        {tab === "discover" && (
          <div className="inv-filters">
            <div className="inv-search"><span><I.search /></span><input placeholder="Search projects..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <select value={ptype} onChange={(e) => setPtype(e.target.value)}><option value="">All types</option>{PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="trending">🔥 Trending</option><option value="new">🆕 Newest</option><option value="funding">💰 Most funded</option></select>
          </div>
        )}

        {loading ? <div className="inv-empty"><div className="inv-spinner" /></div>
          : projects.length === 0 ? <div className="inv-empty">{tab === "saved" ? "No saved projects." : tab === "interested" ? "You haven't shown interest yet." : "No projects published to investors yet."}</div>
          : <div className="inv-grid">{projects.map((p) => <ProjectCard key={p.id} p={p} onOpen={setOpenId} onQuickSave={quickSave} />)}</div>}
      </main>

      {openId && <ProjectModal id={openId} onClose={() => setOpenId(null)} onChange={fetchData} toast={toast} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} toast={toast} />}
    </div>
  );
}
