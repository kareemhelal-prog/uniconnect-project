import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import Sidebar from "../components/Sidebar";

import ProfilePage from "./ProfilePage";
import ProjectsPage from "./ProjectsPage";
import AcademicReviewsPage from "./AcademicReviewsPage";
import NotificationsPage from "./Notifications";

import "../styles/Home.css";

const API_BASE = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const authFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

const mapPost = (p) => ({
  id:          p.id,
  author:      p.name || p.user?.name || p.author_name || "Unknown",
  avatar:      (p.name || p.user?.name || "U").slice(0, 2).toUpperCase(),
  avatarColor: "#a855f7",
  role:        p.user?.role || "",
  time:        new Date(p.created_at).toLocaleString(),
  title:       p.title || "",
  content:     p.content || p.body || "",
  likes:       p.likes       ?? p.likes_count ?? 0,
  liked:       p.liked       ?? false,
  shares:      p.shares      ?? 0,
  shared:      p.shared      ?? false,
  comments:    (p.comments   || []).map((c) => ({
    id:          c.id,
    author:      c.user?.name || "Unknown",
    avatar:      (c.user?.name || "U").slice(0, 2).toUpperCase(),
    avatarColor: "#00e5ff",
    text:        c.content || c.text || "",
    time:        new Date(c.created_at).toLocaleString(),
  })),
});

function renderPage(page, user, setUser) {
  switch (page) {
    case "profile":          return <ProfilePage user={user} setUser={setUser} />;
    case "projects":         return <ProjectsPage />;
    case "academic-reviews": return <AcademicReviewsPage />;
    case "notifications":    return <NotificationsPage />;
    default:                 return null;
  }
}

function PostCard({ post, onUpdate }) {
  const [liked,          setLiked]          = useState(post.liked  ?? false);
  const [shared,         setShared]         = useState(post.shared ?? false);
  const [showComments,   setShowComments]   = useState(false);
  const [commentText,    setCommentText]    = useState("");
  const [likeLoading,    setLikeLoading]    = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error,          setError]          = useState(null);

  const handleLike = useCallback(async () => {
    if (likeLoading) return;
    const newLiked = !liked;
    const newLikes = newLiked
      ? (post.likes || 0) + 1
      : Math.max((post.likes || 1) - 1, 0);

    setLiked(newLiked);
    onUpdate?.({ ...post, liked: newLiked, likes: newLikes });
    setLikeLoading(true);
    setError(null);

    try {
      await authFetch(`${API_BASE}/likes`, {
        method: "POST",
        body: JSON.stringify({ post_id: post.id }),
      });
    } catch {
      setLiked(!newLiked);
      onUpdate?.({ ...post, liked: !newLiked, likes: post.likes });
      setError("تعذّر تنفيذ الإعجاب، حاول مجدداً.");
    } finally {
      setLikeLoading(false);
    }
  }, [liked, likeLoading, post, onUpdate]);

  const handleComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || commentLoading) return;

    setCommentLoading(true);
    setError(null);

    try {
      const res = await authFetch(`${API_BASE}/comments`, {
        method: "POST",
        body: JSON.stringify({ post_id: post.id, content: trimmed }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      const newComment = {
        id:          data.id,
        author:      data.user?.name || "Me",
        avatar:      (data.user?.name || "Me").slice(0, 2).toUpperCase(),
        avatarColor: "#a855f7",
        text:        data.content || trimmed,
        time:        data.created_at ? new Date(data.created_at).toLocaleString() : "Just now",
      };

      onUpdate?.({ ...post, comments: [...(post.comments || []), newComment] });
      setCommentText("");
    } catch {
      setError("تعذّر إضافة التعليق، حاول مجدداً.");
    } finally {
      setCommentLoading(false);
    }
  }, [commentText, commentLoading, post, onUpdate]);

  const handleShare = useCallback(() => {
    if (shared) return;
    setShared(true);
    onUpdate?.({ ...post, shares: (post.shares || 0) + 1 });
  }, [shared, post, onUpdate]);

  return (
    <div className="post-card" data-post-id={post.id}>
      {error && (
        <div className="post-error-banner" role="alert">
          ⚠️ {error}
          <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="post-header">
        <div className="post-avatar-wrap" style={{ background: post.avatarColor || "#a855f7" }}>
          {post.avatar}
        </div>
        <div className="post-meta-info">
          <h4 className="post-author">{post.author}</h4>
          <span className="post-role">{post.role}</span>
          <span className="post-time">{post.time}</span>
        </div>
        <button className="more-btn" aria-label="More options">•••</button>
      </div>

      <div className="post-body">
        {post.title   && <h3 className="post-title">{post.title}</h3>}
        {post.content && <p className="post-content">{post.content}</p>}
      </div>

      {((post.likes > 0) || (post.comments?.length > 0) || (post.shares > 0)) && (
        <div className="post-stats-row">
          {post.likes > 0 && (
            <span className="post-stat">{post.likes} likes</span>
          )}
          {post.comments?.length > 0 && (
            <span className="post-stat">{post.comments.length} comments</span>
          )}
          {post.shares > 0 && (
            <span className="post-stat">{post.shares} shares</span>
          )}
        </div>
      )}

      <div className="post-divider" />

      <div className="post-actions">
        <button
          className={`action-btn like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
          disabled={likeLoading}
          aria-label={liked ? "Unlike" : "Like"}
        >
          {likeLoading ? "⏳" : liked ? "❤️" : "🤍"} Like
        </button>

        <button
          className="action-btn comment-btn"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
        >
          💬 Comment
        </button>

        <button
          className={`action-btn share-btn ${shared ? "shared" : ""}`}
          onClick={handleShare}
          disabled={shared}
          aria-label={shared ? "Already shared" : "Share"}
        >
          {shared ? "✅ Shared" : "↗ Share"}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {(post.comments || []).map((c) => (
            <div key={c.id} className="comment-item">
              <div
                className="comment-avatar"
                style={{ background: c.avatarColor || "#a855f7" }}
              >
                {c.avatar}
              </div>
              <div className="comment-bubble">
                <span className="comment-author">{c.author}</span>
                <p className="comment-text">{c.text}</p>
                <span className="comment-time">{c.time}</span>
              </div>
            </div>
          ))}

          <div className="comment-input-row">
            <div className="comment-avatar" style={{ background: "#a855f7" }}>Me</div>
            <input
              className="comment-input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
              disabled={commentLoading}
              aria-label="Comment input"
            />
            <button
              className="comment-send-btn"
              onClick={handleComment}
              disabled={commentLoading || !commentText.trim()}
            >
              {commentLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreatePostModal({ onClose, onPost }) {
  const [title,   setTitle]   = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/posts`, {
        method: "POST",
        body: JSON.stringify({
          title:   title.trim() || "New Post",
          content: content.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      const data = await res.json();
      onPost(mapPost(data));
      onClose();
    } catch {
      setError("حصل خطأ، حاول تاني.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card">
        <div className="modal-header">
          <span className="modal-title">Create Post</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="modal-label">TITLE (optional)</label>
          <input
            className="modal-input"
            placeholder="Post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="modal-label" style={{ marginTop: "12px" }}>
            WHAT'S ON YOUR MIND?
          </label>
          <textarea
            className="modal-textarea"
            placeholder="Share something with your academic community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
          {error && (
            <p style={{ color: "#f87171", fontSize: "13px", marginTop: "8px" }}>
              {error}
            </p>
          )}
        </div>
        <div className="modal-footer-btns">
          <button className="modal-cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="modal-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

const HomeDoctor = () => {
  const [activePage,     setActivePage]     = useState("home");
  const [user,           setUser]           = useState(null);
  const [posts,          setPosts]          = useState([]);
  const [notifications,  setNotifications]  = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loadingUser,    setLoadingUser]    = useState(true);
  const [loadingPosts,   setLoadingPosts]   = useState(true);

  const isHome = activePage === "home";

  useEffect(() => {
    authFetch(`${API_BASE}/users/me`)
      .then((r) => r.json())
      .then((data) => {
        const u = data.user || data;
        setUser({
          id:       u.id,
          name:     u.name || u.full_name || "Doctor",
          initials: (u.name || "D").slice(0, 2).toUpperCase(),
          role:     u.role       || "doctor",
          dept:     u.department || "",
          faculty:  u.faculty    || "",
          status:   "online",
          stats: [
            { label: "Projects", value: 0 },
            { label: "Students", value: 0 },
            { label: "Groups",   value: 0 },
          ],
        });
      })
      .catch((err) => console.error("Fetch user error:", err))
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    authFetch(`${API_BASE}/posts`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data || data.posts || [];
        setPosts(list.map(mapPost));
      })
      .catch((err) => console.error("Fetch posts error:", err))
      .finally(() => setLoadingPosts(false));
  }, []);

  useEffect(() => {
    authFetch(`${API_BASE}/notifications`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.notifications || [];
        setNotifications(
          list.map((n) => ({
            id:    n.id,
            icon:  "🔔",
            title: n.title   || n.message || "Notification",
            body:  n.body    || "",
            time:  n.created_at ? new Date(n.created_at).toLocaleString() : "",
          }))
        );
      })
      .catch(() => {});
  }, []);

  const updatePost = (updated) =>
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const addPost = (newPost) => setPosts((prev) => [newPost, ...prev]);

  if (loadingUser) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#00e5ff" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="home-page">
      <Navbar
        activePage={activePage}
        onNavigate={(id) => setActivePage(id)}
        user={user}
        notifications={notifications}
      />

      {isHome ? (
        <div className="home-layout">
          <LeftSidebar
            user={user}
            activePage={activePage}
            onNavigate={(id) => setActivePage(id)}
          />

          <main className="feed-section">
            <div className="feed-top-bar">
              <h2 className="feed-title">Academic Social Feed</h2>
              <button
                className="create-post-btn"
                onClick={() => setShowCreatePost(true)}
              >
                + Create Post
              </button>
            </div>

            {loadingPosts ? (
              <p style={{ color: "#8b949e", textAlign: "center", padding: "2rem" }}>
                Loading posts...
              </p>
            ) : posts.length === 0 ? (
              <div className="feed-empty">
                <span className="feed-empty-icon">📭</span>
                <span>No posts yet. Be the first to post!</span>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={updatePost} />
              ))
            )}
          </main>

          <RightSidebar importantDays={[]} />
        </div>
      ) : (
        renderPage(activePage, user, setUser)
      )}

      <Sidebar />

      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onPost={addPost}
        />
      )}
    </div>
  );
};

export default HomeDoctor;
