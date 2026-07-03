import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import { getSocket } from "../socket";
import "../styles/ProfilePage.css";

const API = "/api";
const token = () => localStorage.getItem("token");
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

const resolveImg = (pic) => {
  if (!pic) return "";
  if (pic.startsWith("data:") || pic.startsWith("http")) return pic;
  return `/${pic.replace(/^\//, "")}`;
};

const TABS = ["Posts", "Files", "Groups", "Courses"];

/* Inline SVG icons (no emoji) */
const Ico = {
  users: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  userPlus: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>),
  book: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>),
  layers: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>),
  file: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>),
  user: (p) => (<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>),
  building: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/></svg>),
  code: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>),
  calendar: (p) => (<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>),
  info: (p) => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>),
  download: (p) => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>),
  share: (p) => (<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"/></svg>),
};

function VerifiedBadge() {
  return <span className="pp-verified" title="Verified">✓</span>;
}

function StatItem({ icon, value, label, onClick }) {
  return (
    <div
      className={`pp-stat${onClick ? " pp-stat-clickable" : ""}`}
      onClick={onClick}
    >
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

function FollowersModal({ profileId, type, onClose }) {
  const navigate = useNavigate();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  const myId = (() => {
    try { return JSON.parse(atob((localStorage.getItem("token") || "").split(".")[1])).id; } catch { return null; }
  })();

  useEffect(() => {
    const url = `${API}/users/${profileId}/${type}`;
    fetch(url, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setUsers(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profileId, type]);

  const toggleFollow = async (targetId) => {
    try {
      await fetch(`${API}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ following_id: targetId }),
      });
      setUsers(prev => prev.map(u =>
        u.id === targetId ? { ...u, is_following: !u.is_following } : u
      ));
    } catch {}
  };

  return (
    <div className="pp-modal-overlay" onClick={onClose}>
      <div className="pp-modal" onClick={e => e.stopPropagation()}>
        <div className="pp-modal-header">
          <h3 className="pp-modal-title">
            {type === "followers" ? "Followers" : "Following"}
          </h3>
          <button className="pp-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="pp-modal-list">
          {loading && (
            <p style={{ textAlign: "center", color: "#00e5ff", padding: "20px" }}>Loading...</p>
          )}
          {!loading && users.length === 0 && (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", padding: "24px" }}>
              No {type} yet.
            </p>
          )}
          {users.map(u => {
            const pic        = resolveImg(u.profile_picture);
            const isVerified = u.role === "doctor" || u.role === "admin";
            const isSelf     = myId != null && Number(u.id) === Number(myId);
            return (
              <div key={u.id} className="pp-modal-user-row">
                <div
                  className="pp-modal-avatar"
                  onClick={() => { navigate(`/profile/${u.username || u.id}`); onClose(); }}
                >
                  {pic
                    ? <img src={pic} alt="" onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                    : null}
                  <span className="pp-modal-initials" style={{ display: pic ? "none" : "flex" }}>
                    {(u.name || "U").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div
                  className="pp-modal-info"
                  onClick={() => { navigate(`/profile/${u.username || u.id}`); onClose(); }}
                >
                  <span className="pp-modal-name">
                    {u.name}
                    {isVerified && <span className="pp-modal-verified">✓</span>}
                  </span>
                  <span className="pp-modal-role">
                    {u.role}
                    {u.role === "student" && u.username && ` · ${u.username}`}
                  </span>
                </div>
                {!isSelf && (
                  <button
                    className={`pp-modal-follow-btn${u.is_following ? " following" : ""}`}
                    onClick={() => toggleFollow(u.id)}
                  >
                    {u.is_following ? "✓ Following" : "+ Follow"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
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
            <button className="pp-download-btn"><Ico.download /> Download</button>
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


export default function ProfilePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isOwnProfile = !id;

  const [profile, setProfile]               = useState(null);
  const [posts, setPosts]                   = useState([]);
  const [files, setFiles]                   = useState([]);
  const [groups, setGroups]                 = useState([]);
  const [courses, setCourses]               = useState([]);
  const [activeTab, setActiveTab]           = useState("Posts");
  const [following, setFollowing]           = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading]   = useState(false);
  const [loading, setLoading]               = useState(true);
  const [shareCopied, setShareCopied]       = useState(false);
  const [inviteCopied, setInviteCopied]     = useState(false);
  const [modal, setModal]                   = useState(null); // "followers" | "following" | null

  // Open the followers modal when arriving via ?tab=followers (e.g. from a follow notification)
  useEffect(() => {
    if (searchParams.get("tab") === "followers") setModal("followers");
  }, [searchParams]);

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
    // Returns true only when a real profile was loaded, so we don't render an
    // empty shell (or pull stats) for a non-existent user id.
    const fetchAll = async () => {
      try {
        const url = id ? `${API}/profile/${id}` : `${API}/profile`;
        const res  = await fetch(url, { headers: authHeaders() });
        if (!res.ok) { setProfile(null); return false; }        // 404 / 400 → not found
        const data = await res.json();
        if (!data || !data.id) { setProfile(null); return false; }
        setProfile(data);
        setFollowersCount(data.followers || 0);
        setFollowingCount(data.following || 0);
        setPosts(data.posts || []);
        return true;
      } catch (err) {
        console.error("Profile fetch failed:", err);
        setProfile(null);
        return false;
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

    // Only load the stats once we know the profile actually exists.
    (async () => {
      const ok = await fetchAll();
      if (ok) { fetchFiles(); fetchGroups(); fetchCourses(); }
    })();
  }, [id]);

  // Check follow state for other users' profiles (uses the resolved numeric id)
  useEffect(() => {
    if (isOwnProfile || !profile?.id) return;
    fetch(`${API}/follow/is-following/${profile.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setFollowing(!!d.isFollowing))
      .catch(() => {});
  }, [profile?.id, isOwnProfile]);

  // ── Real-time: live follower count for the profile being viewed ──
  useEffect(() => {
    const pid = profile?.id;
    if (!pid) return;
    const socket = getSocket();
    const onFollower = (data) => {
      if (Number(data.user_id) !== Number(pid)) return;
      if (typeof data.followers === "number") setFollowersCount(data.followers);
    };
    socket.on("new_follower", onFollower);
    return () => socket.off("new_follower", onFollower);
  }, [profile?.id]);

  const handleFollow = async () => {
    if (followLoading || !profile?.id) return;
    setFollowLoading(true);
    try {
      await fetch(`${API}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ following_id: Number(profile.id) }),
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

  const avatarSrc  = resolveImg(profile.profile_picture || "");
  const isVerified = profile.role === "doctor" || profile.role === "admin";
  const profileId  = profile.id; // always the numeric id (URL param may be a username)

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
              <div className="pp-avatar-fallback" style={{ display: avatarSrc ? "none" : "flex" }}><Ico.user /></div>
              <span className="pp-active-dot" />
            </div>

            <div className="pp-identity">
              <h1 className="pp-name">
                {profile.name}
                {isVerified && <VerifiedBadge />}
              </h1>
              <p className="pp-title">{profile.role}</p>
              <div className="pp-meta-row">
                {profile.faculty      && <span><Ico.building /> {profile.faculty}</span>}
                {profile.major        && <span><Ico.code /> {profile.major}</span>}
                {profile.academic_year && <span><Ico.calendar /> Year {profile.academic_year}</span>}
              </div>
            </div>

            <div className="pp-cta-group">
              {isOwnProfile ? (
                <button className="pp-btn-share" onClick={handleShare}>
                  {shareCopied ? "✓ Copied!" : <><Ico.share /> Share Profile</>}
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
                    {inviteCopied ? "✓ Copied!" : <><Ico.users width="15" height="15" /> Invite Friends</>}
                  </button>
                  <button className="pp-btn-share" onClick={handleShare}>
                    {shareCopied ? "✓ Copied!" : <><Ico.share /> Share</>}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="pp-stats-row">
            <StatItem
              icon={<Ico.users />} value={followersCount} label="Followers"
              onClick={() => setModal("followers")}
            />
            <div className="pp-stats-divider" />
            <StatItem
              icon={<Ico.userPlus />} value={followingCount} label="Following"
              onClick={() => setModal("following")}
            />
            <div className="pp-stats-divider" />
            <StatItem icon={<Ico.book />} value={courses.length} label="Courses" />
            <div className="pp-stats-divider" />
            <StatItem icon={<Ico.layers />} value={groups.length} label="Groups" />
            <div className="pp-stats-divider" />
            <StatItem icon={<Ico.file />} value={files.length} label="Files" />
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
                  ? posts.map(p => (
                      <PostCard
                        key={p.id}
                        post={{ ...p, author: p.name, time: new Date(p.created_at).toLocaleString() }}
                        onUpdate={updated => {
                          if (updated._deleted) setPosts(prev => prev.filter(x => x.id !== updated.id));
                          else setPosts(prev => prev.map(x => x.id === updated.id ? updated : x));
                        }}
                      />
                    ))
                  : <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No posts yet.</p>
                )}
              {activeTab === "Files"   && <FilesTab   files={files} />}
              {activeTab === "Groups"  && <GroupsTab  groups={groups} />}
              {activeTab === "Courses" && <CoursesTab courses={courses} />}
            </div>
          </div>

          <aside className="pp-sidebar">
            <section className="pp-sidebar-card">
              <h3 className="pp-sidebar-title"><Ico.info /> About</h3>
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
              <h3 className="pp-sidebar-title"><Ico.users width="16" height="16" /> Groups</h3>
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
              <h3 className="pp-sidebar-title"><Ico.book width="16" height="16" /> Courses</h3>
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
      {modal && (
        <FollowersModal
          profileId={profileId}
          type={modal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
