import React from "react";
import "./LeftSidebar.css";

const LeftSidebar = () => {
  return (
    <aside className="left-sidebar">
      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">K</div>
          <div className="avatar-glow"></div>
        </div>
        <h3 className="profile-name">Kareem Mohamed</h3>
        <p className="profile-role">Frontend Designer</p>
        <div className="status-badge">
          <span className="status-dot"></span>
          <span>Status</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-item active">
          <span className="nav-icon">📚</span>
          <span>My Courses</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">💬</span>
          <span>Messages</span>
          <span className="nav-badge">5</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">👥</span>
          <span>Friends</span>
        </div>
      </nav>
    </aside>
  );
};

export default LeftSidebar;
