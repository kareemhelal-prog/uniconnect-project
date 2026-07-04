import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../components/Navbar";
import "../styles/ProjectsPage.css";
import {
  FiSearch, FiX, FiUsers, FiPlus, FiEdit2, FiTrash2, FiUploadCloud, FiCheck,
  FiWifi, FiCode, FiSettings, FiCpu, FiZap, FiHardDrive, FiSmartphone, FiBarChart2,
  FiPlay, FiEye, FiGrid, FiDollarSign, FiAward, FiClock, FiCheckCircle, FiXCircle,
  FiEdit3, FiUser, FiGithub, FiGlobe, FiVideo, FiFileText, FiFile, FiPaperclip,
  FiMessageSquare, FiCalendar, FiBriefcase, FiExternalLink, FiFolder, FiSend,
  FiTrendingUp, FiHelpCircle, FiCornerDownRight, FiActivity, FiRadio,
} from "react-icons/fi";

const API_BASE = "/api";
const getToken = () => localStorage.getItem("token");
const getMe = () => { try { return JSON.parse(atob(getToken().split(".")[1])); } catch { return null; } };
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });
const jsonHeaders = () => ({ "Content-Type": "application/json", ...authHeaders() });
const imgSrc = (u) => (!u ? "" : u.startsWith("http") || u.startsWith("data:") ? u : `/${u.replace(/^\//, "")}`);
const parseLooking = (s) => (s ? String(s).split(",").map((x) => x.trim()).filter(Boolean) : []);
const money = (n) => (Number(n) > 0 ? `$${Number(n).toLocaleString()}` : "—");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const initials = (name = "") => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

/* Per-type icon + accent colour — gives each category its own identity (no emoji). */
const TYPE_META = {
  "IoT":                  { Icon: FiRadio,      color: "#38bdf8" },
  "Software Application": { Icon: FiCode,       color: "#a855f7" },
  "Mechatronics":         { Icon: FiSettings,   color: "#f59e0b" },
  "Robotics":             { Icon: FiCpu,        color: "#f472b6" },
  "AI/ML":                { Icon: FiZap,        color: "#22d3ee" },
  "Embedded Systems":     { Icon: FiHardDrive,  color: "#34d399" },
  "Web/Mobile App":       { Icon: FiSmartphone, color: "#818cf8" },
  "Data Science":         { Icon: FiBarChart2,  color: "#2dd4bf" },
  "Game Dev":             { Icon: FiPlay,       color: "#fb7185" },
  "AR/VR":                { Icon: FiEye,        color: "#c084fc" },
  "Other":                { Icon: FiGrid,       color: "#94a3b8" },
};
const PROJECT_TYPES = Object.keys(TYPE_META);
const typeMeta = (t) => TYPE_META[t] || TYPE_META.Other;
const TypeIcon = ({ type, size = 15 }) => { const { Icon } = typeMeta(type); return <Icon size={size} />; };

const STAGES = ["idea", "prototype", "mvp", "launched"];
const STAGE_LABEL = { idea: "Idea", prototype: "Prototype", mvp: "MVP", launched: "Launched" };
const STAGE_COLOR = { idea: "#fbbf24", prototype: "#00e5ff", mvp: "#a855f7", launched: "#22c55e" };

const LOOKING_OPTS = [
  { v: "funding", l: "Funding", Icon: FiDollarSign },
  { v: "mentorship", l: "Mentorship", Icon: FiAward },
  { v: "partner", l: "Partner", Icon: FiUsers },
];

const APPROVAL = {
  pending:  { label: "Pending review", color: "#fbbf24", Icon: FiClock },
  approved: { label: "Approved",       color: "#22c55e", Icon: FiCheckCircle },
  rejected: { label: "Rejected",       color: "#f87171", Icon: FiXCircle },
  revision: { label: "Needs changes",  color: "#f59e0b", Icon: FiEdit3 },
};

const upload = async (file) => {
  const fd = new FormData(); fd.append("file", file);
  const res = await fetch(`${API_BASE}/projects/upload`, { method: "POST", headers: authHeaders(), body: fd });
  if (!res.ok) throw new Error();
  return res.json(); // { url, name, size, type }
};
const api = {
  get: (p) => fetch(`${API_BASE}${p}`, { headers: authHeaders() }).then((r) => r.json()),
  post: (p, b) => fetch(`${API_BASE}${p}`, { method: "POST", headers: jsonHeaders(), body: JSON.stringify(b || {}) }),
  put: (p, b) => fetch(`${API_BASE}${p}`, { method: "PUT", headers: jsonHeaders(), body: JSON.stringify(b || {}) }),
  del: (p) => fetch(`${API_BASE}${p}`, { method: "DELETE", headers: authHeaders() }),
};

const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <path d="M12 2.6l2.9 5.88 6.49.95-4.7 4.58 1.11 6.46L12 17.94l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.95L12 2.6z" />
  </svg>
);
const Stars = ({ value }) => {
  const r = Math.round(value || 0);
  return <span className="proj-stars">{[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= r ? "on" : ""}><StarIcon filled={i <= r} /></span>)}</span>;
};

const SectionTitle = ({ icon: I, children, count }) => (
  <h4 className="proj-view-section-title">{I && <I size={14} />}<span>{children}</span>{count != null && <span className="proj-sec-count">{count}</span>}</h4>
);

const Avatar = ({ name, url, size = 26 }) => (
  url
    ? <img className="proj-ava" src={imgSrc(url)} alt="" style={{ width: size, height: size }} />
    : <span className="proj-ava proj-ava-fallback" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials(name)}</span>
);

/* ═══════════ Card ═══════════ */
function ProjectCard({ project, me, onView, onEdit, onDelete }) {
  const isOwner = project.creator_id === me?.id;
  const st = STAGE_COLOR[project.status] || "#8b8ba3";
  const { color } = typeMeta(project.project_type);
  const ap = APPROVAL[project.approval_status] || {};
  return (
    <article className="proj-card" style={{ "--type": color }} onClick={() => onView(project)} tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter") && onView(project)}>
      <div className="proj-card-media">
        {project.image_url
          ? <img className="proj-card-cover" src={imgSrc(project.image_url)} alt="" loading="lazy" />
          : <div className="proj-card-cover proj-card-cover-blank"><TypeIcon type={project.project_type} size={40} /></div>}
        <span className="proj-type-badge"><TypeIcon type={project.project_type} size={12} />{project.project_type || "Project"}</span>
        {project.open_to_investors ? <span className="proj-live-tag"><span className="proj-live-dot" />Live</span> : null}
      </div>

      <div className="proj-card-body">
        <div className="proj-card-headrow">
          <h4 className="proj-card-title" dir="auto">{project.title}</h4>
          <span className="proj-status" style={{ color: st, background: `${st}1a` }}>
            <span className="proj-status-dot" style={{ background: st }} />{STAGE_LABEL[project.status] || project.status}
          </span>
        </div>

        {project.description && <p className="proj-card-desc" dir="auto">{project.description}</p>}

        <div className="proj-card-people">
          <span className="proj-person"><Avatar name={project.creator_name} url={project.creator_avatar} size={22} /><span>{project.creator_name}</span></span>
          {project.supervisor_name && <span className="proj-person muted"><FiAward size={12} />{project.supervisor_name}</span>}
        </div>
      </div>

      <div className="proj-card-foot">
        {isOwner && ap.label
          ? <span className="proj-approval" style={{ color: ap.color }}>{ap.Icon && <ap.Icon size={13} />}{ap.label}</span>
          : Number(project.rating) > 0
            ? <Stars value={project.rating} />
            : <span className="proj-meta-item"><FiUsers size={12} /> {project.interest_count || 0} interested</span>}
        <div className="proj-card-actions">
          {isOwner && <>
            <button className="proj-icon-btn edit" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(project); }}><FiEdit2 size={13} /></button>
            <button className="proj-icon-btn delete" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(project); }}><FiTrash2 size={13} /></button>
          </>}
          <button className="proj-view-btn" onClick={(e) => { e.stopPropagation(); onView(project); }}>View<FiExternalLink size={12} /></button>
        </div>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="proj-card proj-card-skel">
      <div className="proj-card-media sk" />
      <div className="proj-card-body">
        <div className="sk-line w70" /><div className="sk-line w100" /><div className="sk-line w40" />
        <div className="sk-line w55" style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

/* ═══════════ Create / Edit form ═══════════ */
function ProjectFormModal({ initial, doctors, onClose, onSave, loading }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial
      ? { ...initial, looking_for: initial.looking_for || "" }
      : { title: "", project_type: "IoT", description: "", status: "idea", required_funding: "", github_link: "", demo_url: "", video_url: "", image_url: "", pitch_deck_url: "", looking_for: "", supervisor_id: "" }
  );
  const [attachments, setAttachments] = useState([]);
  const [busy, setBusy] = useState("");
  const looking = parseLooking(form.looking_for);

  const toggleLooking = (v) => { const s = new Set(looking); s.has(v) ? s.delete(v) : s.add(v); setForm({ ...form, looking_for: [...s].join(",") }); };
  const doUpload = async (file, field) => { if (!file) return; setBusy(field); try { const d = await upload(file); setForm((f) => ({ ...f, [field]: d.url })); } catch {} finally { setBusy(""); } };
  const addAttachments = async (files) => {
    setBusy("att");
    for (const file of files) { try { const d = await upload(file); setAttachments((a) => [...a, d]); } catch {} }
    setBusy("");
  };

  const save = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, supervisor_id: form.supervisor_id || null, attachments });
  };

  return (
    <div className="proj-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-modal proj-modal-wide">
        <div className="proj-modal-header">
          <h3>{isEdit ? "Edit project" : "New project"}</h3>
          <button className="proj-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="proj-modal-body">
          <label className="proj-modal-label">Project name</label>
          <input className="proj-modal-input" dir="auto" placeholder="e.g. Smart Irrigation System" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <label className="proj-modal-label">Category</label>
          <div className="proj-type-grid">
            {PROJECT_TYPES.map((t) => {
              const { Icon, color } = typeMeta(t);
              const on = form.project_type === t;
              return (
                <button key={t} type="button" className={`proj-type-pick ${on ? "on" : ""}`} style={on ? { "--type": color } : undefined} onClick={() => setForm({ ...form, project_type: t })}>
                  <Icon size={15} style={{ color }} />{t}
                </button>
              );
            })}
          </div>

          <label className="proj-modal-label">Stage</label>
          <select className="proj-modal-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>

          <label className="proj-modal-label">Description</label>
          <textarea className="proj-modal-textarea" dir="auto" placeholder="Describe your project, the problem it solves, and how it works..." maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label className="proj-modal-label">Supervising doctor</label>
          <select className="proj-modal-select" value={form.supervisor_id || ""} onChange={(e) => setForm({ ...form, supervisor_id: e.target.value })}>
            <option value="">— Choose the doctor supervising this project —</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` · ${d.specialization}` : ""}</option>)}
          </select>
          <div className="proj-modal-char">The doctor reviews your project and is the one who publishes it to investors.</div>

          <label className="proj-modal-label">Required funding ($)</label>
          <input className="proj-modal-input" type="number" placeholder="e.g. 5000" value={form.required_funding} onChange={(e) => setForm({ ...form, required_funding: e.target.value })} />

          <label className="proj-modal-label">Looking for</label>
          <div className="proj-looking-opts">
            {LOOKING_OPTS.map((o) => <button key={o.v} type="button" className={`proj-look-chip ${looking.includes(o.v) ? "on" : ""}`} onClick={() => toggleLooking(o.v)}><o.Icon size={13} />{o.l}</button>)}
          </div>

          <label className="proj-modal-label">Cover image</label>
          <div className="proj-cover-upload">
            {form.image_url ? <img className="proj-cover-preview" src={imgSrc(form.image_url)} alt="" /> : <div className="proj-cover-placeholder">No image</div>}
            <label className="proj-cover-btn">{busy === "image_url" ? "Uploading..." : form.image_url ? "Change" : "Upload"}<input type="file" accept="image/*" hidden onChange={(e) => doUpload(e.target.files?.[0], "image_url")} /></label>
          </div>

          <div className="proj-row-2">
            <div>
              <label className="proj-modal-label">Demo video link</label>
              <input className="proj-modal-input" placeholder="YouTube / Drive link" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
            </div>
            <div>
              <label className="proj-modal-label">Pitch deck (PDF)</label>
              <label className="proj-cover-btn block">{busy === "pitch_deck_url" ? "Uploading..." : form.pitch_deck_url ? "Uploaded — change" : "Upload PDF"}<input type="file" accept=".pdf" hidden onChange={(e) => doUpload(e.target.files?.[0], "pitch_deck_url")} /></label>
            </div>
          </div>

          <div className="proj-row-2">
            <div>
              <label className="proj-modal-label">GitHub</label>
              <input className="proj-modal-input" placeholder="https://github.com/..." value={form.github_link} onChange={(e) => setForm({ ...form, github_link: e.target.value })} />
            </div>
            <div>
              <label className="proj-modal-label">Live demo</label>
              <input className="proj-modal-input" placeholder="https://..." value={form.demo_url} onChange={(e) => setForm({ ...form, demo_url: e.target.value })} />
            </div>
          </div>

          <label className="proj-modal-label">Project files / deliverables</label>
          <label className="proj-attach-drop">
            <FiUploadCloud size={18} /> {busy === "att" ? "Uploading..." : "Add files (docs, images, zip...)"}
            <input type="file" multiple hidden onChange={(e) => addAttachments([...e.target.files])} />
          </label>
          {attachments.length > 0 && (
            <div className="proj-attach-list">
              {attachments.map((a, i) => (
                <span key={i} className="proj-attach-chip"><FiPaperclip size={12} /> {a.name}<button onClick={() => setAttachments((x) => x.filter((_, j) => j !== i))}><FiX size={12} /></button></span>
              ))}
            </div>
          )}
        </div>
        <div className="proj-modal-footer">
          <button className="proj-modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="proj-modal-create" onClick={save} disabled={loading || !form.title.trim() || !form.supervisor_id}>
            {loading ? "Saving..." : isEdit ? "Save changes" : "Submit to supervisor"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Detail / manage / review ═══════════ */
function ViewModal({ projectId, me, onClose, onEdit, onChanged, toast }) {
  const [p, setP] = useState(null);
  const [busy, setBusy] = useState(false);
  const [updateText, setUpdateText] = useState("");
  const [answerFor, setAnswerFor] = useState(null);
  const [answerText, setAnswerText] = useState("");
  // review panel
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [publish, setPublish] = useState(false);

  const load = useCallback(async () => {
    const d = await api.get(`/projects/${projectId}`);
    if (d && d.id) { setP(d); setRating(0); setFeedback(d.supervisor_feedback || ""); setPublish(!!d.open_to_investors); }
    else { toast("Couldn't load project", "error"); onClose(); }
  }, [projectId, onClose, toast]);
  useEffect(() => { load(); }, [load]);

  if (!p) return <div className="proj-modal-overlay"><div className="proj-modal"><div className="proj-view-loading"><div className="proj-spin" /></div></div></div>;

  const isOwner = p.creator_id === me?.id;
  const st = STAGE_COLOR[p.status] || "#8b8ba3";
  const ap = APPROVAL[p.approval_status] || {};
  const { color: typeColor } = typeMeta(p.project_type);

  const review = async (decision) => {
    setBusy(true);
    try {
      const r = await api.post(`/projects/${projectId}/review`, { decision, feedback, rating: rating || null, publish: decision === "approved" && publish });
      if (!r.ok) throw new Error();
      toast(decision === "approved" ? "Project approved" : decision === "revision" ? "Changes requested" : "Project rejected");
      onChanged(); load();
    } catch { toast("Something went wrong", "error"); } finally { setBusy(false); }
  };
  const togglePublish = async () => {
    setBusy(true);
    try { const r = await api.post(`/projects/${projectId}/publish`); const d = await r.json(); if (!r.ok) throw new Error(d.message); toast(d.message); onChanged(); load(); }
    catch (e) { toast(e.message || "Failed", "error"); } finally { setBusy(false); }
  };
  const postUpdate = async () => {
    if (!updateText.trim()) return;
    await api.post(`/projects/${projectId}/updates`, { content: updateText.trim() }); setUpdateText(""); toast("Update posted"); load();
  };
  const answer = async (qid) => {
    if (!answerText.trim()) return;
    await api.post(`/projects/questions/${qid}/answer`, { answer: answerText.trim() }); setAnswerFor(null); setAnswerText(""); load();
  };
  const respondOffer = async (oid, status) => { await api.post(`/projects/offers/${oid}/respond`, { status }); toast(`Offer ${status}`); load(); };
  const respondMeeting = async (mid, status) => { await api.post(`/projects/meetings/${mid}/respond`, { status }); toast(`Meeting ${status}`); load(); };

  return (
    <div className="proj-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-modal proj-modal-wide">
        <div className="proj-modal-header">
          <div className="proj-view-headline">
            <span className="proj-view-typeicon" style={{ color: typeColor, background: `${typeColor}1c` }}><TypeIcon type={p.project_type} size={17} /></span>
            <div>
              <h3 dir="auto">{p.title}</h3>
              <span className="proj-status" style={{ color: st, background: `${st}1a`, marginTop: 4, display: "inline-flex" }}>
                <span className="proj-status-dot" style={{ background: st }} />{STAGE_LABEL[p.status] || p.status}
              </span>
            </div>
          </div>
          <button className="proj-modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="proj-modal-body">
          {p.image_url && <img className="proj-view-cover" src={imgSrc(p.image_url)} alt="" />}

          {/* Supervision status */}
          <div className="proj-supbar">
            {ap.label && <span className="proj-approval" style={{ color: ap.color }}>{ap.Icon && <ap.Icon size={14} />}{ap.label}</span>}
            {p.supervisor_name && <span className="proj-meta-item"><FiAward size={13} /> Supervisor: {p.supervisor_name}</span>}
            {Number(p.rating) > 0 && <span><Stars value={p.rating} /></span>}
            {p.open_to_investors ? <span className="proj-live"><span className="proj-live-dot" />Live for investors</span> : null}
          </div>
          {p.supervisor_feedback && (isOwner || p.can_review) && (
            <div className="proj-feedback"><FiMessageSquare size={14} /> <b>Supervisor feedback:</b> {p.supervisor_feedback}</div>
          )}

          {parseLooking(p.looking_for).length > 0 && (
            <div className="proj-looking-opts view">{parseLooking(p.looking_for).map((v) => { const o = LOOKING_OPTS.find((x) => x.v === v); return <span key={v} className="proj-look-chip on">{o && <o.Icon size={13} />}{o ? o.l : v}</span>; })}</div>
          )}
          {p.description && <p className="proj-view-desc" dir="auto">{p.description}</p>}

          <div className="proj-links">
            {Number(p.required_funding) > 0 && <span><FiDollarSign size={14} /> {money(p.required_funding)} needed</span>}
            {p.github_link && <a href={p.github_link} target="_blank" rel="noreferrer"><FiGithub size={14} /> GitHub</a>}
            {p.demo_url && <a href={p.demo_url} target="_blank" rel="noreferrer"><FiGlobe size={14} /> Demo</a>}
            {p.video_url && <a href={p.video_url} target="_blank" rel="noreferrer"><FiVideo size={14} /> Video</a>}
            {p.pitch_deck_url && <a href={imgSrc(p.pitch_deck_url)} target="_blank" rel="noreferrer"><FiFileText size={14} /> Pitch deck</a>}
          </div>

          {/* Files */}
          {p.files?.length > 0 && (
            <><SectionTitle icon={FiFile} count={p.files.length}>Files</SectionTitle>
              <div className="proj-file-list">
                {p.files.map((f) => <a key={f.id} className="proj-file-item" href={imgSrc(f.file_url)} target="_blank" rel="noreferrer"><FiPaperclip size={13} /> {f.file_name}</a>)}
              </div></>
          )}

          {/* Team */}
          {p.members?.length > 0 && (
            <><SectionTitle icon={FiUsers} count={p.members.length}>Team</SectionTitle>
              <div className="proj-looking-opts">{p.members.map((m) => <span key={m.id} className="proj-look-chip"><FiUser size={12} />{m.name}</span>)}</div></>
          )}

          {/* ── DOCTOR REVIEW PANEL ── */}
          {p.can_review && !isOwner && (
            <div className="proj-review-box">
              <SectionTitle icon={FiCheckCircle}>Review this project</SectionTitle>
              <div className="proj-rate-row">
                <span>Rating:</span>
                <span className="proj-rate-pick">{[1, 2, 3, 4, 5].map((i) => <button key={i} className={i <= rating ? "on" : ""} onClick={() => setRating(i)}><StarIcon filled={i <= rating} /></button>)}</span>
              </div>
              <textarea className="proj-modal-textarea" placeholder="Feedback for the student..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              <label className="proj-publish-check"><input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Publish to investors on approval</label>
              <div className="proj-review-actions">
                <button className="proj-btn-approve" disabled={busy} onClick={() => review("approved")}><FiCheck size={14} /> Approve</button>
                <button className="proj-btn-revision" disabled={busy} onClick={() => review("revision")}><FiEdit3 size={13} /> Request changes</button>
                <button className="proj-btn-reject" disabled={busy} onClick={() => review("rejected")}><FiXCircle size={13} /> Reject</button>
              </div>
              {p.approval_status === "approved" && (
                <button className="proj-btn-publish" disabled={busy} onClick={togglePublish}>{p.open_to_investors ? "Unpublish from investors" : "Publish to investors now"}</button>
              )}
            </div>
          )}

          {/* ── OWNER: interested investors / offers / meetings ── */}
          {isOwner && p.offers?.length > 0 && (
            <><SectionTitle icon={FiDollarSign} count={p.offers.length}>Investment offers</SectionTitle>
              {p.offers.map((o) => (
                <div key={o.id} className="proj-offer-item">
                  <div><b>{o.investor_name}</b>{o.verified ? <span className="proj-verified"><FiCheckCircle size={11} /> Verified</span> : ""}{o.company_name ? ` · ${o.company_name}` : ""} — <b className="proj-amount">{money(o.amount)}</b> <span className={`proj-offer-status ${o.status}`}>{o.status}</span></div>
                  {o.message && <p className="proj-endorse-note">"{o.message}"</p>}
                  {o.status === "pending" && <div className="proj-offer-actions"><button onClick={() => respondOffer(o.id, "accepted")}>Accept</button><button className="ghost" onClick={() => respondOffer(o.id, "declined")}>Decline</button></div>}
                </div>
              ))}</>
          )}
          {isOwner && p.meetings?.length > 0 && (
            <><SectionTitle icon={FiCalendar} count={p.meetings.length}>Meeting requests</SectionTitle>
              {p.meetings.map((m) => (
                <div key={m.id} className="proj-offer-item">
                  <div><b>{m.investor_name}</b>{m.proposed_time ? ` · ${new Date(m.proposed_time).toLocaleString()}` : ""} <span className={`proj-offer-status ${m.status}`}>{m.status}</span></div>
                  {m.message && <p className="proj-endorse-note">"{m.message}"</p>}
                  {m.status === "pending" && <div className="proj-offer-actions"><button onClick={() => respondMeeting(m.id, "accepted")}>Accept</button><button className="ghost" onClick={() => respondMeeting(m.id, "declined")}>Decline</button></div>}
                </div>
              ))}</>
          )}
          {isOwner && p.interested_investors?.length > 0 && (
            <><SectionTitle icon={FiBriefcase} count={p.interested_investors.length}>Interested investors</SectionTitle>
              {p.interested_investors.map((inv) => (
                <div key={inv.investor_id} className="proj-offer-item">
                  <b>{inv.investor_name}</b>{inv.verified ? <span className="proj-verified"><FiCheckCircle size={11} /> Verified</span> : ""}{inv.company_name ? ` · ${inv.company_name}` : ""}
                  <div className="proj-inv-contact"><a href={`mailto:${inv.email}`}>{inv.email}</a>{inv.phone_number && <a href={`tel:${inv.phone_number}`}>{inv.phone_number}</a>}</div>
                </div>
              ))}</>
          )}

          {/* Updates */}
          <SectionTitle icon={FiTrendingUp}>Updates</SectionTitle>
          {isOwner && (
            <div className="proj-update-compose">
              <input dir="auto" placeholder="Share a progress update..." value={updateText} onChange={(e) => setUpdateText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && postUpdate()} />
              <button onClick={postUpdate} disabled={!updateText.trim()}><FiSend size={13} /> Post</button>
            </div>
          )}
          {p.updates?.length > 0 ? p.updates.map((u) => (
            <div key={u.id} className="proj-update-item" dir="auto"><span className="proj-update-date">{fmtDate(u.created_at)}</span> {u.content}</div>
          )) : <div className="proj-empty-mini">No updates yet.</div>}

          {/* Q&A */}
          <SectionTitle icon={FiHelpCircle}>Questions & answers</SectionTitle>
          {p.questions?.length > 0 ? p.questions.map((q) => (
            <div key={q.id} className="proj-qa-item">
              <div className="proj-qa-q" dir="auto"><b>{q.asker_name}{q.asker_verified ? " ✓" : ""}:</b> {q.question}</div>
              {q.answer ? <div className="proj-qa-a" dir="auto"><FiCornerDownRight size={12} /> {q.answer}</div> : isOwner ? (
                answerFor === q.id ? (
                  <div className="proj-update-compose"><input dir="auto" placeholder="Your answer..." value={answerText} onChange={(e) => setAnswerText(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && answer(q.id)} /><button onClick={() => answer(q.id)}><FiSend size={13} /> Reply</button></div>
                ) : <button className="proj-answer-btn" onClick={() => { setAnswerFor(q.id); setAnswerText(""); }}>Answer</button>
              ) : <div className="proj-qa-a muted">Not answered yet</div>}
            </div>
          )) : <div className="proj-empty-mini">No questions yet.</div>}
        </div>

        <div className="proj-modal-footer">
          {isOwner && <button className="proj-modal-edit-btn" onClick={() => { onClose(); onEdit(p); }}><FiEdit2 size={13} /> Edit</button>}
          <button className="proj-modal-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ project, onClose, onConfirm, loading }) {
  return (
    <div className="proj-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-modal proj-modal-sm">
        <div className="proj-modal-header"><h3>Delete project</h3><button className="proj-modal-close" onClick={onClose}><FiX /></button></div>
        <div className="proj-modal-body" style={{ textAlign: "center" }}>
          <div className="proj-del-icon"><FiTrash2 size={24} /></div>
          <p style={{ color: "var(--sub)", fontSize: 14 }}>Delete <b style={{ color: "var(--text)" }}>"{project.title}"</b>? This cannot be undone.</p>
        </div>
        <div className="proj-modal-footer">
          <button className="proj-modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="proj-modal-delete-btn" onClick={() => onConfirm(project.id)} disabled={loading}>{loading ? "Deleting..." : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Page ═══════════ */
export default function ProjectsPage() {
  const me = getMe();
  const isStudent = me?.role === "student";
  const isDoctor = me?.role === "doctor";

  const [projects, setProjects] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "All") params.append("project_type", typeFilter);
      const list = await api.get(`/projects?${params}`); // backend scopes by role
      setProjects(Array.isArray(list) ? list : []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { api.get("/projects/doctors").then((d) => setDoctors(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  // Deep-link from a notification (?open=<id>)
  useEffect(() => {
    const openId = new URLSearchParams(window.location.search).get("open");
    if (openId) { setModal({ type: "view", id: Number(openId) }); window.history.replaceState({}, "", "/projects"); }
  }, []);

  const saveProject = async (form) => {
    setSaving(true);
    try {
      const r = modal?.type === "edit" ? await api.put(`/projects/${form.id}`, form) : await api.post("/projects", form);
      if (!r.ok) throw new Error();
      showToast(modal?.type === "edit" ? "Project updated" : "Submitted to your supervisor");
      setModal(null); fetchAll();
    } catch { showToast("Something went wrong", "error"); } finally { setSaving(false); }
  };
  const deleteProject = async (id) => {
    setSaving(true);
    try { await api.del(`/projects/${id}`); showToast("Deleted"); setModal(null); fetchAll(); }
    catch { showToast("Failed to delete", "error"); } finally { setSaving(false); }
  };

  const filtered = projects.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.creator_name || "").toLowerCase().includes(search.toLowerCase()));
  const sectionTitle = isDoctor ? "Projects I supervise" : me?.role === "admin" ? "All projects" : "My projects";

  const stats = useMemo(() => ({
    total: projects.length,
    live: projects.filter((p) => p.open_to_investors).length,
    approved: projects.filter((p) => p.approval_status === "approved").length,
  }), [projects]);

  const cardProps = {
    me, onView: (p) => setModal({ type: "view", id: p.id }),
    onEdit: (p) => setModal({ type: "edit", project: p }),
    onDelete: (p) => setModal({ type: "delete", project: p }),
  };

  return (
    <div className="projects-page">
      <div className="proj-bg" aria-hidden><span className="proj-bg-glow g1" /><span className="proj-bg-glow g2" /><span className="proj-bg-grid" /></div>

      <div className="proj-navbar-wrap"><Navbar /></div>

      {toast && <div className={`proj-toast ${toast.type}`}>{toast.type === "error" ? <FiXCircle size={15} /> : <FiCheckCircle size={15} />}{toast.msg}</div>}

      <div className="proj-content">
      <header className="proj-hero">
        <div className="proj-hero-main">
          <span className="proj-eyebrow"><FiActivity size={12} /> Innovation hub</span>
          <h1 className="projects-title">Projects</h1>
          <p className="projects-sub">Build a project, pick a supervisor, and reach investors.</p>
        </div>
        <div className="proj-hero-side">
          {!loading && (
            <div className="proj-stats">
              <div className="proj-stat"><span className="proj-stat-n">{stats.total}</span><span className="proj-stat-l">{isDoctor ? "Supervised" : "Projects"}</span></div>
              <div className="proj-stat"><span className="proj-stat-n" style={{ color: "#22c55e" }}>{stats.approved}</span><span className="proj-stat-l">Approved</span></div>
              <div className="proj-stat"><span className="proj-stat-n" style={{ color: "#00e5ff" }}>{stats.live}</span><span className="proj-stat-l">Live</span></div>
            </div>
          )}
          {isStudent && <button className="new-project-btn" onClick={() => setModal({ type: "new" })}><FiPlus size={16} /> New project</button>}
        </div>
      </header>

      <div className="projects-filters">
        <div className="type-tabs">
          <button className={`type-tab ${typeFilter === "All" ? "active" : ""}`} onClick={() => setTypeFilter("All")}><FiGrid size={13} /> All</button>
          {PROJECT_TYPES.map((t) => {
            const { Icon, color } = typeMeta(t);
            const active = typeFilter === t;
            return <button key={t} className={`type-tab ${active ? "active" : ""}`} style={active ? { "--type": color } : undefined} onClick={() => setTypeFilter(t)}><Icon size={13} style={{ color: active ? undefined : color }} /> {t}</button>;
          })}
        </div>
        <div className="proj-search-bar">
          <FiSearch size={14} className="proj-search-icon" />
          <input className="proj-search-input-bar" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="proj-search-clear" onClick={() => setSearch("")}><FiX size={13} /></button>}
        </div>
      </div>

      <section className="projects-section">
        <h2 className="projects-section-title">{sectionTitle} {!loading && <span className="proj-count">{filtered.length}</span>}</h2>
        {loading ? (
          <div className="projects-grid">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="proj-empty">
            <div className="proj-empty-icon"><FiFolder size={30} /></div>
            <p>{search ? "No projects match your search" : isDoctor ? "No projects are under your supervision yet" : isStudent ? "You haven't created a project yet" : "No projects yet"}</p>
            <span>{isDoctor ? "Students will pick you as their supervisor — approved work shows up here." : isStudent ? "Start your first project and send it to a supervisor for review." : "Projects created by students will appear here."}</span>
            {isStudent && !search && <button className="new-project-btn" style={{ marginTop: "1.1rem" }} onClick={() => setModal({ type: "new" })}><FiPlus size={14} /> New project</button>}
          </div>
        ) : <div className="projects-grid">{filtered.map((p) => <ProjectCard key={p.id} project={p} {...cardProps} />)}</div>}
      </section>
      </div>

      {(modal?.type === "new" || modal?.type === "edit") && (
        <ProjectFormModal initial={modal.type === "edit" ? modal.project : null} doctors={doctors} onClose={() => setModal(null)} onSave={saveProject} loading={saving} />
      )}
      {modal?.type === "view" && (
        <ViewModal projectId={modal.id} me={me} onClose={() => setModal(null)} onEdit={(p) => setModal({ type: "edit", project: p })} onChanged={fetchAll} toast={showToast} />
      )}
      {modal?.type === "delete" && <DeleteModal project={modal.project} onClose={() => setModal(null)} onConfirm={deleteProject} loading={saving} />}
    </div>
  );
}
