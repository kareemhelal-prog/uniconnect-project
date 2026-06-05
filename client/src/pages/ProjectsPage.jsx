import React, { useState } from "react";
import "../styles/ProjectsPage.css";
import { FiSearch, FiX, FiUsers, FiUser, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { MdOutlineSchool, MdOutlineCategory } from "react-icons/md";

// ─── Constants ────────────────────────────────────────
const COLLEGES = ["All Colleges","Faculty of Engineering","Faculty of Computing","Faculty of Arts"];
const DEPARTMENTS = ["All Departments","Computer Science","Electrical Engineering","Software Engineering","Information Technology","Psychology"];
const YEARS = ["All Academic Years","Year 1","Year 2","Year 3","Year 4"];
const TYPES = ["All","Graduation","Research","Academic"];

const TYPE_COLORS = {
  Graduation: { bg:"rgba(168,85,247,0.15)",  color:"#a855f7", border:"rgba(168,85,247,0.3)" },
  Research:   { bg:"rgba(0,229,255,0.12)",    color:"#00e5ff", border:"rgba(0,229,255,0.3)" },
  Academic:   { bg:"rgba(34,197,94,0.12)",    color:"#22c55e", border:"rgba(34,197,94,0.3)" },
};
const STATUS_COLORS = {
  Active:    { color:"#22c55e", bg:"rgba(34,197,94,0.1)" },
  Completed: { color:"#64748b", bg:"rgba(100,116,139,0.1)" },
};
const AVATAR_COLORS = ["#a855f7","#00e5ff","#f87171","#fbbf24","#34d399","#60a5fa"];

// ─── Current user ─────────────────────────────────────
const CURRENT_USER_ID = 1;

// ─── All available members ────────────────────────────
const ALL_MEMBERS = [
  { id:1, name:"Kareem Mohamed",  initials:"KM", dept:"Computer Science",       avatarColor:"#a855f7" },
  { id:2, name:"Ayesha Khan",     initials:"AK", dept:"Computer Science",       avatarColor:"#00e5ff" },
  { id:3, name:"Muhammad Ali",    initials:"MA", dept:"Electrical Engineering", avatarColor:"#f87171" },
  { id:4, name:"Sara Ahmed",      initials:"SA", dept:"Software Engineering",   avatarColor:"#34d399" },
  { id:5, name:"Usman Badar",     initials:"UB", dept:"Information Technology", avatarColor:"#fbbf24" },
  { id:6, name:"Lina Hassan",     initials:"LH", dept:"Computer Science",       avatarColor:"#60a5fa" },
  { id:7, name:"Omar Farouk",     initials:"OF", dept:"Software Engineering",   avatarColor:"#a78bfa" },
];

// ─── Seed projects ────────────────────────────────────
const SEED_PROJECTS = [
  { id:1, title:"AI-Powered Study Assistant",         type:"Graduation", college:"Faculty of Engineering",  dept:"Computer Science",       status:"Active",    memberIds:[1,2,3,4], leaderId:1, description:"An intelligent assistant that helps students manage study schedules using ML." },
  { id:2, title:"Smart Attendance System",            type:"Research",   college:"Faculty of Engineering",  dept:"Electrical Engineering", status:"Active",    memberIds:[1,3],     leaderId:1, description:"Automated attendance tracking via facial recognition and IoT devices." },
  { id:3, title:"Blockchain-Based Credential Verification", type:"Academic", college:"Faculty of Computing", dept:"Information Technology", status:"Completed", memberIds:[1],       leaderId:1, description:"Decentralised platform to verify academic credentials on-chain." },
  { id:4, title:"E-Commerce Recommendation Engine",   type:"Research",   college:"Faculty of Computing",    dept:"Software Engineering",   status:"Active",    memberIds:[2,3,4,5,6,7], leaderId:2, description:"Collaborative filtering & content-based recommendations for e-commerce." },
  { id:5, title:"IoT-Based Smart Home Automation",    type:"Graduation", college:"Faculty of Engineering",  dept:"Electrical Engineering", status:"Active",    memberIds:[3,5,6],   leaderId:3, description:"Smart home system integrating IoT sensors, voice control and mobile app." },
  { id:6, title:"Impact of Social Media on Students", type:"Academic",   college:"Faculty of Arts",         dept:"Psychology",             status:"Completed", memberIds:[4],       leaderId:4, description:"Research study on social media effects on academic performance." },
];

// ─── Helpers ──────────────────────────────────────────
function getMember(id) { return ALL_MEMBERS.find((m) => m.id === id); }

function AvatarStack({ memberIds }) {
  const shown = memberIds.slice(0, 3);
  const extra = memberIds.length - 3;
  if (memberIds.length === 1) {
    const m = getMember(memberIds[0]);
    return (
      <div className="proj-avatars">
        <div className="proj-avatar" style={{ background: m?.avatarColor }} />
        <span className="proj-solo-label"><FiUser size={11}/> Solo</span>
      </div>
    );
  }
  return (
    <div className="proj-avatars">
      {shown.map((id, i) => {
        const m = getMember(id);
        return (
          <div key={id} className="proj-avatar" style={{ background: m?.avatarColor || AVATAR_COLORS[i], zIndex: 3 - i }} />
        );
      })}
      {extra > 0 && <div className="proj-avatar proj-avatar-more">+{extra}</div>}
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────
function ProjectCard({ project, onView, onEdit, onDelete }) {
  const ts = TYPE_COLORS[project.type] || {};
  const ss = STATUS_COLORS[project.status] || {};
  const isOwner = project.leaderId === CURRENT_USER_ID;

  return (
    <div className="proj-card">
      <div className="proj-card-top">
        <h4 className="proj-card-title">{project.title}</h4>
        <span className="proj-type-badge" style={{ background:ts.bg, color:ts.color, border:`1px solid ${ts.border}` }}>
          {project.type}
        </span>
      </div>

      <AvatarStack memberIds={project.memberIds} />

      <div className="proj-meta">
        <span className="proj-meta-item"><MdOutlineSchool size={13}/> {project.college}</span>
        <span className="proj-meta-item"><MdOutlineCategory size={13}/> {project.dept}</span>
      </div>

      <div className="proj-card-footer">
        <span className="proj-status" style={{ color:ss.color, background:ss.bg }}>
          <span className="proj-status-dot" style={{ background:ss.color }}/>
          {project.status}
        </span>
        <div className="proj-card-actions">
          <button className="proj-view-btn" style={{ borderColor:ts.border, color:ts.color }} onClick={() => onView(project)}>
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

// ─── New / Edit Modal ─────────────────────────────────
function ProjectFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial
      ? { ...initial }
      : { title:"", type:"", college:"", dept:"", description:"", memberIds:[CURRENT_USER_ID], leaderId:CURRENT_USER_ID, status:"Active", mode:"Solo" }
  );
  const [memberSearch, setMemberSearch] = useState("");

  const mode = form.memberIds?.length > 1 ? "Team" : "Solo";

  const setMode = (m) => {
    if (m === "Solo") setForm((f) => ({ ...f, memberIds:[CURRENT_USER_ID], leaderId:CURRENT_USER_ID }));
    else setForm((f) => ({ ...f }));
  };

  const toggleMember = (id) => {
    if (id === CURRENT_USER_ID) return;
    setForm((f) => {
      const has = f.memberIds.includes(id);
      return { ...f, memberIds: has ? f.memberIds.filter((x) => x !== id) : [...f.memberIds, id] };
    });
  };

  const descLen = form.description?.length || 0;

  const filtered = ALL_MEMBERS.filter(
    (m) => m.id !== CURRENT_USER_ID &&
      (m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
       m.dept.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const handleSave = () => {
    if (!form.title.trim() || !form.type) return;
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
          <input className="proj-modal-input" placeholder="e.g. Kareem Mohamed's AI Research" value={form.title} onChange={(e) => setForm({ ...form, title:e.target.value })}/>

          <label className="proj-modal-label">Project Type *</label>
          <select className="proj-modal-select" value={form.type} onChange={(e) => setForm({ ...form, type:e.target.value })}>
            <option value="">Select project type</option>
            <option>Graduation</option>
            <option>Research</option>
            <option>Academic</option>
          </select>

          <label className="proj-modal-label">College</label>
          <select className="proj-modal-select" value={form.college} onChange={(e) => setForm({ ...form, college:e.target.value })}>
            <option value="">Select college</option>
            {COLLEGES.slice(1).map((c) => <option key={c}>{c}</option>)}
          </select>

          <label className="proj-modal-label">Department</label>
          <select className="proj-modal-select" value={form.dept} onChange={(e) => setForm({ ...form, dept:e.target.value })}>
            <option value="">Select department</option>
            {DEPARTMENTS.slice(1).map((d) => <option key={d}>{d}</option>)}
          </select>

          <label className="proj-modal-label">Short Description</label>
          <textarea className="proj-modal-textarea" placeholder="Briefly describe your project..." maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description:e.target.value })}/>
          <div className="proj-modal-char">{descLen}/300</div>

          <label className="proj-modal-label">Status</label>
          <select className="proj-modal-select" value={form.status} onChange={(e) => setForm({ ...form, status:e.target.value })}>
            <option>Active</option>
            <option>Completed</option>
          </select>

          <label className="proj-modal-label">Project Mode</label>
          <div className="proj-type-toggle">
            {["Solo","Team"].map((t) => (
              <button key={t} className={`proj-type-btn ${mode === t ? "active" : ""}`} onClick={() => setMode(t)}>
                {t === "Solo" ? <FiUser size={13}/> : <FiUsers size={13}/>} {t}
              </button>
            ))}
          </div>

          {mode === "Team" && (
            <>
              <label className="proj-modal-label">Invite Members</label>
              <div className="proj-search-wrap">
                <FiSearch size={13} className="proj-search-icon"/>
                <input className="proj-modal-input proj-search-input" placeholder="Search by name or department..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)}/>
              </div>
              <div className="proj-members-list">
                {filtered.map((m) => {
                  const added = form.memberIds.includes(m.id);
                  return (
                    <div key={m.id} className="proj-member-row">
                      <div className="proj-member-avatar" style={{ background:m.avatarColor }}>{m.initials}</div>
                      <div className="proj-member-info">
                        <span className="proj-member-name">{m.name}</span>
                        <span className="proj-member-dept">{m.dept}</span>
                      </div>
                      <button className={`proj-member-add ${added ? "added" : ""}`} onClick={() => toggleMember(m.id)}>
                        {added ? "✓" : "+"}
                      </button>
                    </div>
                  );
                })}
                {filtered.length === 0 && <p className="proj-members-empty">No members found</p>}
              </div>
            </>
          )}
        </div>

        <div className="proj-modal-footer">
          <button className="proj-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="proj-modal-create" onClick={handleSave}>{isEdit ? "Save Changes" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── View / Manage Members Modal ──────────────────────
function ViewModal({ project, onClose, onEdit, onUpdate }) {
  const ts = TYPE_COLORS[project.type] || {};
  const ss = STATUS_COLORS[project.status] || {};
  const isOwner = project.leaderId === CURRENT_USER_ID;
  const [addSearch, setAddSearch] = useState("");

  const notInProject = ALL_MEMBERS.filter(
    (m) => !project.memberIds.includes(m.id) &&
      (m.name.toLowerCase().includes(addSearch.toLowerCase()) || m.dept.toLowerCase().includes(addSearch.toLowerCase()))
  );

  const setLeader = (id) => onUpdate({ ...project, leaderId:id });

  const removeMember = (id) => {
    if (id === project.leaderId) return;
    onUpdate({ ...project, memberIds: project.memberIds.filter((x) => x !== id) });
  };

  const addMember = (id) => {
    if (project.memberIds.includes(id)) return;
    onUpdate({ ...project, memberIds:[...project.memberIds, id] });
  };

  return (
    <div className="proj-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-modal proj-modal-wide">
        <div className="proj-modal-header">
          <div>
            <h3>{project.title}</h3>
            <span className="proj-type-badge" style={{ background:ts.bg, color:ts.color, border:`1px solid ${ts.border}`, marginTop:4, display:"inline-block" }}>{project.type}</span>
          </div>
          <button className="proj-modal-close" onClick={onClose}><FiX/></button>
        </div>

        <div className="proj-modal-body">
          {project.description && <p className="proj-view-desc">{project.description}</p>}

          <div className="proj-view-meta">
            <span><MdOutlineSchool size={13}/> {project.college || "—"}</span>
            <span><MdOutlineCategory size={13}/> {project.dept || "—"}</span>
            <span className="proj-status" style={{ color:ss.color, background:ss.bg, padding:"3px 10px", borderRadius:6 }}>
              <span className="proj-status-dot" style={{ background:ss.color }}/>{project.status}
            </span>
          </div>

          <h4 className="proj-view-section-title">Members ({project.memberIds.length})</h4>
          <div className="proj-view-members">
            {project.memberIds.map((id) => {
              const m = getMember(id);
              if (!m) return null;
              const isLeader = id === project.leaderId;
              return (
                <div key={id} className="proj-view-member-row">
                  <div className="proj-member-avatar" style={{ background:m.avatarColor }}>{m.initials}</div>
                  <div className="proj-member-info">
                    <span className="proj-member-name">
                      {m.name} {isLeader && <span className="proj-leader-badge">👑 Leader</span>}
                    </span>
                    <span className="proj-member-dept">{m.dept}</span>
                  </div>
                  {isOwner && !isLeader && (
                    <div className="proj-member-actions">
                      <button className="proj-make-leader-btn" title="Make Leader" onClick={() => setLeader(id)}>👑</button>
                      <button className="proj-remove-btn" title="Remove" onClick={() => removeMember(id)}><FiX size={12}/></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isOwner && (
            <>
              <h4 className="proj-view-section-title" style={{ marginTop:20 }}>Add Members</h4>
              <div className="proj-search-wrap">
                <FiSearch size={13} className="proj-search-icon"/>
                <input className="proj-modal-input proj-search-input" placeholder="Search members to add..." value={addSearch} onChange={(e) => setAddSearch(e.target.value)}/>
              </div>
              <div className="proj-members-list" style={{ marginTop:8 }}>
                {notInProject.length === 0
                  ? <p className="proj-members-empty">{addSearch ? "No results" : "All available members are already in this project"}</p>
                  : notInProject.map((m) => (
                    <div key={m.id} className="proj-member-row">
                      <div className="proj-member-avatar" style={{ background:m.avatarColor }}>{m.initials}</div>
                      <div className="proj-member-info">
                        <span className="proj-member-name">{m.name}</span>
                        <span className="proj-member-dept">{m.dept}</span>
                      </div>
                      <button className="proj-member-add" onClick={() => addMember(m.id)}>+</button>
                    </div>
                  ))
                }
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

// ─── Delete Confirm Modal ─────────────────────────────
function DeleteModal({ project, onClose, onConfirm }) {
  return (
    <div className="proj-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-modal proj-modal-sm">
        <div className="proj-modal-header">
          <h3>Delete Project</h3>
          <button className="proj-modal-close" onClick={onClose}><FiX/></button>
        </div>
        <div className="proj-modal-body" style={{ textAlign:"center" }}>
          <div style={{ fontSize:"3rem", marginBottom:12 }}>🗑️</div>
          <p style={{ color:"var(--sub)", fontSize:14, lineHeight:1.6 }}>
            Are you sure you want to delete <strong style={{ color:"var(--text)" }}>"{project.title}"</strong>?<br/>This cannot be undone.
          </p>
        </div>
        <div className="proj-modal-footer">
          <button className="proj-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="proj-modal-delete-btn" onClick={() => { onConfirm(project.id); onClose(); }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState(SEED_PROJECTS);
  const [activeType, setActiveType] = useState("All");
  const [college, setCollege] = useState("All Colleges");
  const [dept, setDept] = useState("All Departments");
  const [year, setYear] = useState("All Academic Years");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const [modal, setModal] = useState(null); // null | { type, project? }

  const showToast = (msg, color = "#a855f7") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  const filter = (list) =>
    list.filter((p) => {
      const matchType    = activeType === "All" || p.type === activeType;
      const matchCollege = college === "All Colleges" || p.college === college;
      const matchDept    = dept === "All Departments" || p.dept === dept;
      const matchSearch  = !search || p.title.toLowerCase().includes(search.toLowerCase());
      return matchType && matchCollege && matchDept && matchSearch;
    });

  const myProjects  = filter(projects.filter((p) => p.memberIds.includes(CURRENT_USER_ID)));
  const allProjects = filter(projects);

  const saveProject = (form) => {
    if (modal?.type === "edit") {
      setProjects((prev) => prev.map((p) => p.id === form.id ? { ...p, ...form } : p));
      showToast("Project updated! ✏️", "#00e5ff");
    } else {
      setProjects((prev) => [{ ...form, id: Date.now() }, ...prev]);
      showToast("Project created! 🎉");
    }
    setModal(null);
  };

  const deleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast("Project deleted.", "#f87171");
  };

  const updateProject = (updated) => {
    setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    setModal((m) => m ? { ...m, project: updated } : m);
  };

  const noResults = myProjects.length === 0 && allProjects.length === 0;

  return (
    <div className="projects-page">
      {toast && <div className="proj-toast" style={{ background: toast.color }}>{toast.msg}</div>}

      {/* Header */}
      <div className="projects-header">
        <h1 className="projects-title">Projects</h1>
        <button className="new-project-btn" onClick={() => setModal({ type:"new" })}>
          <FiPlus size={16}/> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="projects-filters">
        <div className="type-tabs">
          {TYPES.map((t) => (
            <button key={t} className={`type-tab ${activeType === t ? "active" : ""}`} onClick={() => setActiveType(t)}>{t}</button>
          ))}
        </div>
        <select className="proj-filter-select" value={college} onChange={(e) => setCollege(e.target.value)}>
          {COLLEGES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="proj-filter-select" value={dept} onChange={(e) => setDept(e.target.value)}>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select className="proj-filter-select" value={year} onChange={(e) => setYear(e.target.value)}>
          {YEARS.map((y) => <option key={y}>{y}</option>)}
        </select>
        <div className="proj-search-bar">
          <FiSearch size={13} className="proj-search-icon"/>
          <input className="proj-search-input-bar" placeholder="Search by project or member..." value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {/* My Projects */}
      {myProjects.length > 0 && (
        <section className="projects-section">
          <h2 className="projects-section-title">My Projects <span className="proj-count">({myProjects.length})</span></h2>
          <div className="projects-grid">
            {myProjects.map((p) => (
              <ProjectCard key={p.id} project={p}
                onView={(proj) => setModal({ type:"view", project:proj })}
                onEdit={(proj) => setModal({ type:"edit", project:proj })}
                onDelete={(proj) => setModal({ type:"delete", project:proj })}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Projects */}
      {allProjects.length > 0 && (
        <section className="projects-section">
          <h2 className="projects-section-title">All Projects <span className="proj-count">({allProjects.length})</span></h2>
          <div className="projects-grid">
            {allProjects.map((p) => (
              <ProjectCard key={p.id} project={p}
                onView={(proj) => setModal({ type:"view", project:proj })}
                onEdit={(proj) => setModal({ type:"edit", project:proj })}
                onDelete={(proj) => setModal({ type:"delete", project:proj })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {noResults && search && (
        <div className="proj-empty">
          <div className="proj-empty-icon">🔍</div>
          <p>No projects match your search</p>
          <span>Try adjusting your filters or search query.</span>
        </div>
      )}
      {noResults && !search && (
        <div className="proj-empty">
          <div className="proj-empty-icon">📁</div>
          <p>You haven't created or joined any projects yet</p>
          <span>Start your first project or join with your peers.</span>
          <button className="new-project-btn" style={{ marginTop:"1rem" }} onClick={() => setModal({ type:"new" })}>
            <FiPlus size={14}/> New Project
          </button>
        </div>
      )}

      {/* Modals */}
      {(modal?.type === "new" || modal?.type === "edit") && (
        <ProjectFormModal
          initial={modal.type === "edit" ? modal.project : null}
          onClose={() => setModal(null)}
          onSave={saveProject}
        />
      )}
      {modal?.type === "view" && (
        <ViewModal
          project={modal.project}
          onClose={() => setModal(null)}
          onEdit={(proj) => setModal({ type:"edit", project:proj })}
          onUpdate={updateProject}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          project={modal.project}
          onClose={() => setModal(null)}
          onConfirm={deleteProject}
        />
      )}
    </div>
  );
}
