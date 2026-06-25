import React, { useState, useEffect, useRef } from "react";
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

const API_BASE = "http://localhost:5000/api";

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

const notifIcon = (type) => {
  if (type === "like")    return "❤️";
  if (type === "comment") return "💬";
  if (type === "follow")  return "👤";
  return "🔔";
};

const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
};

const resolveAvatar = (pic) => {
  if (!pic) return "";
  if (pic.startsWith("data:") || pic.startsWith("http")) return pic;
  return `http://localhost:5000/${pic.replace(/^\//, "")}`;
};

function Navbar({ notifications: _ignored = [], user: userProp = {} }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const token = localStorage.getItem("token");
  const role  = token
    ? (() => { try { return JSON.parse(atob(token.split(".")[1])).role; } catch { return "student"; } })()
    : "student";

  // ── Self-fetch user ──────────────────────────────────────
  const [selfUser, setSelfUser] = useState({});
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const u   = d.user || d;
        const pic = u.profile_picture || "";
        setSelfUser({
          name:       u.name  || "",
          email:      u.email || "",
          initials:   (u.name || "U").slice(0, 2).toUpperCase(),
          profilePic: resolveAvatar(pic),
        });
      }).catch(() => {});
  }, [token]);

  const user = {
    ...selfUser,
    ...Object.fromEntries(Object.entries(userProp).filter(([, v]) => v != null && v !== "")),
  };

  // ── Self-fetch notifications (polls every 30 s) ──────────
  const [selfNotifs,  setSelfNotifs]  = useState([]);
  const prevUnreadRef = useRef(-1);

  const fetchNotifs = async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      const list = json.data || [];
      const newUnread = list.filter(n => !n.is_read).length;
      // Play sound only when unread count grows (new notification arrived)
      if (prevUnreadRef.current >= 0 && newUnread > prevUnreadRef.current) {
        playNotificationSound();
      }
      prevUnreadRef.current = newUnread;
      setSelfNotifs(list);
    } catch {}
  };

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [token]);

  const unreadCount = selfNotifs.filter(n => !n.is_read).length;

  // ── Notification panel ───────────────────────────────────
  const [bellRing,     setBellRing]     = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherClicked, setLauncherClicked] = useState(false);
  const [avatarMenuOpen,  setAvatarMenuOpen]  = useState(false);

  const launcherPages = role === "doctor" ? LAUNCHER_PAGES_DOCTOR : LAUNCHER_PAGES_STUDENT;
  const homePath      = role === "doctor" ? "/HomeDoctor" : "/home";
  const activePage    = location.pathname.replace("/", "") || "home";

  const handleBell = async () => {
    setBellRing(true);
    const wasOpen = notifOpen;
    setNotifOpen(p => !p);
    setLauncherOpen(false);
    setAvatarMenuOpen(false);
    setTimeout(() => setBellRing(false), 600);
    // Mark all as read in DB when opening the panel
    if (!wasOpen && unreadCount > 0) {
      try {
        await fetch(`${API_BASE}/notifications/read-all`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSelfNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
        prevUnreadRef.current = 0;
      } catch {}
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelfNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      prevUnreadRef.current = 0;
    } catch {}
    setNotifOpen(false);
  };

  // ── User Search ─────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 1) { setSearchResults([]); setSearchOpen(false); return; }
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setSearchResults(json.data || []);
        setSearchOpen(true);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFollowFromSearch = async (e, userId) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ following_id: userId }),
      });
      setSearchResults(prev =>
        prev.map(u => u.id === userId ? { ...u, is_following: !u.is_following } : u)
      );
    } catch {}
  };

  const handleLauncher = () => {
    setLauncherOpen(p => !p);
    setNotifOpen(false);
    setAvatarMenuOpen(false);
    setLauncherClicked(true);
    setTimeout(() => setLauncherClicked(false), 600);
  };

  const handleAvatarMenu = () => {
    setAvatarMenuOpen(p => !p);
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
      <div className="nav-search-wrap" ref={searchRef} style={{ position: "relative" }}>
        <FiSearch className="search-icon" />
        <input
          className="nav-search"
          placeholder="Search users..."
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.trim().length >= 2 && setSearchOpen(true)}
        />
        {searchOpen && searchResults.length > 0 && (
          <div className="search-dropdown">
            {searchResults.map(u => {
              const pic        = resolveAvatar(u.profile_picture);
              const isVerified = u.role === "doctor" || u.role === "admin";
              return (
                <div
                  key={u.id}
                  className="search-result-item"
                  onClick={() => { goTo(`/profile/${u.id}`); setSearchOpen(false); setSearchQuery(""); }}
                >
                  <div className="search-result-avatar">
                    {pic
                      ? <img src={pic} alt="" onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                      : null}
                    <span className="search-result-initials" style={{ display: pic ? "none" : "flex" }}>
                      {(u.name || "U").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="search-result-info">
                    <span className="search-result-name">
                      {u.name}
                      {isVerified && <span className="search-verified-badge" title="Verified">✓</span>}
                    </span>
                    <span className="search-result-role">
                      {u.role}
                      {u.role === "student" && u.username && ` · ${u.username}`}
                    </span>
                  </div>
                  <button
                    className={`search-follow-btn${u.is_following ? " following" : ""}`}
                    onClick={e => handleFollowFromSearch(e, u.id)}
                  >
                    {u.is_following ? "✓" : "+ Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {searchOpen && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <div className="search-dropdown">
            <div className="search-no-results">No users found</div>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Home Button */}
      <button
        className={`home-btn ${activePage === "home" || activePage === "HomeDoctor" ? "home-btn-active" : ""}`}
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
              {selfNotifs.length === 0 ? (
                <div className="notif-empty">No notifications</div>
              ) : (
                selfNotifs.slice(0, 6).map(n => (
                  <div
                    key={n.id}
                    className={`notif-item ${n.is_read ? "read" : "unread"}`}
                  >
                    <span className="notif-icon">{notifIcon(n.type)}</span>
                    <div className="notif-body">
                      <div className="notif-item-title">
                        {n.sender_name ? `${n.sender_name} ` : ""}{n.message}
                      </div>
                      <div className="notif-item-time">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                      </div>
                    </div>
                    {!n.is_read && <span className="notif-dot" />}
                  </div>
                ))
              )}
            </div>
            <div
              className="notif-view-all"
              onClick={() => goTo("/notifications")}
            >
              View all notifications
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="tooltip-wrap">
        <div
          className="nav-avatar"
          onClick={handleAvatarMenu}
          style={user.profilePic ? { background: "transparent", padding: 0, overflow: "hidden", position: "relative" } : { position: "relative" }}
        >
          {user.profilePic
            ? <img src={user.profilePic} alt={user.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} onError={e => { e.target.style.display = "none"; }} />
            : (user.initials || "U")}
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
            <button className="avatar-menu-item" onClick={() => goTo("/profile/edit")}>
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
