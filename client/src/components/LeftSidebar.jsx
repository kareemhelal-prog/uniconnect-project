import React, { useState } from "react";
import "./LeftSidebar.css";
import { MdBook, MdPeople, MdNotifications } from "react-icons/md";

const NAV = [
  { key: "courses", icon: <MdBook size={16} />, label: "My Courses" },
  { key: "friends", icon: <MdPeople size={16} />, label: "Friends" },
  {
    key: "notifs",
    icon: <MdNotifications size={16} />,
    label: "Notifications",
  },
];

export default function LeftSidebar({ user = {} }) {
  const [activeTab, setActiveTab] = useState(null); // ← null = مفيش حاجة متحددة

  const initials   = user.initials   || "?";
  const profilePic = user.profilePic || "";
  const status     = user.status     || "offline";

  return (
    <aside className="hp-card">
      <div className="hp-avatar-wrap">
        <div className="hp-avatar" style={profilePic ? { background: "transparent", padding: 0, overflow: "hidden" } : {}}>
          {profilePic
            ? <img src={profilePic} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<span>${initials}</span>`; }} />
            : <span>{initials}</span>}
          <span className="hp-avatar-ring" />
          <span className={`hp-dot ${status}`} />
        </div>
      </div>

      <h2 className="hp-name">{user.name || "—"}</h2>
      <p className="hp-role">{user.role || "—"}</p>

      <div className="hp-id-badge">
        <span className="hp-id-label">USER ID</span>
        <span className="hp-id-value">#{user.id || "—"}</span>
      </div>

      <div className="hp-online">
        <span className="hp-online-led" />
        {status === "online" ? "Online" : "Offline"}
      </div>

      {user.stats && user.stats.length > 0 && (
        <div className="hp-stats">
          {user.stats.map((s) => (
            <div key={s.label} className="hp-stat">
              <span className="hp-stat-val">{s.value}</span>
              <span className="hp-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <nav className="hp-nav">
        {NAV.map((n) => (
          <button
            key={n.key}
            className={`hp-nav-item ${activeTab === n.key ? "active" : ""}`}
            onClick={() => setActiveTab(n.key)}
          >
            {n.icon} {n.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
