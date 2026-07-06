import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LeftSidebar.css";
import { MdBook, MdPeople, MdNotifications } from "react-icons/md";

const NAV = [
  { key: "courses", icon: <MdBook size={16} />,          label: "My Courses",    path: "/courses" },
  { key: "friends", icon: <MdPeople size={16} />,        label: "Friends",       path: "/profile?tab=followers" },
  { key: "notifs",  icon: <MdNotifications size={16} />, label: "Notifications", path: "/notifications" },
];

export default function LeftSidebar({ user = {} }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null); // ← null = مفيش حاجة متحددة
  const [imgError, setImgError] = useState(false);  // fall back to initials if the avatar fails to load

  const initials   = user.initials   || "?";
  const profilePic = user.profilePic || "";
  const status     = user.status     || "offline";

  // Role-based identity badge: doctors/admins → email, students → academic ID
  const isStaff = user.role === "doctor" || user.role === "admin";
  const email   = (user.email || "").trim();
  const academicId = (user.username || "").trim();

  return (
    <aside className="hp-card">
      <div className="hp-avatar-wrap">
        <div className="hp-avatar" style={profilePic && !imgError ? { background: "transparent", padding: 0, overflow: "hidden" } : {}}>
          {profilePic && !imgError
            ? <img src={profilePic} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} onError={() => setImgError(true)} />
            : <span>{initials}</span>}
          <span className="hp-avatar-ring" />
          <span className={`hp-dot ${status}`} />
        </div>
      </div>

      <h2 className="hp-name">{user.name || "—"}</h2>
      <p className="hp-role">{user.role || "—"}</p>

      <div className="hp-id-badge" title={isStaff ? email : academicId}>
        {isStaff ? (
          email ? (
            <>
              <span className="hp-id-icon" aria-hidden="true">✉</span>
              <span className="hp-id-value hp-id-email">{email}</span>
            </>
          ) : (
            <span className="hp-id-empty">Email not set</span>
          )
        ) : (
          academicId ? (
            <>
              <span className="hp-id-icon" aria-hidden="true">🎓</span>
              <span className="hp-id-label">Academic ID</span>
              <span className="hp-id-value">{academicId}</span>
            </>
          ) : (
            <span className="hp-id-empty">ID not set</span>
          )
        )}
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
            onClick={() => { setActiveTab(n.key); navigate(n.path); }}
          >
            {n.icon} <span className="hp-nav-label">{n.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
