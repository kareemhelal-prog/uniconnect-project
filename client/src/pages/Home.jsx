import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import Sidebar from "../components/Sidebar";

import ProfilePage from "./ProfilePage";
import ProjectsPage from "./ProjectsPage";
import AcademicReviewsPage from "./AcademicReviewsPage";
import NotificationsPage from "./Notifications";

import "../styles/Home.css";

// ── Base URL — غيّرها لو السيرفر على port تاني ──
const API_BASE = "http://localhost:5000/api";

// ── Helper: جيب الـ token من localStorage ──
const getToken = () => localStorage.getItem("token");

// ── Helper: عمل request بـ auth header ──
const authFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

// ── Helper: حوّل بيانات post من الـ API للشكل اللي الـ UI بيتوقعه ──
const mapPost = (p) => ({
  id: p.id,
  author: p.user?.name || p.author_name || "Unknown",
  avatar: (p.user?.name || "U").slice(0, 2).toUpperCase(),
  avatarColor: "#a855f7",
  role: p.user?.role || "",
  time: new Date(p.created_at).toLocaleString(),
  title: p.title || "",
  content: p.content || p.body || "",
  likes: p.likes_count || 0,
  shares: 0,
  comments: (p.comments || []).map((c) => ({
    id: c.id,
    author: c.user?.name || "Unknown",
    avatar: (c.user?.name || "U").slice(0, 2).toUpperCase(),
    avatarColor: "#00e5ff",
    text: c.content || c.text || "",
    time: new Date(c.created_at).toLocaleString(),
  })),
});

// ── render الصفحات الفرعية ──
function renderPage(page, user, setUser) {
  switch (page) {
    case "profile":           return <ProfilePage user={user} setUser={setUser} />;
    case "projects":          return <ProjectsPage />;
    case "academic-reviews":  return <AcademicReviewsPage />;
    case "notifications":     return <NotificationsPage />;
    default:                  return null;
  }
}

// ══════════════════════════════════════════════
// Post Card
// ══════════════════════════════════════════════
function PostCard({ post, onUpdate }) {
  const [liked, setLiked]               = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText]   = useState("");
  const [showShareToast, setShowShareToast] = useState(false);
  const [loading, setLoading]           = useState(false);

  // ── Like / Unlike ──
  const handleLike = async () => {
    try {
      await authFetch(`${API_BASE}/likes`, {
        method: "POST",
        body: JSON.stringify({ post_id: post.id }),
      });
      const newLiked = !liked;
      setLiked(newLiked);
      onUpdate({ ...post, likes: newLiked ? post.likes + 1 : post.likes - 1 });
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // ── Add Comment ──
  const handleComment = async () => {
    if (!commentText.trim()) return;
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/comments`, {
        method: "POST",
        body: JSON.stringify({ post_id: post.id, content: commentText.trim() }),
      });
      const data = await res.json();
      const newComment = {
        id: data.id || Date.now(),
        author: data.user?.name || "Me",
        avatar: (data.user?.name || "Me").slice(0, 2).toUpperCase(),
        avatarColor: "#a855f7",
        text: commentText.trim(),
        time: "Just now",
      };
      onUpdate({ ...post, comments: [...post.comments, newComment] });
      setCommentText("");
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Share (local فقط — مفيش endpoint للـ share في الـ API) ──
  const handleShare = () => {
    setShowShareToast(true);
    onUpdate({ ...post, shares: post.shares + 1 });
    setTimeout(() => setShowShareToast(false), 2000);
  };

  return (
    <div className="post-card">
      {showShareToast && <div className="share-toast">🔗 Post shared!</div>}

      <div className="post-header">
        <div className="post-avatar-wrap" style={{ background: post.avatarColor }}>
          {post.avatar}
        </div>
        <div className="post-meta-info">
          <h4 className="post-author">{post.author}</h4>
          <span className="post-role">{post.role}</span>
          <span className="post-time">{post.time}</span>
        </div>
      </div>

      <div className="post-body">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-content">{post.content}</p>
      </div>

      <div className="post-stats-row">
        <span className="post-stat">{post.likes} likes</span>
        <span className="post-stat">
          {post.comments.length} comments · {post.shares} shares
        </span>
      </div>

      <div className="post-divider" />

      <div className="post-actions">
        <button
          className={`action-btn like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
        >
          {liked ? "❤️" : "🤍"} Like
        </button>
        <button
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 Comment
        </button>
        <button className="action-btn share-btn" onClick={handleShare}>
          ↗ Share
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {post.comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-avatar" style={{ background: c.avatarColor }}>
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
            <div className="comment-avatar" style={{ background: "#a855f7" }}>
              Me
            </div>
            <input
              className="comment-input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              disabled={loading}
            />
            <button
              className="comment-send-btn"
              onClick={handleComment}
              disabled={loading}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// Create Post Modal
// ══════════════════════════════════════════════
function CreatePostModal({ onClose, onPost }) {
  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/posts`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim() || "New Post",
          content: content.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      const data = await res.json();
      onPost(mapPost(data));
      onClose();
    } catch (err) {
      setError("حصل خطأ، حاول تاني.");
      console.error("Create post error:", err);
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

// ══════════════════════════════════════════════
// Home Component
// ══════════════════════════════════════════════
const Home = () => {
  const [activePage, setActivePage]       = useState("home");
  const [user, setUser]                   = useState(null);
  const [posts, setPosts]                 = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loadingUser, setLoadingUser]     = useState(true);
  const [loadingPosts, setLoadingPosts]   = useState(true);

  const isHome = activePage === "home";

  // ── جيب بيانات اليوزر الحالي ──
  useEffect(() => {
    authFetch(`${API_BASE}/users/me`)
      .then((r) => r.json())
      .then((data) => {
        // الـ API بيرجع { user: {...} }
        const u = data.user || data;
        setUser({
          id: u.id,
          name: u.name || u.full_name || "User",
          initials: (u.name || "U").slice(0, 2).toUpperCase(),
          role: u.role || "",
          dept: u.department || "",
          faculty: u.faculty || "",
          status: "online",
          stats: [
            { label: "Projects", value: 0 },
            { label: "Friends",  value: 0 },
            { label: "Groups",   value: 0 },
          ],
        });
      })
      .catch((err) => console.error("Fetch user error:", err))
      .finally(() => setLoadingUser(false));
  }, []);

  // ── جيب الـ posts ──
  useEffect(() => {
    authFetch(`${API_BASE}/posts`)
      .then((r) => r.json())
      .then((data) => {
        // الـ API ممكن يرجع array أو { posts: [...] }
        const list = Array.isArray(data) ? data : data.posts || [];
        setPosts(list.map(mapPost));
      })
      .catch((err) => console.error("Fetch posts error:", err))
      .finally(() => setLoadingPosts(false));
  }, []);

  // ── جيب الـ notifications ──
  useEffect(() => {
    authFetch(`${API_BASE}/notifications`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.notifications || [];
        setNotifications(
          list.map((n) => ({
            id: n.id,
            icon: "🔔",
            title: n.title || n.message || "Notification",
            body: n.body || "",
            time: n.created_at ? new Date(n.created_at).toLocaleString() : "",
          }))
        );
      })
      .catch(() => {}); // مش critical لو فشلت
  }, []);

  const updatePost = (updated) =>
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const addPost = (newPost) => setPosts((prev) => [newPost, ...prev]);

  // ── Loading state ──
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

export default Home;