import React, { useState, useEffect, useCallback } from "react";
import "../styles/ProjectsPage.css";
import { FiSearch, FiX, FiUsers, FiPlus, FiEdit2, FiTrash2, FiUploadCloud, FiCheck } from "react-icons/fi";

const API_BASE = "/api";
const getToken = () => localStorage.getItem("token");
const getMe = () => { try { return JSON.parse(atob(getToken().split(".")[1])); } catch { return null; } };
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });
const jsonHeaders = () => ({ "Content-Type": "application/json", ...authHeaders() });
const imgSrc = (u) => (!u ? "" : u.startsWith("http") || u.startsWith("data:") ? u : `/${u.replace(/^\//, "")}`);
const parseLooking = (s) => (s ? String(s).split(",").map((x) => x.trim()).filter(Boolean) : []);
const money = (n) => (Number(n) > 0 ? `$${Number(n).toLocaleString()}` : "—");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const PROJECT_TYPES = ["IoT", "Software Application", "Mechatronics", "Robotics", "AI/ML", "Embedded Systems", "Web/Mobile App", "Data Science", "Game Dev", "AR/VR", "Other"];
const TYPE_ICON = { IoT: "📡", "Software Application": "💻", Mechatronics: "⚙️", Robotics: "🤖", "AI/ML": "🧠", "Embedded Systems": "🔌", "Web/Mobile App": "📱", "Data Science": "📊", "Game Dev": "🎮", "AR/VR": "🕶️", Other: "🚀" };
const STAGES = ["idea", "prototype", "mvp", "launched"];
const STAGE_LABEL = { idea: "Idea", prototype: "Prototype", mvp: "MVP", launched: "Launched" };
const STAGE_COLOR = { idea: "#fbbf24", prototype: "#00e5ff", mvp: "#a855f7", launched: "#22c55e" };
const LOOKING_OPTS = [{ v: "funding", l: "💰 Funding" }, { v: "mentorship", l: "🎓 Mentorship" }, { v: "partner", l: "🤝 Partner" }];
const APPROVAL = {
  pending:  { label: "⏳ Pending review", color: "#fbbf24" },
  approved: { label: "✅ Approved", color: "#22c55e" },
  rejected: { label: "⛔ Rejected", color: "#f87171" },
  revision: { label: "✏️ Needs changes", color: "#f59e0b" },
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

const Stars = ({ value }) => {
  const r = Math.round(value || 0);
  return <span className="proj-stars">{[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= r ? "on" : ""}>★</span>)}</span>;
};

/* ═══════════ Card ═══════════ */
function ProjectCard({ project, me, onView, onEdit, onDelete }) {
  const isOwner = project.creator_id === me?.id;
  const st = STAGE_COLOR[project.status] || "#888";
  return (
    <div className="proj-card" onClick={() => onView(project)}>
      {project.image_url && <img className="proj-card-cover" src={imgSrc(project.image_url)} alt="" />}
      <div className="proj-card-top">
        <h4 className="proj-card-title">{project.title}</h4>
        <span className="proj-type-badge">{TYPE_ICON[project.project_type] || "🚀"} {project.project_type || "Project"}</span>
      </div>
      <div className="proj-meta" style={{ margin: "6px 0" }}>
        <span className="proj-status" style={{ color: st, background: `${st}18` }}>
          <span className="proj-status-dot" style={{ background: st }} />{STAGE_LABEL[project.status] || project.status}
        </span>
        {Number(project.rating) > 0 && <Stars value={project.rating} />}
      </div>
      {project.description && <p className="proj-card-desc">{project.description}</p>}
      <div className="proj-meta">
        <span className="proj-meta-item">👤 {project.creator_name}</span>
        {project.supervisor_name && <span className="proj-meta-item">🎓 {project.supervisor_name}</span>}
      </div>
      <div className="proj-card-footer">
        {isOwner
          ? <span className="proj-approval" style={{ color: (APPROVAL[project.approval_status] || {}).color }}>
              {(APPROVAL[project.approval_status] || {}).label}
              {project.open_to_investors ? " · 🟢 Live" : ""}
            </span>
          : <span className="proj-meta-item"><FiUsers size={11} /> {project.interest_count || 0} interested</span>}
        <div className="proj-card-actions">
          <button className="proj-view-btn" onClick={(e) => { e.stopPropagation(); onView(project); }}>View</button>
          {isOwner && <>
            <button className="proj-icon-btn edit" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(project); }}><FiEdit2 size={13} /></button>
            <button className="proj-icon-btn delete" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(project); }}><FiTrash2 size={13} /></button>
          </>}
        </div>
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
          <h3>{isEdit ? "Edit Project" : "New Project"}</h3>
          <button className="proj-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="proj-modal-body">
          <label className="proj-modal-label">Project Name *</label>
          <input className="proj-modal-input" placeholder="e.g. Smart Irrigation System" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <label className="proj-modal-label">What kind of project? *</label>
          <div className="proj-type-grid">
            {PROJECT_TYPES.map((t) => (
              <button key={t} type="button" className={`proj-type-pick ${form.project_type === t ? "on" : ""}`} onClick={() => setForm({ ...form, project_type: t })}>
                <span>{TYPE_ICON[t]}</span>{t}
              </button>
            ))}
          </div>

          <label className="proj-modal-label">Stage</label>
          <select className="proj-modal-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>

          <label className="proj-modal-label">Description</label>
          <textarea className="proj-modal-textarea" placeholder="Describe your project, the problem it solves, and how it works..." maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label className="proj-modal-label">Supervising Doctor *</label>
          <select className="proj-modal-select" value={form.supervisor_id || ""} onChange={(e) => setForm({ ...form, supervisor_id: e.target.value })}>
            <option value="">— Choose the doctor supervising this project —</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialization ? ` · ${d.specialization}` : ""}</option>)}
          </select>
          <div className="proj-modal-char">The doctor reviews your project and is the one who publishes it to investors.</div>

          <label className="proj-modal-label">Required Funding ($)</label>
          <input className="proj-modal-input" type="number" placeholder="e.g. 5000" value={form.required_funding} onChange={(e) => setForm({ ...form, required_funding: e.target.value })} />

          <label className="proj-modal-label">Looking for</label>
          <div className="proj-looking-opts">
            {LOOKING_OPTS.map((o) => <button key={o.v} type="button" className={`proj-look-chip ${looking.includes(o.v) ? "on" : ""}`} onClick={() => toggleLooking(o.v)}>{o.l}</button>)}
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
              <label className="proj-modal-label">Pitch Deck (PDF)</label>
              <label className="proj-cover-btn block">{busy === "pitch_deck_url" ? "Uploading..." : form.pitch_deck_url ? "✓ Uploaded — change" : "Upload PDF"}<input type="file" accept=".pdf" hidden onChange={(e) => doUpload(e.target.files?.[0], "pitch_deck_url")} /></label>
            </div>
          </div>

          <div className="proj-row-2">
            <div>
              <label className="proj-modal-label">GitHub</label>
              <input className="proj-modal-input" placeholder="https://github.com/..." value={form.github_link} onChange={(e) => setForm({ ...form, github_link: e.target.value })} />
            </div>
            <div>
              <label className="proj-modal-label">Live Demo</label>
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
                <span key={i} className="proj-attach-chip">📎 {a.name}<button onClick={() => setAttachments((x) => x.filter((_, j) => j !== i))}>✕</button></span>
              ))}
            </div>
          )}
        </div>
        <div className="proj-modal-footer">
          <button className="proj-modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="proj-modal-create" onClick={save} disabled={loading || !form.title.trim() || !form.supervisor_id}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Submit to supervisor"}
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
  const st = STAGE_COLOR[p.status] || "#888";
  const ap = APPROVAL[p.approval_status] || {};

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
          <div>
            <h3>{TYPE_ICON[p.project_type]} {p.title}</h3>
            <span className="proj-status" style={{ color: st, background: `${st}18`, marginTop: 4, display: "inline-flex" }}>
              <span className="proj-status-dot" style={{ background: st }} />{STAGE_LABEL[p.status] || p.status}
            </span>
          </div>
          <button className="proj-modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="proj-modal-body">
          {p.image_url && <img className="proj-view-cover" src={imgSrc(p.image_url)} alt="" />}

          {/* Supervision status */}
          <div className="proj-supbar">
            <span className="proj-approval" style={{ color: ap.color }}>{ap.label}</span>
            {p.supervisor_name && <span className="proj-meta-item">🎓 Supervisor: {p.supervisor_name}</span>}
            {Number(p.rating) > 0 && <span><Stars value={p.rating} /></span>}
            {p.open_to_investors ? <span className="proj-live">🟢 Live for investors</span> : null}
          </div>
          {p.supervisor_feedback && (isOwner || p.can_review) && (
            <div className="proj-feedback">💬 <b>Supervisor feedback:</b> {p.supervisor_feedback}</div>
          )}

          {parseLooking(p.looking_for).length > 0 && (
            <div className="proj-looking-opts view">{parseLooking(p.looking_for).map((v) => { const o = LOOKING_OPTS.find((x) => x.v === v); return <span key={v} className="proj-look-chip on">{o ? o.l : v}</span>; })}</div>
          )}
          {p.description && <p className="proj-view-desc">{p.description}</p>}

          <div className="proj-links">
            {Number(p.required_funding) > 0 && <span>💰 {money(p.required_funding)} needed</span>}
            {p.github_link && <a href={p.github_link} target="_blank" rel="noreferrer">🔗 GitHub</a>}
            {p.demo_url && <a href={p.demo_url} target="_blank" rel="noreferrer">🌐 Demo</a>}
            {p.video_url && <a href={p.video_url} target="_blank" rel="noreferrer">🎬 Video</a>}
            {p.pitch_deck_url && <a href={imgSrc(p.pitch_deck_url)} target="_blank" rel="noreferrer">📑 Pitch Deck</a>}
          </div>

          {/* Files */}
          {p.files?.length > 0 && (
            <><h4 className="proj-view-section-title">Files ({p.files.length})</h4>
              <div className="proj-file-list">
                {p.files.map((f) => <a key={f.id} className="proj-file-item" href={imgSrc(f.file_url)} target="_blank" rel="noreferrer">📎 {f.file_name}</a>)}
              </div></>
          )}

          {/* Team */}
          {p.members?.length > 0 && (
            <><h4 className="proj-view-section-title">Team ({p.members.length})</h4>
              <div className="proj-looking-opts">{p.members.map((m) => <span key={m.id} className="proj-look-chip">{m.name}</span>)}</div></>
          )}

          {/* ── DOCTOR REVIEW PANEL ── */}
          {p.can_review && !isOwner && (
            <div className="proj-review-box">
              <h4 className="proj-view-section-title">Review this project</h4>
              <div className="proj-rate-row">
                <span>Rating:</span>
                <span className="proj-rate-pick">{[1, 2, 3, 4, 5].map((i) => <button key={i} className={i <= rating ? "on" : ""} onClick={() => setRating(i)}>★</button>)}</span>
              </div>
              <textarea className="proj-modal-textarea" placeholder="Feedback for the student..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              <label className="proj-publish-check"><input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Publish to investors on approval</label>
              <div className="proj-review-actions">
                <button className="proj-btn-approve" disabled={busy} onClick={() => review("approved")}><FiCheck size={13} /> Approve</button>
                <button className="proj-btn-revision" disabled={busy} onClick={() => review("revision")}>Request changes</button>
                <button className="proj-btn-reject" disabled={busy} onClick={() => review("rejected")}>Reject</button>
              </div>
              {p.approval_status === "approved" && (
                <button className="proj-btn-publish" disabled={busy} onClick={togglePublish}>{p.open_to_investors ? "Unpublish from investors" : "🟢 Publish to investors now"}</button>
              )}
            </div>
          )}

          {/* ── OWNER: interested investors / offers / meetings ── */}
          {isOwner && p.offers?.length > 0 && (
            <><h4 className="proj-view-section-title">💵 Investment offers ({p.offers.length})</h4>
              {p.offers.map((o) => (
                <div key={o.id} className="proj-offer-item">
                  <div><b>{o.investor_name}</b>{o.verified ? <span className="proj-verified">✔ Verified</span> : ""}{o.company_name ? ` · ${o.company_name}` : ""} — <b className="proj-amount">{money(o.amount)}</b> <span className={`proj-offer-status ${o.status}`}>{o.status}</span></div>
                  {o.message && <p className="proj-endorse-note">"{o.message}"</p>}
                  {o.status === "pending" && <div className="proj-offer-actions"><button onClick={() => respondOffer(o.id, "accepted")}>Accept</button><button className="ghost" onClick={() => respondOffer(o.id, "declined")}>Decline</button></div>}
                </div>
              ))}</>
          )}
          {isOwner && p.meetings?.length > 0 && (
            <><h4 className="proj-view-section-title">📅 Meeting requests ({p.meetings.length})</h4>
              {p.meetings.map((m) => (
                <div key={m.id} className="proj-offer-item">
                  <div><b>{m.investor_name}</b>{m.proposed_time ? ` · ${new Date(m.proposed_time).toLocaleString()}` : ""} <span className={`proj-offer-status ${m.status}`}>{m.status}</span></div>
                  {m.message && <p className="proj-endorse-note">"{m.message}"</p>}
                  {m.status === "pending" && <div className="proj-offer-actions"><button onClick={() => respondMeeting(m.id, "accepted")}>Accept</button><button className="ghost" onClick={() => respondMeeting(m.id, "declined")}>Decline</button></div>}
                </div>
              ))}</>
          )}
          {isOwner && p.interested_investors?.length > 0 && (
            <><h4 className="proj-view-section-title">💼 Interested investors ({p.interested_investors.length})</h4>
              {p.interested_investors.map((inv) => (
                <div key={inv.investor_id} className="proj-offer-item">
                  <b>{inv.investor_name}</b>{inv.verified ? <span className="proj-verified">✔ Verified</span> : ""}{inv.company_name ? ` · ${inv.company_name}` : ""}
                  <div className="proj-inv-contact"><a href={`mailto:${inv.email}`}>✉ {inv.email}</a>{inv.phone_number && <a href={`tel:${inv.phone_number}`}>📞 {inv.phone_number}</a>}</div>
                </div>
              ))}</>
          )}

          {/* Updates */}
          <h4 className="proj-view-section-title">📣 Updates</h4>
          {isOwner && (
            <div className="proj-update-compose">
              <input placeholder="Share a progress update..." value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
              <button onClick={postUpdate} disabled={!updateText.trim()}>Post</button>
            </div>
          )}
          {p.updates?.length > 0 ? p.updates.map((u) => (
            <div key={u.id} className="proj-update-item"><span className="proj-update-date">{fmtDate(u.created_at)}</span> {u.content}</div>
          )) : <div className="proj-empty-mini">No updates yet.</div>}

          {/* Q&A */}
          <h4 className="proj-view-section-title">❓ Questions & Answers</h4>
          {p.questions?.length > 0 ? p.questions.map((q) => (
            <div key={q.id} className="proj-qa-item">
              <div className="proj-qa-q"><b>{q.asker_name}{q.asker_verified ? " ✔" : ""}:</b> {q.question}</div>
              {q.answer ? <div className="proj-qa-a">↳ {q.answer}</div> : isOwner ? (
                answerFor === q.id ? (
                  <div className="proj-update-compose"><input placeholder="Your answer..." value={answerText} onChange={(e) => setAnswerText(e.target.value)} autoFocus /><button onClick={() => answer(q.id)}>Reply</button></div>
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
        <div className="proj-modal-header"><h3>Delete Project</h3><button className="proj-modal-close" onClick={onClose}><FiX /></button></div>
        <div className="proj-modal-body" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🗑️</div>
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

  const showToast = (msg, type = "success") => { setToast({ msg, color: type === "error" ? "#f87171" : "#a855f7" }); setTimeout(() => setToast(null), 2500); };

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
      showToast(modal?.type === "edit" ? "Project updated" : "Submitted to your supervisor 🎉");
      setModal(null); fetchAll();
    } catch { showToast("Something went wrong", "error"); } finally { setSaving(false); }
  };
  const deleteProject = async (id) => {
    setSaving(true);
    try { await api.del(`/projects/${id}`); showToast("Deleted"); setModal(null); fetchAll(); }
    catch { showToast("Failed to delete", "error"); } finally { setSaving(false); }
  };

  const filtered = projects.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.creator_name || "").toLowerCase().includes(search.toLowerCase()));
  const sectionTitle = isDoctor ? "Projects I Supervise" : me?.role === "admin" ? "All Projects" : "My Projects";

  const cardProps = {
    me, onView: (p) => setModal({ type: "view", id: p.id }),
    onEdit: (p) => setModal({ type: "edit", project: p }),
    onDelete: (p) => setModal({ type: "delete", project: p }),
  };

  return (
    <div className="projects-page">
      {toast && <div className="proj-toast" style={{ background: toast.color }}>{toast.msg}</div>}

      <div className="projects-header">
        <div>
          <h1 className="projects-title">Projects</h1>
          <p className="projects-sub">Build a project, pick a supervisor, and reach investors.</p>
        </div>
        {isStudent && <button className="new-project-btn" onClick={() => setModal({ type: "new" })}><FiPlus size={16} /> New Project</button>}
      </div>

      <div className="projects-filters">
        <div className="type-tabs">
          {["All", ...PROJECT_TYPES].map((t) => <button key={t} className={`type-tab ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>{t === "All" ? "All" : `${TYPE_ICON[t]} ${t}`}</button>)}
        </div>
        <div className="proj-search-bar">
          <FiSearch size={13} className="proj-search-icon" />
          <input className="proj-search-input-bar" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="proj-view-loading"><div className="proj-spin" /></div> : (
        <section className="projects-section">
          <h2 className="projects-section-title">{sectionTitle} <span className="proj-count">({filtered.length})</span></h2>
          {filtered.length === 0 ? (
            <div className="proj-empty"><div className="proj-empty-icon">📁</div>
              <p>{search ? "No projects match your search" : isDoctor ? "No projects are under your supervision yet" : isStudent ? "You haven't created a project yet" : "No projects yet"}</p>
              {isStudent && !search && <button className="new-project-btn" style={{ marginTop: "1rem" }} onClick={() => setModal({ type: "new" })}><FiPlus size={14} /> New Project</button>}
            </div>
          ) : <div className="projects-grid">{filtered.map((p) => <ProjectCard key={p.id} project={p} {...cardProps} />)}</div>}
        </section>
      )}

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
