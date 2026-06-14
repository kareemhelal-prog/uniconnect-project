import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import '../styles/GroupDetails.css';
/* ─── Mock Data ─────────────────────────────────────────────────────────── */
const MOCK_MEMBERS = [
  { id: 1, name: 'Dr. Layla Hassan',    role: 'Admin',     initials: 'LH', color: '#6c47ff', online: true  },
  { id: 2, name: 'Ahmed Karim',         role: 'Moderator', initials: 'AK', color: '#0ea5e9', online: true  },
  { id: 3, name: 'Nour El-Din',         role: 'Member',    initials: 'ND', color: '#22c55e', online: false },
  { id: 4, name: 'Sara Mostafa',        role: 'Member',    initials: 'SM', color: '#f59e0b', online: true  },
  { id: 5, name: 'Omar Tawfik',         role: 'Member',    initials: 'OT', color: '#ec4899', online: false },
  { id: 6, name: 'Yasmine Adel',        role: 'Member',    initials: 'YA', color: '#14b8a6', online: false },
];

const MOCK_MEDIA = [
  { id: 1, type: 'file', name: 'Lecture 5 - Normalization.pdf',   size: '2.4 MB', icon: '📄', date: 'May 10' },
  { id: 2, type: 'file', name: 'Assignment 2 Template.docx',       size: '340 KB', icon: '📝', date: 'May 12' },
  { id: 3, type: 'file', name: 'ER Diagram Examples.pptx',         size: '5.1 MB', icon: '📊', date: 'May 14' },
  { id: 4, type: 'file', name: 'SQL Practice Sheet.xlsx',          size: '1.2 MB', icon: '📋', date: 'May 15' },
  { id: 5, type: 'file', name: 'Lab 3 Solutions.zip',              size: '8.7 MB', icon: '📦', date: 'May 17' },
];

const RULES = [
  'Be respectful to all members and instructors.',
  'No spamming or off-topic posts.',
  'Upload only course-related files.',
  'Credit original sources when sharing content.',
  'Tag posts correctly (Question / Announcement / Resource).',
];

/* ─── Mock Notifications ──────────────────────────────────────────────────── */
const MOCK_NOTIFICATIONS = [
  { id: 1, icon: '📝', title: 'New post in your group', body: 'Ahmed Karim shared a new resource in Database Systems.', time: '2m ago' },
  { id: 2, icon: '👥', title: 'New member joined', body: 'Sara Mostafa joined Database Systems – CS301.', time: '1h ago' },
  { id: 3, icon: '💬', title: 'New comment', body: 'Nour El-Din commented on your post.', time: '3h ago' },
];

const Avatar = ({ initials, color, size = 40, online }) => (
  <div className="gd2-avatar-wrap" style={{ width: size, height: size }}>
    <div className="gd2-avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
    {online !== undefined && (
      <span className={`gd2-dot ${online ? 'online' : 'offline'}`} />
    )}
  </div>
);

const RoleBadge = ({ role }) => {
  const map = { Admin: 'badge-admin', Moderator: 'badge-mod', Member: 'badge-member' };
  return <span className={`gd2-badge ${map[role] || 'badge-member'}`}>{role}</span>;
};

const SkeletonPost = () => (
  <div className="gd2-card gd2-skeleton-post">
    <div className="sk-row"><div className="sk-circle" /><div className="sk-lines"><div className="sk-line w60" /><div className="sk-line w40" /></div></div>
    <div className="sk-line w100 mt12" />
    <div className="sk-line w80 mt6" />
    <div className="sk-line w90 mt6" />
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */

const GroupDetails = ({
  group = {},
  posts = [],
  onBack,
  onPostClick,
  onAuthorClick,
  onCreatePost,
}) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [isJoined, setIsJoined] = useState(false);
  const [localPosts, setLocalPosts] = useState(() => posts);
  const [loading, setLoading] = useState(true);
  const [postDraft, setPostDraft] = useState('');
  const [showPostBox, setShowPostBox] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Simulate loading */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleLike = (postId) => {
    setLocalPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: (p.likes || 0) + (p.liked ? -1 : 1) }
          : p,
      ),
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPost = () => {
    if (!postDraft.trim()) return;
    const newPost = {
      id: Date.now(),
      author: 'You',
      avatar: 'Y',
      avatarColor: '#6c47ff',
      time: 'Just now',
      content: postDraft.trim(),
      likes: 0,
      liked: false,
    };
    setLocalPosts(prev => [newPost, ...prev]);
    setPostDraft('');
    setShowPostBox(false);
  };

  const g = {
    name:     group.name     || 'Database Systems – CS301',
    desc:     group.desc     || 'Official group for CS301 students. Share notes, ask questions, and stay updated on assignments and exams.',
    color:    group.color    || '#6c47ff',
    icon:     group.icon     || '🗄️',
    members:  group.members  || 128,
    posts:    group.posts    || 47,
    privacy:  group.privacy  || 'Public',
    created:  group.created  || 'September 1, 2025',
  };

  const accentColor = g.color;
  const coverGradient = `linear-gradient(135deg, ${accentColor}cc 0%, #0f172a 100%)`;

  const TABS = [
    { id: 'posts',   label: 'Posts',   icon: '📝' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'media',   label: 'Media',   icon: '📎' },
    { id: 'about',   label: 'About',   icon: '📖' },
  ];

  return (
    <div className="gd2-root">
      {/* ── Navbar ── */}
      <Navbar
        role="student"
        activePage="groups"
        notifications={MOCK_NOTIFICATIONS}
        user={{ initials: 'YO' }}
        onNavigate={(page) => console.log('Navigate to:', page)}
      />

      {/* ── Cover + Header ── */}
      <div className="gd2-hero" style={{ background: coverGradient }}>
        {onBack && (
          <button className="gd2-back" onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="gd2-hero-noise" />

        <div className="gd2-hero-body">
          <div className="gd2-group-avatar" style={{ background: accentColor }}>
            <span>{g.icon}</span>
          </div>

          <div className="gd2-hero-info">
            <div className="gd2-privacy-pill">
              {g.privacy === 'Private' ? '🔒' : '🌐'} {g.privacy}
            </div>
            <h1 className="gd2-title">{g.name}</h1>
            <p className="gd2-subtitle">{g.desc}</p>

            <div className="gd2-stats-row">
              <span className="gd2-stat">👥 {g.members.toLocaleString()} members</span>
              <span className="gd2-stat-sep">·</span>
              <span className="gd2-stat">📝 {g.posts} posts</span>
            </div>

            <div className="gd2-cta-row">
              <button
                className={`gd2-join-btn ${isJoined ? 'joined' : ''}`}
                style={!isJoined ? { background: accentColor } : {}}
                onClick={() => setIsJoined(v => !v)}
              >
                {isJoined ? '✓ Joined' : '+ Join Group'}
              </button>
              <button className="gd2-share-btn" onClick={handleShare}>
                {copied ? '✓ Copied!' : '🔗'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="gd2-tabs-bar">
        <div className="gd2-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`gd2-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
              style={activeTab === t.id ? { '--tab-accent': accentColor } : {}}
            >
              <span className="gd2-tab-icon">{t.icon}</span>
              <span className="gd2-tab-label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="gd2-content">

        {/* ── POSTS TAB ── */}
        {activeTab === 'posts' && (
          <div className="gd2-feed">
            {/* Create post */}
            <div className="gd2-card gd2-create-post">
              {showPostBox ? (
                <>
                  <textarea
                    className="gd2-draft-area"
                    placeholder="What's on your mind? Share a question, resource, or update…"
                    value={postDraft}
                    onChange={e => setPostDraft(e.target.value)}
                    autoFocus
                    rows={4}
                  />
                  <div className="gd2-draft-actions">
                    <button className="gd2-cancel-btn" onClick={() => { setShowPostBox(false); setPostDraft(''); }}>Cancel</button>
                    <button
                      className="gd2-post-submit"
                      style={{ background: accentColor }}
                      onClick={handleSubmitPost}
                      disabled={!postDraft.trim()}
                    >
                      Post
                    </button>
                  </div>
                </>
              ) : (
                <div className="gd2-create-prompt" onClick={() => { setShowPostBox(true); onCreatePost && onCreatePost(); }}>
                  <div className="gd2-me-avatar" style={{ background: accentColor }}>Y</div>
                  <div className="gd2-prompt-placeholder">Share something with the group…</div>
                </div>
              )}
            </div>

            {/* Posts */}
            {loading ? (
              [1, 2, 3].map(i => <SkeletonPost key={i} />)
            ) : localPosts.length === 0 ? (
              <div className="gd2-empty">
                <span className="gd2-empty-icon">📭</span>
                <p className="gd2-empty-title">No posts yet</p>
                <p className="gd2-empty-sub">Be the first to share something with this group.</p>
              </div>
            ) : (
              localPosts.map(post => (
                <article
                  key={post.id}
                  className="gd2-card gd2-post"
                  onClick={() => onPostClick && onPostClick(post.id)}
                >
                  <header className="gd2-post-header">
                    <div
                      className="gd2-avatar"
                      style={{ background: post.avatarColor || '#0284c7', width: 40, height: 40, fontSize: 14, cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); onAuthorClick && onAuthorClick(post.author); }}
                    >
                      {post.avatar || post.author?.[0] || '?'}
                    </div>
                    <div>
                      <p
                        className="gd2-post-author"
                        onClick={e => { e.stopPropagation(); onAuthorClick && onAuthorClick(post.author); }}
                      >
                        {post.author}
                      </p>
                      <p className="gd2-post-time">{post.time}</p>
                    </div>
                  </header>

                  {post.title && <h4 className="gd2-post-title">{post.title}</h4>}
                  <p className="gd2-post-body">{post.content}</p>

                  <footer className="gd2-post-footer" onClick={e => e.stopPropagation()}>
                    <button
                      className={`gd2-action ${post.liked ? 'liked' : ''}`}
                      onClick={() => handleLike(post.id)}
                    >
                      👍 {post.likes || 0}
                    </button>
                    <button className="gd2-action" onClick={() => onPostClick && onPostClick(post.id)}>
                      💬 Comment
                    </button>
                    <button
                      className="gd2-action"
                      onClick={() => navigator.clipboard.writeText(`${post.title || ''}\n\n${post.content}`).catch(() => {})}
                    >
                      🔗 Share
                    </button>
                  </footer>
                </article>
              ))
            )}
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {activeTab === 'members' && (
          <div className="gd2-members-grid">
            {loading ? (
              [1,2,3,4,5,6].map(i => (
                <div key={i} className="gd2-card gd2-member-skeleton">
                  <div className="sk-circle lg" />
                  <div className="sk-lines center mt10">
                    <div className="sk-line w70 center" />
                    <div className="sk-line w40 center mt6" />
                  </div>
                </div>
              ))
            ) : (
              MOCK_MEMBERS.map(m => (
                <div key={m.id} className="gd2-card gd2-member-card">
                  <Avatar initials={m.initials} color={m.color} size={52} online={m.online} />
                  <p className="gd2-member-name">{m.name}</p>
                  <RoleBadge role={m.role} />
                  <button className="gd2-view-btn">View</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── MEDIA TAB ── */}
        {activeTab === 'media' && (
          <div className="gd2-media-list">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="gd2-card gd2-file-skeleton"><div className="sk-circle sm" /><div className="sk-lines ml12"><div className="sk-line w60" /><div className="sk-line w30 mt6" /></div></div>)
            ) : MOCK_MEDIA.length === 0 ? (
              <div className="gd2-empty">
                <span className="gd2-empty-icon">📂</span>
                <p className="gd2-empty-title">No files shared yet</p>
                <p className="gd2-empty-sub">Shared files and media will appear here.</p>
              </div>
            ) : (
              MOCK_MEDIA.map(f => (
                <div key={f.id} className="gd2-card gd2-file-row">
                  <span className="gd2-file-icon">{f.icon}</span>
                  <div className="gd2-file-info">
                    <p className="gd2-file-name">{f.name}</p>
                    <p className="gd2-file-meta">{f.size} · {f.date}</p>
                  </div>
                  <button className="gd2-dl-btn" title="Download">⬇</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ABOUT TAB ── */}
        {activeTab === 'about' && (
          <div className="gd2-about-wrap">
            <div className="gd2-card gd2-about-card">
              <h3 className="gd2-section-title">📖 Description</h3>
              <p className="gd2-about-text">{g.desc}</p>

              <div className="gd2-about-meta">
                <div className="gd2-meta-row"><span className="gd2-meta-label">Privacy</span><span className="gd2-meta-val">{g.privacy === 'Private' ? '🔒 Private' : '🌐 Public'}</span></div>
                <div className="gd2-meta-row"><span className="gd2-meta-label">Members</span><span className="gd2-meta-val">{g.members}</span></div>
                <div className="gd2-meta-row"><span className="gd2-meta-label">Posts</span><span className="gd2-meta-val">{g.posts}</span></div>
                <div className="gd2-meta-row"><span className="gd2-meta-label">Created</span><span className="gd2-meta-val">{g.created}</span></div>
              </div>
            </div>

            <div className="gd2-card gd2-rules-card">
              <h3 className="gd2-section-title">📋 Group Rules</h3>
              <ol className="gd2-rules-list">
                {RULES.map((r, i) => (
                  <li key={i} className="gd2-rule-item">
                    <span className="gd2-rule-num" style={{ background: accentColor }}>{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetails;
 