import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/GroupDetails.css";
import api from "../api/axios";

const Avatar = ({ initials, color, size = 40, online }) => (
  <div className="gd2-avatar-wrap" style={{ width: size, height: size }}>
    <div className="gd2-avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
    {online !== undefined && <span className={`gd2-dot ${online ? "online" : "offline"}`} />}
  </div>
);

const RoleBadge = ({ role }) => {
  const map = { admin: "badge-admin", moderator: "badge-mod", member: "badge-member" };
  return <span className={`gd2-badge ${map[role?.toLowerCase()] || "badge-member"}`}>{role}</span>;
};

const SkeletonPost = () => (
  <div className="gd2-card gd2-skeleton-post">
    <div className="sk-row"><div className="sk-circle" /><div className="sk-lines"><div className="sk-line w60" /><div className="sk-line w40" /></div></div>
    <div className="sk-line w100 mt12" /><div className="sk-line w80 mt6" />
  </div>
);

const TABS = [
  { id: "posts",   label: "Posts",   icon: "📝" },
  { id: "members", label: "Members", icon: "👥" },
  { id: "media",   label: "Media",   icon: "📎" },
  { id: "about",   label: "About",   icon: "📖" },
];

const RULES = [
  "Be respectful to all members.",
  "No spamming or off-topic posts.",
  "Upload only course-related files.",
  "Credit original sources when sharing content.",
];

export default function GroupDetails() {
  const { id } = useParams();

  const [group,       setGroup]       = useState(null);
  const [posts,       setPosts]       = useState([]);
  const [members,     setMembers]     = useState([]);
  const [media,       setMedia]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab,   setActiveTab]   = useState("posts");
  const [isJoined,    setIsJoined]    = useState(false);
  const [postDraft,   setPostDraft]   = useState("");
  const [showPostBox, setShowPostBox] = useState(false);
  const [copied,      setCopied]      = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/groups/${id}`);
      const data = res.data.data || res.data;
      setGroup(data);
      setIsJoined(data.is_member || false);
    } catch (err) {
      console.error("Failed to fetch group:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPosts = useCallback(async () => {
    if (!id) return;
    setPostsLoading(true);
    try {
      const res = await api.get(`/groups/${id}/posts`);
      setPosts(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch group posts:", err);
    } finally {
      setPostsLoading(false);
    }
  }, [id]);

  const fetchMembers = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/groups/${id}/members`);
      setMembers(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  }, [id]);

  const fetchMedia = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/groups/${id}/files`);
      setMedia(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch media:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchGroup();
    fetchPosts();
    fetchMembers();
    fetchMedia();
  }, [fetchGroup, fetchPosts, fetchMembers, fetchMedia]);

  const handleJoin = async () => {
    try {
      if (isJoined) {
        await api.delete("/groups/leave", { data: { group_id: id } });
      } else {
        await api.post("/groups/join", { group_id: id });
      }
      setIsJoined(!isJoined);
    } catch (err) {
      console.error("Join/leave failed:", err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (post?.is_liked) {
        await api.delete(`/groups/posts/${postId}/like`);
      } else {
        await api.post(`/groups/posts/${postId}/like`);
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, is_liked: !p.is_liked, likes_count: (p.likes_count || 0) + (p.is_liked ? -1 : 1) }
            : p
        )
      );
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const handleSubmitPost = async () => {
    if (!postDraft.trim()) return;
    try {
      const res = await api.post(`/groups/${id}/posts`, { content: postDraft.trim() });
      const newPost = res.data.data || res.data;
      setPosts((prev) => [newPost, ...prev]);
      setPostDraft("");
      setShowPostBox(false);
    } catch (err) {
      console.error("Post failed:", err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={{ color: "#00e5ff", padding: "2rem", textAlign: "center" }}>Loading...</div>;
  if (!group)  return <div style={{ color: "#f87171", padding: "2rem" }}>Group not found.</div>;

  const accentColor    = "#6c47ff";
  const coverGradient  = `linear-gradient(135deg, ${accentColor}cc 0%, #0f172a 100%)`;

  return (
    <div className="gd2-root">
      <Navbar role="student" activePage="groups" notifications={[]} user={{ initials: "ME" }} onNavigate={() => {}} />

      <div className="gd2-hero" style={{ background: coverGradient }}>
        <div className="gd2-hero-noise" />
        <div className="gd2-hero-body">
          <div className="gd2-group-avatar" style={{ background: accentColor }}>
            <span>{group.group_image ? <img src={group.group_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : "👥"}</span>
          </div>

          <div className="gd2-hero-info">
            <div className="gd2-privacy-pill">
              {group.is_private ? "🔒 Private" : "🌐 Public"}
            </div>
            <h1 className="gd2-title">{group.name}</h1>
            <p className="gd2-subtitle">{group.description}</p>

            <div className="gd2-stats-row">
              <span className="gd2-stat">👥 {group.members_count || members.length} members</span>
              <span className="gd2-stat-sep">·</span>
              <span className="gd2-stat">📝 {posts.length} posts</span>
            </div>

            <div className="gd2-cta-row">
              <button
                className={`gd2-join-btn ${isJoined ? "joined" : ""}`}
                style={!isJoined ? { background: accentColor } : {}}
                onClick={handleJoin}
              >
                {isJoined ? "✓ Joined" : "+ Join Group"}
              </button>
              <button className="gd2-share-btn" onClick={handleShare}>
                {copied ? "✓ Copied!" : "🔗"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="gd2-tabs-bar">
        <div className="gd2-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`gd2-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
              style={activeTab === t.id ? { "--tab-accent": accentColor } : {}}
            >
              <span className="gd2-tab-icon">{t.icon}</span>
              <span className="gd2-tab-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="gd2-content">
        {/* POSTS */}
        {activeTab === "posts" && (
          <div className="gd2-feed">
            <div className="gd2-card gd2-create-post">
              {showPostBox ? (
                <>
                  <textarea className="gd2-draft-area" placeholder="Share something with the group…" value={postDraft} onChange={(e) => setPostDraft(e.target.value)} autoFocus rows={4} />
                  <div className="gd2-draft-actions">
                    <button className="gd2-cancel-btn" onClick={() => { setShowPostBox(false); setPostDraft(""); }}>Cancel</button>
                    <button className="gd2-post-submit" style={{ background: accentColor }} onClick={handleSubmitPost} disabled={!postDraft.trim()}>Post</button>
                  </div>
                </>
              ) : (
                <div className="gd2-create-prompt" onClick={() => setShowPostBox(true)}>
                  <div className="gd2-me-avatar" style={{ background: accentColor }}>ME</div>
                  <div className="gd2-prompt-placeholder">Share something with the group…</div>
                </div>
              )}
            </div>

            {postsLoading ? (
              [1, 2, 3].map((i) => <SkeletonPost key={i} />)
            ) : posts.length === 0 ? (
              <div className="gd2-empty">
                <span className="gd2-empty-icon">📭</span>
                <p className="gd2-empty-title">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="gd2-card gd2-post">
                  <header className="gd2-post-header">
                    <div className="gd2-avatar" style={{ background: "#6c47ff", width: 40, height: 40, fontSize: 14 }}>
                      {post.author_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="gd2-post-author">{post.author_name || "Unknown"}</p>
                      <p className="gd2-post-time">{new Date(post.created_at).toLocaleString()}</p>
                    </div>
                  </header>
                  <p className="gd2-post-body">{post.content}</p>
                  <footer className="gd2-post-footer">
                    <button className={`gd2-action ${post.is_liked ? "liked" : ""}`} onClick={() => handleLike(post.id)}>
                      👍 {post.likes_count || 0}
                    </button>
                    <button className="gd2-action">💬 Comment</button>
                  </footer>
                </article>
              ))
            )}
          </div>
        )}

        {/* MEMBERS */}
        {activeTab === "members" && (
          <div className="gd2-members-grid">
            {members.length === 0 ? (
              <div className="gd2-empty"><span className="gd2-empty-icon">👥</span><p>No members yet.</p></div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="gd2-card gd2-member-card">
                  <Avatar initials={m.name?.[0]?.toUpperCase() || "U"} color="#6c47ff" size={52} />
                  <p className="gd2-member-name">{m.name}</p>
                  <RoleBadge role={m.role || "member"} />
                </div>
              ))
            )}
          </div>
        )}

        {/* MEDIA */}
        {activeTab === "media" && (
          <div className="gd2-media-list">
            {media.length === 0 ? (
              <div className="gd2-empty"><span className="gd2-empty-icon">📂</span><p className="gd2-empty-title">No files shared yet</p></div>
            ) : (
              media.map((f) => (
                <div key={f.id} className="gd2-card gd2-file-row">
                  <span className="gd2-file-icon">📄</span>
                  <div className="gd2-file-info">
                    <p className="gd2-file-name">{f.file_name}</p>
                    <p className="gd2-file-meta">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : ""}</p>
                  </div>
                  <a href={f.file_url} target="_blank" rel="noreferrer">
                    <button className="gd2-dl-btn">⬇</button>
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABOUT */}
        {activeTab === "about" && (
          <div className="gd2-about-wrap">
            <div className="gd2-card gd2-about-card">
              <h3 className="gd2-section-title">📖 Description</h3>
              <p className="gd2-about-text">{group.description}</p>
              <div className="gd2-about-meta">
                <div className="gd2-meta-row"><span className="gd2-meta-label">Privacy</span><span className="gd2-meta-val">{group.is_private ? "🔒 Private" : "🌐 Public"}</span></div>
                <div className="gd2-meta-row"><span className="gd2-meta-label">Members</span><span className="gd2-meta-val">{group.members_count || members.length}</span></div>
                <div className="gd2-meta-row"><span className="gd2-meta-label">Type</span><span className="gd2-meta-val">{group.group_type || "—"}</span></div>
                <div className="gd2-meta-row"><span className="gd2-meta-label">Year</span><span className="gd2-meta-val">{group.academic_year || "All Years"}</span></div>
                <div className="gd2-meta-row"><span className="gd2-meta-label">Created</span><span className="gd2-meta-val">{new Date(group.created_at).toLocaleDateString()}</span></div>
              </div>
            </div>
            <div