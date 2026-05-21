import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import LeftSidebar from "../components/LeftSidebar";
import PostCard from "../components/PostCard";
import RightSidebar from "../components/RightSidebar";
import Sidebar from "../components/Sidebar";

import ProfilePage from "./ProfilePage";
import ProjectsPage from "./ProjectsPage";
import FilesPage from "./FilesPage";
import GroupsPage from "./GroupsPage";
import AcademicReviewsPage from "./AcademicReviewsPage";

import "../styles/Home.css";

const GROUPS = [
  "UniConnect General",
  "AI in Medicine",
  "React Developers",
  "Campus News",
  "Group Projects",
];

const initialPosts = [];

function renderPage(page) {
  switch (page) {
    case "profile":
      return <ProfilePage />;
    case "projects":
      return <ProjectsPage />;
    case "files":
      return <FilesPage />;
    case "groups":
      return <GroupsPage />;
    case "academic-reviews":
      return <AcademicReviewsPage />;
    default:
      return null;
  }
}

const CreatePostModal = ({ onClose, onSubmit }) => {
  const [postText, setPostText] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [previews, setPreviews] = useState([]);
  const fileRef = React.useRef();

  const filteredGroups = GROUPS.filter((g) =>
    g.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = () => {
    if (!postText.trim()) {
      alert("Please write something before posting.");
      return;
    }
    onSubmit({ postText, selectedGroup });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card">
        <div className="modal-header">
          <span className="modal-title">✏️ Create Post</span>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <label className="modal-label">What's on your mind?</label>
          <textarea
            className="modal-textarea"
            placeholder="Share something with the community..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />

          <label className="modal-label" style={{ marginTop: "1rem" }}>
            Select a Group{" "}
            <span
              style={{
                color: "#484f58",
                fontWeight: 400,
                textTransform: "none",
                fontSize: "0.75rem",
              }}
            >
              (optional)
            </span>
          </label>
          <div className="modal-select-wrap">
            <select
              className="modal-select"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="">— No group selected —</option>
              {filteredGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-search-wrap">
            <span className="modal-search-icon">🔍</span>
            <input
              type="text"
              className="modal-search-input"
              placeholder="Search for a group..."
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />
          </div>

          <label className="modal-label" style={{ marginTop: "1rem" }}>
            Upload Image{" "}
            <span
              style={{
                color: "#484f58",
                fontWeight: 400,
                textTransform: "none",
                fontSize: "0.75rem",
              }}
            >
              (optional)
            </span>
          </label>
          <div
            className="modal-upload-box"
            onClick={() => fileRef.current.click()}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileRef}
              style={{ display: "none" }}
              onChange={handleImages}
            />
            <div className="upload-icon-text">📷</div>
            <div className="upload-hint">
              Drag an image here or{" "}
              <span className="upload-link">click to upload</span>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="modal-previews">
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="preview"
                  className="modal-preview-thumb"
                />
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn-post" onClick={handleSubmit}>
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [activePage, setActivePage] = useState("home");
  const [showModal, setShowModal] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [importantDays, setImportantDays] = useState([]); // ← من الـ backend
  const [user, setUser] = useState({}); // ← من الـ backend

  const isHome = activePage === "home";

  useEffect(() => {
    fetch("/api/important-days")
      .then((res) => res.json())
      .then((data) => setImportantDays(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => {});
  }, []);

  const handleNewPost = ({ postText, selectedGroup }) => {
    const newPost = {
      id: Date.now(),
      author: "You",
      role: selectedGroup || "General",
      time: "Just now",
      title: postText.split("\n")[0] || "New Post",
      content: postText,
      avatar: "Y",
      avatarColor: "linear-gradient(135deg, #00e5ff, #0284c7)",
    };
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="home-page">
      <Navbar activePage={activePage} onNavigate={(id) => setActivePage(id)} />

      {isHome ? (
        <div className="home-layout">
          <LeftSidebar user={user} />
          <main className="feed-section">
            <div className="feed-top-bar">
              <h2 className="feed-title">Academic Social Feed</h2>
              <button
                className="create-post-btn"
                onClick={() => setShowModal(true)}
              >
                + Create Post
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="feed-empty">
                <span className="feed-empty-icon">📭</span>
                <p>No posts yet — be the first to share something!</p>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </main>
          <RightSidebar importantDays={importantDays} />
        </div>
      ) : (
        renderPage(activePage)
      )}

      <Sidebar />

      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onSubmit={handleNewPost}
        />
      )}
    </div>
  );
};

export default Home;
