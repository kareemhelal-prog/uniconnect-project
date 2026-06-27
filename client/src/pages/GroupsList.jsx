import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import AcademicBackground from "../components/AcademicBackground";
import "../styles/GroupsList.css";

// Deterministic gradient per group so every card has its own identity
const GRADIENTS = [
  ["#3b82f6", "#6366f1"], ["#8b5cf6", "#ec4899"], ["#06b6d4", "#3b82f6"],
  ["#10b981", "#06b6d4"], ["#f59e0b", "#ef4444"], ["#ec4899", "#8b5cf6"],
  ["#14b8a6", "#22c55e"], ["#f43f5e", "#f59e0b"],
];

const Icon = {
  users: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

const GroupsList = () => {
  const navigate = useNavigate();
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [joining, setJoining] = useState(null);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    document.title = "Groups | UniConnect";
    fetchGroups();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await API.get("/groups");
      setGroups(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (e, group) => {
    e.stopPropagation();
    setJoining(group.id);
    try {
      await API.post("/groups/join", { group_id: group.id });
      setGroups(prev => prev.map(g =>
        g.id === group.id
          ? { ...g, is_member: 1, members_count: Number(g.members_count || 0) + 1 }
          : g
      ));
      showToast(`Joined "${group.name}"`);
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setJoining(null);
    }
  };

  const openGroup = (id) => navigate(`/groups/${id}`);

  const initials = (name = "") =>
    name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const gradientFor = (id) => GRADIENTS[Math.abs(Number(id)) % GRADIENTS.length];

  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    return (g.name || "").toLowerCase().includes(q) ||
           (g.description || "").toLowerCase().includes(q);
  });

  return (
    <div className="groups-page">
      <div className="groups-navbar-wrap"><Navbar /></div>
      <AcademicBackground />

      {toast && <div className={`groups-toast groups-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="groups-content">
        <div className="groups-header">
          <h1 className="groups-title">Student Groups</h1>
          <p className="groups-subtitle">
            Explore communities, collaborate with students, and join groups that match your interests.
          </p>

          <div className="groups-search">
            <span className="groups-search-icon"><Icon.search /></span>
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="groups-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="group-card group-skeleton">
                <div className="gs-cover" />
                <div className="group-content">
                  <div className="gs-line gs-line-lg" />
                  <div className="gs-line" />
                  <div className="gs-line gs-line-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="groups-empty">
            {search ? `No groups match "${search}"` : "No groups yet."}
          </div>
        ) : (
          <div className="groups-grid">
            {filtered.map((group) => {
              const [g1, g2] = gradientFor(group.id);
              return (
                <div
                  key={group.id}
                  className="group-card"
                  style={{ "--g1": g1, "--g2": g2 }}
                  onClick={() => openGroup(group.id)}
                >
                  <div className="group-cover">
                    {group.group_image && (
                      <img
                        src={group.group_image}
                        alt=""
                        className="group-cover-img"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <span className="group-cover-initials">{initials(group.name)}</span>
                    {group.is_private ? <span className="group-badge">Private</span> : null}
                  </div>

                  <div className="group-content">
                    <h2 className="group-name">{group.name}</h2>
                    <p className="group-desc">{group.description}</p>

                    <div className="group-meta">
                      <Icon.users /> {Number(group.members_count || 0)} {Number(group.members_count) === 1 ? "member" : "members"}
                    </div>

                    {group.is_member ? (
                      <button className="open-btn" onClick={(e) => { e.stopPropagation(); openGroup(group.id); }}>
                        Open Group <Icon.arrow />
                      </button>
                    ) : (
                      <button
                        className="join-btn"
                        onClick={(e) => joinGroup(e, group)}
                        disabled={joining === group.id}
                      >
                        {joining === group.id ? "Joining..." : "Join Group"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsList;
