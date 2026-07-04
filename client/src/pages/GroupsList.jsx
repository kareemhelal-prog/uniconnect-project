import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import AcademicBackground from "../components/AcademicBackground";
import "../styles/GroupsList.css";

const getMe = () => { try { return JSON.parse(atob(localStorage.getItem("token").split(".")[1])); } catch { return null; } };

const GRADIENTS = [
  ["#3b82f6", "#6366f1"], ["#8b5cf6", "#ec4899"], ["#06b6d4", "#3b82f6"],
  ["#10b981", "#06b6d4"], ["#f59e0b", "#ef4444"], ["#ec4899", "#8b5cf6"],
  ["#14b8a6", "#22c55e"], ["#f43f5e", "#f59e0b"],
];
const gradientFor = (id) => GRADIENTS[Math.abs(Number(id)) % GRADIENTS.length];
const initials = (name = "") => name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

// "3:software,4:all" → [{year:"3",track:"software"},{year:"4",track:"all"}]
const parseAud = (s) => (!s ? [] : String(s).split(",").map(p => { const [year, track] = p.split(":"); return { year, track }; }));
const TR = { software: "Software", networks: "Networks", all: "" };
function audLabel(s) {
  const a = parseAud(s);
  if (a.length === 0) return "Everyone";
  return a.map(p => `Y${p.year}${p.track && p.track !== "all" ? ` ${TR[p.track]}` : ""}`).join(" · ");
}

const Icon = {
  users: (p) => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  search: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>),
  arrow: (p) => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>),
};

// Sections for the doctor/admin segmented view (a group appears in every
// section its audience covers).
const SECTIONS = [
  { key: "y1", label: "Year 1", match: a => a.some(p => p.year === "1") },
  { key: "y2", label: "Year 2", match: a => a.some(p => p.year === "2") },
  { key: "y3s", label: "Year 3 · Software", match: a => a.some(p => p.year === "3" && (p.track === "all" || p.track === "software")) },
  { key: "y3n", label: "Year 3 · Networks", match: a => a.some(p => p.year === "3" && (p.track === "all" || p.track === "networks")) },
  { key: "y4s", label: "Year 4 · Software", match: a => a.some(p => p.year === "4" && (p.track === "all" || p.track === "software")) },
  { key: "y4n", label: "Year 4 · Networks", match: a => a.some(p => p.year === "4" && (p.track === "all" || p.track === "networks")) },
  { key: "all", label: "Open to everyone", match: a => a.length === 0 },
];

function GroupCard({ group, onOpen, onJoin, joining }) {
  const [g1, g2] = gradientFor(group.id);
  return (
    <div className="group-card" style={{ "--g1": g1, "--g2": g2 }} onClick={() => onOpen(group.id)}>
      <div className="group-cover">
        {group.group_image && <img src={group.group_image} alt="" className="group-cover-img" onError={(e) => { e.target.style.display = "none"; }} />}
        <span className="group-cover-initials">{initials(group.name)}</span>
        <span className="group-aud-chip">{audLabel(group.audience)}</span>
      </div>
      <div className="group-content">
        <h2 className="group-name">{group.name}</h2>
        <p className="group-desc">{group.description}</p>
        <div className="group-meta"><Icon.users /> {Number(group.members_count || 0)} {Number(group.members_count) === 1 ? "member" : "members"}</div>
        {group.is_member ? (
          <button className="open-btn" onClick={(e) => { e.stopPropagation(); onOpen(group.id); }}>Open Group <Icon.arrow /></button>
        ) : (
          <button className="join-btn" onClick={(e) => onJoin(e, group)} disabled={joining === group.id}>{joining === group.id ? "Joining..." : "Join Group"}</button>
        )}
      </div>
    </div>
  );
}

const GroupsList = () => {
  const navigate = useNavigate();
  const me = getMe();
  const segmented = me?.role === "doctor" || me?.role === "admin";
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [joining, setJoining] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { document.title = "Groups | UniConnect"; fetchGroups(); }, []);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2600); };
  const fetchGroups = async () => { setLoading(true); try { const res = await API.get("/groups"); setGroups(res.data.data || []); } catch (e) { console.error(e); } finally { setLoading(false); } };

  const joinGroup = async (e, group) => {
    e.stopPropagation(); setJoining(group.id);
    try {
      await API.post("/groups/join", { group_id: group.id });
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, is_member: 1, members_count: Number(g.members_count || 0) + 1 } : g));
      showToast(`Joined "${group.name}"`);
    } catch (err) { showToast(err.response?.data?.message || "Something went wrong", "error"); }
    finally { setJoining(null); }
  };
  const openGroup = (id) => navigate(`/groups/${id}`);

  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    return (g.name || "").toLowerCase().includes(q) || (g.description || "").toLowerCase().includes(q);
  });
  const cardProps = { onOpen: openGroup, onJoin: joinGroup, joining };

  return (
    <div className="groups-page">
      <div className="groups-navbar-wrap"><Navbar /></div>
      <AcademicBackground />
      {toast && <div className={`groups-toast groups-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="groups-content">
        <div className="groups-header">
          <h1 className="groups-title">Student Groups</h1>
          <p className="groups-subtitle">
            {segmented ? "Browse student groups, organized by year and track." : "Explore communities, collaborate with students, and join groups that match your interests."}
          </p>
          <div className="groups-toolbar">
            <div className="groups-search">
              <span className="groups-search-icon"><Icon.search /></span>
              <input type="text" placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button className="groups-create-btn" onClick={() => navigate("/create-group")}>+ Create Group</button>
          </div>
        </div>

        {loading ? (
          <div className="groups-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="group-card group-skeleton"><div className="gs-cover" /><div className="group-content"><div className="gs-line gs-line-lg" /><div className="gs-line" /><div className="gs-line gs-line-sm" /></div></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="groups-empty">{search ? `No groups match "${search}"` : "No groups yet."}</div>
        ) : segmented ? (
          // Doctor / admin → grouped by cohort
          SECTIONS.map(sec => {
            const items = filtered.filter(g => sec.match(parseAud(g.audience)));
            if (items.length === 0) return null;
            return (
              <section key={sec.key} className="groups-section">
                <div className="groups-section-head"><h2>{sec.label}</h2><span className="groups-section-count">{items.length}</span></div>
                <div className="groups-grid">{items.map(g => <GroupCard key={g.id} group={g} {...cardProps} />)}</div>
              </section>
            );
          })
        ) : (
          // Students / investors → single grid (already cohort-filtered)
          <div className="groups-grid">{filtered.map(g => <GroupCard key={g.id} group={g} {...cardProps} />)}</div>
        )}
      </div>
    </div>
  );
};

export default GroupsList;
