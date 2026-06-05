import React, { useState } from "react";
import "./Navbar.css";
import {
  FiBell,
  FiSearch,
  FiGrid,
  FiUser,
  FiFolderPlus,
  FiFile,
  FiUsers,
  FiStar,
  FiHome,
  FiSettings,
  FiRepeat,
  FiLogOut,
} from "react-icons/fi";
import { HiOutlineLink } from "react-icons/hi";

const LAUNCHER_PAGES = [
  { id: "profile", label: "Profile", icon: FiUser },
  { id: "projects", label: "Projects", icon: FiFolderPlus },
  { id: "files", label: "Files", icon: FiFile },
  { id: "groups", label: "Groups", icon: FiUsers },
  { id: "academic-reviews", label: "Academic Reviews", icon: FiStar },
];

function Navbar({ activePage, onNavigate, notifications = [], user = {} }) {
  const [bellRing, setBellRing] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState([]);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherClicked, setLauncherClicked] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  React.useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest(".tooltip-wrap")) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter(
    (n) => !readNotifs.includes(n.id)
  ).length;

  const handleBell = () => {
    setBellRing(true);
    setNotifOpen((p) => !p);
    setLauncherOpen(false);
    setTimeout(() => setBellRing(false), 600);
  };

  const markRead = (id) => setReadNotifs((p) => [...p, id]);
  const markAllRead = () => {
    setReadNotifs(notifications.map((n) => n.id));
    setNotifOpen(false);
  };

  const handleLauncher = () => {
    setLauncherOpen((p) => !p);
    setNotifOpen(false);
    setLauncherClicked(true);
    setTimeout(() => setLauncherClicked(false), 600);
  };

  const navigate = (id) => {
    onNavigate(id);
    setLauncherOpen(false);
    setNotifOpen(false);
    setAvatarMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <HiOutlineLink className="logo-icon" />
        <span className="logo-text">UniConnect</span>
      </div>

      <div className="nav-search-wrap">
        <FiSearch className="search-icon" />
        <input className="nav-search" placeholder="Search..." type="text" />
      </div>

      <div style={{ flex: 1 }} />

      <button
        className={`home-btn ${activePage === "home" ? "home-btn-active" : ""}`}
        onClick={() => navigate("home")}
        title="Home"
      >
        <FiHome size={18} />
        <span className="home-btn-label">Home</span>
      </button>

      {/* App Launcher */}
      <div className="launcher-wrap">
        <button
          className={`launcher-btn ${
            launcherOpen ? "launcher-btn-active" : ""
          } ${launcherClicked ? "clicked" : ""}`}
          onClick={handleLauncher}
          title="App Launcher"
        >
          <FiGrid size={20} />
        </button>

        {launcherOpen && (
          <div className="launcher-dropdown">
            <div className="launcher-title">Quick Nav</div>
            <div className="launcher-grid">
              {LAUNCHER_PAGES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`launcher-item ${
                    activePage === id ? "launcher-item-active" : ""
                  }`}
                  onClick={() => navigate(id)}
                >
                  <Icon size={22} className="launcher-icon" />
                  <span className="launcher-label">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notifications Bell */}
      <div className="notif-wrap">
        <div
          className={`nav-bell ${bellRing ? "ring" : ""} ${
            activePage === "notifications" ? "nav-bell-active" : ""
          }`}
          onClick={handleBell}
        >
          <FiBell size={20} />
          {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
          {unreadCount > 0 && <span className="bell-pulse" />}
        </div>

        {notifOpen && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <span className="notif-title">Notifications</span>
              <button className="notif-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            </div>
            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item ${
                      readNotifs.includes(n.id) ? "read" : "unread"
                    }`}
                    onClick={() => {
                      markRead(n.id);
                      navigate("notifications");
                    }}
                  >
                    <span className="notif-icon">{n.icon}</span>
                    <div className="notif-body">
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-body">{n.body}</div>
                      <div className="notif-item-time">{n.time}</div>
                    </div>
                    {!readNotifs.includes(n.id) && (
                      <span className="notif-dot" />
                    )}
                  </div>
                ))
              )}
            </div>
            {unreadCount === 0 && notifications.length > 0 && (
              <div className="notif-empty">All caught up!</div>
            )}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="tooltip-wrap">
        <div
          className="nav-avatar"
          onClick={() => setAvatarMenuOpen((p) => !p)}
        >
          {user.initials || "SJ"}
          <span className="avatar-dot" />
          <span className="avatar-ring" />
        </div>

        {avatarMenuOpen && (
          <div className="avatar-menu">
            <div className="avatar-menu-header">
              <div className="avatar-menu-name">
                {user.name || "Sara Johnson"}
              </div>
              <div className="avatar-menu-email">
                {user.email || "sara@uniconnect.edu"}
              </div>
            </div>
            <button
              className="avatar-menu-item"
              onClick={() => navigate("profile")}
            >
              <FiUser size={14} /> View Profile
            </button>
            <button
              className="avatar-menu-item"
              onClick={() => navigate("settings")}
            >
              <FiSettings size={14} /> Settings
            </button>
            <button
              className="avatar-menu-item"
              onClick={() => navigate("switch-account")}
            >
              <FiRepeat size={14} /> Switch Account
            </button>
            <div className="avatar-menu-divider" />
            <button
              className="avatar-menu-item avatar-menu-danger"
              onClick={() => navigate("logout")}
            >
              <FiLogOut size={14} /> Log Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
