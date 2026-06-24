import React, { useState, useEffect, useCallback } from "react";
import "../styles/SearchResults.css";
import api from "../api/axios";
import { useSearchParams } from "react-router-dom";

const TABS = ["Users", "Groups", "Posts"];
const TAB_ICONS = { Users: "👥", Groups: "🏘️", Posts: "📝" };

export default function SearchResults() {
  const [searchParams]              = useSearchParams();
  const [query,      setQuery]      = useState(searchParams.get("q") || "");
  const [activeTab,  setActiveTab]  = useState("Users");
  const [results,    setResults]    = useState({ users: [], groups: [], posts: [] });
  const [loading,    setLoading]    = useState(false);
  const [page,       setPage]       = useState(1);
  const [followed,   setFollowed]   = useState({});
  const [joined,     setJoined]     = useState({});

  const fetchResults = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults({
        users:  res.data.users  || [],
        groups: res.data.groups || [],
        posts:  res.data.posts  || [],
      });
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => fetchResults(query), 400);
    return () => clearTimeout(delay);
  }, [query, fetchResults]);

  const toggleFollow = async (userId) => {
    try {
      if (followed[userId]) {
        await api.delete(`/follow/${userId}`);
      } else {
        await api.post(`/follow/${userId}`);
      }
      setFollowed((prev) => ({ ...prev, [userId]: !prev[userId] }));
    } catch (err) {
      console.error("Follow failed:", err);
    }
  };

  const toggleJoin = async (groupId) => {
    try {
      if (joined[groupId]) {
        await api.delete(`/groups/${groupId}/leave`);
      } else {
        await api.post(`/groups/${groupId}/join`);
      }
      setJoined((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    } catch (err) {
      console.error("Join failed:", err);
    }
  };

  const { users, groups, posts } = results;

  return (
    <div className="sr-page">
      <div className="sr-blob sr-blob-1" />
      <div className="sr-blob sr-blob-2" />

      <div className="sr-container">
        <h1 className="sr-title">Search Results</h1>

        <div className="sr-searchbar">
          <span className="sr-search-icon">🔍</span>
          <input
            className="sr-search-input"
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search users, groups, posts…"
          />
          {query && <button className="sr-search-clear" onClick={() => setQuery("")}>✕</button>}
        </div>

        <div className="sr-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`sr-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              <span>{TAB_ICONS[tab]}</span>
              <span>{tab}</span>
              <span className="sr-tab-count">
                {tab === "Users" ? users.length : tab === "Groups" ? groups.length : posts.length}
              </span>
            </button>
          ))}
        </div>

        {loading && <p style={{ color: "#00e5ff", textAlign: "center", padding: "2rem" }}>Searching...</p>}

        {!loading && activeTab === "Users" && (
          <>
            {users.length === 0 && query && <p className="sr-empty">No users found for "{query}"</p>}
            <div className="sr-users-grid">
              {users.map((user) => (
                <div key={user.id} className="sr-user-card">
                  <div className="sr-user-avatar-wrap">
                    <div className="sr-user-avatar" style={{ background: "linear-gradient(135deg,#6c47ff,#00e5ff)" }}>
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  </div>
                  <h3 className="sr-user-name">{user.name}</h3>
                  <p className="sr-user-handle">@{user.username}</p>
                  <span className="sr-user-major">{user.role}</span>
                  <button
                    className={`sr-follow-btn ${followed[user.id] ? "following" : ""}`}
                    onClick={() => toggleFollow(user.id)}
                  >
                    {followed[user.id] ? "✓ Following" : "Follow"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && activeTab === "Groups" && (
          <>
            {groups.length === 0 && query && <p className="sr-empty">No groups found for "{query}"</p>}
            <div className="sr-groups-grid">
              {groups.map((group) => (
                <div key={group.id} className="sr-group-card">
                  <div className="sr-group-img" style={{ background: "linear-gradient(135deg,#6c47ff,#a855f7)" }}>
                    <span className="sr-group-icon">👥</span>
                    <div className="sr-group-img-overlay" />
                  </div>
                  <div className="sr-group-body">
                    <h3 className="sr-group-name">{group.name}</h3>
                    <button
                      className={`sr-join-btn ${joined[group.id] ? "joined" : ""}`}
                      onClick={() => toggleJoin(group.id)}
                    >
                      {joined[group.id] ? "✓ Joined" : "Join"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && activeTab === "Posts" && (
          <>
            {posts.length === 0 && query && <p className="sr-empty">No posts found for "{query}"</p>}
            <div className="sr-posts-list">
              {posts.map((post) => (
                <div key={post.id} className="sr-post-card">
                  <div className="sr-post-avatar-wrap">
                    <div className="sr-post-avatar" style={{ background: "linear-gradient(135deg,#6c47ff,#00e5ff)" }}>
                      {post.author_name?.[0]?.toUpperCase() || "U"}
                    </div>
                  </div>
                  <div className="sr-post-body">
                    <div className="sr-post-header">
                      <span className="sr-post-author">{post.author_name}</span>
                    </div>
                    <p className="sr-post-content">{post.content}</p>
                  </div>
                  <div className="sr-post-meta">
                    <span className="sr-post-date">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}