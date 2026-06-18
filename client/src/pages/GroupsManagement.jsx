import React, { useState, useMemo } from "react";
import "../styles/GroupsManagement.css";

/* ═══════════════════════════════════════════
   DUMMY DATA
═══════════════════════════════════════════ */
const ALL_GROUPS = [
  {
    id: 1,
    name: "Data Structures & Algorithms",
    short: "DSA",
    subject: "DSA",
    icon: "DSA",
    iconBg: "linear-gradient(135deg,#1e40af,#3b82f6)",
    creator: "John Doe",
    creatorAvatar: "J",
    creatorColor: "linear-gradient(135deg,#3b82f6,#60a5fa)",
    members: 42,
    type: "Subject Groups",
    year: "2nd Year",
    date: "May 20, 2024",
    description: "A collaborative group for 2nd year students to discuss and learn Data Structures & Algorithms.",
    membersList: [
      { id:1, name:"John Doe",      role:"Creator", year:"2nd Year", avatar:"J", color:"linear-gradient(135deg,#3b82f6,#60a5fa)" },
      { id:2, name:"Jane Smith",    role:"Admin",   year:"2nd Year", avatar:"J", color:"linear-gradient(135deg,#f472b6,#ec4899)" },
      { id:3, name:"Michael Lee",   role:"Member",  year:"2nd Year", avatar:"M", color:"linear-gradient(135deg,#34d399,#059669)" },
      { id:4, name:"Emily Davis",   role:"Member",  year:"2nd Year", avatar:"E", color:"linear-gradient(135deg,#fbbf24,#d97706)" },
      { id:5, name:"Chris Brown",   role:"Member",  year:"2nd Year", avatar:"C", color:"linear-gradient(135deg,#a78bfa,#7c3aed)" },
      { id:6, name:"Kareem Mohamed",role:"Member",  year:"2nd Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
    ],
  },
  {
    id: 2,
    name: "Physics Study Circle",
    short: "PHY",
    subject: "Physics",
    icon: "⚛",
    iconBg: "linear-gradient(135deg,#7c3aed,#a855f7)",
    creator: "Jane Smith",
    creatorAvatar: "J",
    creatorColor: "linear-gradient(135deg,#f472b6,#ec4899)",
    members: 36,
    type: "Subject Groups",
    year: "1st Year",
    date: "May 18, 2024",
    description: "A study group dedicated to Physics fundamentals for 1st year students at BATU.",
    membersList: [
      { id:1, name:"Jane Smith",    role:"Creator", year:"1st Year", avatar:"J", color:"linear-gradient(135deg,#f472b6,#ec4899)" },
      { id:2, name:"Kareem Mohamed",role:"Admin",   year:"1st Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
      { id:3, name:"Sara Khan",     role:"Member",  year:"1st Year", avatar:"S", color:"linear-gradient(135deg,#fb923c,#f43f5e)" },
      { id:4, name:"Omar Hassan",   role:"Member",  year:"1st Year", avatar:"O", color:"linear-gradient(135deg,#38bdf8,#0ea5e9)" },
    ],
  },
  {
    id: 3,
    name: "Web Development Club",
    short: "</>",
    subject: "Coding",
    icon: "</>",
    iconBg: "linear-gradient(135deg,#065f46,#10b981)",
    creator: "Michael Lee",
    creatorAvatar: "M",
    creatorColor: "linear-gradient(135deg,#34d399,#059669)",
    members: 58,
    type: "Other Groups",
    year: "All Years",
    date: "May 15, 2024",
    description: "Open to all students passionate about web technologies — HTML, CSS, React, Node.js and beyond.",
    membersList: [
      { id:1, name:"Michael Lee",   role:"Creator", year:"3rd Year", avatar:"M", color:"linear-gradient(135deg,#34d399,#059669)" },
      { id:2, name:"Kareem Mohamed",role:"Admin",   year:"2nd Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
      { id:3, name:"Arjun Patel",   role:"Member",  year:"1st Year", avatar:"A", color:"linear-gradient(135deg,#3b82f6,#60a5fa)" },
      { id:4, name:"Emily Davis",   role:"Member",  year:"4th Year", avatar:"E", color:"linear-gradient(135deg,#fbbf24,#d97706)" },
      { id:5, name:"Nour El-Din",   role:"Member",  year:"2nd Year", avatar:"N", color:"linear-gradient(135deg,#c084fc,#9333ea)" },
    ],
  },
  {
    id: 4,
    name: "Mathematics Forum",
    short: "∑",
    subject: "Math",
    icon: "∑",
    iconBg: "linear-gradient(135deg,#1e40af,#4338ca)",
    creator: "Emily Davis",
    creatorAvatar: "E",
    creatorColor: "linear-gradient(135deg,#fbbf24,#d97706)",
    members: 29,
    type: "Subject Groups",
    year: "3rd Year",
    date: "May 12, 2024",
    description: "Deep dives into advanced mathematics topics for 3rd year engineering students.",
    membersList: [
      { id:1, name:"Emily Davis",   role:"Creator", year:"3rd Year", avatar:"E", color:"linear-gradient(135deg,#fbbf24,#d97706)" },
      { id:2, name:"David Chen",    role:"Admin",   year:"3rd Year", avatar:"D", color:"linear-gradient(135deg,#34d399,#059669)" },
      { id:3, name:"Kareem Mohamed",role:"Member",  year:"3rd Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
    ],
  },
  {
    id: 5,
    name: "Photography Society",
    short: "📷",
    subject: "Arts",
    icon: "📷",
    iconBg: "linear-gradient(135deg,#92400e,#f59e0b)",
    creator: "Chris Brown",
    creatorAvatar: "C",
    creatorColor: "linear-gradient(135deg,#a78bfa,#7c3aed)",
    members: 24,
    type: "Other Groups",
    year: "All Years",
    date: "May 10, 2024",
    description: "For students who love photography, visual arts, and creative expression through the lens.",
    membersList: [
      { id:1, name:"Chris Brown",   role:"Creator", year:"2nd Year", avatar:"C", color:"linear-gradient(135deg,#a78bfa,#7c3aed)" },
      { id:2, name:"Mei Lin",       role:"Admin",   year:"1st Year", avatar:"M", color:"linear-gradient(135deg,#f472b6,#ec4899)" },
      { id:3, name:"Kareem Mohamed",role:"Member",  year:"2nd Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
    ],
  },
  {
    id: 6,
    name: "Environmental Club",
    short: "🌿",
    subject: "Science",
    icon: "🌿",
    iconBg: "linear-gradient(135deg,#065f46,#22c55e)",
    creator: "Sophia Wilson",
    creatorAvatar: "S",
    creatorColor: "linear-gradient(135deg,#34d399,#059669)",
    members: 31,
    type: "Other Groups",
    year: "All Years",
    date: "May 8, 2024",
    description: "Raising awareness about environmental sustainability and green initiatives on campus.",
    membersList: [
      { id:1, name:"Sophia Wilson",  role:"Creator", year:"4th Year", avatar:"S", color:"linear-gradient(135deg,#34d399,#059669)" },
      { id:2, name:"Kareem Mohamed", role:"Member",  year:"2nd Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
      { id:3, name:"Liam O'Connor",  role:"Member",  year:"3rd Year", avatar:"L", color:"linear-gradient(135deg,#a78bfa,#7c3aed)" },
    ],
  },
  {
    id: 7,
    name: "AI Research Group",
    short: "AI",
    subject: "AI",
    icon: "🤖",
    iconBg: "linear-gradient(135deg,#4c1d95,#7c3aed)",
    creator: "Kareem Mohamed",
    creatorAvatar: "K",
    creatorColor: "linear-gradient(135deg,#00e5ff,#a855f7)",
    members: 47,
    type: "Subject Groups",
    year: "4th Year",
    date: "May 5, 2024",
    description: "Exploring AI, machine learning, and deep learning research — led by BATU's top IT students.",
    membersList: [
      { id:1, name:"Kareem Mohamed", role:"Creator", year:"4th Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
      { id:2, name:"Arjun Patel",    role:"Admin",   year:"4th Year", avatar:"A", color:"linear-gradient(135deg,#3b82f6,#60a5fa)" },
      { id:3, name:"Sara Khan",      role:"Member",  year:"4th Year", avatar:"S", color:"linear-gradient(135deg,#fb923c,#f43f5e)" },
      { id:4, name:"David Chen",     role:"Member",  year:"4th Year", avatar:"D", color:"linear-gradient(135deg,#34d399,#059669)" },
      { id:5, name:"Nour El-Din",    role:"Member",  year:"3rd Year", avatar:"N", color:"linear-gradient(135deg,#c084fc,#9333ea)" },
    ],
  },
  {
    id: 8,
    name: "Frontend Workshop",
    short: "FE",
    subject: "Coding",
    icon: "🎨",
    iconBg: "linear-gradient(135deg,#be123c,#f43f5e)",
    creator: "Kareem Mohamed",
    creatorAvatar: "K",
    creatorColor: "linear-gradient(135deg,#00e5ff,#a855f7)",
    members: 33,
    type: "Other Groups",
    year: "All Years",
    date: "Apr 28, 2024",
    description: "A hands-on workshop for frontend developers — React, CSS, UI/UX design and more.",
    membersList: [
      { id:1, name:"Kareem Mohamed", role:"Creator", year:"2nd Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
      { id:2, name:"Mei Lin",        role:"Admin",   year:"1st Year", avatar:"M", color:"linear-gradient(135deg,#f472b6,#ec4899)" },
      { id:3, name:"Omar Hassan",    role:"Member",  year:"2nd Year", avatar:"O", color:"linear-gradient(135deg,#38bdf8,#0ea5e9)" },
    ],
  },
  {
    id: 9,
    name: "Smart Waste Bin Project",
    short: "♻",
    subject: "Engineering",
    icon: "♻️",
    iconBg: "linear-gradient(135deg,#064e3b,#10b981)",
    creator: "Kareem Mohamed",
    creatorAvatar: "K",
    creatorColor: "linear-gradient(135deg,#00e5ff,#a855f7)",
    members: 12,
    type: "Other Groups",
    year: "All Years",
    date: "Apr 20, 2024",
    description: "Graduation project group working on an IoT-powered smart waste management solution.",
    membersList: [
      { id:1, name:"Kareem Mohamed", role:"Creator", year:"2nd Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
      { id:2, name:"Emily Davis",    role:"Admin",   year:"2nd Year", avatar:"E", color:"linear-gradient(135deg,#fbbf24,#d97706)" },
      { id:3, name:"Chris Brown",    role:"Member",  year:"2nd Year", avatar:"C", color:"linear-gradient(135deg,#a78bfa,#7c3aed)" },
      { id:4, name:"Sophia Wilson",  role:"Member",  year:"2nd Year", avatar:"S", color:"linear-gradient(135deg,#34d399,#059669)" },
    ],
  },
  {
    id: 10,
    name: "Cybersecurity Club",
    short: "🔐",
    subject: "Security",
    icon: "🔐",
    iconBg: "linear-gradient(135deg,#1e3a8a,#2563eb)",
    creator: "Nour El-Din",
    creatorAvatar: "N",
    creatorColor: "linear-gradient(135deg,#c084fc,#9333ea)",
    members: 19,
    type: "Subject Groups",
    year: "3rd Year",
    date: "Apr 15, 2024",
    description: "Ethical hacking, network security, cryptography — for serious 3rd year security students.",
    membersList: [
      { id:1, name:"Nour El-Din",    role:"Creator", year:"3rd Year", avatar:"N", color:"linear-gradient(135deg,#c084fc,#9333ea)" },
      { id:2, name:"Kareem Mohamed", role:"Member",  year:"3rd Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
    ],
  },
  {
    id: 11,
    name: "Database Systems Group",
    short: "DB",
    subject: "CS",
    icon: "🗄",
    iconBg: "linear-gradient(135deg,#92400e,#d97706)",
    creator: "David Chen",
    creatorAvatar: "D",
    creatorColor: "linear-gradient(135deg,#34d399,#059669)",
    members: 22,
    type: "Subject Groups",
    year: "2nd Year",
    date: "Apr 10, 2024",
    description: "SQL, NoSQL, data modeling and optimization for 2nd year CS students.",
    membersList: [
      { id:1, name:"David Chen",     role:"Creator", year:"2nd Year", avatar:"D", color:"linear-gradient(135deg,#34d399,#059669)" },
      { id:2, name:"Kareem Mohamed", role:"Member",  year:"2nd Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
      { id:3, name:"Jane Smith",     role:"Member",  year:"2nd Year", avatar:"J", color:"linear-gradient(135deg,#f472b6,#ec4899)" },
    ],
  },
  {
    id: 12,
    name: "Robotics & IoT Team",
    short: "🤖",
    subject: "Engineering",
    icon: "⚙️",
    iconBg: "linear-gradient(135deg,#334155,#64748b)",
    creator: "Arjun Patel",
    creatorAvatar: "A",
    creatorColor: "linear-gradient(135deg,#3b82f6,#60a5fa)",
    members: 15,
    type: "Other Groups",
    year: "All Years",
    date: "Apr 1, 2024",
    description: "Building robots and IoT solutions for real-world problems — open to all years.",
    membersList: [
      { id:1, name:"Arjun Patel",    role:"Creator", year:"3rd Year", avatar:"A", color:"linear-gradient(135deg,#3b82f6,#60a5fa)" },
      { id:2, name:"Kareem Mohamed", role:"Member",  year:"2nd Year", avatar:"K", color:"linear-gradient(135deg,#00e5ff,#a855f7)" },
      { id:3, name:"Sara Khan",      role:"Member",  year:"1st Year", avatar:"S", color:"linear-gradient(135deg,#fb923c,#f43f5e)" },
    ],
  },
];

const YEAR_OPTIONS = ["All", "1st Year", "2nd Year", "3rd Year", "4th Year"];
const TYPE_OPTIONS = ["All", "Subject Groups", "Other Groups"];
const ROWS_OPTIONS = [10, 25, 50, 100];

/* ── Avatar ── */
function Avatar({ letter, color, size = 36 }) {
  return (
    <div className="gm-avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}>
      {letter}
    </div>
  );
}

/* ── Year Badge ── */
function YearBadge({ year }) {
  const cls =
    year === "1st Year" ? "badge-year1" :
    year === "2nd Year" ? "badge-year2" :
    year === "3rd Year" ? "badge-year3" :
    year === "4th Year" ? "badge-year4" : "badge-yearall";
  return <span className={`gm-year-badge ${cls}`}>{year}</span>;
}

/* ── Type Badge ── */
function TypeBadge({ type }) {
  return (
    <span className={`gm-type-badge ${type === "Subject Groups" ? "badge-subject" : "badge-other"}`}>
      {type}
    </span>
  );
}

/* ── Role Badge ── */
function RoleBadge({ role }) {
  const cls = role === "Creator" ? "badge-creator" : role === "Admin" ? "badge-admin" : "badge-member";
  return <span className={`gm-role-badge ${cls}`}>{role}</span>;
}

/* ── Toast ── */
function Toast({ msg, onDone }) {
  React.useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return <div className="gm-toast">✅ {msg}</div>;
}

/* ── Confirm Dialog ── */
function ConfirmDialog({ group, onConfirm, onCancel }) {
  return (
    <div className="gm-overlay" onClick={onCancel}>
      <div className="gm-confirm" onClick={e => e.stopPropagation()}>
        <div className="gm-confirm-icon">🗑️</div>
        <h3>Delete Group</h3>
        <p>Are you sure you want to delete <strong>"{group.name}"</strong>?<br />This action cannot be undone.</p>
        <div className="gm-confirm-btns">
          <button className="gm-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="gm-btn-delete-confirm" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Members Panel ── */
function MembersPanel({ group, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = group.membersList.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="gm-members-panel">
      <div className="gm-members-head">
        <h3>Members ({group.members})</h3>
        <button className="gm-x-btn" onClick={onClose}>✕</button>
      </div>
      <div className="gm-members-search-wrap">
        <span className="gm-ms-icon">🔍</span>
        <input
          className="gm-members-search"
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="gm-members-list">
        {filtered.map(m => (
          <div key={m.id} className="gm-member-row">
            <Avatar letter={m.avatar} color={m.color} size={38} />
            <span className="gm-member-name">{m.name}</span>
            <RoleBadge role={m.role} />
            <YearBadge year={m.year} />
          </div>
        ))}
        {filtered.length === 0 && <p className="gm-no-results">No members found</p>}
      </div>
    </div>
  );
}

/* ── View Modal ── */
function ViewModal({ group, onClose }) {
  const [showMembers, setShowMembers] = useState(false);
  return (
    <div className="gm-overlay" onClick={onClose}>
      <div className="gm-modal-wrap" onClick={e => e.stopPropagation()}>
        {/* Group Detail Modal */}
        <div className="gm-modal">
          {/* Header */}
          <div className="gm-modal-header">
            <div className="gm-modal-icon" style={{ background: group.iconBg }}>
              <span>{group.icon}</span>
            </div>
            <div className="gm-modal-title-area">
              <div className="gm-modal-title-row">
                <h2 className="gm-modal-title">{group.name}</h2>
                <TypeBadge type={group.type} />
              </div>
            </div>
            <button className="gm-x-btn" onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div className="gm-modal-body">
            <div className="gm-modal-row">
              <span className="gm-modal-key">👤 Created by</span>
              <div className="gm-modal-creator">
                <Avatar letter={group.creatorAvatar} color={group.creatorColor} size={28} />
                <span>{group.creator}</span>
              </div>
            </div>
            <div className="gm-modal-row">
              <span className="gm-modal-key">📅 Academic Year</span>
              <YearBadge year={group.year} />
            </div>
            <div className="gm-modal-row">
              <span className="gm-modal-key">👥 Members</span>
              <span className="gm-modal-val">👥 {group.members}</span>
            </div>
            <div className="gm-modal-row">
              <span className="gm-modal-key">📆 Created on</span>
              <span className="gm-modal-val">📅 {group.date}</span>
            </div>
            <div className="gm-modal-row gm-modal-desc-row">
              <span className="gm-modal-key">📋 Description</span>
              <span className="gm-modal-desc">{group.description}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="gm-modal-footer">
            <button
              className={`gm-members-btn ${showMembers ? "active" : ""}`}
              onClick={() => setShowMembers(v => !v)}
            >
              👥 Members ({group.members})
            </button>
            <button className="gm-btn-close-modal" onClick={onClose}>Close</button>
          </div>
        </div>

        {/* Members Panel — slides in */}
        {showMembers && (
          <MembersPanel group={group} onClose={() => setShowMembers(false)} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function GroupsManagement() {
  const [groups,      setGroups]      = useState(ALL_GROUPS);
  const [search,      setSearch]      = useState("");
  const [yearFilter,  setYearFilter]  = useState("All");
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewGroup,   setViewGroup]   = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [toast,       setToast]       = useState(null);
  const [showYearDD,  setShowYearDD]  = useState(false);
  const [showTypeDD,  setShowTypeDD]  = useState(false);
  const [showRowsDD,  setShowRowsDD]  = useState(false);

  /* filtered */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter(g => {
      const matchSearch = !q || g.name.toLowerCase().includes(q) || g.creator.toLowerCase().includes(q);
      const matchYear   = yearFilter === "All" || g.year === yearFilter || (yearFilter !== "All" && g.year === "All Years");
      const matchType   = typeFilter === "All" || g.type === typeFilter;
      return matchSearch && matchYear && matchType;
    });
  }, [groups, search, yearFilter, typeFilter]);

  /* pagination */
  const totalPages  = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage    = Math.min(currentPage, totalPages);
  const pageData    = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const goPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  /* page numbers */
  const pageNums = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3) return [1, 2, 3, "...", totalPages];
    if (safePage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", safePage, "...", totalPages];
  }, [totalPages, safePage]);

  /* delete */
  const handleDelete = () => {
    setGroups(prev => prev.filter(g => g.id !== confirmDel.id));
    setToast("Group deleted successfully");
    setConfirmDel(null);
    setCurrentPage(1);
  };

  /* close dropdowns on outside click */
  const closeDropdowns = () => { setShowYearDD(false); setShowTypeDD(false); setShowRowsDD(false); };

  return (
    <div className="gm-page" onClick={closeDropdowns}>
      {/* BG blobs */}
      <div className="gm-blob gm-blob1" />
      <div className="gm-blob gm-blob2" />

      <div className="gm-inner">
        {/* ── Header ── */}
        <div className="gm-page-header">
          <h1 className="gm-page-title">Groups Management</h1>
          <div className="gm-header-actions">
            <button className="gm-icon-btn" title="Dark Mode">🌙</button>
            <button className="gm-icon-btn gm-notif-btn" title="Notifications">
              🔔 <span className="gm-notif-badge">5</span>
            </button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="gm-toolbar">
          {/* Search */}
          <div className="gm-search-wrap">
            <span className="gm-search-ico">🔍</span>
            <input
              className="gm-search-input"
              placeholder="Search group name, creator..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
            {search && <button className="gm-search-clear" onClick={() => setSearch("")}>✕</button>}
          </div>

          <div className="gm-filters">
            {/* Academic Year */}
            <div className="gm-filter-group">
              <span className="gm-filter-label">Academic Year</span>
              <div className="gm-dropdown-wrap" onClick={e => e.stopPropagation()}>
                <button
                  className={`gm-dropdown-btn ${showYearDD ? "open" : ""}`}
                  onClick={() => { setShowYearDD(v => !v); setShowTypeDD(false); setShowRowsDD(false); }}
                >
                  {yearFilter} <span className="gm-chevron">{showYearDD ? "▲" : "▼"}</span>
                </button>
                {showYearDD && (
                  <div className="gm-dropdown-menu">
                    {YEAR_OPTIONS.map(y => (
                      <div
                        key={y}
                        className={`gm-dropdown-item ${yearFilter === y ? "active" : ""}`}
                        onClick={() => { setYearFilter(y); setShowYearDD(false); setCurrentPage(1); }}
                      >{y}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Type */}
            <div className="gm-filter-group">
              <span className="gm-filter-label">Type</span>
              <div className="gm-dropdown-wrap" onClick={e => e.stopPropagation()}>
                <button
                  className={`gm-dropdown-btn ${showTypeDD ? "open" : ""}`}
                  onClick={() => { setShowTypeDD(v => !v); setShowYearDD(false); setShowRowsDD(false); }}
                >
                  {typeFilter} <span className="gm-chevron">{showTypeDD ? "▲" : "▼"}</span>
                </button>
                {showTypeDD && (
                  <div className="gm-dropdown-menu">
                    {TYPE_OPTIONS.map(t => (
                      <div
                        key={t}
                        className={`gm-dropdown-item ${typeFilter === t ? "active" : ""}`}
                        onClick={() => { setTypeFilter(t); setShowTypeDD(false); setCurrentPage(1); }}
                      >{t}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="gm-table-panel">
          <div className="gm-table-wrap">
            <table className="gm-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Creator</th>
                  <th>Members</th>
                  <th>Type</th>
                  <th>Year</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 && (
                  <tr><td colSpan={7} className="gm-empty-row">No groups found</td></tr>
                )}
                {pageData.map(group => (
                  <tr key={group.id} className="gm-table-row">
                    {/* Group */}
                    <td>
                      <div className="gm-group-cell">
                        <div className="gm-group-icon" style={{ background: group.iconBg }}>
                          <span>{group.icon}</span>
                        </div>
                        <div>
                          <div className="gm-group-name">{group.name}</div>
                          <div className="gm-group-sub">{group.subject} • {group.year}</div>
                        </div>
                      </div>
                    </td>
                    {/* Creator */}
                    <td>
                      <div className="gm-creator-cell">
                        <Avatar letter={group.creatorAvatar} color={group.creatorColor} size={34} />
                        <span className="gm-creator-name">{group.creator}</span>
                      </div>
                    </td>
                    {/* Members */}
                    <td><span className="gm-members-count">👥 {group.members}</span></td>
                    {/* Type */}
                    <td><TypeBadge type={group.type} /></td>
                    {/* Year */}
                    <td><YearBadge year={group.year} /></td>
                    {/* Date */}
                    <td className="gm-date-cell">{group.date}</td>
                    {/* Actions */}
                    <td>
                      <div className="gm-actions">
                        <button
                          className="gm-view-btn"
                          onClick={() => setViewGroup(group)}
                        >👁 View</button>
                        <button
                          className="gm-delete-btn"
                          onClick={() => setConfirmDel(group)}
                        >🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Footer: rows per page + pagination ── */}
          <div className="gm-table-footer">
            {/* Rows per page */}
            <div className="gm-rows-wrap" onClick={e => e.stopPropagation()}>
              <span className="gm-rows-label">Rows per page:</span>
              <div className="gm-dropdown-wrap">
                <button
                  className={`gm-dropdown-btn gm-rows-btn ${showRowsDD ? "open" : ""}`}
                  onClick={() => { setShowRowsDD(v => !v); setShowYearDD(false); setShowTypeDD(false); }}
                >
                  {rowsPerPage} <span className="gm-chevron">{showRowsDD ? "▲" : "▼"}</span>
                </button>
                {showRowsDD && (
                  <div className="gm-dropdown-menu gm-rows-menu">
                    {ROWS_OPTIONS.map(r => (
                      <div
                        key={r}
                        className={`gm-dropdown-item ${rowsPerPage === r ? "active" : ""}`}
                        onClick={() => { setRowsPerPage(r); setShowRowsDD(false); setCurrentPage(1); }}
                      >{r}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            <div className="gm-pagination">
              <button
                className="gm-page-nav"
                disabled={safePage === 1}
                onClick={() => goPage(safePage - 1)}
              >‹ Previous</button>

              {pageNums.map((p, i) =>
                p === "..." ? (
                  <span key={i} className="gm-page-dots">…</span>
                ) : (
                  <button
                    key={i}
                    className={`gm-page-num ${safePage === p ? "active" : ""}`}
                    onClick={() => goPage(p)}
                  >{p}</button>
                )
              )}

              <button
                className="gm-page-nav"
                disabled={safePage === totalPages}
                onClick={() => goPage(safePage + 1)}
              >Next ›</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── View Modal ── */}
      {viewGroup && (
        <ViewModal group={viewGroup} onClose={() => setViewGroup(null)} />
      )}

      {/* ── Confirm Delete ── */}
      {confirmDel && (
        <ConfirmDialog
          group={confirmDel}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
