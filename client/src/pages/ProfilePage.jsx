import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";

function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).id;
  } catch { return null; }
}

function Avatar({ src, name, size = 120 }) {
  const [err, setErr] = useState(false);
  const letter = name ? name.trim().charAt(0).toUpperCase() : "?";
  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        className="pp-avatar"
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className="pp-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {letter}
    </div>
  );
}

function PostCard({ post, profile, currentUserId, onDelete }) {
  const [liked, setLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const token = localStorage.getItem("token");
  const BASE = "http://localhost:5000/api";
  const isOwner = String(currentUserId) === String(profile?.id);

  const handleDelete = async () => {
    if (!window.confirm("هل تريد حذف هذا المنشور؟")) return;
    try {
      await fetch(`${BASE}/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete(post.id);
    } catch { alert("فشل الحذف، حاول مرة أخرى"); }
    setShowMenu(false);
  };

  const dateStr = post.date
    ? new Date(post.date).toLocaleDateString("ar-EG", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "";

  return (
    <div className="pp-post-card">
      <div className="pp-post-header">
        <Avatar src={profile?.profile_picture} name={profile?.name} size={44} />
        <div className="pp-post-meta">
          <span className="pp-post-author">{profile?.name || "مستخدم"}</span>
          <span className="pp-post-date">{dateStr}</span>
        </div>
        {isOwner && (
          <div className="pp-post-menu-wrap">
            <button className="pp-post-menu-btn" onClick={() => setShowMenu(!showMenu)}>⋯</button>
            {showMenu && (
              <div className="pp-post-dropdown">
                <button onClick={handleDelete}>🗑 حذف المنشور</button>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="pp-post-text">{post.text}</p>
      <div className="pp-post-actions">
        <button className={`pp-action-btn${liked ? " liked" : ""}`} onClick={() => setLiked(!liked)}>
          <span>👍</span> إعجاب
        </button>
        <button className="pp-action-btn"><span>💬</span> تعليق</button>
        <button className="pp-action-btn"><span>↗</span> مشاركة</button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUserId = getCurrentUserId();
  const profileId = id || null;
  const isOwnProfile = !profileId || String(currentUserId) === String(profileId);

  const BASE = "http://localhost:5000/api";
  const authH = { Authorization: `Bearer ${token}` };

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [files, setFiles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoad, setFollowLoad] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      try {
        // If no profileId (own profile), try to get it from current user data
        let resolvedProfileId = profileId;

        // If visiting own profile via /profile/:id but we can also try /profile
        const profileUrl = resolvedProfileId
          ? `${BASE}/profile/${resolvedProfileId}`
          : `${BASE}/profile`;

        const res = await fetch(profileUrl, { headers: authH });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          // If own profile returns 404, token is stale → force re-login
          if (res.status === 404 && !profileId) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
          if (res.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
          if (res.status === 404) throw new Error("هذا المستخدم غير موجود أو تم حذف حسابه");
          throw new Error(errData.detail || errData.message || "فشل تحميل الملف الشخصي — تأكد أن السيرفر شغال");
        }

        const data = await res.json();
        if (cancelled) return;

        const uid = profileId || data.id;
        setProfile(data);
        setPosts(data.posts || []);
        setFollowers(typeof data.followers === "number" ? data.followers : 0);

        // Parallel: follow-state + following-count + files + groups + courses
        const [isFollowRes, followingCntRes, filesRes, groupsRes, coursesRes] = await Promise.all([
          (!isOwnProfile && uid)
            ? fetch(`${BASE}/follow/is-following/${uid}`, { headers: authH }).catch(() => null)
            : null,
          uid
            ? fetch(`${BASE}/follow/following/${uid}`, { headers: authH }).catch(() => null)
            : null,
          fetch(`${BASE}/files`, { headers: authH }).catch(() => null),
          fetch(`${BASE}/groups/my-groups`, { headers: authH }).catch(() => null),
          fetch(`${BASE}/courses/my`, { headers: authH }).catch(() => null),
        ]);

        if (cancelled) return;

        if (isFollowRes?.ok) {
          const d = await isFollowRes.json();
          setFollowing(d.isFollowing || false);
        }
        if (followingCntRes?.ok) {
          const d = await followingCntRes.json();
          setFollowingCount(typeof d.following === "number" ? d.following : 0);
        }
        if (filesRes?.ok) { const d = await filesRes.json(); setFiles(d.data || []); }
        if (groupsRes?.ok) { const d = await groupsRes.json(); setGroups(d.data || []); }
        if (coursesRes?.ok) { const d = await coursesRes.json(); setCourses(d.data || []); }

      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [id]);

  const handleFollow = async () => {
    if (!profileId || followLoad) return;
    setFollowLoad(true);
    const prev = following;
    setFollowing(!prev);
    try {
      const res = await fetch(`${BASE}/follow`, {
        method: "POST",
        headers: { ...authH, "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: parseInt(profileId) }),
      });
      if (!res.ok) throw new Error();
      // Fetch verified count from server
      const r = await fetch(`${BASE}/follow/followers/${profileId}`, { headers: authH });
      if (r.ok) {
        const d = await r.json();
        setFollowers(typeof d.followers === "number" ? d.followers : 0);
      }
    } catch {
      setFollowing(prev); // rollback on error
    } finally {
      setFollowLoad(false);
    }
  };

  if (loading) {
    return (
      <div className="pp-loading">
        <div className="pp-spinner" />
        <span>جارٍ التحميل...</span>
      </div>
    );
  }

  if (error || !profile) {
    const isAuthError = error?.includes("جلسة");
    return (
      <div className="pp-error">
        <span className="pp-error-icon">{isAuthError ? "🔒" : "⚠"}</span>
        <p>{error || "المستخدم غير موجود"}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate(-1)}>← عودة</button>
          {isAuthError ? (
            <button onClick={() => navigate("/login")} style={{ borderColor: "#00e5ff", color: "#00e5ff" }}>
              تسجيل الدخول
            </button>
          ) : (
            <button onClick={() => window.location.reload()} style={{ borderColor: "#00e5ff", color: "#00e5ff" }}>
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    );
  }

  const displayName = profile.name || "مستخدم";
  const roleLabel =
    profile.role === "doctor" ? "دكتور" :
    profile.role === "investor" ? "مستثمر" : "طالب";

  const TABS = [
    { key: "posts",   label: "المنشورات",    icon: "📝" },
    { key: "about",   label: "نبذة عني",     icon: "ℹ" },
    { key: "files",   label: "الملفات",      icon: "📁" },
    { key: "groups",  label: "المجموعات",    icon: "👥" },
    { key: "courses", label: "الكورسات",     icon: "📚" },
  ];

  return (
    <div className="pp-root">

      {/* ═══ COVER ═══ */}
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

      {/* ═══ HEADER ═══ */}
      <div className="pp-header-section">
        <div className="pp-header-inner">

          {/* Top row: avatar + identity + actions */}
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
                {profile.faculty && <span className="pp-chip">🏛 {profile.faculty}</span>}
                {profile.major && <span className="pp-chip">💻 {profile.major}</span>}
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
                    onClick={handleFollow}
                    disabled={followLoad}
                  >
                    {followLoad ? "..." : following ? "✓ تتابعه" : "+ متابعة"}
                  </button>
                  <button className="pp-btn pp-btn-msg">💬 رسالة</button>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="pp-stats-bar">
            <div className="pp-stat">
              <span className="pp-stat-num">{followers.toLocaleString()}</span>
              <span className="pp-stat-lbl">متابِع</span>
            </div>
            <div className="pp-stat-divider" />
            <div className="pp-stat">
              <span className="pp-stat-num">{followingCount.toLocaleString()}</span>
              <span className="pp-stat-lbl">يتابع</span>
            </div>
            <div className="pp-stat-divider" />
            <div className="pp-stat">
              <span className="pp-stat-num">{posts.length}</span>
              <span className="pp-stat-lbl">منشور</span>
            </div>
            <div className="pp-stat-divider" />
            <div className="pp-stat">
              <span className="pp-stat-num">{courses.length}</span>
              <span className="pp-stat-lbl">كورس</span>
            </div>
            <div className="pp-stat-divider" />
            <div className="pp-stat">
              <span className="pp-stat-num">{files.length}</span>
              <span className="pp-stat-lbl">ملف</span>
            </div>
          </div>

          {/* Tabs */}
          <nav className="pp-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`pp-tab${activeTab === t.key ? " active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                <span className="pp-tab-icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="pp-body">

        {/* Main content */}
        <div className="pp-main">

          {/* Posts tab */}
          {activeTab === "posts" && (
            posts.length === 0 ? (
              <div className="pp-empty">
                <span>📭</span>
                <p>لا توجد منشورات بعد</p>
                {isOwnProfile && (
                  <small>انشر أول منشور لك من الصفحة الرئيسية</small>
                )}
              </div>
            ) : (
              posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  profile={profile}
                  currentUserId={currentUserId}
                  onDelete={(deletedId) => setPosts((prev) => prev.filter((x) => x.id !== deletedId))}
                />
              ))
            )
          )}

          {/* About tab */}
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
                  {profile.faculty && <div className="pp-info-row"><span>🏛</span><b>الكلية:</b><span>{profile.faculty}</span></div>}
                  {profile.major && <div className="pp-info-row"><span>💻</span><b>التخصص:</b><span>{profile.major}</span></div>}
                  {profile.academic_year && <div className="pp-info-row"><span>📅</span><b>السنة:</b><span>السنة {profile.academic_year}</span></div>}
                </div>
              </div>
            </div>
          )}

          {/* Files tab */}
          {activeTab === "files" && (
            files.length === 0 ? (
              <div className="pp-empty"><span>📂</span><p>لا توجد ملفات</p></div>
            ) : (
              <div className="pp-files-list">
                {files.map((f, i) => (
                  <div className="pp-file-row" key={i}>
                    <span className="pp-file-badge">{(f.file_type || "FILE").slice(0, 3).toUpperCase()}</span>
                    <div className="pp-file-info">
                      <p className="pp-file-name">{f.file_name}</p>
                      <p className="pp-file-size">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : ""}</p>
                    </div>
                    <a href={f.file_url} target="_blank" rel="noreferrer">
                      <button className="pp-download-btn">⬇ تحميل</button>
                    </a>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Groups tab */}
          {activeTab === "groups" && (
            groups.length === 0 ? (
              <div className="pp-empty"><span>👥</span><p>لم ينضم لأي مجموعة بعد</p></div>
            ) : (
              <div className="pp-grid-2">
                {groups.map((g, i) => (
                  <div className="pp-group-card" key={i}>
                    <div className="pp-group-icon">◈</div>
                    <p className="pp-group-name">{g.name}</p>
                    <p className="pp-group-members">{g.member_count || 0} عضو</p>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Courses tab */}
          {activeTab === "courses" && (
            courses.length === 0 ? (
              <div className="pp-empty"><span>📚</span><p>لا توجد كورسات مسجلة</p></div>
            ) : (
              <div className="pp-grid-2">
                {courses.map((c, i) => (
                  <div className="pp-course-card" key={i}>
                    <div className="pp-course-icon">{["</>", "↑", "✦", "{}"][i % 4]}</div>
                    <p className="pp-course-name">{c.title}</p>
                    <p className="pp-course-doctor">{c.doctor_name}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Sidebar */}
        <aside className="pp-sidebar">
          {/* About card */}
          <div className="pp-sc">
            <h3 className="pp-sc-title">ℹ نبذة</h3>
            <p className="pp-sc-bio">{profile.bio || "لم تتم إضافة نبذة بعد."}</p>
            <div className="pp-sc-details">
              {profile.faculty && <p><span>🏛</span> {profile.faculty}</p>}
              {profile.major && <p><span>💻</span> {profile.major}</p>}
              {profile.academic_year && <p><span>📅</span> السنة {profile.academic_year}</p>}
              <p><span>🎓</span> {roleLabel}</p>
            </div>
            {isOwnProfile && (
              <button className="pp-sc-edit-btn" onClick={() => navigate("/edit-profile")}>
                ✏ تعديل الملف الشخصي
              </button>
            )}
          </div>

          {/* Groups mini */}
          {groups.length > 0 && (
            <div className="pp-sc">
              <h3 className="pp-sc-title">👥 المجموعات</h3>
              {groups.slice(0, 4).map((g, i) => (
                <div className="pp-sc-row" key={i}>
                  <span className="pp-sc-icon">◈</span>
                  <div>
                    <p className="pp-sc-name">{g.name}</p>
                    <p className="pp-sc-sub">{g.member_count || 0} عضو</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Courses mini */}
          {courses.length > 0 && (
            <div className="pp-sc">
              <h3 className="pp-sc-title">📚 الكورسات</h3>
              {courses.slice(0, 4).map((c, i) => (
                <div className="pp-sc-row" key={i}>
                  <span className="pp-sc-icon">{["</>", "↑", "✦", "{}"][i % 4]}</span>
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
