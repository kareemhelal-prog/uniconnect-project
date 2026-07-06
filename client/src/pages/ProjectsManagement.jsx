import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import "../styles/ProjectsManagement.css";
import {
  Search, ChevronDown, Eye, Trash2, X,
  GitBranch as Github, Link as LinkIcon,
  Users, Calendar, DollarSign, CheckCircle2,
  AlertTriangle, ChevronLeft, ChevronRight, Briefcase, Star,
} from "lucide-react";
import api from "../api/axios";

function Avatar({ name, size = 36 }) {
  return (
    <div className="pm-avatar" style={{ width: size, height: size, background: "#6c47ff33", color: "#a855f7", fontSize: size * 0.38 }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

function CategoryBadge({ category }) {
  const isSoftware = category === "software";
  return (
    <span className={`pm-badge ${isSoftware ? "pm-badge-software" : "pm-badge-hardware"}`}>
      {category}
    </span>
  );
}

export default function ProjectsManagement() {
  const [projects,     setProjects]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [category,     setCategory]     = useState("All");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [rowsPerPage,  setRowsPerPage]  = useState(10);
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [viewProject,  setViewProject]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState(null);
  const categoryRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (categoryRef.current && !categoryRef.current.contains(e.target))
        setCategoryOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: rowsPerPage,
        ...(search && { search }),
        ...(category !== "All" && { category: category.toLowerCase() }),
      });
      const res = await api.get(`/admin/projects?${params}`);
      setProjects(res.data.projects || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, category]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { setPage(1); }, [search, category, rowsPerPage]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  const toggleFeature = async (p) => {
    try {
      await api.post(`/projects/${p.id}/feature`, { featured: !p.featured });
      showToast(p.featured ? "Removed from featured" : "Featured as project of the week");
      fetchProjects();
    } catch { showToast("Could not update"); }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/projects/${deleteTarget.id}`);
      setDeleteTarget(null);
      showToast("Project deleted successfully");
      fetchProjects();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  function pageNumbers() {
    const out = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) out.push(i);
      return out;
    }
    out.push(1);
    if (page > 3) out.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) out.push(i);
    if (page < totalPages - 2) out.push("…");
    out.push(totalPages);
    return out;
  }

  return (
    <div className="pm-page">
      <div className="pm-header">
        <div className="pm-header-icon"><Briefcase size={22} /></div>
        <div>
          <h1>Projects Management</h1>
          <p>View and manage all projects created by users.</p>
        </div>
      </div>

      <div className="pm-toolbar">
        <div className="pm-search-wrapper">
          <Search size={17} className="pm-search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, description or creator…"
            className="pm-search-input"
          />
        </div>

        <div className="pm-category-wrapper">
          <span className="pm-category-label">Category:</span>
          <div className="pm-dropdown" ref={categoryRef}>
            <button onClick={() => setCategoryOpen((o) => !o)} className="pm-dropdown-btn">
              {category} <ChevronDown size={15} />
            </button>
            {categoryOpen && (
              <div className="pm-dropdown-menu">
                {["All", "Software", "Hardware"].map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setCategoryOpen(false); }}
                    className={`pm-dropdown-item ${c === category ? "active" : ""}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pm-table-container">
        <div className="pm-table-scroll">
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#00e5ff" }}>Loading...</div>
          ) : (
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Creator</th>
                  <th>Category</th>
                  <th>Members</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="pm-project-cell">
                        <div className="pm-project-icon" style={{ background: "#6c47ff22", color: "#a855f7" }}>
                          📁
                        </div>
                        <div>
                          <div className="pm-project-name">{p.title}</div>
                          <div className="pm-project-desc">{p.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="pm-creator-cell">
                        <Avatar name={p.creator_name} size={32} />
                        <div>
                          <div className="pm-creator-name">{p.creator_name}</div>
                          <div className="pm-creator-username">@{p.creator_username}</div>
                        </div>
                      </div>
                    </td>
                    <td><CategoryBadge category={p.category} /></td>
                    <td className="pm-members">{p.members_count || 0}</td>
                    <td className="pm-date">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="pm-actions">
                        <button onClick={() => setViewProject(p)} className="pm-btn-view">
                          <Eye size={14} /> View
                        </button>
                        <button onClick={() => toggleFeature(p)} className="pm-btn-view" title="Project of the week">
                          <Star size={14} fill={p.featured ? "#fbbf24" : "none"} color={p.featured ? "#fbbf24" : "currentColor"} /> {p.featured ? "Featured" : "Feature"}
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="pm-btn-delete">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr><td colSpan={6} className="pm-empty">No projects found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="pm-footer">
        <div className="pm-rows-section">
          <span className="pm-rows-label">Rows per page:</span>
          {[10, 25, 50].map((n) => (
            <button key={n} onClick={() => setRowsPerPage(n)} className={`pm-rows-btn ${rowsPerPage === n ? "active" : ""}`}>{n}</button>
          ))}
        </div>
        <div className="pm-pagination">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="pm-page-prev">
            <ChevronLeft size={15} /> Previous
          </button>
          {pageNumbers().map((n, i) =>
            n === "…" ? (
              <span key={`d${i}`} className="pm-page-dots">…</span>
            ) : (
              <button key={n} onClick={() => setPage(n)} className={`pm-page-btn ${n === page ? "active" : ""}`}>{n}</button>
            )
          )}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="pm-page-next">
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {viewProject && (
        <div className="pm-modal-backdrop">
          <div className="pm-modal">
            <div className="pm-modal-header">
              <div className="pm-modal-title"><Briefcase size={18} /> Project Details</div>
              <button onClick={() => setViewProject(null)} className="pm-modal-close"><X size={18} /></button>
            </div>
            <div className="pm-modal-body">
              <div className="pm-modal-grid">
                {[
                  [<Github size={13} />, "Repository", viewProject.github_link || "—"],
                  [<LinkIcon size={13} />, "Demo URL", viewProject.demo_url || "—"],
                  [<DollarSign size={13} />, "Required Funding", `$${Number(viewProject.required_funding || 0).toLocaleString()}`],
                  [<Calendar size={13} />, "Created", new Date(viewProject.created_at).toLocaleDateString()],
                  [<Users size={13} />, "Members", viewProject.members_count || 0],
                  [<CheckCircle2 size={13} />, "Status", viewProject.status || "—"],
                ].map(([icon, label, value]) => (
                  <div key={label}>
                    <div className="pm-modal-grid-item-label">{icon} {label}</div>
                    <div className="pm-modal-grid-item-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pm-modal-footer">
              <button onClick={() => setViewProject(null)} className="pm-modal-close-btn">Close</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="pm-modal-backdrop">
          <div className="pm-delete-modal">
            <div className="pm-delete-modal-header">
              <div className="pm-delete-icon"><AlertTriangle size={20} /></div>
              <h3 className="pm-delete-modal-title">Delete project?</h3>
            </div>
            <p className="pm-delete-modal-body">
              This will permanently delete <strong>"{deleteTarget.title}"</strong>. Cannot be undone.
            </p>
            <div className="pm-delete-modal-actions">
              <button onClick={() => setDeleteTarget(null)} className="pm-delete-cancel-btn">Cancel</button>
              <button onClick={confirmDelete} className="pm-delete-confirm-btn">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="pm-toast">
          <div className="pm-toast-inner">
            <CheckCircle2 size={17} style={{ color: "#4ade80" }} /> {toast}
          </div>
        </div>
      )}
    </div>
  );
}