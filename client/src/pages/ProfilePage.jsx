import { useState } from "react";
import "../styles/ProfilePage.css";

// ── Mock Data ────────────────────────────────────────────────────────────────
const student = {
  name: "Ahmed Ayman",
  title: "Student",
  verified: false,
  department: "School of Engineering",
  field: "Computer Science",
  specialty: "AI & Machine Learning",
  followers: 342,
  courses: 6,
  groups: 4,
  uploadedFiles: 12,
  active: true,
  about:
    "Third-year Computer Science student at Borg El Arab Technological University, passionate about AI, data science, and building impactful software.",
  year: "Third Year",
  skills: [
    "Machine Learning",
    "Data Science",
    "Full-Stack Dev",
    "Data Analysis",
  ],
  researchInterests: [
    "Deep Learning",
    "Computer Vision",
    "NLP",
    "Data Mining",
    "Web Development",
    "Cloud Computing",
  ],
  coursesList: [
    { code: "CS301", name: "Data Structures", year: "2023 – 2024", color: "#6c47ff", icon: "</>" },
    { code: "CS401", name: "Algorithms", year: "2023 – 2024", color: "#22c55e", icon: "↑" },
    { code: "CS501", name: "Machine Learning", year: "2023 – 2024", color: "#f59e0b", icon: "✦" },
    { code: "CS302", name: "Web Development", year: "2023 – 2024", color: "#3b82f6", icon: "{}" },
  ],
  groupsList: [
    { name: "AI & ML Study Group", members: 54, color: "#6c47ff" },
    { name: "Competitive Programming", members: 38, color: "#22c55e" },
    { name: "Web Dev Community", members: 67, color: "#f59e0b" },
  ],
  posts: [
    {
      id: 1,
      date: "May 10 at 10:00 AM",
      text: "Just finished my Machine Learning project on image classification using CNNs. Achieved 94% accuracy on the test set! Happy to share the notes and code with anyone interested.",
      likes: 28,
      comments: 9,
      shares: 5,
    },
    {
      id: 2,
      date: "Apr 30 at 3:00 PM",
      text: "Reminder to everyone in CS301: the Data Structures assignment is due this Friday. Don't forget to handle edge cases in your tree traversal implementation!",
      likes: 15,
      comments: 4,
      shares: 2,
    },
    {
      id: 3,
      date: "Apr 18 at 9:30 AM",
      text: "Excited to share that I joined the university's AI research team this semester. Looking forward to contributing to real-world projects in NLP and computer vision.",
      likes: 41,
      comments: 11,
      shares: 7,
      badge: "New Achievement",
    },
  ],
  files: [
    { name: "ML Lecture Notes – Week 1-6.pdf", type: "PDF", size: "2.4 MB", age: "5 days ago", color: "#ef4444" },
    { name: "CNN Project Report.pptx", type: "PPT", size: "3.1 MB", age: "1 week ago", color: "#f97316" },
    { name: "Data Structures – Assignment 1.pdf", type: "DOC", size: "1.7 MB", age: "2 weeks ago", color: "#3b82f6" },
  ],
};

const TABS = ["Posts", "Files", "Groups", "Courses"];

// ── Sub-components ────────────────────────────────────────────────────────────

function VerifiedBadge() {
  return (
    <span className="pp-verified" title="Verified">
      ✓
    </span>
  );
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

function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="pp-post-card">
      <div className="pp-post-header">
        <div className="pp-post-avatar">AC</div>
        <div>
          <p className="pp-post-name">{student.name}</p>
          <p className="pp-post-date">{post.date}</p>
        </div>
        {post.badge && <span className="pp-post-badge">{post.badge}</span>}
        <button className="pp-post-menu">⋯</button>
      </div>
      <p className="pp-post-text">{post.text}</p>
      <div className="pp-post-actions">
        <button
          className={`pp-action-btn${liked ? " active" : ""}`}
          onClick={() => setLiked(!liked)}
        >
          <span>👍</span> Like ({post.likes + (liked ? 1 : 0)})
        </button>
        <button className="pp-action-btn">
          <span>💬</span> Comment ({post.comments})
        </button>
        <button className="pp-action-btn">
          <span>↗</span> Share ({post.shares})
        </button>
        <button className="pp-action-btn pp-save-btn">🔖 Save</button>
      </div>
    </div>
  );
}

function FilesTab() {
  return (
    <div className="pp-files-list">
      {student.files.map((f, i) => (
        <div className="pp-file-row" key={i}>
          <span className="pp-file-type" style={{ background: f.color }}>
            {f.type}
          </span>
          <div className="pp-file-info">
            <p className="pp-file-name">{f.name}</p>
            <p className="pp-file-meta">
              Uploaded {f.age} · {f.size}
            </p>
          </div>
          <button className="pp-download-btn">⬇ Download</button>
        </div>
      ))}
    </div>
  );
}

// ── Tabs Components ────────────────────────────────────────────────────────────

function GroupsTab() {
  return (
    <div className="pp-groups-grid">
      {student.groupsList.map((g, i) => (
        <div className="pp-group-card" key={i}>
          <span className="pp-group-icon" style={{ background: g.color }}>
            ◈
          </span>
          <div>
            <p className="pp-group-name">{g.name}</p>
            <p className="pp-group-members">{g.members} members</p>
          </div>
          <button className="pp-join-btn">Join</button>
        </div>
      ))}
    </div>
  );
}

function CoursesTab() {
  return (
    <div className="pp-courses-grid">
      {student.coursesList.map((c, i) => (
        <div className="pp-course-card" key={i}>
          <span className="pp-course-icon" style={{ background: c.color }}>
            {c.icon}
          </span>
          <div className="pp-course-info">
            <p className="pp-course-name">{c.name}</p>
            <p className="pp-course-code">{c.code} · {c.year}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Posts");
  const [following, setFollowing] = useState(false);

  return (
    <div className="pp-root">
      {/* ── Cover ── */}
      <div className="pp-cover">
        <div className="pp-cover-overlay" />
      </div>

      {/* ── Profile Header ── */}
      <div className="pp-header-wrap">
        <div className="pp-header">
          <div className="pp-avatar-wrap">
            <img
              src="/ahmed.png"
              alt="Ahmed Ayman"
              className="pp-avatar"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentNode.querySelector(".pp-avatar-fallback").style.display = "flex";
              }}
            />
            <div className="pp-avatar-fallback">👤</div>
            <span className="pp-active-dot" title="Active" />
          </div>

          <div className="pp-identity">
            <h1 className="pp-name">
              {student.name}
              {student.verified && <VerifiedBadge />}
            </h1>
            <p className="pp-title">{student.title}</p>
            <div className="pp-meta-row">
              <span>🏛 {student.department}</span>
              <span>💻 {student.field}</span>
              <span>🏷 {student.specialty}</span>
            </div>
          </div>

          <div className="pp-cta-group">
            <button
              className={`pp-btn-follow${following ? " followed" : ""}`}
              onClick={() => setFollowing(!following)}
            >
              {following ? "✓ Following" : "+ Follow"}
            </button>
            <button className="pp-btn-message">✉ Message</button>
          </div>
        </div>

        {/* Stats row */}
        <div className="pp-stats-row">
          <StatItem icon="👥" value={student.followers} label="Followers" />
          <div className="pp-stats-divider" />
          <StatItem icon="📚" value={student.courses} label="Courses" />
          <div className="pp-stats-divider" />
          <StatItem icon="🗂" value={student.groups} label="Groups" />
          <div className="pp-stats-divider" />
          <StatItem icon="📄" value={student.uploadedFiles} label="Files" />
        </div>
      </div>

      {/* ── Tabs + Main Content ── */}
      <div className="pp-body">
        {/* Left: tabs + feed */}
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
              student.posts.map((p) => <PostCard key={p.id} post={p} />)}
            {activeTab === "Files" && <FilesTab />}
            {activeTab === "Groups" && <GroupsTab />}
            {activeTab === "Courses" && <CoursesTab />}
          </div>
        </div>

        {/* Right: sidebar */}
        <aside className="pp-sidebar">
          {/* About */}
          <section className="pp-sidebar-card">
            <h3 className="pp-sidebar-title">ℹ About</h3>
            <p className="pp-about-text">{student.about}</p>
            <div className="pp-about-grid">
              <span className="pp-about-key">Year</span>
              <span className="pp-about-val">{student.year}</span>
              <span className="pp-about-key">Skills</span>
              <span className="pp-about-val">{student.skills.join(", ")}</span>
            </div>
          </section>

          {/* Research Interests */}
          <section className="pp-sidebar-card">
            <h3 className="pp-sidebar-title">🔬 Interests</h3>
            <div className="pp-tags">
              {student.researchInterests.map((r) => (
                <span className="pp-tag" key={r}>
                  {r}
                </span>
              ))}
            </div>
          </section>

          {/* Courses */}
          <section className="pp-sidebar-card">
            <div className="pp-sidebar-row-head">
              <h3 className="pp-sidebar-title">📖 Courses</h3>
              <button className="pp-view-all">View All</button>
            </div>
            <div className="pp-sidebar-courses">
              {student.coursesList.slice(0, 4).map((c) => (
                <div className="pp-sc-item" key={c.code}>
                  <span className="pp-sc-icon" style={{ background: c.color }}>
                    {c.icon}
                  </span>
                  <div>
                    <p className="pp-sc-name">{c.name}</p>
                    <p className="pp-sc-code">
                      {c.code} · {c.year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Groups */}
          <section className="pp-sidebar-card">
            <div className="pp-sidebar-row-head">
              <h3 className="pp-sidebar-title">👥 Groups</h3>
              <button className="pp-view-all">See All</button>
            </div>
            {student.groupsList.map((g) => (
              <div className="pp-sg-item" key={g.name}>
                <span className="pp-sg-icon" style={{ background: g.color }}>
                  ◈
                </span>
                <div>
                  <p className="pp-sg-name">{g.name}</p>
                  <p className="pp-sg-members">{g.members} members</p>
                </div>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}