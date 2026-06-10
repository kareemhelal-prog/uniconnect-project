import React, { useState } from "react";
import "./Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
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
  FiLogOut,
  FiBook,
} from "react-icons/fi";
import { HiOutlineLink } from "react-icons/hi";

// ── Launcher items حسب الـ role ──
const LAUNCHER_PAGES_STUDENT = [
  { id: "profile",  label: "Profile",          icon: FiUser,       path: "/profile" },
  { id: "projects", label: "Projects",         icon: FiFolderPlus, path: "/projects" },
  { id: "files",    label: "Files",            icon: FiFile,       path: "/files" },
  { id: "groups",   label: "Groups",           icon: FiUsers,      path: "/groups" },
  { id: "reviews",  label: "Academic Reviews", icon: FiStar,       path: "/reviews" },
];

const LAUNCHER_PAGES_DOCTOR = [
  { id: "profile",   label: "Profile",    icon: FiUser,  path: "/profile" },
  { id: "groups",    label: "My Courses", icon: FiBook,  path: "/groups" },
  { id: "files",     label: "Files",      icon: FiFile,  path: "/files" },
  { id: "my-groups", label: "My Groups",  icon: FiUsers, path: "/my-groups" },
  { id: "reviews",   label: "Reviews",    icon: FiStar,  path: "/reviews" },
];

function Navbar({ notifications = [], user = {}, searchValue, onSearchChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  // قراءة الـ role من الـ JWT أوتوماتيك
  const token = localStorage.getItem("token");
  const role = token
    ? JSON.parse(atob(token.split(".")[1])).role
    : "student";

  const [bellRing,        setBellRing]        = useState(false);
  const [notifOpen,       setNotifOpen]       = useState(false);
  const [readNotifs,      setReadNotifs]      = useState([]);
  const [launcherOpen,    setLauncherOpen]    = useState(false);
  const [launcherClicked, setLauncherClicked] = useState(false);
  const [avatarMenuOpen,  setAvatarMenuOpen]  = useState(false);

  const launcherPages =
    role === "doctor" ? LAUNCHER_PAGES_DOCTOR : LAUNCHER_PAGES_STUDENT;

  const unreadCount = notifications.filter((n) => !readNotifs.includes(n.id)).length;
  const activePage  = location.pathname.replace("/", "") || "home";
  const homePath    = "/dashboard";

  const handleBell = () => {
    setBellRing(true);
    setNotifOpen((p) => !p);
    setLauncherOpen(false);
    setAvatarMenuOpen(false);
    setTimeout(() => setBellRing(false), 600);
  };

  const markRead    = (id) => setReadNotifs((p) => [...p, id]);
  const markAllRead = () => {
    setReadNotifs(notifications.map((n) => n.id));
    setNotifOpen(false);
  };

  const handleLauncher = () => {
    setLauncherOpen((p) => !p);
    setNotifOpen(false);
    setAvatarMenuOpen(false);
    setLauncherClicked(true);
    setTimeout(() => setLauncherClicked(false), 600);
  };

  const handleAvatarMenu = () => {
    setAvatarMenuOpen((p) => !p);
    setNotifOpen(false);
    setLauncherOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goTo = (path) => {
    navigate(path);
    setLauncherOpen(false);
    setNotifOpen(false);
    setAvatarMenuOpen(false);
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="nav-logo" onClick={() => goTo(homePath)} style={{ cursor: "pointer" }}>
        <HiOutlineLink className="logo-icon" />
        <span className="logo-text">UniConnect</span>
      </div>

      {/* Search */}
      <div className="nav-search-wrap">
        <FiSearch className="search-icon" />
        <input
          className="nav-search"
          placeholder="Search..."
          type="text"
          value={searchValue || ""}
          onChange={onSearchChange}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Home Button */}
      <button
        className={`home-btn ${activePage === "dashboard" ? "home-btn-active" : ""}`}
        onClick={() => goTo(homePath)}
        title="Home"
      >
        <FiHome size={18} />
        <span className="home-btn-label">Home</span>
      </button>

      {/* App Launcher */}
      <div className="launcher-wrap">
        <button
          className={`launcher-btn ${launcherOpen ? "launcher-btn-active" : ""} ${launcherClicked ? "clicked" : ""}`}
          onClick={handleLauncher}
          title="App Launcher"
        >
          <FiGrid size={20} />
        </button>

        {launcherOpen && (
          <div className="launcher-dropdown">
            <div className="launcher-title">Quick Nav</div>
            <div className="launcher-grid">
              {launcherPages.map(({ id, label, icon: Icon, path }) => (
                <button
                  key={id}
                  className={`launcher-item ${activePage === id ? "launcher-item-active" : ""}`}
                  onClick={() => goTo(path)}
                >
                  <Icon size={22} className="launcher-icon" />
                  <span className="launcher-label">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bell */}
      <div className="notif-wrap">
        <div
          className={`nav-bell ${bellRing ? "ring" : ""} ${notifOpen ? "nav-bell-active" : ""}`}
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
                notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item ${readNotifs.includes(n.id) ? "read" : "unread"}`}
                    onClick={() => markRead(n.id)}
                  >
                    <span className="notif-icon">{n.icon}</span>
                    <div className="notif-body">
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-body">{n.body}</div>
                      <div className="notif-item-time">{n.time}</div>
                    </div>
                    {!readNotifs.includes(n.id) && <span className="notif-dot" />}
                  </div>
                ))
              )}
            </div>
            <div
              className="notif-mark-all"
              style={{ padding: "10px 16px", borderTop: "1px solid #1e1e3a", textAlign: "center" }}
              onClick={() => goTo("/notifications")}
            >
              View all notifications
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="tooltip-wrap">
        <div className="nav-avatar" onClick={handleAvatarMenu}>
          {user.initials || "U"}
          <span className="avatar-dot" />
          <span className="avatar-ring" />
        </div>

        {avatarMenuOpen && (
          <div className="avatar-menu">
            <div className="avatar-menu-header">
              <div className="avatar-menu-name">{user.name || "User"}</div>
              <div className="avatar-menu-email">{user.email || ""}</div>
            </div>
            <button className="avatar-menu-item" onClick={() => goTo("/profile")}>
              <FiUser size={15} /> Profile
            </button>
            <button className="avatar-menu-item" onClick={() => goTo("/edit-profile")}>
              <FiSettings size={15} /> Settings
            </button>
            <div className="avatar-menu-divider" />
            <button className="avatar-menu-item avatar-menu-danger" onClick={handleLogout}>
              <FiLogOut size={15} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;