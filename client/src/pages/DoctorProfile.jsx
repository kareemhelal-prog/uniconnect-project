import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/DoctorProfile.css";
import api from "../api/axios";

const TABS = ["Posts", "Files", "Groups", "Courses"];

function VerifiedBadge() {
  return <span className="dp-verified" title="Verified">✓</span>;
}

function StatItem({ icon, value, label }) {
  return (
    <div className="dp-stat">
      <span className="dp-stat-icon">{icon}</span>
      <div>
        <span className="dp-stat-value">{typeof value === "number" ? value.toLocaleString() : value}</span>
        <span className="dp-stat-label">{label}</span>
      </div>
    </div>
  );
}

function PostCard({ post, doctorName }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const handleLike = async () => {
    try {
      if (liked) {
        await api.delete(`/posts/${post.id}/like`);
        setLikesCount((c) => c - 1);
      } else {
        await api.post(`/posts/${post.id}/like`);
        setLikesCount((c) => c + 1);
      }
      setLiked(!liked);
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  return (
    <div className="dp-post-card">
      <div className="dp-post-header">
        <div className="dp-post-avatar">{doctorName?.[0] || "D"}</div>
        <div>
          <p className="dp-post-name">{doctorName}</p>
          <p className="dp-post-date">{new Date(post.created_at).toLocaleString()}</p>
        </div>
        <button className="dp-post-menu">⋯</button>
      </div>
      <p className="dp-post-text">{post.content}</p>
      <div className="dp-post-actions">
        <button className={`dp-action-btn${liked ? " active" : ""}`} onClick={handleLike}>
          <span>👍</span> Like ({likesCount})
        </button>
        <button className="dp-action-btn"><span>💬</span> Comment</button>
      </div>
    </div>
  );
}

function FilesTab({ files }) {
  if (!files || files.length === 0)
    return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No files uploaded yet.</p>;
  const colors = ["#ef4444", "#f97316", "#3b82f6"];
  return (
    <div className="dp-files-list">
      {files.map((f, i) => (
        <div className="dp-file-row" key={f.id}>
          <span className="dp-file-type" style={{ background: colors[i % colors.length] }}>
            {f.file_type?.toUpperCase().slice(0, 3) || "FILE"}
          </span>
          <div className="dp-file-info">
            <p className="dp-file-name">{f.file_name}</p>
            <p className="dp-file-meta">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : ""}</p>
          </div>
          <a href={f.file_url} target="_blank" rel="noreferrer">
            <button className="dp-download-btn">⬇ Download</button>
          </a>
        </div>
      ))}
    </div>
  );
}

function GroupsTab({ groups }) {
  const colors = ["#6c47ff", "#22c55e", "#f59e0b"];
  if (!groups || groups.length === 0)
    return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No groups yet.</p>;
  return (
    <div className="dp-groups-grid">
      {groups.map((g, i) => (
        <div className="dp-group-card" key={g.id}>
          <span className="dp-group-icon" style={{ background: colors[i % colors.length] }}>◈</span>
          <div>
            <p className="dp-group-name">{g.name}</p>
            <p className="dp-group-members">{g.member_count || 0} members</p>
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
    return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No courses yet.</p>;
  return (
    <div className="dp-courses-grid">
      {courses.map((c, i) => (
        <div className="dp-course-card" key={c.id}>
          <span className="dp-course-icon" style={{ background: colors[i % colors.length] }}>
            {icons[i % icons.length]}
          </span>
          <div className="dp-course-info">
            <p className="dp-course-name">{c.title}</p>
            <p className="dp-course-code">{c.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DoctorProfile() {
  const { id } = useParams();
  const [profile,  setProfile]  = useState(null);
  const [posts,    setPosts]    = useState([]);
  const [files,    setFiles]    = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState("Posts");
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const profileUrl = id ? `/profile/${id}` : "/profile";
        const [profileRes, postsRes, filesRes, groupsRes, coursesRes] = await Promise.all([
          api.get(profileUrl),
          api.get(id ? `/posts?user_id=${id}` : "/posts/my"),
          api.get(id ? `/files?user=${id}` : "/files/my"),
          api.get("/groups/my-groups"),
          api.get(id ? `/courses?doctor_id=${id}` : "/courses/my"),
        ]);
        setProfile(profileRes.data.data || profileRes.data);
        setPosts(postsRes.data.data   || postsRes.data   || []);
        setFiles(filesRes.data.data   || filesRes.data   || []);
        setGroups(groupsRes.data.data  || groupsRes.data  || []);
        setCourses(coursesRes.data.data || coursesRes.data || []);
      } catch (err) {
        console.error("Failed to fetch doctor profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleFollow = async () => {
    try {
      if (following) {
        await api.delete(`/follow/${id}`);
      } else {
        await api.post(`/follow/${id}`);
      }
      setFollowing(!following);
    } catch (err) {
      console.error("Follow failed:", err);
    }
  };

  if (loading) return <div style={{ color: "#00e5ff", padding: "2rem", textAlign: "center" }}>Loading...</div>;
  if (!profile) return <div style={{ color: "#f87171", padding: "2rem" }}>Doctor not found.</div>;

  return (
    <div className="dp-root">
      <div className="dp-cover"><div className="dp-cover-overlay" /></div>

      <div className="dp-header-wrap">
        <div className="dp-header">
          <div className="dp-avatar-wrap">
            {profile.profile_picture ? (
              <img src={profile.profile_picture} alt={profile.name} className="dp-avatar" />
            ) : (
              <div className="dp-avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                {profile.name?.[0] || "D"}
              </div>
            )}
            <span className="dp-active-dot" />
          </div>

          <div className="dp-identity">
            <h1 className="dp-name">{profile.name} <VerifiedBadge /></h1>
            <p className="dp-title">Doctor</p>
            <div className="dp-meta-row">
              {profile.faculty         && <span>🏛 {profile.faculty}</span>}
              {profile.specialization  && <span>💻 {profile.specialization}</span>}
              {profile.office_location && <span>📍 {profile.office_location}</span>}
            </div>
          </div>

          <div className="dp-cta-group">
            {id && (
              <button className={`dp-btn-follow${following ? " followed" : ""}`} onClick={handleFollow}>
                {following ? "✓ Following" : "+ Follow"}
              </button>
            )}
          </div>
        </div>

        <div className="dp-stats-row">
          <StatItem icon="👥" value={profile.followers_count || 0} label="Followers" />
          <div className="dp-stats-divider" />
          <StatItem icon="📚" value={courses.length} label="Courses" />
          <div className="dp-stats-divider" />
          <StatItem icon="🗂" value={groups.length}  label="Groups" />
          <div className="dp-stats-divider" />
          <StatItem icon="📄" value={files.length}   label="Files" />
        </div>
      </div>

      <div className="dp-body">
        <div className="dp-main">
          <nav className="dp-tabs">
            {TABS.map((t) => (
              <button key={t} className={`dp-tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
                {t}
              </button>
            ))}
          </nav>

          <div className="dp-tab-content">
            {activeTab === "Posts"   && (posts.length > 0 ? posts.map((p) => <PostCard key={p.id} post={p} doctorName={profile.name} />) : <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No posts yet.</p>)}
            {activeTab === "Files"   && <FilesTab files={files} />}
            {activeTab === "Groups"  && <GroupsTab groups={groups} />}
            {activeTab === "Courses" && <CoursesTab courses={courses} />}
          </div>
        </div>

        <aside className="dp-sidebar">
          <section className="dp-sidebar-card">
            <h3 className="dp-sidebar-title">ℹ About</h3>
            <p className="dp-about-text">{profile.bio || "No bio added yet."}</p>
            <div className="dp-about-grid">
              {profile.specialization  && <><span className="dp-about-key">Specialization</span><span className="dp-about-val">{profile.specialization}</span></>}
              {profile.office_location && <><span className="dp-about-key">Office</span><span className="dp-about-val">{profile.office_location}</span></>}
            </div>
          </section>

          <section className="dp-sidebar-card">
            <div className="dp-sidebar-row-head">
              <h3 className="dp-sidebar-title">📖 Courses</h3>
            </div>
            <div className="dp-sidebar-courses">
              {courses.slice(0, 4).map((c, i) => (
                <div className="dp-sc-item" key={c.id}>
                  <span className="dp-sc-icon" style={{ background: "#6c47ff" }}>{"/>"}</span>
                  <div>
                    <p className="dp-sc-name">{c.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dp-sidebar-card">
            <div className="dp-sidebar-row-head">
              <h3 className="dp-sidebar-title">👥 Groups</h3>
            </div>
            {groups.slice(0, 3).map((g, i) => (
              <div className="dp-sg-item" key={g.id}>
                <span className="dp-sg-icon" style={{ background: "#6c47ff" }}>◈</span>
                <div>
                  <p className="dp-sg-name">{g.name}</p>
                  <p className="dp-sg-members">{g.member_count || 0} members</p>
                </div>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}