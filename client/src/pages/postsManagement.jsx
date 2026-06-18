import "../styles/postsManagement.css";
import { useState, useEffect, useMemo, useCallback } from "react";
import api from "../api/axios";

function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className={`um-toast um-toast-${type}`}>{message}</div>;
}

function StatCard({ icon, value, label, accent }) {
  return (
    <div className={`um-stat-card um-stat-${accent}`}>
      <div className="um-stat-icon-wrap">
        <span className="um-stat-icon">{icon}</span>
      </div>
      <div className="um-stat-body">
        <span className="um-stat-value">{value.toLocaleString()}</span>
        <span className="um-stat-label">{label}</span>
      </div>
    </div>
  );
}

function PostModal({ post, onClose, onDelete, onDeleteComments }) {
  return (
    <div className="um-modal-overlay" onClick={onClose}>
      <div className="um-modal" onClick={(e) => e.stopPropagation()}>
        <div className="um-modal-header">
          <div className="um-modal-user-info">
            <div className="um-modal-avatar">{post.title?.charAt(0).toUpperCase()}</div>
            <div>
              <div className="um-modal-name-row">
                <h3 className="um-modal-name">{post.title}</h3>
              </div>
              <span className={`um-role-badge ${post.type === "post" ? "role-admin" : "role-student"}`}>
                {post.type === "post" ? "📝 Post" : "💬 Comment"}
              </span>
            </div>
          </div>
          <button className="um-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="um-modal-body">
          <div className="um-modal-section">
            <h4 className="um-modal-section-title">Post Information</h4>
            <div className="um-modal-info-grid">
              {[
                ["Title", post.title],
                ["Author", post.author],
                ["Type", post.type === "post" ? "Post" : "Comment"],
                ["Date", new Date(post.created_at).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k} className="um-info-row">
                  <span className="um-info-key">{k}</span>
                  <span className="um-info-val">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="um-modal-section">
            <div className="um-modal-security-box">
              <h4 className="um-modal-section-title">Actions</h4>
              {post.type === "post" ? (
                <button className="um-delete-btn" onClick={() => { onDelete(post.id); onClose(); }}>
                  🗑️ Delete Post
                </button>
              ) : (
                <button className="um-delete-btn" onClick={() => { onDeleteComments(post.id); onClose(); }}>
                  🗑️ Delete Comments
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="um-modal-footer">
          <button className="um-btn-close-modal" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function PostsManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  const showToast = (text, type = "success") => setToast({ text, type });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        ...(search && { search }),
        ...(typeFilter !== "all" && { type: typeFilter }),
      });
      const res = await api.get(`/admin/posts?${params}`);
      setPosts(res.data.posts);
      setTotal(res.data.pagination.total);
    } catch {
      showToast("Failed to load posts", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { setPage(1); }, [search, typeFilter]);

  const stats = useMemo(() => ({
    totalPosts: posts.filter(p => p.type === "post").length,
    totalComments: posts.filter(p => p.type === "comment").length,
  }), [posts]);

  const deletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      showToast("Post deleted successfully");
      fetchPosts();
    } catch {
      showToast("Failed to delete post", "error");
    }
  };

  const deleteComments = async (id) => {
    if (!window.confirm("Are you sure you want to delete all comments on this post?")) return;
    try {
      await api.delete(`/admin/posts/${id}/comments`);
      showToast("All comments deleted successfully");
      fetchPosts();
    } catch {
      showToast("Failed to delete comments", "error");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="um-page">
      <div className="um-page-header">
        <div>
          <h1 className="um-page-title">Posts Management</h1>
          <p className="um-page-sub">Manage and monitor all posts on the platform.</p>
        </div>
        <div className="um-page-header-badge">
          <span className="um-live-dot" />
          Live
        </div>
      </div>

      <div className="um-stats-bar" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <StatCard icon="📝" value={stats.totalPosts} label="Total Posts" accent="cyan" />
        <StatCard icon="💬" value={stats.totalComments} label="Total Comments" accent="blue" />
      </div>

      <div className="um-table-panel">
        <div className="um-toolbar">
          <div className="um-search-wrap">
            <span className="um-search-icon">🔍</span>
            <input className="um-search-input" type="text" placeholder="Search by title or author…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button className="um-search-clear" onClick={() => setSearch("")}>✕</button>}
          </div>
          <div className="um-filter-row">
            <span className="um-filter-label">Filter:</span>
            {["all", "post", "comment"].map(t => (
              <button key={t} className={`um-filter-btn ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>
                {t === "all" ? "All" : t === "post" ? "Post" : "Comment"}
              </button>
            ))}
          </div>
        </div>

        <div className="um-table-wrap">
          {loading ? <div className="um-loading">Loading...</div> : (
            <table className="um-table">
              <thead>
                <tr><th>Title</th><th>Author</th><th>Type</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {posts.length === 0 && <tr><td colSpan={5} className="um-table-empty">No posts found</td></tr>}
                {posts.map(post => (
                  <tr key={post.id} className="um-table-row" onClick={() => setSelectedPost(post)}>
                    <td className="um-user-cell">
                      <div className="um-user-avatar">{post.title?.charAt(0).toUpperCase()}</div>
                      <span className="um-user-name">{post.title}</span>
                    </td>
                    <td className="um-email-cell">{post.author}</td>
                    <td>
                      <span className={`um-role-badge ${post.type === "post" ? "role-admin" : "role-student"}`}>
                        {post.type === "post" ? "📝 Post" : "💬 Comment"}
                      </span>
                    </td>
                    <td className="um-date-cell">{new Date(post.created_at).toLocaleDateString()}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="um-actions">
                        {post.type === "post" ? (
                          <button className="um-act-btn delete" title="Delete Post" onClick={() => deletePost(post.id)}>🗑</button>
                        ) : (
                          <button className="um-act-btn delete" title="Delete All Comments" onClick={() => deleteComments(post.id)}>💬🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="um-table-footer">
          <span>Showing {posts.length} of {total} posts</span>
          {totalPages > 1 && (
            <div className="um-pagination">
              <button className="um-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
              <span className="um-page-info">{page} / {totalPages}</span>
              <button className="um-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          )}
        </div>
      </div>

      {selectedPost && (
        <PostModal
          post={posts.find(p => p.id === selectedPost.id) || selectedPost}
          onClose={() => setSelectedPost(null)}
          onDelete={deletePost}
          onDeleteComments={deleteComments}
        />
      )}

      {toast && <Toast message={toast.text} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}