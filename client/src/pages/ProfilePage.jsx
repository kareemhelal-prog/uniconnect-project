import React from "react";
import { useEffect } from "react";

import "../styles/ProfilePage.css";

const skills = [
  
  { label: "Machine Learning", icon: "🤖" },
  { label: "Data Science",     icon: "📊" },
  { label: "Full-Stack Dev",   icon: "💻" },
  { label: "Data Analysis",    icon: "📈" },
];

const materials = [
  { id: 1, user: "Ahmed Salem",  initials: "AS", time: "2 months ago", file: "Machine Learning Notes", ext: "AI"  },
  { id: 2, user: "Sara Khaled",  initials: "SK", time: "3 months ago", file: "AI Project History.ppx", ext: "PPT" },
  { id: 3, user: "Omar Tarek",   initials: "OT", time: "1 month ago",  file: "AI Project Proposal",   ext: "PDF" },
  { id: 4, user: "Nada Hassan",  initials: "NH", time: "2 months ago", file: "Web Dev Cheatsheet",     ext: "DOC" },
];

export default function ProfilePage() {
  useEffect(() => {
    document.title = "Profile | UniConnect";
}, []);
  return (
    
    <div className="profile-page">
      <div className="profile-grid">

        {/* ===== SIDEBAR ===== */}
        <aside className="sidebar">
          <div className="profile-avatar">
            <img
              src="/7734.jpg"
              alt="Profile"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentNode.textContent = "👤";
              }}
            />
          </div>

          <h2 className="profile-name">Alex Chen</h2>
          <p className="profile-role">Student Profile</p>

          <div className="status-badge">
            <span className="status-dot" />
            Status
          </div>

          <nav className="sidebar-nav">
            <button className="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              My Courses
            </button>

            <button className="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Messages
            </button>

            <button className="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Friends
            </button>
          </nav>

          {/* Social Links */}
          <div className="social-links">
            <a href="https://www.facebook.com/your-username" target="_blank" rel="noreferrer" className="social-item">
              📘 Facebook Profile
            </a>
            <a href="https://www.tiktok.com/@your-username" target="_blank" rel="noreferrer" className="social-item">
              🎵 TikTok Channel
            </a>
            <a href="https://www.linkedin.com/in/your-username" target="_blank" rel="noreferrer" className="social-item">
              💼 LinkedIn Profile
            </a>
          </div>
        </aside>

        {/* ===== GPA CARD ===== */}
        <main className="gpa-card">
          <h2 className="gpa-title">GPA Tracker</h2>

          {/* الدايرة - بتلف عند hover */}
          <div className="gpa-circle-wrapper">
            <div className="gpa-ring">
              <div className="gpa-score">
                3.8/4.0
                <span>GPA Score</span>
              </div>
            </div>
          </div>

          {/* السنوات - بتظهر عند hover بأنيميشن */}
          <div className="years-container">
            <div className="year-block">First Academic Year</div>
            <div className="year-block">Second Academic Year</div>
            <div className="year-block">Third Academic Year</div>
            <div className="year-block">Fourth Academic Year</div>
          </div>

          {/* Pinned Material */}
          <div className="pinned-material" style={{ marginTop: "20px" }}>
            <div className="pinned-header">
              <div className="pinned-avatar">MR</div>
              <div className="pinned-info">
                <h4>Pinned Materials</h4>
                <p>3 months ago</p>
              </div>
            </div>

            <div className="pinned-actions">
              <button className="action-btn">♡ Like Comment</button>
              <button className="action-btn">♡ Like</button>
            </div>

            <div className="pinned-file">
              <div className="file-icon">AI</div>
              <div>
                <div className="file-name">Machine Learning Notes</div>
                <div className="file-time">5 months ago</div>
              </div>
            </div>

            <p className="pinned-desc">
              Advanced machine learning techniques and algorithms for data science applications...
            </p>

            <div className="pinned-btns">
              <button className="download-btn">⬇ Download</button>
              <button className="share-btn">↗ Share</button>
            </div>
          </div>
        </main>

        {/* ===== RIGHT COLUMN ===== */}
        <section className="right-column">

          {/* Skills */}
          <div className="section-card">
            <h3 className="section-title">My Skills</h3>
            <div className="skills-grid">
              {skills.map((s, i) => (
                <div className="skill-tag" key={i}>
                  <div className="skill-icon">{s.icon}</div>
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Uploaded Materials */}
          <div className="section-card">
            <h3 className="section-title">Uploaded Materials</h3>
            <div className="materials-grid">
              {materials.map((m) => (
                <div className="material-card" key={m.id}>
                  <div className="material-user">
                    <div className="material-avatar-circle">{m.initials}</div>
                    <div className="material-user-info">
                      <h5>{m.user}</h5>
                      <p>{m.time}</p>
                    </div>
                  </div>
                  <div className="material-file">
                    <div className={`material-file-icon ${m.ext === "PDF" ? "pdf" : m.ext === "DOC" ? "doc" : ""}`}>
                      {m.ext}
                    </div>
                    <div className="material-file-info">
                      <h4>{m.file}</h4>
                      <p>{m.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
