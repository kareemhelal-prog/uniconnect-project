import React, { useState, useEffect } from "react";
import "../styles/ProjectsPage.css";
import { FiSearch, FiX, FiUsers, FiUser, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { MdOutlineSchool, MdOutlineCategory } from "react-icons/md";

const API_BASE = "/api";
const getToken = () => localStorage.getItem("token");
const getCurrentUserId = () => {
  try {
    const t = getToken();
    return t ? JSON.parse(atob(t.split(".")[1])).id : null;
  } catch { return null; }
};

const CATEGORIES = ["All", "IT", "Engineering", "Business", "Medicine", "Other"];
const STATUSES   = ["All", "idea", "prototype", "mvp", "launched"];

const CATEGORY_COLORS = {
  IT:          { bg: "rgba(168,85,247,0.15)",  color: "#a855f7", border: "rgba(168,85,247,0.3)" },
  Engineering: { bg: "rgba(0,229,255,0.12)",   color: "#00e5ff", border: "rgba(0,229,255,0.3)" },
  Business:    { bg: "rgba(34,197,94,0.12)",   color: "#22c55e", border: "rgba(34,197,94,0.3)" },
  Medicine:    { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  Other:       { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.3)" },
};
const STATUS_LABELS = { idea: "Idea", prototype: "Prototype", mvp: "MVP", launched: "Launched" };
const STATUS_COLORS = {
  idea:      { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  prototype: { color: "#00e5ff", bg: "rgba(0,229,255,0.1)" },
  mvp:       { color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  launched:  { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
};
const AVATAR_COLORS = ["#a855f7", "#00e5ff", "#f87171", "#fbbf24", "#34d399", "#60a5fa"];

function colorFor(id) { return AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length]; }

function MembersCount({ count }) {
  if (count <= 1) return <span className="proj-solo-label"><FiUser size={11}/> Solo</span>;
  return <span className="proj-meta-item"><FiUsers size={11}/> {count} members</span>;
}

function ProjectCard({ project, onView, onEdit, onDelete, currentUserId }) {
  const ts = CATEGORY_COLORS[project.category] || CATEGORY_COLORS.Other;
  const ss = STATUS_COLORS[project.status]   || STATUS_COLORS.idea;
  const isOwner = project.creator_id === currentUserId;

  return (
    <div className="proj-card">
      <div className="proj-card-top">
        <h4 className="proj-card-title">{project.title}</h4>
        <span className="proj-type-badge" style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
          {project.category}
        </span>
      </div>

      <div className="proj-meta" style={{ margin: "8px 0" }}>
        <MembersCount count={project.members_count || 1} />
        {project.interest_count > 0 && (
          <span className="proj-meta-item">⭐ {project.interest_count} interested</span>
        )}
      </div>

      <div className="proj-meta">
        <span className="proj-meta-item"><MdOutlineSchool size={13}/> {project.creator_name}</span>
        <span className="proj-meta-item"><MdOutlineCategory size={13}/> {project.category}</span>
      </div>

      {project.description && (
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "8px", lineHeight: "1.5",
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {project.description}
        </p>
      )}

      <div className="proj-card-footer">
        <span className="proj-status" style={{ color: ss.color, background: ss.bg }}>
          <span className="proj-status-dot" style={{ background: ss.color }}/>
          {STATUS_LABELS[project.status] || project.status}
        </span>
        <div className="proj-card-actions">
          <button className="proj-view-btn" style={{ borderColor: ts.border, color: ts.color }} onClick={() => onView(project)}>
            View
          </button>
          {isOwner && (
            <>
              <button className="proj-icon-btn edit" title="Edit" onClick={() => onEdit(project)}><FiEdit2 size={13}/></button>
              <button className="proj-icon-btn delete" title="Delete" onClick={() => onDelete(project)}><FiTrash2 size={13}/></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectFormModal({ initial, onClose, onSave, loading }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial
      ? { ...initial }
      : { title: "", category: "IT", description: "", status: "idea", required_funding: "", github_link: "", demo_url: "" }
  );

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className="proj-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-modal">
        <div className="proj-modal-header">
          <h3>{isEdit ? "Edit Project" : "New Project"}</h3>
          <button className="proj-modal-close" onClick={onClose}><FiX/></button>
        </div>
        <div className="proj-modal-body">
          <label className="proj-modal-label">Project Name *</label>
          <input className="proj-modal-input" placeholder="e.g. AI Study Assistant" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}/>

          <label className="proj-modal-label">Category *</label>
          <select className="proj-modal-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
          </select>

          <label className="proj-modal-label">Status</label>
          <select className="proj-modal-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUSES.slice(1).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          <label className="proj-modal-label">Short Description</label>
          <textarea className="proj-modal-textarea" placeholder="Briefly describe your project..." maxLength={500}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/>
          <div className="proj-modal-char">{(form.description || '').length}/500</div>

          <label className="proj-modal-label">Required Funding ($)</label>
          <input className="proj-modal-input" type="number" placeholder="e.g. 5000" value={form.required_funding}
            onChange={(e) => setForm({ ...form, required_funding: e.target.value })}/>

          <label className="proj-modal-label">GitHub Link</label>
          <input className="proj-modal-input" placeholder="https://github.com/..." value={form.github_link}
            onChange={(e) => setForm({ ...form, github_link: e.target.value })}/>

          <label className="proj-modal-label">Demo URL</label>
          <input className="proj-modal-input" placeholder="https://..." value={form.demo_url}
            onChange={(e) => setForm({ ...form, demo_url: e.target.value })}/>
        </div>
        <div className="proj-modal-footer">
          <button className="proj-modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="proj-modal-create" onClick={handleSave} disabled={loading || !form.title.trim()}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewModal({ project, onClose, onEdit, currentUserId }) {
  const ts = CATEGORY_COLORS[project.category] || CATEGORY_COLORS.Other;
  const ss = STATUS_COLORS[project.status] || STATUS_COLORS.idea;
  const isOwner = project.creator_id === currentUserId;

  return (
    <div className="proj-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-modal proj-modal-wide">
        <div className="proj-modal-header">
          <div>
            <h3>{project.title}</h3>
            <span className="proj-type-badge" style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}`, marginTop: 4, display: "inline-block" }}>
              {project.category}
            </span>
          </div>
          <button className="proj-modal-close" onClick={onClose}><FiX/></button>
        </div>
        <div className="proj-modal-body">
          {project.description && <p className="proj-view-desc">{project.description}</p>}

          <div className="proj-view-meta">
            <span><MdOutlineSchool size={13}/> {project.creator_name}</span>
            <span className="proj-status" style={{ color: ss.color, background: ss.bg, padding: "3px 10px", borderRadius: 6 }}>
              <span className="proj-status-dot" style={{ background: ss.color }}/>{STATUS_LABELS[project.status] || project.status}
            </span>
            {project.required_funding > 0 && <span>💰 ${Number(project.required_funding).toLocaleString()}</span>}
            {project.interest_count > 0 && <span>⭐ {project.interest_count} investors interested</span>}
          </div>

          {project.github_link && (
            <a href={project.github_link} target="_blank" rel="noreferrer"
              style={{ display: "inline-block", color: "#00e5ff", fontSize: 13, marginTop: 8 }}>
              🔗 View on GitHub
            </a>
          )}
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noreferrer"
              style={{ display: "inline-block", color: "#a855f7", fontSize: 13, marginTop: 8, marginLeft: 12 }}>
              🌐 Live Demo
            </a>
          )}

          {project.members && project.members.length > 0 && (
            <>
              <h4 className="proj-view-section-title">Members ({project.members.length})</h4>
              <div className="proj-view-members">
                {project.members.map((m) => (
                  <div key={m.id} className="proj-view-member-row">
                    <div className="proj-member-avatar" style={{ background: colorFor(m.id) }}>
                      {(m.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="proj-member-info">
                      <span className="proj-member-name">{m.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="proj-modal-footer">
          {isOwner && (
            <button className="proj-modal-edit-btn" onClick={() => { onClose(); onEdit(project); }}>
              <FiEdit2 size={13}/> Edit Project
            </button>
          )}
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
        <div className="proj-modal-header">
          <h3>Delete Project</h3>
          <button className="proj-modal-close" onClick={onClose}><FiX/></button>
        </div>
        <div className="proj-modal-body" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>🗑️</div>
          <p style={{ color: "var(--sub)", fontSize: 14, lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: "var(--text)" }}>"{project.title}"</strong>?<br/>This cannot be undone.
          </p>
        </div>
        <div className="proj-modal-footer">
          <button className="proj-modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="proj-modal-delete-btn" onClick={() => onConfirm(project.id)} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus]     = useState("All");
  const [search, setSearch] = useState("");
  const [toast, setToast]   = useState(null);
  const [modal, setModal]   = useState(null);
  const currentUserId = getCurrentUserId();

  const showToast = (msg, color = "#a855f7") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "All") params.append("category", activeCategory);
      if (activeStatus !== "All") params.append("status", activeStatus);
      const res = await fetch(`${API_BASE}/projects?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [activeCategory, activeStatus]);

  const fetchProjectDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return await res.json();
    } catch { return null; }
  };

  const saveProject = async (form) => {
    setSaving(true);
    try {
      if (modal?.type === "edit") {
        await fetch(`${API_BASE}/projects/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(form)
        });
        showToast("Project updated! ✏️", "#00e5ff");
      } else {
        const res = await fetch(`${API_BASE}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error();
        showToast("Project created! 🎉");
      }
      setModal(null);
      fetchProjects();
    } catch {
      showToast("Something went wrong ❌", "#f87171");
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id) => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      showToast("Project deleted.", "#f87171");
      setModal(null);
      fetchProjects();
    } catch {
      showToast("Failed to delete ❌", "#f87171");
    } finally {
      setSaving(false);
    }
  };

  const openView = async (project) => {
    const detail = await fetchProjectDetails(project.id);
    setModal({ type: "view", project: detail || project });
  };

  const filtered = projects.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.creator_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const myProjects  = filtered.filter(p => p.creator_id === currentUserId);
  const allProjects = filtered;

  return (
    <div className="projects-page">
      {toast && <div className="proj-toast" style={{ background: toast.color }}>{toast.msg}</div>}

      <div className="projects-header">
        <h1 className="projects-title">Projects</h1>
        <button className="new-project-btn" onClick={() => setModal({ type: "new" })}>
          <FiPlus size={16}/> New Project
        </button>
      </div>

      <div className="projects-filters">
        <div className="type-tabs">
          {CATEGORIES.map(c => (
            <button key={c} className={`type-tab ${activeCategory === c ? "active" : ""}`} onClick={() => setActiveCategory(c)}>{c}</button>
          ))}
        </div>
        <select className="proj-filter-select" value={activeStatus} onChange={(e) => setActiveStatus(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : STATUS_LABELS[s]}</option>)}
        </select>
        <div className="proj-search-bar">
          <FiSearch size={13} className="proj-search-icon"/>
          <input className="proj-search-input-bar" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.5)" }}>
          Loading projects...
        </div>
      ) : (
        <>
          {myProjects.length > 0 && (
            <section className="projects-section">
              <h2 className="projects-section-title">My Projects <span className="proj-count">({myProjects.length})</span></h2>
              <div className="projects-grid">
                {myProjects.map(p => (
                  <ProjectCard key={p.id} project={p} currentUserId={currentUserId}
                    onView={openView}
                    onEdit={(proj) => setModal({ type: "edit", project: proj })}
                    onDelete={(proj) => setModal({ type: "delete", project: proj })}
                  />
                ))}
              </div>
            </section>
          )}

          {allProjects.length > 0 && (
            <section className="projects-section">
              <h2 className="projects-section-title">All Projects <span className="proj-count">({allProjects.length})</span></h2>
              <div className="projects-grid">
                {allProjects.map(p => (
                  <ProjectCard key={p.id} project={p} currentUserId={currentUserId}
                    onView={openView}
                    onEdit={(proj) => setModal({ type: "edit", project: proj })}
                    onDelete={(proj) => setModal({ type: "delete", project: proj })}
                  />
                ))}
              </div>
            </section>
          )}

          {allProjects.length === 0 && (
            <div className="proj-empty">
              <div className="proj-empty-icon">📁</div>
              <p>{search ? "No projects match your search" : "No projects yet"}</p>
              <span>{search ? "Try adjusting your filters." : "Be the first to create a project!"}</span>
              {!search && (
                <button className="new-project-btn" style={{ marginTop: "1rem" }} onClick={() => setModal({ type: "new" })}>
                  <FiPlus size={14}/> New Project
                </button>
              )}
            </div>
          )}
        </>
      )}

      {(modal?.type === "new" || modal?.type === "edit") && (
        <ProjectFormModal
          initial={modal.type === "edit" ? modal.project : null}
          onClose={() => setModal(null)}
          onSave={saveProject}
          loading={saving}
        />
      )}
      {modal?.type === "view" && (
        <ViewModal
          project={modal.project}
          onClose={() => setModal(null)}
          onEdit={(proj) => setModal({ type: "edit", project: proj })}
          currentUserId={currentUserId}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          project={modal.project}
          onClose={() => setModal(null)}
          onConfirm={deleteProject}
          loading={saving}
        />
      )}
    </div>
  );
}
