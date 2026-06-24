import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";
import "../styles/Home.css";

const BASE = "http://localhost:5000/api";

function getToken() { return localStorage.getItem("token"); }
function authH()    { return { Authorization: `Bearer ${getToken()}` }; }
function authFetch(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...authH(), ...(opts.headers || {}) },
  });
}

function getCurrentUserId() {
  try {
    const token = getToken();
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).id;
  } catch { return null; }
}

/* ─── Avatar with image + fallback ─── */
function Avatar({ src, name, size = 120, className = "" }) {
  const [err, setErr] = useState(false);
  const letter = name ? name.trim().charAt(0).toUpperCase() : "?";
  if (src && !err) {
    return (
      <img src={src} alt={name} className={`pp-avatar ${className}`}
        style={{ width: size, height: size }} onError={() => setErr(true)} />
    );
  }
  return (
    <div className={`pp-avatar-fallback ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {letter}
    </div>
  );
}

/* ─── Small inline avatar (post / comment) ─── */
function MiniAvatar({ src, name, size = 38, style = {} }) {
  const [err, setErr] = useState(false);
  const initials = (name || "?").slice(0, 2).toUpperCase();
  const base = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.36, fontWeight: 700, overflow: "hidden", ...style,
  };
  if (src && !err) {
    return (
      <div style={{ ...base, background: "transparent", padding: 0 }}>
        <img src={src} alt={name} onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
      </div>
    );
  }
  return <div style={{ ...base, background: "#a855f7", color: "#fff" }}>{initials}</div>;
}

/* ═══════════════════════════════════════════
   POST CARD  (identical to Home.jsx PostCard)
═══════════════════════════════════════════ */
function PostCard({ post: initialPost, currentUserId, currentUserPic, currentUserInitials, onDelete }) {
  const navigate = useNavigate();
  const [post,        setPost]        = useState(initialPost);
  const [liked,       setLiked]       = useState(initialPost.liked  ?? false);
  const [likesCount,  setLikesCount]  = useState(initialPost.likes  ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComments,setShowComments]= useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoad, setCommentLoad] = useState(false);
  const [showMenu,    setShowMenu]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editTitle,   setEditTitle]   = useState(initialPost.title   || "");
  const [editContent, setEditContent] = useState(initialPost.content || initialPost.text || "");
  const [editLoad,    setEditLoad]    = useState(false);
  const [error,       setError]       = useState(null);

  const isOwner   = currentUserId && post.user_id &&
                    String(currentUserId) === String(post.user_id);
  const comments  = post.comments || [];
  const postText  = post.content  || post.text || "";
  const authorName = post.name    || "User";
  const authorPic  = post.profile_picture || "";
  const dateStr   = post.created_at || post.date
    ? new Date(post.created_at || post.date).toLocaleString()
    : "";

  /* Like */
  const handleLike = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(n => newLiked ? n + 1 : Math.max(n - 1, 0));
    try {
      await authFetch(`${BASE}/likes`, { method: "POST", body: JSON.stringify({ post_id: post.id }) });
    } catch {
      setLiked(!newLiked);
      setLikesCount(n => newLiked ? n - 1 : n + 1);
      setError("Failed to like post.");
    } finally { setLikeLoading(false); }
  }, [liked, likeLoading, post.id]);

  /* Comment */
  const handleComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || commentLoad) return;
    setCommentLoad(true);
    try {
      const res = await authFetch(`${BASE}/comments`, {
        method: "POST", body: JSON.stringify({ post_id: post.id, content: trimmed }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newComment = {
        id:         data.id,
        content:    data.content || trimmed,
        created_at: data.created_at || new Date().toISOString(),
        user: {
          id:              getCurrentUserId(),
          name:            data.user?.name || "Me",
          profile_picture: currentUserPic || "",
        },
      };
      setPost(p => ({ ...p, comments: [...(p.comments || []), newComment] }));
      setCommentText("");
    } catch { setError("Failed to add comment."); }
    finally  { setCommentLoad(false); }
  }, [commentText, commentLoad, post.id, currentUserPic]);

  /* Delete */
  const handleDelete = useCallback(async () => {
    setShowMenu(false);
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await authFetch(`${BASE}/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete(post.id);
    } catch { setError("Failed to delete post."); }
  }, [post.id, onDelete]);

  /* Edit save */
  const handleEditSave = useCallback(async () => {
    if (!editContent.trim()) return;
    setEditLoad(true);
    try {
      const res = await authFetch(`${BASE}/posts/${post.id}`, {
        method: "PUT", body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (!res.ok) throw new Error();
      setPost(p => ({ ...p, title: editTitle, content: editContent, text: editContent }));
      setEditing(false);
    } catch { setError("Failed to update post."); }
    finally  { setEditLoad(false); }
  }, [editTitle, editContent, post.id]);

  return (
    <div className="post-card" style={{ marginBottom: 16 }}>

      {/* Error banner */}
      {error && (
        <div className="post-error-banner" role="alert">
          ⚠️ {error}
          <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="post-header">
        <MiniAvatar src={authorPic} name={authorName} size={42}
          style={{ cursor: post.user_id ? "pointer" : "default" }}
        />
        <div className="post-meta-info" style={{ flex: 1 }}>
          <h4 className="post-author"
            style={{ cursor: post.user_id ? "pointer" : "default" }}
            onClick={() => post.user_id && navigate(`/profile/${post.user_id}`)}>
            {authorName}
          </h4>
          <span className="post-time">{dateStr}</span>
        </div>

        {isOwner && (
          <div style={{ position: "relative" }}>
            <button className="more-btn" onClick={() => setShowMenu(v => !v)}>•••</button>
            {showMenu && (
              <div style={{
                position: "absolute", right: 0, top: "100%", zIndex: 20,
                background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, overflow: "hidden", minWidth: 140,
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}>
                <button onClick={() => { setEditing(true); setShowMenu(false); }} style={{
                  display: "block", width: "100%", padding: "10px 16px",
                  background: "none", border: "none", color: "#e2e8f0",
                  cursor: "pointer", textAlign: "left", fontSize: 14,
                }}>✏️ Edit</button>
                <button onClick={handleDelete} style={{
                  display: "block", width: "100%", padding: "10px 16px",
                  background: "none", border: "none", color: "#f87171",
                  cursor: "pointer", textAlign: "left", fontSize: 14,
                }}>🗑 Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit mode */}
      {editing && (
        <div style={{ padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: 8 }}>
          <input
            style={{ width: "100%", background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: 8, color: "#e2e8f0", marginBottom: 8, boxSizing: "border-box" }}
            value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title (optional)"
          />
          <textarea
            style={{ width: "100%", background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: 8, color: "#e2e8f0", minHeight: 80, resize: "vertical",
              boxSizing: "border-box", fontFamily: "inherit", fontSize: 14 }}
            value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Post content..."
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={handleEditSave} disabled={editLoad}
              style={{ padding: "7px 16px", borderRadius: 6, background: "#a855f7", border: "none", color: "#fff", cursor: "pointer", fontSize: 13 }}>
              {editLoad ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditing(false)}
              style={{ padding: "7px 16px", borderRadius: 6, background: "rgba(255,255,255,0.1)", border: "none", color: "#e2e8f0", cursor: "pointer", fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="post-body">
        {post.title && <h3 className="post-title">{post.title}</h3>}
        {postText   && <p  className="post-content">{postText}</p>}
      </div>

      {/* Stats */}
      {(likesCount > 0 || comments.length > 0) && (
        <div className="post-stats-row">
          {likesCount    > 0 && <span className="post-stat">{likesCount} likes</span>}
          {comments.length > 0 && (
            <span className="post-stat" style={{ cursor: "pointer" }}
              onClick={() => setShowComments(v => !v)}>
              {comments.length} comments
            </span>
          )}
        </div>
      )}

      <div className="post-divider" />

      {/* Actions */}
      <div className="post-actions">
        <button className={`action-btn like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike} disabled={likeLoading} aria-label={liked ? "Unlike" : "Like"}>
          {likeLoading ? "⏳" : liked ? "❤️" : "🤍"} Like
        </button>
        <button className="action-btn comment-btn"
          onClick={() => setShowComments(v => !v)} aria-expanded={showComments}>
          💬 Comment
        </button>
        <button className="action-btn share-btn">↗ Share</button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="comments-section">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <MiniAvatar
                src={c.user?.profile_picture}
                name={c.user?.name}
                size={32}
                style={{ background: "#00e5ff" }}
              />
              <div className="comment-bubble">
                <span className="comment-author">{c.user?.name || "User"}</span>
                <p className="comment-text">{c.content}</p>
                <span className="comment-time">
                  {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                </span>
              </div>
            </div>
          ))}

          <div className="comment-input-row">
            <MiniAvatar src={currentUserPic} name={currentUserInitials || "Me"} size={32} />
            <input
              className="comment-input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleComment()}
              disabled={commentLoad}
            />
            <button className="comment-send-btn"
              onClick={handleComment}
              disabled={commentLoad || !commentText.trim()}>
              {commentLoad ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════ */
export default function ProfilePage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const currentUserId = getCurrentUserId();
  const profileId     = id || null;
  const isOwnProfile  = !profileId || String(currentUserId) === String(profileId);

  const [profile,        setProfile]        = useState(null);
  const [posts,          setPosts]          = useState([]);
  const [files,          setFiles]          = useState([]);
  const [groups,         setGroups]         = useState([]);
  const [courses,        setCourses]        = useState([]);
  const [following,      setFollowing]      = useState(false);
  const [followers,      setFollowers]      = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoad,     setFollowLoad]     = useState(false);
  const [activeTab,      setActiveTab]      = useState("posts");
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [currentUserPic, setCurrentUserPic] = useState("");

  /* Fetch current user's own picture (for comment input avatar) */
  useEffect(() => {
    fetch(`${BASE}/users/me`, { headers: authH() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.profile_picture) setCurrentUserPic(d.user.profile_picture); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const profileUrl = profileId ? `${BASE}/profile/${profileId}` : `${BASE}/profile`;
        const res = await fetch(profileUrl, { headers: authH() });

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          if (res.status === 401) throw new Error("Session expired — please log in again");
          if (res.status === 404) throw new Error(profileId ? "User not found" : "Could not load your profile");
          throw new Error(d.detail || d.message || "Server error");
        }

        const data = await res.json();
        if (cancelled) return;

        const uid = profileId || data.id;
        setProfile(data);
        setFollowers(typeof data.followers === "number" ? data.followers : 0);

        const [postsRes, isFollowRes, followingCntRes, filesRes, groupsRes, coursesRes] =
          await Promise.all([
            uid
              ? fetch(`${BASE}/posts/user/${uid}`, { headers: authH() }).catch(() => null)
              : null,
            (!isOwnProfile && uid)
              ? fetch(`${BASE}/follow/is-following/${uid}`, { headers: authH() }).catch(() => null)
              : null,
            uid
              ? fetch(`${BASE}/follow/following/${uid}`, { headers: authH() }).catch(() => null)
              : null,
            fetch(`${BASE}/files`,             { headers: authH() }).catch(() => null),
            fetch(`${BASE}/groups/my-groups`,  { headers: authH() }).catch(() => null),
            fetch(`${BASE}/courses/my`,        { headers: authH() }).catch(() => null),
          ]);

        if (cancelled) return;

        if (postsRes?.ok) {
          const d = await postsRes.json();
          setPosts(d.data || []);
        } else {
          setPosts((data.posts || []).map(p => ({ ...p, liked: false, likes: 0, comments: [] })));
        }

        if (isFollowRes?.ok)   { const d = await isFollowRes.json();    setFollowing(d.isFollowing || false); }
        if (followingCntRes?.ok){ const d = await followingCntRes.json(); setFollowingCount(typeof d.following === "number" ? d.following : 0); }
        if (filesRes?.ok)      { const d = await filesRes.json();       setFiles(d.data   || []); }
        if (groupsRes?.ok)     { const d = await groupsRes.json();      setGroups(d.data  || []); }
        if (coursesRes?.ok)    { const d = await coursesRes.json();     setCourses(d.data || []); }

      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [id]);

  const handleFollow = async () => {
    if (!profileId || followLoad) return;
    setFollowLoad(true);
    const prev = following;
    setFollowing(!prev);
    try {
      const res = await authFetch(`${BASE}/follow`, {
        method: "POST", body: JSON.stringify({ following_id: parseInt(profileId) }),
      });
      if (!res.ok) throw new Error();
      const r = await fetch(`${BASE}/follow/followers/${profileId}`, { headers: authH() });
      if (r.ok) { const d = await r.json(); setFollowers(typeof d.followers === "number" ? d.followers : 0); }
    } catch { setFollowing(prev); }
    finally  { setFollowLoad(false); }
  };

  /* Loading */
  if (loading) {
    return (
      <div className="pp-loading">
        <div className="pp-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  /* Error */
  if (error || !profile) {
    const isAuth     = error?.toLowerCase().includes("session") || error?.toLowerCase().includes("log in");
    const isNotFound = error?.toLowerCase().includes("not found");
    return (
      <div className="pp-error">
        <span className="pp-error-icon">{isAuth ? "🔒" : isNotFound ? "👤" : "⚠"}</span>
        <p className="pp-error-msg">{error || "Could not load profile"}</p>
        <div className="pp-error-btns">
          <button className="pp-err-btn" onClick={() => navigate(-1)}>← Back</button>
          {isAuth
            ? <button className="pp-err-btn pp-err-btn-primary" onClick={() => navigate("/login")}>Log In</button>
            : <button className="pp-err-btn pp-err-btn-primary" onClick={() => window.location.reload()}>Retry</button>
          }
        </div>
        {!isAuth && !isNotFound && (
          <p className="pp-error-hint">Make sure the server is running on port 5000</p>
        )}
      </div>
    );
  }

  const displayName = profile.name || "User";
  const roleLabel   = profile.role === "doctor" ? "Doctor" : profile.role === "investor" ? "Investor" : "Student";

  const TABS = [
    { key: "posts",   label: "Posts",   icon: "📝" },
    { key: "about",   label: "About",   icon: "ℹ" },
    { key: "files",   label: "Files",   icon: "📁" },
    { key: "groups",  label: "Groups",  icon: "👥" },
    { key: "courses", label: "Courses", icon: "📚" },
  ];

  const currentUserInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="pp-root" style={{ direction: "ltr" }}>

      {/* Cover */}
      <div className="pp-cover">
        <div className="pp-cover-grid" />
        <div className="pp-cover-glow" />
        <div className="pp-cover-bottom-fade" />
        {isOwnProfile && (
          <button className="pp-cover-edit-btn" onClick={() => navigate("/edit-profile")}>
            ✏ Edit Cover
          </button>
        )}
      </div>

      {/* Header */}
      <div className="pp-header-section">
        <div className="pp-header-inner">
          <div className="pp-top-row">
            <div className="pp-avatar-wrap">
              <Avatar src={profile.profile_picture} name={displayName} size={130} />
              <span className="pp-online-dot" />
            </div>

            <div className="pp-identity">
              <div className="pp-name-row">
                <h1 className="pp-name">{displayName}</h1>
                <span className={`pp-role-badge role-${profile.role}`}>{roleLabel}</span>
              </div>
              <div className="pp-meta-chips">
                {profile.faculty      && <span className="pp-chip">🏛 {profile.faculty}</span>}
                {profile.major        && <span className="pp-chip">💻 {profile.major}</span>}
                {profile.academic_year && <span className="pp-chip">📅 Year {profile.academic_year}</span>}
              </div>
              {profile.bio && <p className="pp-bio-preview">{profile.bio}</p>}
            </div>

            <div className="pp-action-group">
              {isOwnProfile ? (
                <button className="pp-btn pp-btn-edit" onClick={() => navigate("/edit-profile")}>
                  ✏ Edit Profile
                </button>
              ) : (
                <>
                  <button
                    className={`pp-btn pp-btn-follow${following ? " following" : ""}`}
                    onClick={handleFollow} disabled={followLoad}>
                    {followLoad ? "..." : following ? "✓ Following" : "+ Follow"}
                  </button>
                  <button className="pp-btn pp-btn-msg">💬 Message</button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="pp-stats-bar">
            {[
              { num: followers,      lbl: "Followers" },
              { num: followingCount, lbl: "Following" },
              { num: posts.length,   lbl: "Posts" },
              { num: courses.length, lbl: "Courses" },
              { num: files.length,   lbl: "Files" },
            ].map((s, i, arr) => (
              <span key={s.lbl} style={{ display: "contents" }}>
                <div className="pp-stat">
                  <span className="pp-stat-num">{s.num.toLocaleString()}</span>
                  <span className="pp-stat-lbl">{s.lbl}</span>
                </div>
                {i < arr.length - 1 && <div className="pp-stat-divider" />}
              </span>
            ))}
          </div>

          {/* Tabs */}
          <nav className="pp-tabs">
            {TABS.map(t => (
              <button key={t.key}
                className={`pp-tab${activeTab === t.key ? " active" : ""}`}
                onClick={() => setActiveTab(t.key)}>
                <span className="pp-tab-icon">{t.icon}</span> {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Body */}
      <div className="pp-body">
        <div className="pp-main">

          {/* Posts */}
          {activeTab === "posts" && (
            posts.length === 0
              ? <div className="pp-empty"><span>📭</span><p>No posts yet</p></div>
              : posts.map(p => (
                  <PostCard
                    key={p.id}
                    post={p}
                    currentUserId={currentUserId}
                    currentUserPic={currentUserPic}
                    currentUserInitials={isOwnProfile ? displayName.slice(0,2).toUpperCase() : currentUserInitials}
                    onDelete={pid => setPosts(prev => prev.filter(x => x.id !== pid))}
                  />
                ))
          )}

          {/* About */}
          {activeTab === "about" && (
            <div className="pp-about-section">
              <div className="pp-info-card">
                <h3>About</h3>
                <p className="pp-about-bio">{profile.bio || "No bio added yet."}</p>
              </div>
              <div className="pp-info-card">
                <h3>Academic Info</h3>
                <div className="pp-info-rows">
                  <div className="pp-info-row"><span>🎓</span><b>Role:</b><span>{roleLabel}</span></div>
                  {profile.faculty      && <div className="pp-info-row"><span>🏛</span><b>Faculty:</b><span>{profile.faculty}</span></div>}
                  {profile.major        && <div className="pp-info-row"><span>💻</span><b>Major:</b><span>{profile.major}</span></div>}
                  {profile.academic_year && <div className="pp-info-row"><span>📅</span><b>Year:</b><span>Year {profile.academic_year}</span></div>}
                </div>
              </div>
            </div>
          )}

          {/* Files */}
          {activeTab === "files" && (
            files.length === 0
              ? <div className="pp-empty"><span>📂</span><p>No files uploaded</p></div>
              : <div className="pp-files-list">
                  {files.map((f, i) => (
                    <div className="pp-file-row" key={i}>
                      <span className="pp-file-badge">{(f.file_type || "FILE").slice(0, 3).toUpperCase()}</span>
                      <div className="pp-file-info">
                        <p className="pp-file-name">{f.file_name}</p>
                        <p className="pp-file-size">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : ""}</p>
                      </div>
                      <a href={f.file_url} target="_blank" rel="noreferrer">
                        <button className="pp-download-btn">⬇ Download</button>
                      </a>
                    </div>
                  ))}
                </div>
          )}

          {/* Groups */}
          {activeTab === "groups" && (
            groups.length === 0
              ? <div className="pp-empty"><span>👥</span><p>No groups joined yet</p></div>
              : <div className="pp-grid-2">
                  {groups.map((g, i) => (
                    <div className="pp-group-card" key={i}>
                      <div className="pp-group-icon">◈</div>
                      <p className="pp-group-name">{g.name}</p>
                      <p className="pp-group-members">{g.member_count || 0} members</p>
                    </div>
                  ))}
                </div>
          )}

          {/* Courses */}
          {activeTab === "courses" && (
            courses.length === 0
              ? <div className="pp-empty"><span>📚</span><p>No courses enrolled</p></div>
              : <div className="pp-grid-2">
                  {courses.map((c, i) => (
                    <div className="pp-course-card" key={i}>
                      <div className="pp-course-icon">{["</>","↑","✦","{}"][i % 4]}</div>
                      <p className="pp-course-name">{c.title}</p>
                      <p className="pp-course-doctor">{c.doctor_name}</p>
                    </div>
                  ))}
                </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="pp-sidebar">
          <div className="pp-sc">
            <h3 className="pp-sc-title">ℹ About</h3>
            <p className="pp-sc-bio">{profile.bio || "No bio added yet."}</p>
            <div className="pp-sc-details">
              {profile.faculty       && <p><span>🏛</span> {profile.faculty}</p>}
              {profile.major         && <p><span>💻</span> {profile.major}</p>}
              {profile.academic_year && <p><span>📅</span> Year {profile.academic_year}</p>}
              <p><span>🎓</span> {roleLabel}</p>
            </div>
            {isOwnProfile && (
              <button className="pp-sc-edit-btn" onClick={() => navigate("/edit-profile")}>
                ✏ Edit Profile
              </button>
            )}
          </div>

          {groups.length > 0 && (
            <div className="pp-sc">
              <h3 className="pp-sc-title">👥 Groups</h3>
              {groups.slice(0, 4).map((g, i) => (
                <div className="pp-sc-row" key={i}>
                  <span className="pp-sc-icon">◈</span>
                  <div>
                    <p className="pp-sc-name">{g.name}</p>
                    <p className="pp-sc-sub">{g.member_count || 0} members</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {courses.length > 0 && (
            <div className="pp-sc">
              <h3 className="pp-sc-title">📚 Courses</h3>
              {courses.slice(0, 4).map((c, i) => (
                <div className="pp-sc-row" key={i}>
                  <span className="pp-sc-icon">{["</>","↑","✦","{}"][i % 4]}</span>
                  <div>
                    <p className="pp-sc-name">{c.title}</p>
                    <p className="pp-sc-sub">{c.doctor_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
