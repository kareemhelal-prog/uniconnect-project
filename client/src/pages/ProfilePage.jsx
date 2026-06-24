import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import "../styles/ProfilePage.css";

const TABS = ["Posts", "Files", "Groups", "Courses"];

function VerifiedBadge() {
  return <span className="pp-verified" title="Verified">✓</span>;
}

function StatItem({ icon, value, label }) {
  return (
    <div className="pp-stat">
      <span className="pp-stat-icon">{icon}</span>
      <div>
        <span className="pp-stat-value">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        <span className="pp-stat-label">{label}</span>
      </div>
    </div>
  );
}

function PostCard({ post, userName }) {
  const [liked, setLiked] = useState(false);
  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      })
    : "Unknown date";

  return (
    <div className="pp-post-card">
      <div className="pp-post-header">
        <div className="pp-post-avatar">
          {userName ? userName.charAt(0).toUpperCase() : "?"}
        </div>
        <div>
          <p className="pp-post-name">{userName}</p>
          <p className="pp-post-date">{formattedDate}</p>
        </div>
        <button className="pp-post-menu" aria-label="Post options">⋯</button>
      </div>
      <p className="pp-post-text">{post.text}</p>
      <div className="pp-post-actions">
        <button
          className={`pp-action-btn${liked ? " active" : ""}`}
          onClick={() => setLiked(!liked)}
        >
          <span>👍</span> Like
        </button>
        <button className="pp-action-btn"><span>💬</span> Comment</button>
        <button className="pp-action-btn"><span>↗</span> Share</button>
        <button className="pp-action-btn pp-save-btn">🔖 Save</button>
      </div>
    </div>
  );
}

function FilesTab({ files }) {
  if (!files || files.length === 0)
    return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No files uploaded yet.</p>;

  const colors = ["#ef4444", "#f97316", "#3b82f6", "#22c55e", "#a855f7"];

  return (
    <div className="pp-files-list">
      {files.map((f, i) => (
        <div className="pp-file-row" key={i}>
          <span className="pp-file-type" style={{ background: colors[i % colors.length] }}>
            {f.file_type?.toUpperCase().slice(0, 3) || "FILE"}
          </span>
          <div className="pp-file-info">
            <p className="pp-file-name">{f.file_name}</p>
            <p className="pp-file-meta">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : ""}</p>
          </div>
          <a href={f.file_url} target="_blank" rel="noreferrer">
            <button className="pp-download-btn" aria-label={`Download ${f.file_name}`}>⬇ Download</button>
          </a>
        </div>
      ))}
    </div>
  );
}

function GroupsTab({ groups }) {
  const colors = ["#6c47ff", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899"];
  if (!groups || groups.length === 0)
    return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No groups joined yet.</p>;

  return (
    <div className="pp-groups-grid">
      {groups.map((g, i) => (
        <div className="pp-group-card" key={i}>
          <span className="pp-group-icon" style={{ background: colors[i % colors.length] }}>◈</span>
          <div>
            <p className="pp-group-name">{g.name}</p>
            <p className="pp-group-members">{g.member_count || 0} members</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CoursesTab({ courses }) {
  const colors = ["#6c47ff", "#22c55e", "#f59e0b", "#3b82f6"];
  const icons = ["</>", "↑", "✦", "{}"];
  if (!courses || courses.length === 0)
    return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No courses enrolled yet.</p>;

  return (
    <div className="pp-courses-grid">
      {courses.map((c, i) => (
        <div className="pp-course-card" key={i}>
          <span className="pp-course-icon" style={{ background: colors[i % colors.length] }}>
            {icons[i % icons.length]}
          </span>
          <div className="pp-course-info">
            <p className="pp-course-name">{c.title}</p>
            <p className="pp-course-code">{c.doctor_name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const isOwnProfile = !id;
  const [profile, setProfile] = useState(null);
  const [files, setFiles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState("Posts");
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // FIX: token داخل الـ component بس مش في الـ useEffect مباشرة
  const token = localStorage.getItem("token");

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }, []);

  const handleInvite = useCallback(() => {
    // FIX: لو isOwnProfile، نستخدم الـ URL الحالي بدل /profile/undefined
    const profileUrl = id
      ? `${window.location.origin}/profile/${id}`
      : window.location.href;
    navigator.clipboard.writeText(profileUrl).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  }, [id]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const url = id ? `/api/profile/${id}` : "/api/profile";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchFiles = async () => {
      try {
        const userId = id || "me";
        const res = await fetch(`/api/files?user=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setFiles(data.data || []);
      } catch (err) {
        console.error("Failed to fetch files:", err);
      }
    };

    const fetchGroups = async () => {
      try {
        const res = await fetch(`/api/groups/my-groups`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setGroups(data.data || []);
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };

    const fetchCourses = async () => {
      try {
        const res = await fetch(`/api/courses/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setCourses(data.data || []);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };

    fetchProfile();
    fetchFiles();
    fetchGroups();
    fetchCourses();
  }, [id, token]); // FIX: أضفنا token في dependency array

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#00e5ff" }}>
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "rgba(255,255,255,0.5)" }}>
        User not found.
      </div>
    );
  }

  return (
    <div className="pp-root">
      {/* Cover */}
      <div className="pp-cover">
        <div className="pp-cover-overlay" />
      </div>

      {/* Header */}
      <div className="pp-header-wrap">
        <div className="pp-header">
          <div className="pp-avatar-wrap">
            {profile.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={profile.name}
                className="pp-avatar"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.querySelector(".pp-avatar-fallback").style.display = "flex";
                }}
              />
            ) : null}
            <div className="pp-avatar-fallback" style={{ display: profile.profile_picture ? "none" : "flex" }}>
              👤
            </div>
            <span className="pp-active-dot" />
          </div>

          <div className="pp-identity">
            {/* FIX: VerifiedBadge بتتعرض دلوقتي */}
            <h1 className="pp-name">
              {profile.name}
              {profile.verified && <VerifiedBadge />}
            </h1>
            <p className="pp-title">{profile.role}</p>
            <div className="pp-meta-row">
              {profile.faculty && <span>🏛 {profile.faculty}</span>}
              {profile.major && <span>💻 {profile.major}</span>}
              {profile.academic_year && <span>📅 Year {profile.academic_year}</span>}
            </div>
          </div>

          <div className="pp-cta-group">
            {isOwnProfile ? (
              <button className="pp-btn-share" onClick={handleShare}>
                {shareCopied ? "✓ Copied!" : "↗ Share Profile"}
              </button>
            ) : (
              <>
                <button
                  className={`pp-btn-follow${following ? " followed" : ""}`}
                  onClick={() => setFollowing(!following)}
                >
                  {following ? "✓ Following" : "+ Follow"}
                </button>
                <button className="pp-btn-invite" onClick={handleInvite}>
                  {inviteCopied ? "✓ Copied!" : "👥 Invite Friends"}
                </button>
                <button className="pp-btn-share" onClick={handleShare}>
                  {shareCopied ? "✓ Copied!" : "↗ Share"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* FIX: Stats كلها consistent — courses.length للكل المحسوب محلياً */}
        <div className="pp-stats-row">
          <StatItem icon="👥" value={profile.followers || 0} label="Followers" />
          <div className="pp-stats-divider" />
          <StatItem icon="📚" value={courses.length} label="Courses" />
          <div className="pp-stats-divider" />
          <StatItem icon="🗂" value={groups.length} label="Groups" />
          <div className="pp-stats-divider" />
          <StatItem icon="📄" value={files.length} label="Files" />
        </div>
      </div>

      {/* Body */}
      <div className="pp-body">
        <div className="pp-main">
          <nav className="pp-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={`pp-tab${activeTab === t ? " active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="pp-tab-content">
            {activeTab === "Posts" &&
              (profile.posts?.length > 0
                ? profile.posts.map((p) => <PostCard key={p.id} post={p} userName={profile.name} />)
                : <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No posts yet.</p>
              )}
            {activeTab === "Files" && <FilesTab files={files} />}
            {activeTab === "Groups" && <GroupsTab groups={groups} />}
            {activeTab === "Courses" && <CoursesTab courses={courses} />}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="pp-sidebar">
          <section className="pp-sidebar-card">
            <h3 className="pp-sidebar-title">ℹ About</h3>
            <p className="pp-about-text">{profile.bio || "No bio added yet."}</p>
            <div className="pp-about-grid">
              <span className="pp-about-key">Role</span>
              <span className="pp-about-val">{profile.role}</span>
              {profile.faculty && <>
                <span className="pp-about-key">Faculty</span>
                <span className="pp-about-val">{profile.faculty}</span>
              </>}
              {profile.major && <>
                <span className="pp-about-key">Major</span>
                <span className="pp-about-val">{profile.major}</span>
              </>}
              {profile.academic_year && <>
                <span className="pp-about-key">Year</span>
                <span className="pp-about-val">Year {profile.academic_year}</span>
              </>}
            </div>
          </section>

          <section className="pp-sidebar-card">
            <div className="pp-sidebar-row-head">
              <h3 className="pp-sidebar-title">👥 Groups</h3>
            </div>
            {groups.slice(0, 3).map((g, i) => (
              <div className="pp-sg-item" key={i}>
                <span className="pp-sg-icon" style={{ background: "#6c47ff" }}>◈</span>
                <div>
                  <p className="pp-sg-name">{g.name}</p>
                  <p className="pp-sg-members">{g.member_count || 0} members</p>
                </div>
              </div>
            ))}
          </section>

          <section className="pp-sidebar-card">
            <div className="pp-sidebar-row-head">
              <h3 className="pp-sidebar-title">📖 Courses</h3>
            </div>
            <div className="pp-sidebar-courses">
              {courses.slice(0, 4).map((c, i) => (
                <div className="pp-sc-item" key={i}>
                  <span className="pp-sc-icon" style={{ background: "#6c47ff" }}>{"/>"}</span>
                  <div>
                    <p className="pp-sc-name">{c.title}</p>
                    <p className="pp-sc-code">{c.doctor_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}