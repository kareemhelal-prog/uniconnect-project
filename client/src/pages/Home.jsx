import React, { useState } from "react";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import Sidebar from "../components/Sidebar";

import ProfilePage from "./ProfilePage";
import ProjectsPage from "./ProjectsPage";
import AcademicReviewsPage from "./AcademicReviewsPage";
import NotificationsPage from "./Notifications";

import "../styles/Home.css";

// ── Current logged-in user (Kareem Mohamed) ──
const CURRENT_USER = {
  id: "2420924",
  name: "Kareem Mohamed",
  initials: "KM",
  role: "Computer Science · Year 3",
  dept: "Computer Science",
  faculty: "Faculty of Engineering",
  status: "online",
  stats: [
    { label: "Projects", value: 3 },
    { label: "Friends", value: 24 },
    { label: "Groups",  value: 5 },
  ],
};

// ── Dummy posts feed ──
const INITIAL_POSTS = [
  {
    id: 1,
    author: "Kareem Mohamed",
    avatar: "KM",
    avatarColor: "#a855f7",
    role: "Computer Science · Year 3",
    time: "2 hours ago",
    title: "Just finished my AI Study Assistant project! 🎉",
    content:
      "After months of work, our team finally wrapped up the AI-Powered Study Assistant. It uses NLP to personalise study schedules and recommend resources. Open for feedback!",
    likes: 12,
    shares: 3,
    comments: [
      { id: 101, author: "Ayesha Khan", avatar: "AK", avatarColor: "#00e5ff", text: "Amazing work Kareem! Can't wait to try it.", time: "1 hour ago" },
      { id: 102, author: "Muhammad Ali", avatar: "MA", avatarColor: "#f87171", text: "Congrats! The NLP part sounds really cool.", time: "45 min ago" },
    ],
  },
  {
    id: 2,
    author: "Sara Ahmed",
    avatar: "SA",
    avatarColor: "#34d399",
    role: "Software Engineering · Year 2",
    time: "5 hours ago",
    title: "Looking for team members for Blockchain project",
    content:
      "Hi everyone! I'm working on a Blockchain-Based Credential Verification system as my graduation project. Looking for 1-2 more members with backend or smart contract experience.",
    likes: 7,
    shares: 5,
    comments: [
      { id: 201, author: "Usman Badar", avatar: "UB", avatarColor: "#fbbf24", text: "I have Solidity experience, DM me!", time: "4 hours ago" },
    ],
  },
  {
    id: 3,
    author: "Omar Farouk",
    avatar: "OF",
    avatarColor: "#60a5fa",
    role: "Electrical Engineering · Year 4",
    time: "Yesterday",
    title: "IoT Smart Home demo video is live!",
    content:
      "We posted a demo of our IoT-Based Smart Home Automation project. You can control lights, AC and door locks from your phone. Check it out on the projects page.",
    likes: 31,
    shares: 11,
    comments: [],
  },
];

const NOTIFICATIONS = [
  { id: 1, icon: "🔔", title: "Welcome to UniConnect!", body: "Start exploring your academic community.", time: "Just now" },
];

function renderPage(page, user, setUser) {
  switch (page) {
    case "profile":   return <ProfilePage user={user} setUser={setUser} />;
    case "projects":  return <ProjectsPage />;
    case "files":     return <FilesPage />;
    case "groups":    return <GroupsPage />;
    case "academic-reviews": return <AcademicReviewsPage />;
    case "courses":   return <CoursesPage />;
    case "friends":   return <FriendsPage />;
    case "notifications": return <NotificationsPage />;
    default: return null;
  }
}

// ── Post Card with likes, comments, share ──
function PostCard({ post, onUpdate }) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showShareToast, setShowShareToast] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    onUpdate({ ...post, likes: liked ? post.likes - 1 : post.likes + 1 });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now(),
      author: "Kareem Mohamed",
      avatar: "KM",
      avatarColor: "#a855f7",
      text: commentText.trim(),
      time: "Just now",
    };
    onUpdate({ ...post, comments: [...post.comments, newComment] });
    setCommentText("");
  };

  const handleShare = () => {
    setShowShareToast(true);
    onUpdate({ ...post, shares: post.shares + 1 });
    setTimeout(() => setShowShareToast(false), 2000);
  };

  return (
    <div className="post-card">
      {showShareToast && <div className="share-toast">🔗 Post shared!</div>}
      <div className="post-header">
        <div className="post-avatar-wrap" style={{ background: post.avatarColor }}>{post.avatar}</div>
        <div className="post-meta-info">
          <h4 className="post-author">{post.author}</h4>
          <span className="post-role">{post.role}</span>
          <span className="post-time">{post.time}</span>
        </div>
        <button className="more-btn">•••</button>
      </div>

      <div className="post-body">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-content">{post.content}</p>
      </div>

      <div className="post-stats-row">
        <span className="post-stat">{post.likes} likes</span>
        <span className="post-stat">{post.comments.length} comments · {post.shares} shares</span>
      </div>

      <div className="post-divider" />

      <div className="post-actions">
        <button className={`action-btn like-btn ${liked ? "liked" : ""}`} onClick={handleLike}>
          {liked ? "❤️" : "🤍"} Like
        </button>
        <button className="action-btn comment-btn" onClick={() => setShowComments(!showComments)}>
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
              <div className="comment-avatar" style={{ background: c.avatarColor }}>{c.avatar}</div>
              <div className="comment-bubble">
                <span className="comment-author">{c.author}</span>
                <p className="comment-text">{c.text}</p>
                <span className="comment-time">{c.time}</span>
              </div>
            </div>
          ))}
          <div className="comment-input-row">
            <div className="comment-avatar" style={{ background: "#a855f7" }}>KM</div>
            <input
              className="comment-input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
            />
            <button className="comment-send-btn" onClick={handleComment}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Post Modal ──
function CreatePostModal({ onClose, onPost }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!content.trim()) return;
    onPost({
      id: Date.now(),
      author: "Kareem Mohamed",
      avatar: "KM",
      avatarColor: "#a855f7",
      role: "Computer Science · Year 3",
      time: "Just now",
      title: title.trim() || "New Post",
      content: content.trim(),
      likes: 0,
      shares: 0,
      comments: [],
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
          <label className="modal-label" style={{ marginTop: "12px" }}>WHAT'S ON YOUR MIND?</label>
          <textarea
            className="modal-textarea"
            placeholder="Share something with your academic community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
        </div>
        <div className="modal-footer-btns">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-submit-btn" onClick={handleSubmit}>Post</button>
        </div>
      </div>
    </div>
  );
}

const Home = () => {
  const [activePage, setActivePage] = useState("home");
  const [user, setUser] = useState(CURRENT_USER);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const isHome = activePage === "home";

  const updatePost = (updated) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const addPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="home-page">
      <Navbar
        activePage={activePage}
        onNavigate={(id) => setActivePage(id)}
        user={user}
        notifications={NOTIFICATIONS}
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
              <button className="create-post-btn" onClick={() => setShowCreatePost(true)}>
                + Create Post
              </button>
            </div>

            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={updatePost} />
            ))}
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
