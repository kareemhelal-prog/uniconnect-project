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

/* ─── Avatar ─── */
function Avatar({ src, name, size = 120, className = "" }) {
  const [err, setErr] = useState(false);
  const letter = name ? name.trim().charAt(0).toUpperCase() : "?";
  if (src && !err) {
    return <img src={src} alt={name} className={`pp-avatar ${className}`}
      style={{ width: size, height: size }} onError={() => setErr(true)} />;
  }
  return (
    <div className={`pp-avatar-fallback ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {letter}
    </div>
  );
}

/* ─── Full PostCard (same as Home) ─── */
function PostCard({ post: initialPost, profile, currentUserId, onDelete }) {
  const navigate = useNavigate();
  const [post,          setPost]          = useState(initialPost);
  const [liked,         setLiked]         = useState(initialPost.liked ?? false);
  const [likesCount,    setLikesCount]    = useState(initialPost.likes ?? 0);
  const [likeLoading,   setLikeLoading]   = useState(false);
  const [showComments,  setShowComments]  = useState(false);
  const [commentText,   setCommentText]   = useState("");
  const [commentLoad,   setCommentLoad]   = useState(false);
  const [showMenu,      setShowMenu]      = useState(false);
  const [editing,       setEditing]       = useState(false);
  const [editContent,   setEditContent]   = useState(initialPost.content || initialPost.text || "");
  const [editLoad,      setEditLoad]      = useState(false);
  const [error,         setError]         = useState(null);

  const isOwner = currentUserId && post.user_id &&
                  String(currentUserId) === String(post.user_id);

  const comments  = post.comments || [];
  const postText  = post.content || post.text || "";
  const authorName = post.name || profile?.name || "مستخدم";
  const authorPic  = post.profile_picture || profile?.profile_picture || "";
  const dateStr   = post.created_at || post.date
    ? new Date(post.created_at || post.date).toLocaleDateString("ar-EG", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "";

  /* Like toggle */
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
      setError("تعذر تنفيذ الإعجاب");
    } finally { setLikeLoading(false); }
  }, [liked, likeLoading, post.id]);

  /* Add comment */
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
        id: data.id,
        content: data.content || trimmed,
        created_at: data.created_at || new Date().toISOString(),
        user: { id: getCurrentUserId(), name: data.user?.name || "أنت" },
      };
      setPost(p => ({ ...p, comments: [...(p.comments || []), newComment] }));
      setCommentText("");
    } catch { setError("تعذر إضافة التعليق"); }
    finally { setCommentLoad(false); }
  }, [commentText, commentLoad, post.id]);

  /* Delete post */
  const handleDelete = useCallback(async () => {
    setShowMenu(false);
    if (!window.confirm("هل تريد حذف هذا المنشور؟")) return;
    try {
      const res = await authFetch(`${BASE}/posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete(post.id);
    } catch { setError("تعذر حذف المنشور"); }
  }, [post.id, onDelete]);

  /* Edit post */
  const handleEditSave = useCallback(async () => {
    if (!editContent.trim()) return;
    setEditLoad(true);
    try {
      const res = await authFetch(`${BASE}/posts/${post.id}`, {
        method: "PUT", body: JSON.stringify({ content: editContent, title: post.title }),
      });
      if (!res.ok) throw new Error();
      setPost(p => ({ ...p, content: editContent, text: editContent }));
      setEditing(false);
    } catch { setError("تعذر تعديل المنشور"); }
    finally { setEditLoad(false); }
  }, [editContent, post]);

  return (
    <div className="post-card" style={{ marginBottom: 16, direction: "rtl" }}>

      {error && (
        <div className="post-error-banner">
          ⚠ {error}
          <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="post-header">
        <div className="post-avatar-wrap" style={{ background: "linear-gradient(135deg,#00e5ff,#a855f7)", fontSize: 14, fontWeight: 700, color: "#0a0b1a" }}>
          {authorPic
            ? <img src={authorPic} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
            : authorName.charAt(0).toUpperCase()
          }
        </div>
        <div className="post-meta-info">
          <h4 className="post-author" style={{ cursor: "pointer" }}
            onClick={() => navigate(post.user_id ? `/profile/${post.user_id}` : "/profile")}>
            {authorName}
          </h4>
          <span className="post-time">{dateStr}</span>
        </div>
        {isOwner && (
          <div style={{ position: "relative", marginRight: "auto" }}>
            <button className="more-btn" onClick={() => setShowMenu(v => !v)}>•••</button>
            {showMenu && (
              <div style={{
                position: "absolute", left: 0, top: "100%", zIndex: 20,
                background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, overflow: "hidden", minWidth: 140,
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
              }}>
                <button onClick={() => { setEditing(true); setShowMenu(false); }} style={{
                  display: "block", width: "100%", padding: "10px 16px",
                  background: "none", border: "none", color: "#e2e8f0",
                  cursor: "pointer", textAlign: "right", fontSize: 14
                }}>✏ تعديل</button>
                <button onClick={handleDelete} style={{
                  display: "block", width: "100%", padding: "10px 16px",
                  background: "none", border: "none", color: "#f87171",
                  cursor: "pointer", textAlign: "right", fontSize: 14
                }}>🗑 حذف</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit mode */}
      {editing && (
        <div style={{ padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: 8 }}>
          <textarea
            style={{ width: "100%", background: "#0d1117", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6, padding: 10, color: "#e2e8f0", minHeight: 80, resize: "vertical",
              boxSizing: "border-box", fontFamily: "inherit", fontSize: 14 }}
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={handleEditSave} disabled={editLoad}
              style={{ padding: "7px 18px", borderRadius: 6, background: "#a855f7", border: "none", color: "#fff", cursor: "pointer", fontSize: 13 }}>
              {editLoad ? "..." : "حفظ"}
            </button>
            <button onClick={() => setEditing(false)}
              style={{ padding: "7px 18px", borderRadius: 6, background: "rgba(255,255,255,0.08)", border: "none", color: "#e2e8f0", cursor: "pointer", fontSize: 13 }}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="post-body">
        {post.title   && <h3 className="post-title">{post.title}</h3>}
        <p className="post-content">{postText}</p>
      </div>

      {/* Stats */}
      {(likesCount > 0 || comments.length > 0) && (
        <div className="post-stats-row">
          {likesCount > 0 && <span className="post-stat">{likesCount} إعجاب</span>}
          {comments.length > 0 && (
            <span className="post-stat" style={{ cursor: "pointer" }}
              onClick={() => setShowComments(v => !v)}>
              {comments.length} تعليق
            </span>
          )}
        </div>
      )}

      <div className="post-divider" />

      {/* Actions */}
      <div className="post-actions">
        <button
          className={`action-btn like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike} disabled={likeLoading}>
          {likeLoading ? "⏳" : liked ? "❤️" : "🤍"} إعجاب
        </button>
        <button
          className="action-btn comment-btn"
          onClick={() => setShowComments(v => !v)}>
          💬 تعليق
        </button>
        <button className="action-btn share-btn">↗ مشاركة</button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="comments-section">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-avatar" style={{ background: "#a855f7" }}>
                {c.user?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="comment-bubble">
                <span className="comment-author">{c.user?.name || "مستخدم"}</span>
                <p className="comment-text">{c.content}</p>
                <span className="comment-time">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString("ar-EG") : ""}
                </span>
              </div>
            </div>
          ))}
          <div className="comment-input-row">
            <div className="comment-avatar" style={{ background: "#a855f7" }}>أنا</div>
            <input
              className="comment-input"
              placeholder="اكتب تعليقاً..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleComment()}
              disabled={commentLoad}
            />
            <button
              className="comment-send-btn"
              onClick={handleComment}
              disabled={commentLoad || !commentText.trim()}>
              {commentLoad ? "..." : "إرسال"}
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
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();
  const profileId = id || null;
  const isOwnProfile = !profileId || String(currentUserId) === String(profileId);

  const [profile,       setProfile]       = useState(null);
  const [posts,         setPosts]         = useState([]);
  const [files,         setFiles]         = useState([]);
  const [groups,        setGroups]        = useState([]);
  const [courses,       setCourses]       = useState([]);
  const [following,     setFollowing]     = useState(false);
  const [followers,     setFollowers]     = useState(0);
  const [followingCount,setFollowingCount]= useState(0);
  const [followLoad,    setFollowLoad]    = useState(false);
  const [activeTab,     setActiveTab]     = useState("posts");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        // 1. Fetch profile
        const profileUrl = profileId ? `${BASE}/profile/${profileId}` : `${BASE}/profile`;
        const res = await fetch(profileUrl, { headers: authH() });

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          if (res.status === 401) throw new Error("انتهت الجلسة — سجل دخولك مرة أخرى");
          if (res.status === 404) throw new Error(profileId ? "هذا المستخدم غير موجود" : "تعذر تحميل ملفك الشخصي");
          throw new Error(d.detail || d.message || "خطأ في السيرفر");
        }

        const data = await res.json();
        if (cancelled) return;

        const uid = profileId || data.id;
        setProfile(data);
        setFollowers(typeof data.followers === "number" ? data.followers : 0);

        // 2. Fetch posts with full info (likes + comments) in parallel with the rest
        const [
          postsRes, isFollowRes, followingCntRes, filesRes, groupsRes, coursesRes
        ] = await Promise.all([
          uid
            ? fetch(`${BASE}/posts/user/${uid}`, { headers: authH() }).catch(() => null)
            : null,
          (!isOwnProfile && uid)
            ? fetch(`${BASE}/follow/is-following/${uid}`, { headers: authH() }).catch(() => null)
            : null,
          uid
            ? fetch(`${BASE}/follow/following/${uid}`, { headers: authH() }).catch(() => null)
            : null,
          fetch(`${BASE}/files`, { headers: authH() }).catch(() => null),
          fetch(`${BASE}/groups/my-groups`, { headers: authH() }).catch(() => null),
          fetch(`${BASE}/courses/my`, { headers: authH() }).catch(() => null),
        ]);

        if (cancelled) return;

        if (postsRes?.ok) {
          const d = await postsRes.json();
          setPosts(d.data || []);
        } else {
          // Fallback: use profile posts (basic)
          setPosts((data.posts || []).map(p => ({ ...p, liked: false, likes: 0, comments: [] })));
        }

        if (isFollowRes?.ok) {
          const d = await isFollowRes.json(); setFollowing(d.isFollowing || false);
        }
        if (followingCntRes?.ok) {
          const d = await followingCntRes.json();
          setFollowingCount(typeof d.following === "number" ? d.following : 0);
        }
        if (filesRes?.ok)   { const d = await filesRes.json();   setFiles(d.data || []); }
        if (groupsRes?.ok)  { const d = await groupsRes.json();  setGroups(d.data || []); }
        if (coursesRes?.ok) { const d = await coursesRes.json(); setCourses(d.data || []); }

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
    finally { setFollowLoad(false); }
  };

  /* Loading */
  if (loading) {
    return (
      <div className="pp-loading">
        <div className="pp-spinner" />
        <span>جارٍ التحميل...</span>
      </div>
    );
  }

  /* Error */
  if (error || !profile) {
    const isAuth     = error?.includes("جلسة");
    const isNotFound = error?.includes("غير موجود");
    return (
      <div className="pp-error">
        <span className="pp-error-icon">{isAuth ? "🔒" : isNotFound ? "👤" : "⚠"}</span>
        <p className="pp-error-msg">{error || "تعذر تحميل الملف الشخصي"}</p>
        <div className="pp-error-btns">
          <button className="pp-err-btn" onClick={() => navigate(-1)}>← عودة</button>
          {isAuth
            ? <button className="pp-err-btn pp-err-btn-primary" onClick={() => navigate("/login")}>تسجيل الدخول</button>
            : <button className="pp-err-btn pp-err-btn-primary" onClick={() => window.location.reload()}>إعادة المحاولة</button>
          }
        </div>
        {!isAuth && !isNotFound && (
          <p className="pp-error-hint">تأكد أن السيرفر شغال على port 5000</p>
        )}
      </div>
    );
  }

  const displayName = profile.name || "مستخدم";
  const roleLabel   = profile.role === "doctor" ? "دكتور" : profile.role === "investor" ? "مستثمر" : "طالب";

  const TABS = [
    { key: "posts",   label: "المنشورات", icon: "📝" },
    { key: "about",   label: "نبذة عني",  icon: "ℹ" },
    { key: "files",   label: "الملفات",   icon: "📁" },
    { key: "groups",  label: "المجموعات", icon: "👥" },
    { key: "courses", label: "الكورسات",  icon: "📚" },
  ];

  return (
    <div className="pp-root">

      {/* Cover */}
      <div className="pp-cover">
        <div className="pp-cover-grid" />
        <div className="pp-cover-glow" />
        <div className="pp-cover-bottom-fade" />
        {isOwnProfile && (
          <button className="pp-cover-edit-btn" onClick={() => navigate("/edit-profile")}>
            ✏ تعديل الغلاف
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
                {profile.faculty     && <span className="pp-chip">🏛 {profile.faculty}</span>}
                {profile.major       && <span className="pp-chip">💻 {profile.major}</span>}
                {profile.academic_year && <span className="pp-chip">📅 السنة {profile.academic_year}</span>}
              </div>
              {profile.bio && <p className="pp-bio-preview">{profile.bio}</p>}
            </div>

            <div className="pp-action-group">
              {isOwnProfile ? (
                <button className="pp-btn pp-btn-edit" onClick={() => navigate("/edit-profile")}>
                  ✏ تعديل الملف الشخصي
                </button>
              ) : (
                <>
                  <button
                    className={`pp-btn pp-btn-follow${following ? " following" : ""}`}
                    onClick={handleFollow} disabled={followLoad}>
                    {followLoad ? "..." : following ? "✓ تتابعه" : "+ متابعة"}
                  </button>
                  <button className="pp-btn pp-btn-msg">💬 رسالة</button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="pp-stats-bar">
            {[
              { num: followers,     lbl: "متابِع" },
              { num: followingCount,lbl: "يتابع" },
              { num: posts.length,  lbl: "منشور" },
              { num: courses.length,lbl: "كورس" },
              { num: files.length,  lbl: "ملف" },
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
              <button key={t.key} className={`pp-tab${activeTab === t.key ? " active" : ""}`}
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
              ? <div className="pp-empty"><span>📭</span><p>لا توجد منشورات بعد</p></div>
              : posts.map(p => (
                  <PostCard
                    key={p.id}
                    post={p}
                    profile={profile}
                    currentUserId={currentUserId}
                    onDelete={id => setPosts(prev => prev.filter(x => x.id !== id))}
                  />
                ))
          )}

          {/* About */}
          {activeTab === "about" && (
            <div className="pp-about-section">
              <div className="pp-info-card">
                <h3>نبذة عني</h3>
                <p className="pp-about-bio">{profile.bio || "لم تتم إضافة نبذة شخصية بعد."}</p>
              </div>
              <div className="pp-info-card">
                <h3>المعلومات الأكاديمية</h3>
                <div className="pp-info-rows">
                  <div className="pp-info-row"><span>🎓</span><b>الدور:</b><span>{roleLabel}</span></div>
                  {profile.faculty     && <div className="pp-info-row"><span>🏛</span><b>الكلية:</b><span>{profile.faculty}</span></div>}
                  {profile.major       && <div className="pp-info-row"><span>💻</span><b>التخصص:</b><span>{profile.major}</span></div>}
                  {profile.academic_year && <div className="pp-info-row"><span>📅</span><b>السنة:</b><span>السنة {profile.academic_year}</span></div>}
                </div>
              </div>
            </div>
          )}

          {/* Files */}
          {activeTab === "files" && (
            files.length === 0
              ? <div className="pp-empty"><span>📂</span><p>لا توجد ملفات</p></div>
              : <div className="pp-files-list">
                  {files.map((f, i) => (
                    <div className="pp-file-row" key={i}>
                      <span className="pp-file-badge">{(f.file_type || "FILE").slice(0, 3).toUpperCase()}</span>
                      <div className="pp-file-info">
                        <p className="pp-file-name">{f.file_name}</p>
                        <p className="pp-file-size">{f.file_size ? `${(f.file_size/1024).toFixed(1)} KB` : ""}</p>
                      </div>
                      <a href={f.file_url} target="_blank" rel="noreferrer">
                        <button className="pp-download-btn">⬇ تحميل</button>
                      </a>
                    </div>
                  ))}
                </div>
          )}

          {/* Groups */}
          {activeTab === "groups" && (
            groups.length === 0
              ? <div className="pp-empty"><span>👥</span><p>لم ينضم لأي مجموعة بعد</p></div>
              : <div className="pp-grid-2">
                  {groups.map((g, i) => (
                    <div className="pp-group-card" key={i}>
                      <div className="pp-group-icon">◈</div>
                      <p className="pp-group-name">{g.name}</p>
                      <p className="pp-group-members">{g.member_count || 0} عضو</p>
                    </div>
                  ))}
                </div>
          )}

          {/* Courses */}
          {activeTab === "courses" && (
            courses.length === 0
              ? <div className="pp-empty"><span>📚</span><p>لا توجد كورسات مسجلة</p></div>
              : <div className="pp-grid-2">
                  {courses.map((c, i) => (
                    <div className="pp-course-card" key={i}>
                      <div className="pp-course-icon">{["</>","↑","✦","{}"][i%4]}</div>
                      <p className="pp-course-name">{c.title}</p>
                      <p className="pp-course-doctor">{c.doctor_name}</p>
                    </div>
                  ))}
                </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="pp-sidebar">
          <div className="pp-sc">
            <h3 className="pp-sc-title">ℹ نبذة</h3>
            <p className="pp-sc-bio">{profile.bio || "لم تتم إضافة نبذة بعد."}</p>
            <div className="pp-sc-details">
              {profile.faculty     && <p><span>🏛</span> {profile.faculty}</p>}
              {profile.major       && <p><span>💻</span> {profile.major}</p>}
              {profile.academic_year && <p><span>📅</span> السنة {profile.academic_year}</p>}
              <p><span>🎓</span> {roleLabel}</p>
            </div>
            {isOwnProfile && (
              <button className="pp-sc-edit-btn" onClick={() => navigate("/edit-profile")}>
                ✏ تعديل الملف الشخصي
              </button>
            )}
          </div>

          {groups.length > 0 && (
            <div className="pp-sc">
              <h3 className="pp-sc-title">👥 المجموعات</h3>
              {groups.slice(0, 4).map((g, i) => (
                <div className="pp-sc-row" key={i}>
                  <span className="pp-sc-icon">◈</span>
                  <div><p className="pp-sc-name">{g.name}</p><p className="pp-sc-sub">{g.member_count || 0} عضو</p></div>
                </div>
              ))}
            </div>
          )}

          {courses.length > 0 && (
            <div className="pp-sc">
              <h3 className="pp-sc-title">📚 الكورسات</h3>
              {courses.slice(0, 4).map((c, i) => (
                <div className="pp-sc-row" key={i}>
                  <span className="pp-sc-icon">{["</>","↑","✦","{}"][i%4]}</span>
                  <div><p className="pp-sc-name">{c.title}</p><p className="pp-sc-sub">{c.doctor_name}</p></div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
