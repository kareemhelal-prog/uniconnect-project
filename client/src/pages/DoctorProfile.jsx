import { useState } from "react";
import "../styles/DoctorProfile.css";

// ── Mock Data ────────────────────────────────────────────────────────────────
const professor = {
  name: "Dr. Osama Alnahas ",
  title: "Professor",
  verified: true,
  department: "School of Engineering",
  field: "Computer Science",
  specialty: "Algorithms & Data Structures",
  followers: 1248,
  courses: 8,
  groups: 6,
  uploadedFiles: 24,
  active: true,
  about:
    "Dr. Osama Alnahas is a IT Department Head at the Faculty of Industry and Energy.",
  experience: "15+ years",
  specializations: [
    "Algorithms",
    "Data Structures",
    "Dynamic Programming",
    "Computational Complexity",
  ],
  researchInterests: [
    "Machine Learning",
    "Deep Learning",
    "Data Mining",
    "Natural Language Processing",
    "AI Ethics",
    "Computer Vision",
  ],
  coursesList: [
    { code: "CS301", name: "Data Structures", year: "2023 – 2024", students: 128, color: "#6c47ff", icon: "</>" },
    { code: "CS401", name: "Algorithms", year: "2023 – 2024", students: 96, color: "#22c55e", icon: "↑" },
    { code: "CS501", name: "Design & Analysis of Algorithms", year: "2023 – 2024", students: 74, color: "#f59e0b", icon: "✦" },
    { code: "CS302", name: "Advanced Programming", year: "2023 – 2024", students: 61, color: "#3b82f6", icon: "{}" },
  ],
  groupsList: [
    { name: "Data Structures — CS301", members: 128, color: "#6c47ff" },
    { name: "Algorithms — CS401", members: 96, color: "#22c55e" },
    { name: "Competitive Programming", members: 74, color: "#f59e0b" },
  ],
  posts: [
    {
      id: 1,
      date: "May 8 at 9:15 AM",
      text: "Happy to share the notes from last week's lecture on Dynamic Programming. We covered Matrix Chain Multiplication and Longest Common Subsequence in detail.",
      likes: 45,
      comments: 12,
      shares: 8,
      hasVisual: true,
    },
    {
      id: 2,
      date: "Apr 28 at 4:30 PM",
      text: "A quick reminder: The programming assignment 2 is due this Sunday, May 5th by 11:59 PM. Make sure to test your code with the provided test cases.",
      likes: 32,
      comments: 6,
      shares: 4,
      hasVisual: false,
    },
    {
      id: 3,
      date: "Apr 20 at 11:00 AM",
      text: "Excited to share our latest paper on explainable AI in healthcare, published in the Journal of Machine Learning Research.",
      likes: 42,
      comments: 8,
      shares: 5,
      hasVisual: false,
      badge: "New Publication",
    },
  ],
  files: [
    { name: "ML Lecture Notes – Week 1-6.pdf", type: "PDF", size: "2.4 MB", age: "5 days ago", color: "#ef4444" },
    { name: "AI Course Slides – Introduction.pptx", type: "PPT", size: "3.1 MB", age: "1 week ago", color: "#f97316" },
    { name: "Data Mining – Assignment 1.pdf", type: "DOC", size: "1.7 MB", age: "2 weeks ago", color: "#3b82f6" },
  ],
};

const TABS = ["Posts", "Files", "Groups", "Courses"];

// ── Sub-components ────────────────────────────────────────────────────────────

function VerifiedBadge() {
  return (
    <span className="dp-verified" title="Verified">
      ✓
    </span>
  );
}

function StatItem({ icon, value, label }) {
  return (
    <div className="dp-stat">
      <span className="dp-stat-icon">{icon}</span>
      <div>
        <span className="dp-stat-value">{value.toLocaleString()}</span>
        <span className="dp-stat-label">{label}</span>
      </div>
    </div>
  );
}

function AlgoVisual() {
  return (
    <div className="dp-algo-visual">
      <div className="dp-algo-section">
        <p className="dp-algo-title">Matrix Chain Multiplication</p>
        <div className="dp-algo-row">
          {["A₁", "A₂", "…", "Aₙ"].map((s, i) => (
            <span key={i} className="dp-algo-box primary">
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="dp-algo-divider" />
      <div className="dp-algo-section">
        <p className="dp-algo-title">Longest Common Subsequence</p>
        <div className="dp-algo-lcs">
          {[
            ["A", "B", "C", "B", "A", "B"],
            ["B", "D", "C", "A", "B", "A"],
          ].map((row, ri) => (
            <div className="dp-algo-row" key={ri}>
              {row.map((c, ci) => (
                <span
                  key={ci}
                  className={`dp-algo-box ${["C", "B", "A"].includes(c) && ri === 1 ? "accent" : ""}`}
                >
                  {c}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="dp-post-card">
      <div className="dp-post-header">
        <div className="dp-post-avatar">AR</div>
        <div>
          <p className="dp-post-name">{professor.name}</p>
          <p className="dp-post-date">{post.date}</p>
        </div>
        {post.badge && <span className="dp-post-badge">{post.badge}</span>}
        <button className="dp-post-menu">⋯</button>
      </div>
      <p className="dp-post-text">{post.text}</p>
      {post.hasVisual && <AlgoVisual />}
      <div className="dp-post-actions">
        <button
          className={`dp-action-btn${liked ? " active" : ""}`}
          onClick={() => setLiked(!liked)}
        >
          <span>👍</span> Like ({post.likes + (liked ? 1 : 0)})
        </button>
        <button className="dp-action-btn">
          <span>💬</span> Comment ({post.comments})
        </button>
        <button className="dp-action-btn">
          <span>↗</span> Share ({post.shares})
        </button>
        <button className="dp-action-btn dp-save-btn">🔖 Save</button>
      </div>
    </div>
  );
}

function FilesTab() {
  return (
    <div className="dp-files-list">
      {professor.files.map((f, i) => (
        <div className="dp-file-row" key={i}>
          <span className="dp-file-type" style={{ background: f.color }}>
            {f.type}
          </span>
          <div className="dp-file-info">
            <p className="dp-file-name">{f.name}</p>
            <p className="dp-file-meta">
              Uploaded {f.age} · {f.size}
            </p>
          </div>
          <button className="dp-download-btn">⬇ Download</button>
        </div>
      ))}
    </div>
  );
}

function GroupsTab() {
  return (
    <div className="dp-groups-grid">
      {professor.groupsList.map((g, i) => (
        <div className="dp-group-card" key={i}>
          <span className="dp-group-icon" style={{ background: g.color }}>
            ◈
          </span>
          <div>
            <p className="dp-group-name">{g.name}</p>
            <p className="dp-group-members">{g.members} members</p>
          </div>
          <button className="dp-join-btn">Join</button>
        </div>
      ))}
    </div>
  );
}

function CoursesTab() {
  return (
    <div className="dp-courses-grid">
      {professor.coursesList.map((c, i) => (
        <div className="dp-course-card" key={i}>
          <span className="dp-course-icon" style={{ background: c.color }}>
            {c.icon}
          </span>
          <div className="dp-course-info">
            <p className="dp-course-name">{c.name}</p>
            <p className="dp-course-code">{c.code} · 2023–2024</p>
            <p className="dp-course-students">👥 {c.students} students</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DoctorProfile() {
  const [activeTab, setActiveTab] = useState("Posts");
  const [following, setFollowing] = useState(false);

  return (
    <div className="dp-root">
      {/* ── Cover ── */}
      <div className="dp-cover">
        <div className="dp-cover-overlay" />
      </div>

      {/* ── Profile Header ── */}
      <div className="dp-header-wrap">
        <div className="dp-header">
          <div className="dp-avatar-wrap">
<img src="doctor.jpg" alt="Dr. Osama Alnahas" className="dp-avatar" />            <span className="dp-active-dot" title="Active" />
          </div>

          <div className="dp-identity">
            <h1 className="dp-name">
              {professor.name}
              <VerifiedBadge />
            </h1>
            <p className="dp-title">{professor.title}</p>
            <div className="dp-meta-row">
              <span>🏛 {professor.department}</span>
              <span>💻 {professor.field}</span>
              <span>🏷 {professor.specialty}</span>
            </div>
          </div>

          <div className="dp-cta-group">
            <button
              className={`dp-btn-follow${following ? " followed" : ""}`}
              onClick={() => setFollowing(!following)}
            >
              {following ? "✓ Following" : "+ Follow"}
            </button>
            <button className="dp-btn-email">✉ Email</button>
          </div>
        </div>

        {/* Stats row */}
        <div className="dp-stats-row">
          <StatItem icon="👥" value={professor.followers} label="Followers" />
          <div className="dp-stats-divider" />
          <StatItem icon="📚" value={professor.courses} label="Courses" />
          <div className="dp-stats-divider" />
          <StatItem icon="🗂" value={professor.groups} label="Groups" />
          <div className="dp-stats-divider" />
          <StatItem icon="📄" value={professor.uploadedFiles} label="Files" />
        </div>
      </div>

      {/* ── Tabs + Main Content ── */}
      <div className="dp-body">
        {/* Left: tabs + feed */}
        <div className="dp-main">
          <nav className="dp-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={`dp-tab${activeTab === t ? " active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="dp-tab-content">
            {activeTab === "Posts" &&
              professor.posts.map((p) => <PostCard key={p.id} post={p} />)}
            {activeTab === "Files" && <FilesTab />}
            {activeTab === "Groups" && <GroupsTab />}
            {activeTab === "Courses" && <CoursesTab />}
          </div>
        </div>

        {/* Right: sidebar */}
        <aside className="dp-sidebar">
          {/* About */}
          <section className="dp-sidebar-card">
            <h3 className="dp-sidebar-title">ℹ About</h3>
            <p className="dp-about-text">{professor.about}</p>
            <div className="dp-about-grid">
              <span className="dp-about-key">Experience</span>
              <span className="dp-about-val">{professor.experience}</span>
              <span className="dp-about-key">Specialization</span>
              <span className="dp-about-val">
                {professor.specializations.join(", ")}
              </span>
            </div>
          </section>

          {/* Research Interests */}
          <section className="dp-sidebar-card">
            <h3 className="dp-sidebar-title">🔬 Research Interests</h3>
            <div className="dp-tags">
              {professor.researchInterests.map((r) => (
                <span className="dp-tag" key={r}>
                  {r}
                </span>
              ))}
            </div>
          </section>

          {/* Courses */}
          <section className="dp-sidebar-card">
            <div className="dp-sidebar-row-head">
              <h3 className="dp-sidebar-title">📖 Courses</h3>
              <button className="dp-view-all">View All</button>
            </div>
            <div className="dp-sidebar-courses">
              {professor.coursesList.slice(0, 4).map((c) => (
                <div className="dp-sc-item" key={c.code}>
                  <span className="dp-sc-icon" style={{ background: c.color }}>
                    {c.icon}
                  </span>
                  <div>
                    <p className="dp-sc-name">{c.name}</p>
                    <p className="dp-sc-code">
                      {c.code} · {c.year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Groups */}
          <section className="dp-sidebar-card">
            <div className="dp-sidebar-row-head">
              <h3 className="dp-sidebar-title">👥 Groups</h3>
              <button className="dp-view-all">See All</button>
            </div>
            {professor.groupsList.map((g) => (
              <div className="dp-sg-item" key={g.name}>
                <span className="dp-sg-icon" style={{ background: g.color }}>
                  ◈
                </span>
                <div>
                  <p className="dp-sg-name">{g.name}</p>
                  <p className="dp-sg-members">{g.members} members</p>
                </div>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
