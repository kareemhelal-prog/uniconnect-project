import React, { useState } from "react";
import "../styles/ProjectsPage.css";
import { FiSearch, FiX, FiUsers, FiUser, FiPlus } from "react-icons/fi";
import { MdOutlineSchool, MdOutlineCategory } from "react-icons/md";

const COLLEGES = [
  "All Colleges",
  "Faculty of Engineering",
  "Faculty of Computing",
  "Faculty of Arts",
];
const DEPARTMENTS = [
  "All Departments",
  "Computer Science",
  "Electrical Engineering",
  "Software Engineering",
  "Information Technology",
  "Psychology",
];
const YEARS = ["All Academic Years", "Year 1", "Year 2", "Year 3", "Year 4"];
const TYPES = ["All", "Graduation", "Research", "Academic"];

const TYPE_COLORS = {
  Graduation: {
    bg: "rgba(168,85,247,0.15)",
    color: "#a855f7",
    border: "rgba(168,85,247,0.3)",
  },
  Research: {
    bg: "rgba(0,229,255,0.12)",
    color: "#00e5ff",
    border: "rgba(0,229,255,0.3)",
  },
  Academic: {
    bg: "rgba(34,197,94,0.12)",
    color: "#22c55e",
    border: "rgba(34,197,94,0.3)",
  },
};

const STATUS_COLORS = {
  Active: { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  Completed: { color: "#64748b", bg: "rgba(100,116,139,0.1)" },
};

const AVATAR_COLORS = [
  "#a855f7",
  "#00e5ff",
  "#f87171",
  "#fbbf24",
  "#34d399",
  "#60a5fa",
];

// ── بيانات فاضية — الجمعة يجيبها من الـ backend ──
const MY_PROJECTS = [];
const ALL_PROJECTS = [];

const AvatarStack = ({ count }) => {
  const shown = Math.min(count, 3);
  return (
    <div className="proj-avatars">
      {Array.from({ length: shown }).map((_, i) => (
        <div
          key={i}
          className="proj-avatar"
          style={{
            background: AVATAR_COLORS[i % AVATAR_COLORS.length],
            zIndex: shown - i,
          }}
        />
      ))}
      {count > 3 && (
        <div className="proj-avatar proj-avatar-more">+{count - 3}</div>
      )}
    </div>
  );
};

const ProjectCard = ({ project }) => {
  const typeStyle = TYPE_COLORS[project.type] || {};
  const statusStyle = STATUS_COLORS[project.status] || {};
  const isSolo = project.members === 1;

  return (
    <div className="proj-card">
      <div className="proj-card-top">
        <h4 className="proj-card-title">{project.title}</h4>
        <span
          className="proj-type-badge"
          style={{
            background: typeStyle.bg,
            color: typeStyle.color,
            border: `1px solid ${typeStyle.border}`,
          }}
        >
          {project.type}
        </span>
      </div>

      <div className="proj-members-row">
        {isSolo ? (
          <span className="proj-solo">
            <FiUser size={12} /> Solo
          </span>
        ) : (
          <AvatarStack count={project.members} />
        )}
      </div>

      <div className="proj-meta">
        <span className="proj-meta-item">
          <MdOutlineSchool size={13} /> {project.college}
        </span>
        <span className="proj-meta-item">
          <MdOutlineCategory size={13} /> {project.dept}
        </span>
      </div>

      <div className="proj-card-footer">
        <span
          className="proj-status"
          style={{ color: statusStyle.color, background: statusStyle.bg }}
        >
          <span
            className="proj-status-dot"
            style={{ background: statusStyle.color }}
          />
          {project.status}
        </span>
        <button
          className="proj-view-btn"
          style={{ borderColor: typeStyle.border, color: typeStyle.color }}
        >
          View
        </button>
      </div>
    </div>
  );
};

const NewProjectModal = ({ onClose }) => {
  const [projType, setProjType] = useState("Solo");
  const [memberSearch, setMemberSearch] = useState("");

  // الجمعة يجيب الـ suggested members من الـ backend
  const SUGGESTED = [];

  return (
    <div
      className="proj-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="proj-modal">
        <div className="proj-modal-header">
          <h3>New Project</h3>
          <button className="proj-modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="proj-modal-body">
          <label className="proj-modal-label">Project Name</label>
          <input
            className="proj-modal-input"
            placeholder="Enter project name"
          />

          <label className="proj-modal-label">Project Type</label>
          <select className="proj-modal-select">
            <option value="">Select project type</option>
            <option>Graduation</option>
            <option>Research</option>
            <option>Academic</option>
          </select>

          <label className="proj-modal-label">Short Description</label>
          <textarea
            className="proj-modal-textarea"
            placeholder="Briefly describe your project..."
          />
          <div className="proj-modal-char">0/300</div>

          <label className="proj-modal-label">Project Mode</label>
          <div className="proj-type-toggle">
            {["Solo", "Team"].map((t) => (
              <button
                key={t}
                className={`proj-type-btn ${projType === t ? "active" : ""}`}
                onClick={() => setProjType(t)}
              >
                {t === "Solo" ? <FiUser size={14} /> : <FiUsers size={14} />}{" "}
                {t}
              </button>
            ))}
          </div>

          {projType === "Team" && (
            <>
              <label className="proj-modal-label">Invite Members</label>
              <div className="proj-search-wrap">
                <FiSearch size={13} className="proj-search-icon" />
                <input
                  className="proj-modal-input proj-search-input"
                  placeholder="Search by name or username..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
              <div className="proj-members-list">
                {SUGGESTED.length === 0 && (
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "12px",
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    ابدأ اكتب اسم عشان تدور على members
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="proj-modal-footer">
          <button className="proj-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="proj-modal-create">Create</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Props:
 *   myProjects:  [] — الجمعة يبعتها من الـ backend (بروجكتات المستخدم)
 *   allProjects: [] — الجمعة يبعتها من الـ backend (كل البروجكتات)
 */
export default function ProjectsPage({
  myProjects = MY_PROJECTS,
  allProjects = ALL_PROJECTS,
}) {
  const [activeType, setActiveType] = useState("All");
  const [college, setCollege] = useState("All Colleges");
  const [dept, setDept] = useState("All Departments");
  const [year, setYear] = useState("All Academic Years");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filter = (list) =>
    list.filter((p) => {
      const matchType = activeType === "All" || p.type === activeType;
      const matchCollege = college === "All Colleges" || p.college === college;
      const matchDept = dept === "All Departments" || p.dept === dept;
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
      return matchType && matchCollege && matchDept && matchSearch;
    });

  const filteredMy = filter(myProjects);
  const filteredAll = filter(allProjects);
  const noResults = filteredMy.length === 0 && filteredAll.length === 0;

  return (
    <div className="projects-page">
      {/* ── Header ── */}
      <div className="projects-header">
        <h1 className="projects-title">Projects</h1>
        <button className="new-project-btn" onClick={() => setShowModal(true)}>
          <FiPlus size={16} /> New Project
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="projects-filters">
        <div className="type-tabs">
          {TYPES.map((t) => (
            <button
              key={t}
              className={`type-tab ${activeType === t ? "active" : ""}`}
              onClick={() => setActiveType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <select
          className="proj-filter-select"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
        >
          {COLLEGES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          className="proj-filter-select"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <select
          className="proj-filter-select"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          {YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        <div className="proj-search-bar">
          <FiSearch size={13} className="proj-search-icon" />
          <input
            className="proj-search-input-bar"
            placeholder="Search by project or member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── My Projects ── */}
      {filteredMy.length > 0 && (
        <section className="projects-section">
          <h2 className="projects-section-title">
            My Projects{" "}
            <span className="proj-count">({filteredMy.length})</span>
          </h2>
          <div className="projects-grid">
            {filteredMy.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── All Projects ── */}
      {filteredAll.length > 0 && (
        <section className="projects-section">
          <h2 className="projects-section-title">
            All Projects{" "}
            <span className="proj-count">({filteredAll.length})</span>
          </h2>
          <div className="projects-grid">
            {filteredAll.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty States ── */}
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
          <button
            className="new-project-btn"
            style={{ marginTop: "1rem" }}
            onClick={() => setShowModal(true)}
          >
            <FiPlus size={14} /> New Project
          </button>
        </div>
      )}

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
