import { useState, useEffect, useMemo, useCallback } from "react";
import { FiSearch, FiRefreshCw, FiGlobe, FiInbox } from "react-icons/fi";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import "../styles/AdminFeed.css";

// Keep every raw field so PostCard can read user_id, profile_picture, role,
// liked, nested comments, etc. — we only add a couple of derived helpers.
const mapPost = (p) => ({
  ...p,
  author: p.name || p.user?.name || "Unknown",
  time: new Date(p.created_at).toLocaleString(),
  title: p.title || "",
  content: p.content || p.body || "",
  likes: Number(p.likes || p.likes_count || 0),
});

const ROLE_FILTERS = [
  { key: "all", label: "All posts" },
  { key: "doctor", label: "Doctors" },
  { key: "student", label: "Students" },
];

const YEARS = [
  { key: "all", label: "All stages" },
  { key: "1", label: "Year 1" },
  { key: "2", label: "Year 2" },
  { key: "3", label: "Year 3" },
  { key: "4", label: "Year 4" },
];

export default function AdminFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [role, setRole] = useState("all");
  const [year, setYear] = useState("all");
  const [search, setSearch] = useState("");

  const fetchPosts = useCallback(async (silent) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get("/posts");
      const list = res.data?.data || res.data || [];
      setPosts(list.map(mapPost));
      setError(false);
    } catch (e) {
      console.error("admin feed error:", e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Home Feed - UniConnect Admin";
    fetchPosts();
  }, [fetchPosts]);

  // PostCard signals edits/deletes through onUpdate.
  const onUpdate = (updated) => {
    if (updated._deleted) setPosts((prev) => prev.filter((p) => p.id !== updated.id));
    else setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (role !== "all" && p.role !== role) return false;
      if (year !== "all" && String(p.academic_year ?? "") !== year) return false;
      if (q) {
        const hay = `${p.author} ${p.title} ${p.content}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, role, year, search]);

  const doctorCount = useMemo(() => posts.filter((p) => p.role === "doctor").length, [posts]);

  return (
    <div className="af-page">
      {/* Header */}
      <div className="af-head">
        <div className="af-head-left">
          <h1 className="af-title">Home Feed</h1>
          <p className="af-sub">
            <FiGlobe size={13} /> Full access — every post across all stages &amp; faculty
          </p>
        </div>
        <button className={`af-refresh ${refreshing ? "spinning" : ""}`} onClick={() => fetchPosts(true)} title="Refresh">
          <FiRefreshCw size={16} />
        </button>
      </div>

      {/* Stat strip */}
      <div className="af-stats">
        <div className="af-stat"><b>{posts.length}</b><span>Total posts</span></div>
        <div className="af-stat"><b>{doctorCount}</b><span>From doctors</span></div>
        <div className="af-stat"><b>{filtered.length}</b><span>Showing</span></div>
      </div>

      {/* Filters */}
      <div className="af-filters">
        <div className="af-chips">
          {ROLE_FILTERS.map((r) => (
            <button key={r.key} className={`af-chip ${role === r.key ? "active" : ""}`} onClick={() => setRole(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="af-filters-right">
          <select className="af-select" value={year} onChange={(e) => setYear(e.target.value)}>
            {YEARS.map((y) => <option key={y.key} value={y.key}>{y.label}</option>)}
          </select>
          <div className="af-search">
            <FiSearch size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts, authors…"
            />
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="af-feed">
        {loading ? (
          <div className="af-state"><div className="af-spinner" /><span>Loading feed…</span></div>
        ) : error ? (
          <div className="af-state">
            <FiInbox size={26} />
            <span>Couldn't load the feed.</span>
            <button className="af-retry" onClick={() => fetchPosts()}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="af-state">
            <FiInbox size={26} />
            <span>No posts match your filters.</span>
          </div>
        ) : (
          filtered.map((post) => <PostCard key={post.id} post={post} onUpdate={onUpdate} />)
        )}
      </div>
    </div>
  );
}
