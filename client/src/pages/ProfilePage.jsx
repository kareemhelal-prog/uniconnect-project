import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/ProfilePage.css";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("token");
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

const resolveImg = (pic) => {
  if (!pic) return "";
  if (pic.startsWith("data:") || pic.startsWith("http")) return pic;
  return `http://localhost:5000/${pic.replace(/^\//, "")}`;
};

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

function FilesTab({ files }) {
  const colors = ["#ef4444", "#f97316", "#3b82f6", "#22c55e", "#a855f7"];
  if (!files || files.length === 0)
    return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No files uploaded yet.</p>;
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
            <button className="pp-download-btn">⬇ Download</button>
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
  const icons  = ["</>", "↑", "✦", "{}"];
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

function ProfilePostCard({ post }) {
  const [liked, setLiked]   = useState(!!post.liked);
  const [count, setCount]   = useState(Number(post.likes) || 0);
  const pic = resolveImg(post.profile_picture || "");
  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Unknown date";

  const handleLike = async () => {
    try {
      await fetch(`${API}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ post_id: post.id }),
      });
      setLiked(l => !l);
      setCount(c => liked ? c - 1 : c + 1);
    } catch {}
  };

  return (
    <div className="pp-post-card">
      <div className="pp-post-header">
        <div className="pp-post-avatar-wrap">
          {pic
            ? <img src={pic} alt="" className="pp-post-avatar-img" onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
            : null}
          <span className="pp-post-avatar-fallback" style={{ display: pic ? "none" : "flex" }}>
            {(post.name || "U").slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <p className="pp-post-name">{post.name}</p>
          <p className="pp-post-date" style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
            {post.role && <span style={{ textTransform: "capitalize", marginRight: 4 }}>{post.role}</span>}
            · {formattedDate}
          </p>
        </div>
        <button className="pp-post-menu" aria-label="Post options">⋯</button>
      </div>
      {post.title && <h4 className="pp-post-title">{post.title}</h4>}
      <p className="pp-post-text">{post.content}</p>
      <div className="pp-post-actions">
        <button className={`pp-action-btn${liked ? " active" : ""}`} onClick={handleLike}>
          <span>{liked ? "❤️" : "👍"}</span> Like ({count})
        </button>
        <button className="pp-action-btn"><span>💬</span> Comment ({post.comments_count || 0})</button>
        <button className="pp-action-btn"><span>↗</span> Share</button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const isOwnProfile = !id;

  const [profile, setProfile]               = useState(null);
  const [posts, setPosts]                   = useState([]);
  const [files, setFiles]                   = useState([]);
  const [groups, setGroups]                 = useState([]);
  const [courses, setCourses]               = useState([]);
  const [activeTab, setActiveTab]           = useState("Posts");
  const [following, setFollowing]           = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading]   = useState(false);
  const [loading, setLoading]               = useState(true);
  const [shareCopied, setShareCopied]       = useState(false);
  const [inviteCopied, setInviteCopied]     = useState(false);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }, []);

  const handleInvite = useCallback(() => {
    const url = id ? `${window.location.origin}/profile/${id}` : window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  }, [id]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const url = id ? `${API}/profile/${id}` : `${API}/profile`;
        const res  = await fetch(url, { headers: authHeaders() });
        const data = await res.json();
        setProfile(data);
        setFollowersCount(data.followers || 0);
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Profile fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchFiles = async () => {
      try {
        const res  = await fetch(`${API}/files?user=${id || "me"}`, { headers: authHeaders() });
        const data = await res.json();
        setFiles(data.data || []);
      } catch {}
    };

    const fetchGroups = async () => {
      try {
        const res  = await fetch(`${API}/groups/my-groups`, { headers: authHeaders() });
        const data = await res.json();
        setGroups(data.data || []);
      } catch {}
    };

    const fetchCourses = async () => {
      try {
        const res  = await fetch(`${API}/courses/my`, { headers: authHeaders() });
        const data = await res.json();
        setCourses(data.data || []);
      } catch {}
    };

    fetchAll();
    fetchFiles();
    fetchGroups();
    fetchCourses();
  }, [id]);

  // Check follow state for other users' profiles
  useEffect(() => {
    if (isOwnProfile || !id) return;
    fetch(`${API}/follow/is-following/${id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setFollowing(!!d.isFollowing))
      .catch(() => {});
  }, [id, isOwnProfile]);

  const handleFollow = async () => {
    if (followLoading || !id) return;
    setFollowLoading(true);
    try {
      await fetch(`${API}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ following_id: Number(id) }),
      });
      const wasFollowing = following;
      setFollowing(f => !f);
      setFollowersCount(c => wasFollowing ? c - 1 : c + 1);
    } catch {} finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", color: "#00e5ff" }}>
          Loading...
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", color: "rgba(255,255,255,0.5)" }}>
          User not found.
        </div>
      </>
    );
  }

  const avatarSrc = resolveImg(profile.profile_picture || "");
  const isVerified = profile.role === "doctor" || profile.role === "admin";

  return (
    <>
      <Navbar />
      <div className="pp-root">
        {/* Cover */}
        <div className="pp-cover">
          <div className="pp-cover-overlay" />
        </div>

        {/* Header */}
        <div className="pp-header-wrap">
          <div className="pp-header">
            <div className="pp-avatar-wrap">
              {avatarSrc
                ? <img src={avatarSrc} alt={profile.name} className="pp-avatar" onError={e => { e.target.style.display = "none"; e.target.parentNode.querySelector(".pp-avatar-fallback").style.display = "flex"; }} />
                : null}
              <div className="pp-avatar-fallback" style={{ display: avatarSrc ? "none" : "flex" }}>👤</div>
              <span className="pp-active-dot" />
            </div>

            <div className="pp-identity">
              <h1 className="pp-name">
                {profile.name}
                {isVerified && <VerifiedBadge />}
              </h1>
              <p className="pp-title">{profile.role}</p>
              <div className="pp-meta-row">
                {profile.faculty      && <span>🏛 {profile.faculty}</span>}
                {profile.major        && <span>💻 {profile.major}</span>}
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
                    onClick={handleFollow}
                    disabled={followLoading}
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

          <div className="pp-stats-row">
            <StatItem icon="👥" value={followersCount} label="Followers" />
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
                (posts.length > 0
                  ? posts.map(p => <ProfilePostCard key={p.id} post={p} />)
                  : <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No posts yet.</p>
                )}
              {activeTab === "Files"   && <FilesTab   files={files} />}
              {activeTab === "Groups"  && <GroupsTab  groups={groups} />}
              {activeTab === "Courses" && <CoursesTab courses={courses} />}
            </div>
          </div>

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
              <h3 className="pp-sidebar-title">👥 Groups</h3>
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
              <h3 className="pp-sidebar-title">📖 Courses</h3>
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
    </>
  );
}
