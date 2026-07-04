import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import "../styles/GroupDetails.css";

const token = () => localStorage.getItem("token");
const getMe = () => { try { return JSON.parse(atob(token().split(".")[1])); } catch { return null; } };
const fmt = (d) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtDay = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const kb = (b) => (b ? (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`) : "");
const initials = (n) => (n || "U").trim().slice(0, 1).toUpperCase();
function countdown(dateStr) {
  const ms = new Date(dateStr) - new Date();
  if (ms <= 0) return "now";
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

/* ── Icon set (inline SVG, no emoji) ── */
const S = (p) => ({ viewBox: "0 0 24 24", width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", ...p });
const Icon = {
  feed: (p) => <svg {...S(p)}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1 1-1 1-1h3" /><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" /></svg>,
  materials: (p) => <svg {...S(p)}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>,
  qa: (p) => <svg {...S(p)}><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>,
  sessions: (p) => <svg {...S(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  tasks: (p) => <svg {...S(p)}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  flash: (p) => <svg {...S(p)}><rect x="2" y="7" width="15" height="14" rx="2" /><path d="M7 3h13a2 2 0 0 1 2 2v11" /></svg>,
  wiki: (p) => <svg {...S(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>,
  polls: (p) => <svg {...S(p)}><path d="M12 20V10M18 20V4M6 20v-6" /></svg>,
  trophy: (p) => <svg {...S(p)}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M6 2h12v7a6 6 0 0 1-12 0V2Z" /><path d="M9 22h6M12 15v7" /></svg>,
  users: (p) => <svg {...S(p)}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  plus: (p) => <svg {...S(p)}><path d="M12 5v14M5 12h14" /></svg>,
  download: (p) => <svg {...S(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>,
  upload: (p) => <svg {...S(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>,
  trash: (p) => <svg {...S(p)}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" /></svg>,
  pin: (p) => <svg {...S(p)}><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1Z" /></svg>,
  like: (p) => <svg {...S(p)}><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>,
  star: (p) => <svg {...S(p)}><path d="m12 2 3 6.5 7 .8-5.2 4.8L18.2 21 12 17.3 5.8 21 7.2 14.1 2 9.3l7-.8L12 2Z" /></svg>,
  lock: (p) => <svg {...S({ width: 14, height: 14, ...p })}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  edit: (p) => <svg {...S(p)}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>,
  chev: (p) => <svg {...S(p)}><path d="m9 18 6-6-6-6" /></svg>,
  back: (p) => <svg {...S(p)}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  x: (p) => <svg {...S(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>,
  search: (p) => <svg {...S(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>,
  check: (p) => <svg {...S(p)}><path d="M20 6 9 17l-5-5" /></svg>,
  link: (p) => <svg {...S(p)}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>,
  clock: (p) => <svg {...S({ width: 13, height: 13, ...p })}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  file: (p) => <svg {...S(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>,
  send: (p) => <svg {...S(p)}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>,
  megaphone: (p) => <svg {...S({ width: 13, height: 13, ...p })}><path d="m3 11 18-5v12L3 14v-3ZM11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>,
};

const TABS = [
  { id: "feed", icon: Icon.feed, label: "Feed" },
  { id: "materials", icon: Icon.materials, label: "Materials" },
  { id: "qa", icon: Icon.qa, label: "Q&A" },
  { id: "sessions", icon: Icon.sessions, label: "Sessions" },
  { id: "tasks", icon: Icon.tasks, label: "My To-Do" },
  { id: "flashcards", icon: Icon.flash, label: "My Flashcards" },
  { id: "wiki", icon: Icon.wiki, label: "My Notes" },
  { id: "polls", icon: Icon.polls, label: "Polls" },
  { id: "leaderboard", icon: Icon.trophy, label: "Leaderboard" },
  { id: "members", icon: Icon.users, label: "Members" },
];

const Empty = ({ icon: I, text }) => <div className="gd-empty"><span className="gd-empty-icon"><I width={30} height={30} /></span><p>{text}</p></div>;
const Spin = () => <div className="gd-spin-wrap"><div className="gd-spin" /></div>;
const Avatar = ({ name, size = 38 }) => <div className="gd-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials(name)}</div>;
const PrivHint = ({ text }) => <div className="gd-priv"><Icon.lock /> {text}</div>;
const Edited = ({ on }) => (on ? <span className="gd-edited">· edited</span> : null);

/* Live, themed background */
function GroupBg() {
  return (
    <div className="gd-bg" aria-hidden="true">
      <span className="gd-blob b1" /><span className="gd-blob b2" /><span className="gd-blob b3" />
      <div className="gd-shapes">
        {[...Array(9)].map((_, i) => (
          <svg key={i} className={`gd-shape s${i}`} viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="1.4">
            {i % 4 === 0 && <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>}
            {i % 4 === 1 && <><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" /></>}
            {i % 4 === 2 && <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 5 2c0 2-3 2-3 4" /></>}
            {i % 4 === 3 && <><path d="M12 20V10M18 20V4M6 20v-6" /></>}
          </svg>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ FEED ═══════════ */
function FeedTab({ gid, group, me }) {
  const [posts, setPosts] = useState(null);
  const [draft, setDraft] = useState("");
  const [announce, setAnnounce] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const load = useCallback(() => api.get(`/groups/${gid}/posts`).then(r => setPosts(r.data.data || [])), [gid]);
  useEffect(() => { load(); }, [load]);
  const post = async () => { if (!draft.trim()) return; await api.post(`/groups/${gid}/posts`, { content: draft.trim(), post_type: announce ? "announcement" : "post" }); setDraft(""); setAnnounce(false); load(); };
  const like = async (p) => { p.liked ? await api.delete(`/groups/posts/${p.id}/like`) : await api.post(`/groups/posts/${p.id}/like`); load(); };
  const pin = async (p) => { await api.post(`/groups/posts/${p.id}/pin`); load(); };
  const del = async (p) => { if (window.confirm("Delete this post?")) { await api.delete(`/groups/posts/${p.id}`); load(); } };
  const saveEdit = async (p) => { if (!editDraft.trim()) return; await api.put(`/groups/posts/${p.id}`, { content: editDraft.trim() }); setEditId(null); load(); };
  if (!posts) return <Spin />;
  return (
    <div className="gd-col">
      {group.is_member && (
        <div className="gd-card gd-compose">
          <textarea dir="auto" placeholder="Share something with the group…" value={draft} onChange={e => setDraft(e.target.value)} rows={3} />
          <div className="gd-compose-row">
            {group.is_group_admin && <label className="gd-check"><input type="checkbox" checked={announce} onChange={e => setAnnounce(e.target.checked)} /> Announcement</label>}
            <button className="gd-btn" onClick={post} disabled={!draft.trim()}><Icon.send width={15} height={15} /> Post</button>
          </div>
        </div>
      )}
      {posts.length === 0 ? <Empty icon={Icon.feed} text="No posts yet" /> : posts.map(p => (
        <article key={p.id} className={`gd-card gd-post ${p.is_pinned ? "pinned" : ""}`}>
          <header className="gd-post-head">
            <Avatar name={p.name} />
            <div style={{ flex: 1 }}>
              <p className="gd-post-author">{p.name}
                {p.post_type === "announcement" && <span className="gd-chip amber"><Icon.megaphone /> Announcement</span>}
                {p.is_pinned && <span className="gd-chip blue"><Icon.pin width={12} height={12} /> Pinned</span>}
              </p>
              <p className="gd-muted">{fmt(p.created_at)} <Edited on={p.is_edited} /></p>
            </div>
            {group.is_group_admin && <button className="gd-icon-btn" onClick={() => pin(p)} title="Pin"><Icon.pin /></button>}
            {p.user_id === me?.id && editId !== p.id && <button className="gd-icon-btn" onClick={() => { setEditId(p.id); setEditDraft(p.content); }} title="Edit"><Icon.edit width={16} height={16} /></button>}
            {p.user_id === me?.id && <button className="gd-icon-btn danger" onClick={() => del(p)} title="Delete"><Icon.trash /></button>}
          </header>
          {editId === p.id ? (
            <div className="gd-compose">
              <textarea dir="auto" value={editDraft} onChange={e => setEditDraft(e.target.value)} rows={3} autoFocus />
              <div className="gd-compose-row"><button className="gd-btn-ghost" onClick={() => setEditId(null)}>Cancel</button><button className="gd-btn" onClick={() => saveEdit(p)} disabled={!editDraft.trim()}>Save</button></div>
            </div>
          ) : <p className="gd-post-body" dir="auto">{p.content}</p>}
          <footer className="gd-post-foot">
            <button className={`gd-like ${p.liked ? "on" : ""}`} onClick={() => like(p)}><Icon.like width={15} height={15} /> {p.likes}</button>
          </footer>
        </article>
      ))}
    </div>
  );
}

/* ═══════════ MATERIALS ═══════════ */
function MaterialsTab({ gid, group, me }) {
  const [files, setFiles] = useState(null);
  const [picked, setPicked] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [ef, setEf] = useState({ title: "", description: "" });
  const load = useCallback(() => api.get(`/groups/${gid}/files`).then(r => setFiles(r.data.data || [])), [gid]);
  useEffect(() => { load(); }, [load]);
  const saveEdit = async (f) => { if (!ef.title.trim()) return; await api.put(`/groups/files/${f.id}`, ef); setEditId(null); load(); };
  const uploadFile = async () => {
    if (!picked) return; setBusy(true);
    const fd = new FormData(); fd.append("file", picked); if (title) fd.append("title", title); if (desc) fd.append("description", desc);
    try { await fetch(`/api/groups/${gid}/files`, { method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: fd }); setPicked(null); setTitle(""); setDesc(""); load(); } finally { setBusy(false); }
  };
  const download = async (f) => {
    const res = await fetch(`/api/files/${f.id}/download`, { headers: { Authorization: `Bearer ${token()}` } });
    const blob = await res.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = f.file_name; a.click(); URL.revokeObjectURL(url);
  };
  const del = async (f) => { if (window.confirm("Delete this material?")) { await api.delete(`/groups/files/${f.id}`); load(); } };
  if (!files) return <Spin />;
  return (
    <div className="gd-col">
      {group.is_member && (
        <div className="gd-card gd-upload">
          <label className="gd-drop"><Icon.upload /> {picked ? picked.name : "Choose a file — summary, PDF, notes…"}<input type="file" hidden onChange={e => setPicked(e.target.files[0])} /></label>
          {picked && <>
            <input className="gd-input" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
            <input className="gd-input" placeholder="What is it? (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
            <div className="gd-compose-row"><button className="gd-btn" onClick={uploadFile} disabled={busy}>{busy ? "Uploading…" : "Share material"}</button></div>
          </>}
        </div>
      )}
      {files.length === 0 ? <Empty icon={Icon.materials} text="No materials shared yet" /> : files.map(f => (
        editId === f.id ? (
          <div key={f.id} className="gd-card gd-compose">
            <input className="gd-input" placeholder="Title" value={ef.title} onChange={e => setEf({ ...ef, title: e.target.value })} />
            <input className="gd-input" placeholder="Description" value={ef.description} onChange={e => setEf({ ...ef, description: e.target.value })} />
            <div className="gd-compose-row"><button className="gd-btn-ghost" onClick={() => setEditId(null)}>Cancel</button><button className="gd-btn" onClick={() => saveEdit(f)}>Save</button></div>
          </div>
        ) : (
          <div key={f.id} className="gd-card gd-file">
            <span className="gd-file-ic"><Icon.file width={22} height={22} /></span>
            <div className="gd-file-info">
              <p className="gd-file-name">{f.file_name} <Edited on={f.is_edited} /></p>
              <p className="gd-muted">{f.uploader_name} · {kb(f.file_size)}{f.avg_rating ? ` · ${f.avg_rating}★` : ""} · {f.download_count || 0} downloads</p>
              {f.description && <p className="gd-file-desc">{f.description}</p>}
            </div>
            <button className="gd-icon-btn" onClick={() => download(f)} title="Download"><Icon.download /></button>
            {f.uploader_id === me?.id && <button className="gd-icon-btn" title="Edit" onClick={() => { setEditId(f.id); setEf({ title: f.file_name, description: f.description || "" }); }}><Icon.edit width={16} height={16} /></button>}
            {(f.uploader_id === me?.id || group.is_group_admin) && <button className="gd-icon-btn danger" onClick={() => del(f)}><Icon.trash /></button>}
          </div>
        )
      ))}
    </div>
  );
}

/* ═══════════ Q&A ═══════════ */
function QATab({ gid, group, me }) {
  const [qs, setQs] = useState(null);
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [ans, setAns] = useState("");
  const [editQ, setEditQ] = useState(false);
  const [qDraft, setQDraft] = useState("");
  const [editAId, setEditAId] = useState(null);
  const [aDraft, setADraft] = useState("");

  const load = useCallback(() => api.get(`/groups/${gid}/questions`).then(r => setQs(r.data.data || [])), [gid]);
  useEffect(() => { load(); }, [load]);
  const ask = async () => { if (!title.trim()) return; await api.post(`/groups/${gid}/questions`, { title: title.trim() }); setTitle(""); load(); };
  const openQ = async (q) => { setOpen(q); setEditQ(false); const r = await api.get(`/groups/questions/${q.id}/answers`); setAnswers(r.data.data || []); };
  const refreshA = async () => { const r = await api.get(`/groups/questions/${open.id}/answers`); setAnswers(r.data.data || []); };
  const answer = async () => { if (!ans.trim()) return; await api.post(`/groups/questions/${open.id}/answers`, { content: ans.trim() }); setAns(""); refreshA(); };
  const best = async (a) => { await api.post(`/groups/answers/${a.id}/best`); refreshA(); };
  const saveQ = async () => { if (!qDraft.trim()) return; await api.put(`/groups/questions/${open.id}`, { title: qDraft.trim() }); setOpen({ ...open, title: qDraft.trim(), is_edited: 1 }); setEditQ(false); load(); };
  const delQ = async () => { if (window.confirm("Delete this question?")) { await api.delete(`/groups/questions/${open.id}`); setOpen(null); load(); } };
  const saveA = async (a) => { if (!aDraft.trim()) return; await api.put(`/groups/answers/${a.id}`, { content: aDraft.trim() }); setEditAId(null); refreshA(); };
  const delA = async (a) => { if (window.confirm("Delete this answer?")) { await api.delete(`/groups/answers/${a.id}`); refreshA(); } };
  if (!qs) return <Spin />;

  if (open) return (
    <div className="gd-col">
      <button className="gd-back" onClick={() => setOpen(null)}><Icon.back width={16} height={16} /> All questions</button>
      <div className="gd-card">
        {editQ ? (
          <div className="gd-compose"><input className="gd-input" dir="auto" value={qDraft} onChange={e => setQDraft(e.target.value)} autoFocus /><div className="gd-compose-row"><button className="gd-btn-ghost" onClick={() => setEditQ(false)}>Cancel</button><button className="gd-btn" onClick={saveQ} disabled={!qDraft.trim()}>Save</button></div></div>
        ) : (
          <div className="gd-qhead">
            <div style={{ flex: 1, minWidth: 0 }}><h3 className="gd-h" dir="auto">{open.title} <Edited on={open.is_edited} /></h3><p className="gd-muted">asked by {open.asker_name}</p></div>
            {open.asker_id === me?.id && <div className="gd-qhead-actions"><button className="gd-icon-btn" title="Edit" onClick={() => { setQDraft(open.title); setEditQ(true); }}><Icon.edit width={16} height={16} /></button><button className="gd-icon-btn danger" title="Delete" onClick={delQ}><Icon.trash /></button></div>}
          </div>
        )}
      </div>
      {answers.map(a => (
        <div key={a.id} className={`gd-card gd-answer ${a.is_best ? "best" : ""}`}>
          <div className="gd-answer-head">
            <Avatar name={a.name} size={30} /><b>{a.name}</b>
            {a.is_best && <span className="gd-chip green"><Icon.check width={12} height={12} /> Best answer</span>}
            <Edited on={a.is_edited} />
            {a.user_id === me?.id && editAId !== a.id && (
              <span className="gd-answer-actions"><button className="gd-icon-btn" title="Edit" onClick={() => { setEditAId(a.id); setADraft(a.content); }}><Icon.edit width={15} height={15} /></button><button className="gd-icon-btn danger" title="Delete" onClick={() => delA(a)}><Icon.trash width={15} height={15} /></button></span>
            )}
          </div>
          {editAId === a.id ? (
            <div className="gd-compose"><textarea dir="auto" value={aDraft} onChange={e => setADraft(e.target.value)} rows={3} autoFocus /><div className="gd-compose-row"><button className="gd-btn-ghost" onClick={() => setEditAId(null)}>Cancel</button><button className="gd-btn" onClick={() => saveA(a)} disabled={!aDraft.trim()}>Save</button></div></div>
          ) : <p className="gd-post-body" dir="auto">{a.content}</p>}
          {open.asker_id === me?.id && !a.is_best && editAId !== a.id && <button className="gd-btn-sm" onClick={() => best(a)}>Mark as best</button>}
        </div>
      ))}
      {answers.length === 0 && <Empty icon={Icon.qa} text="No answers yet" />}
      {group.is_member && <div className="gd-card gd-compose"><textarea dir="auto" placeholder="Write an answer…" value={ans} onChange={e => setAns(e.target.value)} rows={3} /><div className="gd-compose-row"><button className="gd-btn" onClick={answer} disabled={!ans.trim()}><Icon.send width={15} height={15} /> Answer</button></div></div>}
    </div>
  );
  return (
    <div className="gd-col">
      {group.is_member && <div className="gd-card gd-compose"><input className="gd-input" dir="auto" placeholder="Ask the group a question…" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && ask()} /><div className="gd-compose-row"><button className="gd-btn" onClick={ask} disabled={!title.trim()}>Ask</button></div></div>}
      {qs.length === 0 ? <Empty icon={Icon.qa} text="No questions yet" /> : qs.map(q => (
        <button key={q.id} className="gd-card gd-row" onClick={() => openQ(q)}>
          <div className="gd-row-main"><p className="gd-h-sm" dir="auto">{q.title} {q.solved && <span className="gd-chip green"><Icon.check width={12} height={12} /> Solved</span>} <Edited on={q.is_edited} /></p><p className="gd-muted">{q.asker_name} · {q.answer_count} answers</p></div>
          <span className="gd-chev"><Icon.chev /></span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════ SESSIONS ═══════════ */
const EMPTY_SESSION = { title: "", type: "session", scheduled_at: "", location: "" };
function SessionsTab({ gid, group, me }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(EMPTY_SESSION);
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState(null);
  const load = useCallback(() => api.get(`/groups/${gid}/sessions`).then(r => setItems(r.data.data || [])), [gid]);
  useEffect(() => { load(); }, [load]);
  const create = async () => { if (!form.title || !form.scheduled_at) return; await api.post(`/groups/${gid}/sessions`, form); setForm(EMPTY_SESSION); setShow(false); load(); };
  const saveEdit = async () => { if (!form.title || !form.scheduled_at) return; await api.put(`/groups/sessions/${editId}`, form); setEditId(null); setForm(EMPTY_SESSION); load(); };
  const del = async (s) => { if (window.confirm("Delete this?")) { await api.delete(`/groups/sessions/${s.id}`); load(); } };
  const rsvp = async (s, status) => { await api.post(`/groups/sessions/${s.id}/rsvp`, { status }); load(); };
  const startEdit = (s) => { setEditId(s.id); setForm({ title: s.title, type: s.type, scheduled_at: s.scheduled_at ? s.scheduled_at.slice(0, 16) : "", location: s.location || "" }); };
  if (!items) return <Spin />;
  const SessionForm = ({ onSave, onCancel }) => (
    <div className="gd-card gd-compose">
      <input className="gd-input" dir="auto" placeholder="Title — e.g. Chapter 5 revision / Midterm" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <div className="gd-row2">
        <select className="gd-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="session">Study session</option><option value="exam">Exam</option></select>
        <input className="gd-input" type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
      </div>
      <input className="gd-input" placeholder="Location / link (optional)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
      <div className="gd-compose-row"><button className="gd-btn-ghost" onClick={onCancel}>Cancel</button><button className="gd-btn" onClick={onSave}>Save</button></div>
    </div>
  );
  return (
    <div className="gd-col">
      {group.is_member && !editId && (show ? <SessionForm onSave={create} onCancel={() => setShow(false)} /> : <button className="gd-btn gd-btn-block" onClick={() => { setForm(EMPTY_SESSION); setShow(true); }}><Icon.plus /> Add session or exam</button>)}
      {items.length === 0 ? <Empty icon={Icon.sessions} text="Nothing scheduled yet" /> : items.map(s => (
        editId === s.id ? <SessionForm key={s.id} onSave={saveEdit} onCancel={() => { setEditId(null); setForm(EMPTY_SESSION); }} /> : (
          <div key={s.id} className={`gd-card gd-session ${s.type === "exam" ? "exam" : ""}`}>
            <div className={`gd-session-ic ${s.type === "exam" ? "exam" : ""}`}>{s.type === "exam" ? <Icon.file width={20} height={20} /> : <Icon.sessions width={20} height={20} />}</div>
            <div className="gd-file-info">
              <p className="gd-file-name" dir="auto">{s.title} <span className="gd-countdown"><Icon.clock /> {countdown(s.scheduled_at)}</span> <Edited on={s.is_edited} /></p>
              <p className="gd-muted">{fmt(s.scheduled_at)}{s.location ? ` · ${s.location}` : ""} · {s.going_count} going</p>
            </div>
            {group.is_member && s.type === "session" && (
              <div className="gd-rsvp">{["going", "maybe", "no"].map(st => <button key={st} className={`gd-seg ${s.my_rsvp === st ? "on" : ""}`} onClick={() => rsvp(s, st)}>{st === "going" ? "Going" : st === "maybe" ? "Maybe" : "No"}</button>)}</div>
            )}
            {(s.created_by === me?.id || group.is_group_admin) && <><button className="gd-icon-btn" title="Edit" onClick={() => startEdit(s)}><Icon.edit width={16} height={16} /></button><button className="gd-icon-btn danger" title="Delete" onClick={() => del(s)}><Icon.trash /></button></>}
          </div>
        )
      ))}
    </div>
  );
}

/* ═══════════ TASKS (private) ═══════════ */
function TasksTab({ gid }) {
  const [tasks, setTasks] = useState(null);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const load = useCallback(() => api.get(`/groups/${gid}/tasks`).then(r => setTasks(r.data.data || [])), [gid]);
  useEffect(() => { load(); }, [load]);
  const [editId, setEditId] = useState(null);
  const [eTitle, setETitle] = useState("");
  const add = async () => { if (!title.trim()) return; await api.post(`/groups/${gid}/tasks`, { title: title.trim(), due_date: due || null }); setTitle(""); setDue(""); load(); };
  const move = async (t, status) => { await api.put(`/groups/tasks/${t.id}`, { status }); load(); };
  const del = async (t) => { await api.delete(`/groups/tasks/${t.id}`); load(); };
  const saveEdit = async (t) => { if (!eTitle.trim()) return; await api.put(`/groups/tasks/${t.id}`, { title: eTitle.trim() }); setEditId(null); load(); };
  if (!tasks) return <Spin />;
  const cols = { todo: "To do", doing: "Doing", done: "Done" };
  const next = { todo: "doing", doing: "done", done: "todo" };
  return (
    <div className="gd-col">
      <PrivHint text="Your private to-do list — only you can see it." />
      <div className="gd-card gd-compose"><div className="gd-row2"><input className="gd-input" dir="auto" placeholder="New task — e.g. Summarize chapter 3" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} /><input className="gd-input" type="date" value={due} onChange={e => setDue(e.target.value)} /></div><div className="gd-compose-row"><button className="gd-btn" onClick={add} disabled={!title.trim()}><Icon.plus /> Add task</button></div></div>
      <div className="gd-board">
        {Object.keys(cols).map(col => (
          <div key={col} className="gd-board-col">
            <h4 className="gd-board-title">{cols[col]} <span>{tasks.filter(t => t.status === col).length}</span></h4>
            {tasks.filter(t => t.status === col).map(t => (
              <div key={t.id} className="gd-task">
                {editId === t.id ? (
                  <div className="gd-compose"><input className="gd-input" dir="auto" value={eTitle} onChange={e => setETitle(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit(t)} autoFocus /><div className="gd-compose-row"><button className="gd-btn-ghost" onClick={() => setEditId(null)}>Cancel</button><button className="gd-btn" onClick={() => saveEdit(t)}>Save</button></div></div>
                ) : (<>
                  <p className={col === "done" ? "gd-task-done" : ""} dir="auto">{t.title} <Edited on={t.is_edited} /></p>
                  {t.due_date && <p className="gd-muted">{fmtDay(t.due_date)}</p>}
                  <div className="gd-task-actions"><button className="gd-btn-sm" onClick={() => move(t, next[col])}>{col === "done" ? "Reopen" : col === "todo" ? "Start" : "Done"}</button><button className="gd-icon-btn" title="Edit" onClick={() => { setEditId(t.id); setETitle(t.title); }}><Icon.edit width={15} height={15} /></button><button className="gd-icon-btn danger" onClick={() => del(t)}><Icon.trash width={15} height={15} /></button></div>
                </>)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ FLASHCARDS (private) ═══════════ */
function FlashTab({ gid }) {
  const [cards, setCards] = useState(null);
  const [form, setForm] = useState({ front: "", back: "", topic: "" });
  const [flipped, setFlipped] = useState({});
  const load = useCallback(() => api.get(`/groups/${gid}/flashcards`).then(r => setCards(r.data.data || [])), [gid]);
  useEffect(() => { load(); }, [load]);
  const [editId, setEditId] = useState(null);
  const [ef, setEf] = useState({ front: "", back: "", topic: "" });
  const add = async () => { if (!form.front || !form.back) return; await api.post(`/groups/${gid}/flashcards`, form); setForm({ front: "", back: "", topic: "" }); load(); };
  const del = async (c) => { await api.delete(`/groups/flashcards/${c.id}`); load(); };
  const saveEdit = async (c) => { if (!ef.front || !ef.back) return; await api.put(`/groups/flashcards/${c.id}`, ef); setEditId(null); load(); };
  if (!cards) return <Spin />;
  return (
    <div className="gd-col">
      <PrivHint text="Your private flashcards — only you can see them." />
      <div className="gd-card gd-compose"><div className="gd-row2"><input className="gd-input" dir="auto" placeholder="Front (question)" value={form.front} onChange={e => setForm({ ...form, front: e.target.value })} /><input className="gd-input" dir="auto" placeholder="Back (answer)" value={form.back} onChange={e => setForm({ ...form, back: e.target.value })} /></div><div className="gd-compose-row"><input className="gd-input" dir="auto" placeholder="Topic (optional)" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} style={{ flex: 1 }} /><button className="gd-btn" onClick={add}><Icon.plus /> Add card</button></div></div>
      {editId && (
        <div className="gd-card gd-compose"><div className="gd-row2"><input className="gd-input" dir="auto" placeholder="Front" value={ef.front} onChange={e => setEf({ ...ef, front: e.target.value })} /><input className="gd-input" dir="auto" placeholder="Back" value={ef.back} onChange={e => setEf({ ...ef, back: e.target.value })} /></div><div className="gd-compose-row"><input className="gd-input" dir="auto" placeholder="Topic" value={ef.topic} onChange={e => setEf({ ...ef, topic: e.target.value })} style={{ flex: 1 }} /><button className="gd-btn-ghost" onClick={() => setEditId(null)}>Cancel</button><button className="gd-btn" onClick={() => saveEdit({ id: editId })}>Save</button></div></div>
      )}
      {cards.length === 0 ? <Empty icon={Icon.flash} text="No flashcards yet" /> : (
        <div className="gd-flash-grid">
          {cards.map(c => (
            <div key={c.id} className={`gd-flash ${flipped[c.id] ? "flipped" : ""}`} onClick={() => setFlipped(f => ({ ...f, [c.id]: !f[c.id] }))}>
              <div className="gd-flash-inner">
                <div className="gd-flash-face front">{c.topic && <span className="gd-flash-topic" dir="auto">{c.topic}</span>}<p dir="auto">{c.front}</p><span className="gd-flash-hint">tap to flip{c.is_edited ? " · edited" : ""}</span></div>
                <div className="gd-flash-face back"><p dir="auto">{c.back}</p></div>
              </div>
              <div className="gd-flash-tools">
                <button className="gd-flash-del" onClick={(e) => { e.stopPropagation(); setEditId(c.id); setEf({ front: c.front, back: c.back, topic: c.topic || "" }); }}><Icon.edit width={13} height={13} /></button>
                <button className="gd-flash-del" onClick={(e) => { e.stopPropagation(); del(c); }}><Icon.trash width={13} height={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════ WIKI / NOTES (private) ═══════════ */
function WikiTab({ gid }) {
  const [docs, setDocs] = useState(null);
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const load = useCallback(() => api.get(`/groups/${gid}/wiki`).then(r => setDocs(r.data.data || [])), [gid]);
  useEffect(() => { load(); }, [load]);
  const create = async () => { if (!form.title.trim()) return; await api.post(`/groups/${gid}/wiki`, form); setForm({ title: "", content: "" }); setEditing(false); load(); };
  const save = async () => { await api.put(`/groups/wiki/${open.id}`, form); setOpen({ ...open, ...form, is_edited: 1 }); setEditing(false); load(); };
  const delDoc = async () => { if (window.confirm("Delete this note?")) { await api.delete(`/groups/wiki/${open.id}`); setOpen(null); load(); } };
  if (!docs) return <Spin />;
  if (open) return (
    <div className="gd-col">
      <button className="gd-back" onClick={() => { setOpen(null); setEditing(false); }}><Icon.back width={16} height={16} /> All notes</button>
      <div className="gd-card gd-wiki-doc">
        {editing ? (<>
          <input className="gd-input" dir="auto" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="gd-input" dir="auto" rows={12} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          <div className="gd-compose-row"><button className="gd-btn-ghost" onClick={() => setEditing(false)}>Cancel</button><button className="gd-btn" onClick={save}>Save</button></div>
        </>) : (<>
          <div className="gd-wiki-head"><h3 className="gd-h" dir="auto">{open.title} <Edited on={open.is_edited} /></h3><div className="gd-qhead-actions"><button className="gd-btn-sm" onClick={() => { setForm({ title: open.title, content: open.content || "" }); setEditing(true); }}><Icon.edit width={14} height={14} /> Edit</button><button className="gd-icon-btn danger" title="Delete" onClick={delDoc}><Icon.trash /></button></div></div>
          <div className="gd-wiki-content" dir="auto">{open.content || "Empty — click Edit to start writing."}</div>
        </>)}
      </div>
    </div>
  );
  return (
    <div className="gd-col">
      <PrivHint text="Your private notes — only you can see them." />
      {editing ? (
        <div className="gd-card gd-compose"><input className="gd-input" dir="auto" placeholder="Note title — e.g. Chapter 4 summary" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><textarea className="gd-input" dir="auto" rows={5} placeholder="Write your summary…" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /><div className="gd-compose-row"><button className="gd-btn-ghost" onClick={() => setEditing(false)}>Cancel</button><button className="gd-btn" onClick={create}>Create</button></div></div>
      ) : <button className="gd-btn gd-btn-block" onClick={() => { setForm({ title: "", content: "" }); setEditing(true); }}><Icon.plus /> New note</button>}
      {docs.length === 0 ? <Empty icon={Icon.wiki} text="No notes yet" /> : docs.map(d => (
        <button key={d.id} className="gd-card gd-row" onClick={() => setOpen(d)}>
          <div className="gd-row-main"><p className="gd-h-sm" dir="auto">{d.title} <Edited on={d.is_edited} /></p><p className="gd-muted">Updated {fmtDay(d.updated_at)}</p></div>
          <span className="gd-chev"><Icon.chev /></span>
        </button>
      ))}
    </div>
  );
}

/* ═══════════ POLLS ═══════════ */
function PollsTab({ gid, group, me }) {
  const [polls, setPolls] = useState(null);
  const [show, setShow] = useState(false);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const [editId, setEditId] = useState(null);
  const [eq, setEq] = useState("");
  const load = useCallback(() => api.get(`/groups/${gid}/polls`).then(r => setPolls(r.data.data || [])), [gid]);
  useEffect(() => { load(); }, [load]);
  const create = async () => { const clean = opts.map(o => o.trim()).filter(Boolean); if (!q.trim() || clean.length < 2) return; await api.post(`/groups/${gid}/polls`, { question: q.trim(), options: clean }); setQ(""); setOpts(["", ""]); setShow(false); load(); };
  const vote = async (poll, oid) => { await api.post(`/groups/polls/${poll.id}/vote`, { option_id: oid }); load(); };
  const saveEdit = async (p) => { if (!eq.trim()) return; await api.put(`/groups/polls/${p.id}`, { question: eq.trim() }); setEditId(null); load(); };
  const del = async (p) => { if (window.confirm("Delete this poll?")) { await api.delete(`/groups/polls/${p.id}`); load(); } };
  if (!polls) return <Spin />;
  return (
    <div className="gd-col">
      {group.is_member && (show ? (
        <div className="gd-card gd-compose">
          <input className="gd-input" dir="auto" placeholder="Poll question…" value={q} onChange={e => setQ(e.target.value)} />
          {opts.map((o, i) => <input key={i} className="gd-input" dir="auto" placeholder={`Option ${i + 1}`} value={o} onChange={e => setOpts(opts.map((x, j) => j === i ? e.target.value : x))} />)}
          <div className="gd-compose-row"><button className="gd-btn-ghost" onClick={() => setOpts([...opts, ""])}>+ Option</button><button className="gd-btn-ghost" onClick={() => setShow(false)}>Cancel</button><button className="gd-btn" onClick={create}>Create poll</button></div>
        </div>
      ) : <button className="gd-btn gd-btn-block" onClick={() => setShow(true)}><Icon.plus /> New poll</button>)}
      {polls.length === 0 ? <Empty icon={Icon.polls} text="No polls yet" /> : polls.map(p => (
        <div key={p.id} className="gd-card">
          {editId === p.id ? (
            <div className="gd-compose"><input className="gd-input" dir="auto" value={eq} onChange={e => setEq(e.target.value)} autoFocus /><div className="gd-compose-row"><button className="gd-btn-ghost" onClick={() => setEditId(null)}>Cancel</button><button className="gd-btn" onClick={() => saveEdit(p)}>Save</button></div></div>
          ) : (
            <div className="gd-qhead">
              <div style={{ flex: 1, minWidth: 0 }}><p className="gd-h-sm" dir="auto">{p.question} <Edited on={p.is_edited} /></p><p className="gd-muted">{p.total} votes</p></div>
              {(p.created_by === me?.id || group.is_group_admin) && <div className="gd-qhead-actions"><button className="gd-icon-btn" title="Edit" onClick={() => { setEditId(p.id); setEq(p.question); }}><Icon.edit width={15} height={15} /></button><button className="gd-icon-btn danger" title="Delete" onClick={() => del(p)}><Icon.trash width={15} height={15} /></button></div>}
            </div>
          )}
          <div className="gd-poll-opts">
            {p.options.map(o => {
              const pct = p.total ? Math.round((o.votes / p.total) * 100) : 0;
              const mine = p.my_vote === o.id;
              return (
                <button key={o.id} className={`gd-poll-opt ${mine ? "mine" : ""}`} onClick={() => vote(p, o.id)}>
                  <span className="gd-poll-fill" style={{ width: `${pct}%` }} />
                  <span className="gd-poll-label">{mine && <Icon.check width={13} height={13} />} {o.text}</span>
                  <span className="gd-poll-pct">{pct}%</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════ LEADERBOARD ═══════════ */
function LeaderboardTab({ gid }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.get(`/groups/${gid}/leaderboard`).then(r => setRows(r.data.data || [])); }, [gid]);
  if (!rows) return <Spin />;
  return (
    <div className="gd-col">
      <p className="gd-note">Earn points by sharing materials, best answers, answering and more.</p>
      {rows.length === 0 ? <Empty icon={Icon.trophy} text="No points yet — start contributing" /> : rows.map((r, i) => (
        <div key={r.user_id} className={`gd-card gd-rank r${i}`}>
          <span className={`gd-rank-pos p${i}`}>{i + 1}</span>
          <Avatar name={r.name} size={36} />
          <span className="gd-rank-name">{r.name} {i === 0 && <span className="gd-chip amber"><Icon.star width={12} height={12} /> Top contributor</span>}</span>
          <span className="gd-rank-pts">{r.points}<small>pts</small></span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════ MEMBERS ═══════════ */
function MembersTab({ gid }) {
  const [members, setMembers] = useState(null);
  useEffect(() => { api.get(`/groups/${gid}/members`).then(r => setMembers(r.data.data || [])); }, [gid]);
  if (!members) return <Spin />;
  return (
    <div className="gd-members-grid">
      {members.map(m => (
        <div key={m.id} className="gd-card gd-member">
          <Avatar name={m.name} size={54} />
          <p className="gd-member-name">{m.name}</p>
          <span className={`gd-role ${m.role === "admin" ? "admin" : ""}`}>{m.role || "member"}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════ PAGE ═══════════ */
export default function GroupDetails() {
  const { id } = useParams();
  const me = getMe();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("feed");
  const [copied, setCopied] = useState(false);
  const [editG, setEditG] = useState(false);
  const [gForm, setGForm] = useState({ name: "", description: "", group_image: "" });

  const load = useCallback(async () => {
    try { const r = await api.get(`/groups/${id}`); setGroup(r.data.data); }
    catch { setNotFound(true); } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const saveGroup = async () => { if (!gForm.name.trim()) return; await api.put(`/groups/${id}`, gForm); setEditG(false); load(); };

  const toggleJoin = async () => {
    try { if (group.is_member) await api.delete(`/groups/${id}/leave`); else await api.post(`/groups/join`, { group_id: id }); load(); } catch {}
  };
  const share = () => { navigator.clipboard.writeText(window.location.href).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (loading) return <><Navbar /><div className="gd-page"><GroupBg /><Spin /></div></>;
  if (notFound || !group) return <><Navbar /><div className="gd-page"><GroupBg /><div className="gd-empty" style={{ marginTop: 80 }}><span className="gd-empty-icon"><Icon.users width={30} height={30} /></span><p>Group not found.</p></div></div></>;

  const props = { gid: id, group, me };
  return (
    <div className="gd-page">
      <Navbar />
      <GroupBg />

      <header className="gd-hero">
        <div className="gd-hero-avatar">{group.group_image ? <img src={group.group_image} alt="" /> : initials(group.name)}</div>
        <div className="gd-hero-info">
          <span className="gd-hero-pill">{group.is_private ? "Private group" : "Public group"}</span>
          <h1 className="gd-hero-title">{group.name}</h1>
          <p className="gd-hero-sub">{group.description}</p>
          <div className="gd-hero-meta"><Icon.users width={15} height={15} /> {group.members_count} members</div>
        </div>
        <div className="gd-hero-actions">
          <button className={`gd-btn ${group.is_member ? "gd-btn-outline" : ""}`} onClick={toggleJoin}>
            {group.is_member ? <><Icon.check width={16} height={16} /> Joined</> : <><Icon.plus /> Join group</>}
          </button>
          {group.is_group_admin && <button className="gd-icon-btn lg" title="Edit group" onClick={() => { setGForm({ name: group.name, description: group.description || "", group_image: group.group_image || "" }); setEditG(true); }}><Icon.edit /></button>}
          <button className="gd-icon-btn lg" onClick={share} title="Copy link">{copied ? <Icon.check /> : <Icon.link />}</button>
        </div>
      </header>

      {editG && (
        <div className="gd-modal-overlay" onClick={e => e.target === e.currentTarget && setEditG(false)}>
          <div className="gd-modal">
            <h3 className="gd-h" style={{ marginBottom: 14 }}>Edit group</h3>
            <label className="gd-flabel">Name</label>
            <input className="gd-input" value={gForm.name} onChange={e => setGForm({ ...gForm, name: e.target.value })} />
            <label className="gd-flabel">Description</label>
            <textarea className="gd-input" rows={3} value={gForm.description} onChange={e => setGForm({ ...gForm, description: e.target.value })} />
            <label className="gd-flabel">Image URL <span style={{ opacity: .5 }}>(optional)</span></label>
            <input className="gd-input" value={gForm.group_image} onChange={e => setGForm({ ...gForm, group_image: e.target.value })} placeholder="Paste image URL" />
            <div className="gd-compose-row"><button className="gd-btn-ghost" onClick={() => setEditG(false)}>Cancel</button><button className="gd-btn" onClick={saveGroup} disabled={!gForm.name.trim()}>Save</button></div>
          </div>
        </div>
      )}

      <nav className="gd-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`gd-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <t.icon width={17} height={17} /><span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="gd-main">
        {tab === "feed" && <FeedTab {...props} />}
        {tab === "materials" && <MaterialsTab {...props} />}
        {tab === "qa" && <QATab {...props} />}
        {tab === "sessions" && <SessionsTab {...props} />}
        {tab === "tasks" && <TasksTab {...props} />}
        {tab === "flashcards" && <FlashTab {...props} />}
        {tab === "wiki" && <WikiTab {...props} />}
        {tab === "polls" && <PollsTab {...props} />}
        {tab === "leaderboard" && <LeaderboardTab {...props} />}
        {tab === "members" && <MembersTab {...props} />}
      </main>
    </div>
  );
}
