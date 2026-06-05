import React, { useState } from "react";
import "../styles/SearchResults.css";

/* ═══════════════════════════════════════════════
   DUMMY DATA
═══════════════════════════════════════════════ */
const USERS = [
  {
    id: 1, name: "Kareem Mohamed", handle: "@kareem_mohamed",
    major: "IT Student & Frontend Designer at BATU",
    avatar: "K", color: "linear-gradient(135deg,#00e5ff,#a855f7)",
    online: true, followed: false,
  },
  {
    id: 2, name: "Arjun Patel", handle: "@arjun_patel",
    major: "Computer Science",
    avatar: "A", color: "linear-gradient(135deg,#3b82f6,#60a5fa)",
    online: true, followed: false,
  },
  {
    id: 3, name: "Mei Lin", handle: "@meilin_23",
    major: "Data Science",
    avatar: "M", color: "linear-gradient(135deg,#f472b6,#ec4899)",
    online: true, followed: false,
  },
  {
    id: 4, name: "Liam O'Connor", handle: "@liam_oc",
    major: "AI Research",
    avatar: "L", color: "linear-gradient(135deg,#a78bfa,#7c3aed)",
    online: true, followed: false,
  },
  {
    id: 5, name: "Sara Khan", handle: "@sara_khan",
    major: "Information Systems",
    avatar: "S", color: "linear-gradient(135deg,#fb923c,#f43f5e)",
    online: false, followed: false,
  },
  {
    id: 6, name: "David Chen", handle: "@david_chen",
    major: "Machine Learning",
    avatar: "D", color: "linear-gradient(135deg,#34d399,#059669)",
    online: true, followed: false,
  },
  {
    id: 7, name: "Emily Johnson", handle: "@emily_j",
    major: "Statistics",
    avatar: "E", color: "linear-gradient(135deg,#fbbf24,#d97706)",
    online: false, followed: false,
  },
  {
    id: 8, name: "Omar Hassan", handle: "@omar_dev",
    major: "Software Engineering",
    avatar: "O", color: "linear-gradient(135deg,#38bdf8,#0ea5e9)",
    online: true, followed: false,
  },
  {
    id: 9, name: "Nour El-Din", handle: "@nour_eldin",
    major: "Cybersecurity",
    avatar: "N", color: "linear-gradient(135deg,#c084fc,#9333ea)",
    online: false, followed: false,
  },
];

const GROUPS = [
  {
    id: 1, name: "Machine Learning Enthusiasts",
    members: "1.2K", icon: "🧠",
    color: "linear-gradient(135deg,#7c3aed,#a855f7)",
    joined: false,
  },
  {
    id: 2, name: "AI & Deep Learning Club",
    members: "842", icon: "🤖",
    color: "linear-gradient(135deg,#0ea5e9,#2563eb)",
    joined: false,
  },
  {
    id: 3, name: "Data Science Academy",
    members: "1.5K", icon: "📊",
    color: "linear-gradient(135deg,#059669,#10b981)",
    joined: false,
  },
  {
    id: 4, name: "CS Research Collaborators",
    members: "623", icon: "💻",
    color: "linear-gradient(135deg,#9333ea,#f43f5e)",
    joined: false,
  },
  {
    id: 5, name: "Frontend Workshop",
    members: "910", icon: "🎨",
    color: "linear-gradient(135deg,#f59e0b,#ef4444)",
    joined: false,
  },
  {
    id: 6, name: "Smart Waste Bin Project",
    members: "318", icon: "♻️",
    color: "linear-gradient(135deg,#22c55e,#16a34a)",
    joined: false,
  },
];

const POSTS = [
  {
    id: 1, author: "Arjun Patel", handle: "@arjun_patel",
    avatar: "A", color: "linear-gradient(135deg,#3b82f6,#60a5fa)",
    content: "Just published a new blog post on using Transformer models for time series forecasting. Would love your thoughts!",
    date: "May 18, 2025", comments: 12, online: true,
  },
  {
    id: 2, author: "Mei Lin", handle: "@meilin_23",
    avatar: "M", color: "linear-gradient(135deg,#f472b6,#ec4899)",
    content: "Exploring explainable AI techniques. Here's a summary of SHAP vs LIME. Which one do you prefer and why?",
    date: "May 17, 2025", comments: 8, online: true,
  },
  {
    id: 3, author: "Liam O'Connor", handle: "@liam_oc",
    avatar: "L", color: "linear-gradient(135deg,#a78bfa,#7c3aed)",
    content: "Anyone working on reinforcement learning projects? Let's connect and collaborate! Open to all skill levels.",
    date: "May 16, 2025", comments: 15, online: true,
  },
  {
    id: 4, author: "Kareem Mohamed", handle: "@kareem_mohamed",
    avatar: "K", color: "linear-gradient(135deg,#00e5ff,#a855f7)",
    content: "Just finished building the UniConnect Search page using React! Super proud of how the neon glassmorphism UI turned out 🚀",
    date: "May 15, 2025", comments: 21, online: true,
  },
  {
    id: 5, author: "Sara Khan", handle: "@sara_khan",
    avatar: "S", color: "linear-gradient(135deg,#fb923c,#f43f5e)",
    content: "Machine learning model accuracy just hit 94% on our Smart Waste Detection project. Excited to present this at the graduation expo!",
    date: "May 14, 2025", comments: 9, online: false,
  },
];

const TABS = ["Users", "Groups", "Posts"];
const TAB_ICONS = { Users: "👥", Groups: "🏘️", Posts: "📝" };

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function SearchResults() {
  const [query,      setQuery]      = useState("machine learning");
  const [activeTab,  setActiveTab]  = useState("Users");
  const [users,      setUsers]      = useState(USERS);
  const [groups,     setGroups]     = useState(GROUPS);
  const [page,       setPage]       = useState(1);

  const TOTAL_PAGES = 10;

  /* search filter */
  const q = query.toLowerCase();
  const filteredUsers  = users.filter(u =>
    u.name.toLowerCase().includes(q) || u.major.toLowerCase().includes(q) || u.handle.includes(q)
  );
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(q)
  );
  const filteredPosts  = POSTS.filter(p =>
    p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)
  );

  const toggleFollow = (id) =>
    setUsers(prev => prev.map(u => u.id === id ? { ...u, followed: !u.followed } : u));

  const toggleJoin = (id) =>
    setGroups(prev => prev.map(g => g.id === id ? { ...g, joined: !g.joined } : g));

  /* pagination display */
  const pages = [1, 2, 3, "...", TOTAL_PAGES];

  return (
    <div className="sr-page">
      {/* BG glow blobs */}
      <div className="sr-blob sr-blob-1" />
      <div className="sr-blob sr-blob-2" />

      <div className="sr-container">

        {/* ── Title ── */}
        <h1 className="sr-title">Search Results</h1>

        {/* ── Search Bar ── */}
        <div className="sr-searchbar">
          <span className="sr-search-icon">🔍</span>
          <input
            className="sr-search-input"
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search users, groups, posts…"
          />
          {query && (
            <button className="sr-search-clear" onClick={() => setQuery("")}>✕</button>
          )}
          <button className="sr-search-btn">Search</button>
        </div>

        {/* ── Tabs ── */}
        <div className="sr-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`sr-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              <span>{TAB_ICONS[tab]}</span>
              <span>{tab}</span>
              <span className="sr-tab-count">
                {tab === "Users"  ? filteredUsers.length
                : tab === "Groups" ? filteredGroups.length
                : filteredPosts.length}
              </span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════
            TAB: USERS
        ══════════════════════════════════ */}
        {activeTab === "Users" && (
          <>
            {filteredUsers.length === 0 && <p className="sr-empty">No users found for "{query}"</p>}
            <div className="sr-users-grid">
              {filteredUsers.map(user => (
                <div key={user.id} className="sr-user-card">
                  <div className="sr-user-avatar-wrap">
                    <div className="sr-user-avatar" style={{ background: user.color }}>
                      {user.avatar}
                    </div>
                    {user.online && <span className="sr-online-dot" />}
                  </div>
                  <h3 className="sr-user-name">{user.name}</h3>
                  <p className="sr-user-handle">{user.handle}</p>
                  <span className="sr-user-major">{user.major}</span>
                  <button
                    className={`sr-follow-btn ${user.followed ? "following" : ""}`}
                    onClick={() => toggleFollow(user.id)}
                  >
                    {user.followed ? "✓ Following" : "Follow"}
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="sr-pagination">
              <button
                className="sr-page-btn arrow"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >‹</button>
              {pages.map((p, i) =>
                p === "..." ? (
                  <span key={i} className="sr-page-dots">…</span>
                ) : (
                  <button
                    key={i}
                    className={`sr-page-btn ${page === p ? "active" : ""}`}
                    onClick={() => setPage(p)}
                  >{p}</button>
                )
              )}
              <button
                className="sr-page-btn arrow"
                onClick={() => setPage(p => Math.min(TOTAL_PAGES, p + 1))}
                disabled={page === TOTAL_PAGES}
              >›</button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════
            TAB: GROUPS
        ══════════════════════════════════ */}
        {activeTab === "Groups" && (
          <>
            {filteredGroups.length === 0 && <p className="sr-empty">No groups found for "{query}"</p>}
            <div className="sr-groups-grid">
              {filteredGroups.map(group => (
                <div key={group.id} className="sr-group-card">
                  <div className="sr-group-img" style={{ background: group.color }}>
                    <span className="sr-group-icon">{group.icon}</span>
                    <div className="sr-group-img-overlay" />
                  </div>
                  <div className="sr-group-body">
                    <h3 className="sr-group-name">{group.name}</h3>
                    <p className="sr-group-members">👥 {group.members} members</p>
                    <button
                      className={`sr-join-btn ${group.joined ? "joined" : ""}`}
                      onClick={() => toggleJoin(group.id)}
                    >
                      {group.joined ? "✓ Joined" : "Join"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════════════════
            TAB: POSTS
        ══════════════════════════════════ */}
        {activeTab === "Posts" && (
          <>
            {filteredPosts.length === 0 && <p className="sr-empty">No posts found for "{query}"</p>}
            <div className="sr-posts-list">
              {filteredPosts.map(post => (
                <div key={post.id} className="sr-post-card">
                  <div className="sr-post-avatar-wrap">
                    <div className="sr-post-avatar" style={{ background: post.color }}>
                      {post.avatar}
                    </div>
                    {post.online && <span className="sr-online-dot" />}
                  </div>
                  <div className="sr-post-body">
                    <div className="sr-post-header">
                      <span className="sr-post-author">{post.author}</span>
                      <span className="sr-post-handle">{post.handle}</span>
                    </div>
                    <p className="sr-post-content">{post.content}</p>
                  </div>
                  <div className="sr-post-meta">
                    <span className="sr-post-date">{post.date}</span>
                    <span className="sr-post-comments">💬 {post.comments}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="sr-view-more-btn">View more posts</button>
          </>
        )}

      </div>
    </div>
  );
}
