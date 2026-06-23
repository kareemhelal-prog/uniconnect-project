import React, { useState, useEffect } from "react";
import "../styles/ProjectsPage.css";
import { FiSearch, FiX, FiUsers, FiUser, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { MdOutlineSchool, MdOutlineCategory } from "react-icons/md";
import api from "../api/axios";

const TYPES   = ["All", "Graduation", "Research", "Academic"];
const TYPE_COLORS = {
  Graduation: { bg: "rgba(168,85,247,0.15)", color: "#a855f7", border: "rgba(168,85,247,0.3)" },
  Research:   { bg: "rgba(0,229,255,0.12)",  color: "#00e5ff", border: "rgba(0,229,255,0.3)" },
  Academic:   { bg: "rgba(34,197,94,0.12)",  color: "#22c55e", border: "rgba(34,197,94,0.3)" },
};
const STATUS_COLORS = {
  idea:      { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  prototype: { color: "#00e5ff", bg: "rgba(0,229,255,0.1)" },
  mvp:       { color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  launched:  { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
};

function ProjectCard({ project, onView, onEdit, onDelete, isOwner }) {
  const ts = TYPE_COLORS[project.category] || TYPE_COLORS["Academic"];
  const ss = STATUS_COLORS[project.status] || STATUS_COLORS["idea"];
  return (
    <div className="proj-card">
      <div className="proj-card-top">
        <h4 className="proj-card-title">{project.title}</h4>
        <span className="proj-type-badge" style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
          {project.category}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>{project.description}</p>
      <div className="proj-card-footer">
        <span className="proj-status" style={{ color: ss.color, background: ss.bg }}>
          <span className="proj-status-dot" style={{ background: ss.color }} />
          {project.status}
        </span>
        <div className="proj-card-actions">
          <button className="proj-view-btn" style={{ borderColor: ts.border, color: ts.color }} onClick={() => onView(project)}>
            View
          </button>
          {isOwner && (
            <>
              <button className="proj-icon-btn edit" onClick={() => onEdit(project)}><FiEdit2 size={13} /></button>
              <button className="proj-icon-btn delete" onClick={() => onDelete(project)}><FiTrash2 size={13} /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial || { title: "", category: "software", description: "", github_link: "", demo_url: "", required_funding: "", status: "idea" }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.title.trim()) return setError("Title is required.");
    setLoading(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="proj-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-modal">
        <div className="proj-modal-header">
          <h3>{isEdit ? "Edit Project" : "New Project"}</h3>
          <button className="proj-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="proj-modal-body">
          <label className="proj-modal-label">Project Title *</label>
          <input className="proj-modal-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project name" />

          <label className="proj-modal-label">Category</label>
          <select className="proj-modal-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="software">Software</option>
            <option value="hardware">Hardware</option>
          </select>

          <label className="proj-modal-label">Description</label>
          <textarea className="proj-modal-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your project..." maxLength={300} />

          <label className="proj-modal-label">Status</label>
          <select className="proj-modal-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="idea">Idea</option>
            <option value="prototype">Prototype</option>
            <option value="mvp">MVP</option>
            <option value="launched">Launched</option>
          </select>

          <label className="proj-modal-label">GitHub Link</label>
          <input className="proj-modal-input" value={form.github_link} onChange={(e) => setForm({ ...form, github_link: e.target.value })} placeholder="https://github.com/..." />

          <label className="proj-modal-label">Demo URL</label>
          <input className="proj-modal-input" value={form.demo_url} onChange={(e) => setForm({ ...form, demo_url: e.target.value })} placeholder="https://..." />

          <label className="proj-modal-label">Required Funding ($)</label>
          <input className="proj-modal-input" type="number" value={form.required_funding} onChange={(e) => setForm({ ...form, required_funding: e.target.value })} placeholder="0" />

          {error && <p style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>
        <div className="proj-modal-footer">
          <button className="proj-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="proj-modal-create" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewModal({ project, onClose, onEdit, isOwner }) {
  const ts = TYPE_COLORS[project.category] || TYPE_COLORS["Academic"];
  return (
    <div className="proj-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-modal proj-modal-wide">
        <div className="proj-modal-header">
          <h3>{project.title}</h3>
          <button className="proj-modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="proj-modal-body">
          <p className="proj-view-desc">{project.description}</p>
          <div className="proj-view-meta">
            <span><MdOutlineCategory size={13} /> {project.category}</span>
            <span>Status: {project.status}</span>
            {project.github_link && <a href={project.github_link} target="_blank" rel="noreferrer" style={{ color: "#00e5ff" }}>GitHub</a>}
            {project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer" style={{ color: "#a855f7" }}>Demo</a>}
          </div>
        </div>
        <div className="proj-modal-footer">
          {isOwner && (
            <button className="proj-modal-edit-btn" onClick={() => { onClose(); onEdit(project); }}>
              <FiEdit2 size={13} /> Edit
            </button>
          )}
          <button className="proj-modal-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects,    setProjects]    = useState([]);
  const [myProjects,  setMyProjects]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeType,  setActiveType]  = useState("All");
  const [search,      setSearch]      = useState("");
  const [toast,       setToast]       = useState(null);
  const [modal,       setModal]       = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const showToast = (msg, color = "#a855f7") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allRes, myRes, meRes] = await Promise.all([
          api.get("/projects"),
          api.get("/projects/my"),
          api.get("/profile"),
        ]);
        setProjects(allRes.data.data || allRes.data || []);
        setMyProjects(myRes.data.data || myRes.data || []);
        setCurrentUser(meRes.data.id || meRes.data.data?.id);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filter = (list) =>
    list.filter((p) => {
      const matchType   = activeType === "All" || p.category?.toLowerCase() === activeType.toLowerCase();
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });

  const saveProject = async (form) => {
    if (modal?.type === "edit") {
      await api.put(`/projects/${form.id}`, form);
      setProjects((prev) => prev.map((p) => p.id === form.id ? { ...p, ...form } : p));
      setMyProjects((prev) => prev.map((p) => p.id === form.id ? { ...p, ...form } : p));
      showToast("Project updated! ✏️", "#00e5ff");
    } else {
      const res = await api.post("/projects", form);
      const newProject = res.data.data || res.data;
      setProjects((prev) => [newProject, ...prev]);
      setMyProjects((prev) => [newProject, ...prev]);
      showToast("Project created! 🎉");
    }
  };

  const deleteProject = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setMyProjects((prev) => prev.filter((p) => p.id !== id));
      setModal(null);
      showToast("Project deleted.", "#f87171");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filteredAll = filter(projects);
  const filteredMy  = filter(myProjects);

  if (loading) return <div style={{ color: "#00e5ff", padding: "2rem", textAlign: "center" }}>Loading...</div>;

  return (
    <div className="projects-page">
      {toast && <div className="proj-toast" style={{ background: toast.color }}>{toast.msg}</div>}

      <div className="projects-header">
        <h1 className="projects-title">Projects</h1>
        <button className="new-project-btn" onClick={() => setModal({ type: "new" })}>
          <FiPlus size={16} /> New Project
        </button>
      </div>

      <div className="projects-filters">
        <div className="type-tabs">
          {TYPES.map((t) => (
            <button key={t} className={`type-tab ${activeType === t ? "active" : ""}`} onClick={() => setActiveType(t)}>{t}</button>
          ))}
        </div>
        <div className="proj-search-bar">
          <FiSearch size={13} className="proj-search-icon" />
          <input className="proj-search-input-bar" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filteredMy.length > 0 && (
        <section className="projects-section">
          <h2 className="projects-section-title">My Projects <span className="proj-count">({filteredMy.length})</span></h2>
          <div className="projects-grid">
            {filteredMy.map((p) => (
              <ProjectCard key={p.id} project={p} isOwner={p.creator_id === currentUser}
                onView={(proj) => setModal({ type: "view", project: proj })}
                onEdit={(proj) => setModal({ type: "edit", project: proj })}
                onDelete={(proj) => deleteProject(proj.id)}
              />
            ))}
          </div>
        </section>
      )}

      {filteredAll.length > 0 && (
        <section className="projects-section">
          <h2 className="projects-section-title">All Projects <span className="proj-count">({filteredAll.length})</span></h2>
          <div className="projects-grid">
            {filteredAll.map((p) => (
              <ProjectCard key={p.id} project={p} isOwner={p.creator_id === currentUser}
                onView={(proj) => setModal({ type: "view", project: proj })}
                onEdit={(proj) => setModal({ type: "edit", project: proj })}
                onDelete={(proj) => deleteProject(proj.id)}
              />
            ))}
          </div>
        </section>
      )}

      {filteredAll.length === 0 && (
        <div className="proj-empty">
          <div className="proj-empty-icon">📁</div>
          <p>No projects found</p>
          <button className="new-project-btn" style={{ marginTop: "1rem" }} onClick={() => setModal({ type: "new" })}>
            <FiPlus size={14} /> New Project
          </button>
        </div>
      )}

      {(modal?.type === "new" || modal?.type === "edit") && (
        <ProjectFormModal initial={modal.type === "edit" ? modal.project : null} onClose={() => setModal(null)} onSave={saveProject} />
      )}
      {modal?.type === "view" && (
        <ViewModal project={modal.project} onClose={() => setModal(null)} onEdit={(proj) => setModal({ type: "edit", project: proj })} isOwner={modal.project?.creator_id === currentUser} />
      )}
    </div>
  );
}