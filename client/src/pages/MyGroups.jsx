import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import AcademicBackground from "../components/AcademicBackground";
import "../styles/GroupsList.css";

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

const MyGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [leaving, setLeaving] = useState(null);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    document.title = "My Groups | UniConnect";
    fetchMyGroups();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const fetchMyGroups = async () => {
    setLoading(true);
    try {
      const res = await API.get("/groups/my-groups");
      setGroups(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async (e, group) => {
    e.stopPropagation();
    if (!window.confirm(`Leave "${group.name}"?`)) return;
    setLeaving(group.id);
    try {
      await API.delete("/groups/leave", { data: { group_id: group.id } });
      setGroups(prev => prev.filter(g => g.id !== group.id));
      showToast(`Left "${group.name}"`);
    } catch (err) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setLeaving(null);
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
          <h1 className="groups-title">My Groups</h1>
          <p className="groups-subtitle">
            The communities you've joined. Open a group to share notes and chat, or leave anytime.
          </p>

          {groups.length > 0 && (
            <div className="groups-search">
              <span className="groups-search-icon"><Icon.search /></span>
              <input
                type="text"
                placeholder="Search your groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="groups-grid">
            {[1, 2, 3].map(i => (
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
        ) : groups.length === 0 ? (
          <div className="groups-empty groups-empty-cta">
            <h2>No groups joined yet</h2>
            <p>Discover communities and join the ones that match your interests.</p>
            <button className="browse-groups-btn" onClick={() => navigate("/groups")}>
              Browse Groups <Icon.arrow />
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="groups-empty">No groups match "{search}"</div>
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

                    <div className="group-actions">
                      <button className="open-btn" onClick={(e) => { e.stopPropagation(); openGroup(group.id); }}>
                        Open <Icon.arrow />
                      </button>
                      <button
                        className="leave-btn"
                        onClick={(e) => leaveGroup(e, group)}
                        disabled={leaving === group.id}
                      >
                        {leaving === group.id ? "..." : "Leave"}
                      </button>
                    </div>
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

export default MyGroups;
