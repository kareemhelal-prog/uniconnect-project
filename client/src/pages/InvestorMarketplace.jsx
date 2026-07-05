import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useSettings } from "../context/SettingsContext";
import "../styles/InvestorMarketplace.css";

// Compress an image file → base64 (max 512px, jpeg 82%) so avatars stay small.
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 512; let w = img.width, h = img.height;
        if (w > MAX || h > MAX) { if (w > h) { h = Math.round((h * MAX) / w); w = MAX; } else { w = Math.round((w * MAX) / h); h = MAX; } }
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject; img.src = e.target.result;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

const getCurrentUser = () => { try { return JSON.parse(atob(localStorage.getItem("token").split(".")[1])); } catch { return null; } };

const PROJECT_TYPES = ["IoT", "Software Application", "Mechatronics", "Robotics", "AI/ML", "Embedded Systems", "Web/Mobile App", "Data Science", "Game Dev", "AR/VR", "Other"];
const TYPE_ICON = { IoT: "📡", "Software Application": "💻", Mechatronics: "⚙️", Robotics: "🤖", "AI/ML": "🧠", "Embedded Systems": "🔌", "Web/Mobile App": "📱", "Data Science": "📊", "Game Dev": "🎮", "AR/VR": "🕶️", Other: "🚀" };
const STAGES = { idea: "Idea", prototype: "Prototype", mvp: "MVP", launched: "Launched" };
const STAGE_COLOR = { idea: "#f59e0b", prototype: "#38bdf8", mvp: "#a855f7", launched: "#22c55e" };
const LOOKING = { funding: "💰 Funding", mentorship: "🎓 Mentorship", partner: "🤝 Partner" };
const OFFER_BADGE = { pending: { t: "Pending", c: "#e0b23c" }, accepted: { t: "Accepted", c: "#10b981" }, declined: { t: "Declined", c: "#ef4444" } };
const parseLooking = (s) => (s ? String(s).split(",").map((x) => x.trim()).filter(Boolean) : []);
const imgSrc = (u) => (!u ? "" : u.startsWith("http") || u.startsWith("data:") ? u : `/${u.replace(/^\//, "")}`);
const money = (n) => (Number(n) > 0 ? `$${Number(n).toLocaleString()}` : "—");
const shortMoney = (n) => { n = Number(n) || 0; return n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : `$${n}`; };
const initials = (s) => (s || "?").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

const I = {
  search: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>),
  bookmark: ({ filled, ...p }) => (<svg viewBox="0 0 24 24" width="15" height="15" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>),
  close: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>),
  logout: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>),
  user: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>),
  bell: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>),
  verify: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...p}><path d="M12 1l2.4 2.3 3.3-.3.3 3.3L20.7 9 19 12l1.7 3-2.7 1.7-.3 3.3-3.3-.3L12 22l-2.4-2.3-3.3.3-.3-3.3L3.3 15 5 12 3.3 9l2.7-1.7.3-3.3 3.3.3z" /><path d="m8.5 12 2.2 2.2 4.3-4.4" fill="none" stroke="#0a0f14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  chev: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6" /></svg>),
  trend: (p) => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></svg>),
  settings: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>),
  camera: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>),
  sun: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4.5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>),
  moon: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>),
  globe: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></svg>),
};

const Stars = ({ value }) => <span className="inv-stars">{[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= Math.round(value || 0) ? "on" : ""}>★</span>)}</span>;
const FundingBar = ({ raised, goal }) => {
  if (!Number(goal)) return null;
  const pct = Math.min(100, Math.round((Number(raised) / Number(goal)) * 100));
  return (<div className="inv-fund"><div className="inv-fund-bar"><span style={{ "--pct": `${pct}%` }} /></div><div className="inv-fund-txt">{money(raised)} <em>/ {money(goal)}</em> · {pct}%</div></div>);
};

/* Count-up number animation */
function CountUp({ to, prefix = "", short = false }) {
  const [n, setN] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const target = Number(to) || 0; const dur = 900; const t0 = performance.now();
    cancelAnimationFrame(ref.current);
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur); const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [to]);
  const val = short ? shortMoney(n) : Math.round(n).toLocaleString();
  return <span>{prefix}{val}</span>;
}

/* Scroll-reveal: adds .in to .reveal elements as they enter the viewport */
function useReveal(dep) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.06 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
}

/* ── Notifications bell ── */
function NotifBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const load = useCallback(() => { api.get("/notifications").then((r) => setItems(r.data?.data || [])).catch(() => {}); }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  const unread = items.filter((n) => !n.is_read).length;
  const markAll = () => { api.patch("/notifications/read-all").then(() => setItems((x) => x.map((n) => ({ ...n, is_read: 1 })))).catch(() => {}); };
  return (
    <div className="inv-nav-notif">
      <button className={`inv-icon-btn ${open ? "on" : ""}`} onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <I.bell />{unread > 0 && <span className="inv-notif-dot">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (<>
        <div className="inv-menu-backdrop" onClick={() => setOpen(false)} />
        <div className="inv-notif-panel">
          <div className="inv-notif-head"><b>Notifications</b>{unread > 0 && <button onClick={markAll}>Mark all read</button>}</div>
          <div className="inv-notif-list">
            {items.length === 0 ? <div className="inv-notif-empty">You're all caught up 🎉</div>
              : items.slice(0, 12).map((n) => (
                <div key={n.id} className={`inv-notif-item ${n.is_read ? "" : "unread"}`}>
                  <span className="inv-notif-av">{initials(n.sender_name)}</span>
                  <div><b>{n.sender_name || "Someone"}</b> {n.message}</div>
                </div>
              ))}
          </div>
        </div>
      </>)}
    </div>
  );
}

/* ── Detail modal ── */
function ProjectModal({ id, onClose, onChange, toast }) {
  const [p, setP] = useState(null);
  const [busy, setBusy] = useState(false);
  const [offer, setOffer] = useState({ amount: "", message: "" });
  const [meet, setMeet] = useState({ proposed_time: "", message: "" });
  const [question, setQuestion] = useState("");
  const [tab, setTab] = useState("about");

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
    try { await api.post(`/projects/${id}/offer`, offer); toast("Offer sent to the student"); load(); onChange(); }
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
              {p.supervisor_name && <span className="inv-endorsed"><I.verify /> Supervised by {p.supervisor_name}</span>}
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
                <div className="inv-block"><h4>Progress updates</h4>{p.updates.map((u) => <div key={u.id} className="inv-update">{u.content}</div>)}</div>
              )}
              {p.my_interested && p.creator_contact && (
                <div className="inv-contact"><h4>Contact the founder</h4>
                  <a href={`mailto:${p.creator_contact.email}`}>✉ {p.creator_contact.email}</a>
                  {p.creator_contact.phone_number && <a href={`tel:${p.creator_contact.phone_number}`}>📞 {p.creator_contact.phone_number}</a>}
                </div>
              )}
            </>)}

            {tab === "invest" && (<>
              <div className="inv-block">
                <h4>{p.my_offer ? `Your offer: ${money(p.my_offer.amount)} (${p.my_offer.status})` : "Make an investment offer"}</h4>
                <input className="inv-input" type="number" placeholder="Amount ($)" value={offer.amount} onChange={(e) => setOffer({ ...offer, amount: e.target.value })} />
                <textarea className="inv-input" rows={2} placeholder="Message to the founder (optional)" value={offer.message} onChange={(e) => setOffer({ ...offer, message: e.target.value })} />
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
              <div className="inv-qa-ask"><input className="inv-input" placeholder="Ask the founder a question..." value={question} onChange={(e) => setQuestion(e.target.value)} /><button onClick={ask}>Ask</button></div>
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
function ProjectCard({ p, onOpen, onQuickSave, idx }) {
  const looking = parseLooking(p.looking_for);
  const ob = p.my_offer_status ? OFFER_BADGE[p.my_offer_status] : null;
  return (
    <div className="inv-card reveal" style={{ "--d": `${Math.min(idx, 8) * 55}ms` }} onClick={() => onOpen(p.id)}>
      <div className="inv-card-cover" style={p.image_url ? { backgroundImage: `url(${imgSrc(p.image_url)})` } : undefined}>
        {!p.image_url && <span className="inv-cover-fallback">{TYPE_ICON[p.project_type] || "🚀"}</span>}
        <span className="inv-stage inv-cover-stage" style={{ "--sc": STAGE_COLOR[p.status] || "#64748b" }}>{STAGES[p.status] || p.status}</span>
        <button className={`inv-card-save ${p.my_bookmarked ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); onQuickSave(p); }}><I.bookmark filled={p.my_bookmarked} /></button>
        {ob && <span className="inv-card-offer" style={{ "--oc": ob.c }}>Offer · {ob.t}</span>}
      </div>
      <div className="inv-card-body">
        <div className="inv-card-tags"><span className="inv-cat">{TYPE_ICON[p.project_type]} {p.project_type}</span>{p.featured ? <span className="inv-chip-featured">★ Featured</span> : null}</div>
        <h3 className="inv-card-title">{p.title}</h3>
        <div className="inv-card-by">by {p.creator_name}</div>
        {p.supervisor_name && <div className="inv-card-sup"><I.verify /> {p.supervisor_name} {Number(p.rating) > 0 && <Stars value={p.rating} />}</div>}
        <p className="inv-card-desc">{p.description}</p>
        {looking.length > 0 && <div className="inv-looking sm">{looking.map((l) => <span key={l} className="inv-look-badge">{LOOKING[l] || l}</span>)}</div>}
        <FundingBar raised={p.funding_raised} goal={p.required_funding} />
        <div className="inv-card-foot">
          <span>👥 {p.interest_count} interested</span>
          {p.my_interested ? <span className="inv-interested">you're in ✓</span> : <span className="inv-view">View →</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Featured spotlight ── */
function Spotlight({ p, onOpen }) {
  return (
    <div className="inv-spot reveal" onClick={() => onOpen(p.id)}>
      <div className="inv-spot-media" style={p.image_url ? { backgroundImage: `url(${imgSrc(p.image_url)})` } : undefined}>
        {!p.image_url && <span className="inv-spot-fallback">{TYPE_ICON[p.project_type] || "🚀"}</span>}
      </div>
      <div className="inv-spot-body">
        <span className="inv-spot-kicker">★ Project of the Week</span>
        <h2 className="inv-spot-title">{p.title}</h2>
        <div className="inv-card-by">by {p.creator_name}{p.supervisor_name ? ` · Supervised by ${p.supervisor_name}` : ""}</div>
        <p className="inv-spot-desc">{p.description}</p>
        <FundingBar raised={p.funding_raised} goal={p.required_funding} />
        <div className="inv-spot-foot">
          <span className="inv-cat">{TYPE_ICON[p.project_type]} {p.project_type}</span>
          <span>👥 {p.interest_count} interested</span>
          {Number(p.rating) > 0 && <Stars value={p.rating} />}
          <button className="inv-spot-cta" onClick={(e) => { e.stopPropagation(); onOpen(p.id); }}>Explore <I.chev style={{ transform: "rotate(-90deg)" }} /></button>
        </div>
      </div>
    </div>
  );
}

/* ── Investor profile modal (with avatar upload) ── */
function ProfileModal({ onClose, toast, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  useEffect(() => {
    api.get("/projects/investor-profile").then((r) => setForm({ name: r.data.name || "", phone_number: r.data.phone_number || "", company_name: r.data.company_name || "", investment_field: r.data.investment_field || "", verified: r.data.verified, profile_picture: r.data.profile_picture || "" }))
      .catch(() => setForm({ name: "", phone_number: "", company_name: "", investment_field: "", profile_picture: "" }));
  }, []);
  const pickImage = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Please choose an image", "error"); return; }
    try { const b64 = await compressImage(file); setForm((f) => ({ ...f, profile_picture: b64 })); }
    catch { toast("Couldn't read that image", "error"); }
  };
  const save = async () => { setSaving(true); try { await api.put("/projects/investor-profile", form); toast("Profile saved"); onSaved?.(); onClose(); } catch { toast("Failed", "error"); } finally { setSaving(false); } };
  return (
    <div className="inv-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="inv-modal inv-modal-sm">
        <button className="inv-modal-close" onClick={onClose}><I.close /></button>
        <h2 className="inv-modal-title" style={{ fontSize: "1.3rem" }}>My investor profile {form?.verified ? <span className="inv-endorsed"><I.verify /> Verified</span> : ""}</h2>
        <p className="inv-modal-by">Founders see this when you show interest.</p>
        {!form ? <div className="inv-modal-loading"><div className="inv-spinner" /></div> : (
          <div className="inv-form">
            <div className="inv-avatar-upload">
              <button type="button" className="inv-avatar-edit" onClick={() => fileRef.current?.click()}>
                {form.profile_picture ? <img src={imgSrc(form.profile_picture)} alt="" /> : <span className="inv-avatar-ph">{initials(form.name || "?")}</span>}
                <span className="inv-avatar-cam"><I.camera /></span>
              </button>
              <div className="inv-avatar-upload-txt">
                <b>Profile photo</b>
                <span>Click the avatar to upload. {form.profile_picture && <button type="button" className="inv-avatar-remove" onClick={() => setForm((f) => ({ ...f, profile_picture: "" }))}>Remove</button>}</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
            </div>
            <label>Full name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label>Phone</label><input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            <label>Company / fund</label><input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="e.g. Nile Ventures" />
            <label>Investment field</label><input value={form.investment_field} onChange={(e) => setForm({ ...form, investment_field: e.target.value })} placeholder="e.g. Tech, Healthcare" />
            <div className="inv-modal-actions"><button className="inv-btn-save" onClick={onClose} disabled={saving}>Cancel</button><button className="inv-btn-interest on" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Settings modal (appearance + language, wired to SettingsContext) ── */
function SettingsModal({ onClose }) {
  const { theme, setTheme, lang, setLang } = useSettings();
  return (
    <div className="inv-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="inv-modal inv-modal-sm">
        <button className="inv-modal-close" onClick={onClose}><I.close /></button>
        <h2 className="inv-modal-title" style={{ fontSize: "1.3rem" }}>Settings</h2>
        <p className="inv-modal-by">Preferences are saved to this browser.</p>

        <div className="inv-set-row">
          <div className="inv-set-label"><I.sun /> Appearance</div>
          <div className="inv-seg">
            <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}><I.moon /> Dark</button>
            <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}><I.sun /> Light</button>
          </div>
        </div>

        <div className="inv-set-row">
          <div className="inv-set-label"><I.globe /> Language</div>
          <div className="inv-seg">
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button>
            <button className={lang === "ar" ? "on" : ""} onClick={() => setLang("ar")}>العربية</button>
          </div>
        </div>

        <div className="inv-modal-actions"><button className="inv-btn-interest on" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}

export default function InvestorMarketplace() {
  const me = getCurrentUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState("discover");
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [ptype, setPtype] = useState("");
  const [sort, setSort] = useState("trending");
  const [q, setQ] = useState("");
  const [profile, setProfile] = useState(null);

  const toast = (msg, type = "success") => { setToastMsg({ msg, type }); setTimeout(() => setToastMsg(null), 2600); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get("/projects/marketplace"); setAll(r.data || []); }
    catch { toast("Couldn't load projects", "error"); } finally { setLoading(false); }
  }, []);
  const loadProfile = useCallback(() => { api.get("/projects/investor-profile").then((r) => setProfile(r.data)).catch(() => {}); }, []);

  useEffect(() => { document.title = "Investor Portal | UniConnect"; }, []);
  useEffect(() => { fetchAll(); loadProfile(); }, [fetchAll, loadProfile]);
  useEffect(() => { const o = new URLSearchParams(window.location.search).get("open"); if (o) { setOpenId(Number(o)); window.history.replaceState({}, "", "/HomeInvestor"); } }, []);

  // stats
  const stats = useMemo(() => ({
    available: all.length,
    interested: all.filter((p) => p.my_interested).length,
    saved: all.filter((p) => p.my_bookmarked).length,
    offers: all.filter((p) => p.my_offer_amount != null).length,
    totalOffered: all.filter((p) => p.my_offer_status !== "declined").reduce((s, p) => s + (Number(p.my_offer_amount) || 0), 0),
  }), [all]);
  const featured = useMemo(() => all.find((p) => p.featured), [all]);

  // filtered/sorted display list
  const displayed = useMemo(() => {
    let list = all;
    if (tab === "interested") list = list.filter((p) => p.my_interested);
    else if (tab === "offers") list = list.filter((p) => p.my_offer_amount != null);
    else if (tab === "saved") list = list.filter((p) => p.my_bookmarked);
    if (ptype) list = list.filter((p) => p.project_type === ptype);
    if (q.trim()) { const s = q.toLowerCase(); list = list.filter((p) => (p.title || "").toLowerCase().includes(s) || (p.description || "").toLowerCase().includes(s)); }
    const sorted = [...list];
    if (sort === "funding") sorted.sort((a, b) => (Number(b.funding_raised) || 0) - (Number(a.funding_raised) || 0));
    else if (sort === "new") sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else sorted.sort((a, b) => (b.interest_count || 0) - (a.interest_count || 0));
    // keep featured out of the discover grid (it's in the spotlight)
    if (tab === "discover" && featured && !ptype && !q.trim()) return sorted.filter((p) => p.id !== featured.id);
    return sorted;
  }, [all, tab, ptype, q, sort, featured]);

  useReveal(displayed);

  const quickSave = async (p) => {
    try {
      if (p.my_bookmarked) await api.delete(`/projects/${p.id}/bookmark`); else await api.post(`/projects/${p.id}/bookmark`);
      setAll((xs) => xs.map((x) => x.id === p.id ? { ...x, my_bookmarked: !x.my_bookmarked } : x));
    } catch { toast("Failed", "error"); }
  };
  const logout = () => { localStorage.removeItem("token"); navigate("/login"); };
  const displayName = profile?.name || me?.email?.split("@")[0] || "Investor";

  const STAT_CARDS = [
    { k: "available", label: "Live projects", icon: "🚀" },
    { k: "interested", label: "Interested in", icon: "❤️" },
    { k: "offers", label: "Offers made", icon: "🤝" },
    { k: "saved", label: "Saved", icon: "🔖" },
  ];

  return (
    <div className="inv-page">
      <div className="inv-bg" aria-hidden="true" />
      {toastMsg && <div className={`inv-toast inv-toast-${toastMsg.type}`}>{toastMsg.msg}</div>}

      {/* ── Glass navbar ── */}
      <header className="inv-nav">
        <div className="inv-brand"><img src="/logo.png" alt="" className="inv-logo" /><div><span className="inv-brand-name">UniConnect</span><span className="inv-brand-sub">Investor Portal</span></div></div>
        <div className="inv-nav-right">
          <div className="inv-nav-stat"><span className="inv-nav-stat-n"><CountUp to={stats.totalOffered} prefix="$" short /></span><span className="inv-nav-stat-l">committed</span></div>
          <NotifBell />
          <div className="inv-nav-user">
            <button className="inv-avatar-btn" onClick={() => setMenuOpen((o) => !o)}>
              <span className="inv-avatar">{profile?.profile_picture ? <img src={imgSrc(profile.profile_picture)} alt="" /> : initials(displayName)}{profile?.verified ? <span className="inv-avatar-verify"><I.verify /></span> : null}</span>
              <span className="inv-avatar-name">{displayName}{profile?.verified ? <span className="inv-verify-badge"><I.verify /> Verified</span> : null}</span>
              <I.chev className={menuOpen ? "inv-chev-up" : ""} />
            </button>
            {menuOpen && (<>
              <div className="inv-menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="inv-user-menu">
                <div className="inv-user-menu-head"><span className="inv-avatar lg">{initials(displayName)}</span><div><b>{displayName}</b><span>{me?.email}</span></div></div>
                <button onClick={() => { setMenuOpen(false); setShowProfile(true); }}><I.user /> My profile</button>
                <button onClick={() => { setMenuOpen(false); setShowSettings(true); }}><I.settings /> Settings</button>
                <button onClick={logout} className="danger"><I.logout /> Logout</button>
              </div>
            </>)}
          </div>
        </div>
      </header>

      <main className="inv-main">
        <div className="inv-hero reveal in">
          <span className="inv-hero-eyebrow"><I.trend /> Curated · supervised · investable</span>
          <h1>Where <span>student ideas</span> meet capital.</h1>
          <p>Discover supervised, approved projects — back the founders, make offers, and follow their progress in real time.</p>
        </div>

        {/* ── Stats bar ── */}
        <div className="inv-stats reveal in">
          {STAT_CARDS.map((s) => (
            <div className="inv-stat" key={s.k}>
              <span className="inv-stat-icon">{s.icon}</span>
              <div><span className="inv-stat-n"><CountUp to={stats[s.k]} /></span><span className="inv-stat-l">{s.label}</span></div>
            </div>
          ))}
          <div className="inv-stat inv-stat-hl">
            <span className="inv-stat-icon">💰</span>
            <div><span className="inv-stat-n"><CountUp to={stats.totalOffered} prefix="$" short /></span><span className="inv-stat-l">Total committed</span></div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="inv-tabs">
          {[["discover", "Discover"], ["interested", "My Interests"], ["offers", "My Offers"], ["saved", "Saved"]].map(([k, label]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
              {label}{k === "interested" && stats.interested ? <em>{stats.interested}</em> : null}{k === "offers" && stats.offers ? <em>{stats.offers}</em> : null}{k === "saved" && stats.saved ? <em>{stats.saved}</em> : null}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="inv-filters">
          <div className="inv-search"><span><I.search /></span><input placeholder="Search projects, founders, ideas…" value={q} onChange={(e) => setQ(e.target.value)} />{q && <button className="inv-search-clear" onClick={() => setQ("")}><I.close width="14" height="14" /></button>}</div>
          <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="trending">🔥 Trending</option><option value="new">🆕 Newest</option><option value="funding">💰 Most funded</option></select>
        </div>

        {/* ── Category chips ── */}
        <div className="inv-chips">
          <button className={ptype === "" ? "on" : ""} onClick={() => setPtype("")}>All</button>
          {PROJECT_TYPES.map((t) => <button key={t} className={ptype === t ? "on" : ""} onClick={() => setPtype(ptype === t ? "" : t)}>{TYPE_ICON[t]} {t}</button>)}
        </div>

        {/* ── Featured spotlight (discover only) ── */}
        {tab === "discover" && featured && !ptype && !q.trim() && <Spotlight p={featured} onOpen={setOpenId} />}

        {/* ── Grid ── */}
        {loading ? <div className="inv-empty"><div className="inv-spinner" /></div>
          : displayed.length === 0 ? (
            <div className="inv-empty">
              <span className="inv-empty-icon">{tab === "saved" ? "🔖" : tab === "offers" ? "🤝" : tab === "interested" ? "❤️" : "🚀"}</span>
              {tab === "saved" ? "No saved projects yet — tap the bookmark on any card."
                : tab === "offers" ? "You haven't made any offers yet."
                : tab === "interested" ? "You haven't shown interest yet — explore the marketplace."
                : "No projects published to investors yet."}
            </div>
          ) : <div className="inv-grid">{displayed.map((p, i) => <ProjectCard key={p.id} p={p} idx={i} onOpen={setOpenId} onQuickSave={quickSave} />)}</div>}
      </main>

      {openId && <ProjectModal id={openId} onClose={() => setOpenId(null)} onChange={fetchAll} toast={toast} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} toast={toast} onSaved={loadProfile} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
