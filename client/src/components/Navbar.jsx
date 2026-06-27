import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./Navbar.css";
import logo from "../assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { getSocket } from "../socket";
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
  FiCompass,
} from "react-icons/fi";

const API_BASE = "/api";

const LAUNCHER_PAGES_STUDENT = [
  { id: "profile",   label: "Profile",          icon: FiUser,     path: "/profile" },
  { id: "courses",   label: "My Courses",       icon: FiBook,     path: "/courses" },
  { id: "files",     label: "Files",            icon: FiFile,     path: "/files" },
  { id: "groups",    label: "Groups",           icon: FiCompass,  path: "/groups" },
  { id: "my-groups", label: "My Groups",        icon: FiUsers,    path: "/my-groups" },
  { id: "reviews",   label: "Academic Reviews", icon: FiStar,     path: "/reviews" },
];

const LAUNCHER_PAGES_DOCTOR = [
  { id: "profile",   label: "Profile",    icon: FiUser,    path: "/profile" },
  { id: "courses",   label: "My Courses", icon: FiBook,    path: "/courses" },
  { id: "files",     label: "Files",      icon: FiFile,    path: "/files" },
  { id: "groups",    label: "Groups",     icon: FiCompass, path: "/groups" },
  { id: "my-groups", label: "My Groups",  icon: FiUsers,   path: "/my-groups" },
  { id: "reviews",   label: "Reviews",    icon: FiStar,    path: "/reviews" },
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
  return `/${pic.replace(/^\//, "")}`;
};

function Navbar({ notifications: _ignored = [], user: userProp = {} }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Track viewport width so portal styles are correct after resize
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= 640
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  // ── Real-time: prepend incoming notifications instantly ──
  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    const onNew = (notif) => {
      setSelfNotifs(prev => {
        if (prev.some(n => n.id === notif.id)) return prev; // dedupe
        return [notif, ...prev];
      });
      playNotificationSound();
    };
    socket.on("new_notification", onNew);
    return () => socket.off("new_notification", onNew);
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

  // Mark a single notification read (optimistic + API)
  const markNotifRead = (id) => {
    setSelfNotifs(prev => prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n)));
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  // Zone 1 — actor name / avatar → their profile
  const goToNotifActor = (e, n) => {
    e.stopPropagation();
    markNotifRead(n.id);
    if (n.sender_id) goTo(`/profile/${n.sender_id}`);
  };

  // Zone 2 — message text → the relevant content
  const goToNotifContent = (e, n) => {
    e.stopPropagation();
    markNotifRead(n.id);
    if (n.type === "follow") {
      goTo(`/profile?tab=followers`);
    } else if (n.reference_id) {
      const hash = n.type === "comment" && n.reference_comment_id
        ? `#comment-${n.reference_comment_id}` : "";
      goTo(`/posts/${n.reference_id}${hash}`);
    } else {
      goTo("/notifications");
    }
  };

  // ── User Search ─────────────────────────────────────────
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchRef      = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-focus when mobile search expands
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const closeSearch = () => {
    setSearchExpanded(false);
    setSearchQuery("");
    setSearchOpen(false);
  };

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
    <>
    <nav className="navbar">
      {/* Logo */}
      <div className="nav-logo" onClick={() => goTo(homePath)} style={{ cursor: "pointer" }}>
        <span className="logo-mark" aria-hidden="true">
          <img src={logo} className="logo-img" alt="UniConnect" />
        </span>
        <span className="logo-text">UniConnect</span>
      </div>

      {/* Search */}
      <div
        className={`nav-search-wrap${searchExpanded ? " search-open" : ""}`}
        ref={searchRef}
      >
        {/* Mobile icon-only button — tapping opens the full search overlay */}
        <button className="nav-search-toggle" onClick={() => setSearchExpanded(true)} aria-label="Open search">
          <FiSearch size={18} />
        </button>

        {/* Search input area (always visible on desktop; overlay on mobile when expanded) */}
        <div className="nav-search-inner">
          <FiSearch className="search-icon" />
          <input
            ref={searchInputRef}
            className="nav-search"
            placeholder="Search users..."
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length >= 1 && setSearchOpen(true)}
            onBlur={() => setTimeout(() => { if (!searchQuery.trim()) setSearchExpanded(false); }, 200)}
          />
          <button className="nav-search-close" onClick={closeSearch} aria-label="Close search">✕</button>
        </div>
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

      {/* Bell — button only; dropdown rendered outside <nav> below */}
      <div className="notif-wrap">
        <div
          className={`nav-bell ${bellRing ? "ring" : ""} ${notifOpen ? "nav-bell-active" : ""}`}
          onClick={handleBell}
        >
          <FiBell size={20} />
          {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
          {unreadCount > 0 && <span className="bell-pulse" />}
        </div>
      </div>

      {/* Hamburger — mobile only */}
      <button
        className={`nav-hamburger${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen(m => !m)}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>

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
            <button className="avatar-menu-item" onClick={() => goTo("/settings")}>
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

    {/* ── Notification overlay — rendered via portal into document.body ── */}
    {notifOpen && createPortal(
      <>
        {/* Backdrop: inline styles so nothing in the CSS cascade can interfere */}
        <div
          onClick={() => setNotifOpen(false)}
          style={{
            position: "fixed",
            inset: "0",
            background: "rgba(0,0,0,0.35)",
            zIndex: 9998,
            cursor: "pointer",
          }}
        />
        {/* Panel: inline styles for critical layout; CSS class handles visual design */}
        <div
          className="notif-dropdown"
          style={isMobile ? {
            /* Compact dropdown — centered on mobile, never full-screen */
            position: "fixed",
            top: "62px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "320px",
            maxWidth: "90vw",
            maxHeight: "60vh",
            zIndex: 9999,
            overflowY: "auto",
            overflowX: "hidden",
            boxSizing: "border-box",
          } : {
            position: "fixed",
            top: "62px",
            right: "10px",
            width: "360px",
            maxWidth: "calc(100vw - 20px)",
            maxHeight: "520px",
            zIndex: 9999,
            overflowY: "auto",
            overflowX: "hidden",
            boxSizing: "border-box",
          }}
        >
          <div className="notif-header">
            <span className="notif-title">Notifications</span>
            <div className="notif-header-actions">
              <button className="notif-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
              <button className="notif-close-btn" onClick={() => setNotifOpen(false)} aria-label="Close">✕</button>
            </div>
          </div>
          <div className="notif-list">
            {selfNotifs.length === 0 ? (
              <div className="notif-empty">No notifications</div>
            ) : (
              selfNotifs.slice(0, 8).map(n => {
                const senderVerified = n.sender_role === "doctor" || n.sender_role === "admin";
                return (
                  <div
                    key={n.id}
                    className={`notif-item ${n.is_read ? "read" : "unread"}`}
                  >
                    <span
                      className="notif-icon notif-zone-actor"
                      onClick={(e) => goToNotifActor(e, n)}
                      title="View profile"
                    >
                      {notifIcon(n.type)}
                    </span>
                    <div className="notif-body">
                      <div className="notif-item-title">
                        {n.sender_name && (
                          <span
                            className="notif-actor-name notif-zone-actor"
                            onClick={(e) => goToNotifActor(e, n)}
                          >
                            {n.sender_name}
                            {senderVerified && <span className="notif-verified" title="Verified">✓</span>}
                          </span>
                        )}{" "}
                        <span
                          className="notif-msg-text notif-zone-content"
                          onClick={(e) => goToNotifContent(e, n)}
                        >
                          {n.message}
                        </span>
                      </div>
                      <div
                        className="notif-item-time notif-zone-content"
                        onClick={(e) => goToNotifContent(e, n)}
                      >
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                      </div>
                    </div>
                    {!n.is_read && <span className="notif-dot" />}
                  </div>
                );
              })
            )}
          </div>
          <div className="notif-view-all" onClick={() => { goTo("/notifications"); setNotifOpen(false); }}>
            View all notifications
          </div>
        </div>
      </>,
      document.body
    )}

    {/* Mobile slide-down menu */}
    {menuOpen && (
      <div className="mobile-menu">
        <button className="mobile-menu-item" onClick={() => { goTo(homePath); setMenuOpen(false); }}>
          <FiHome size={18} /> Home
        </button>
        {launcherPages.map(({ id, label, icon: Icon, path }) => (
          <button
            key={id}
            className="mobile-menu-item"
            onClick={() => { goTo(path); setMenuOpen(false); }}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
        <div className="mobile-menu-divider" />
        <button className="mobile-menu-item mobile-menu-danger" onClick={handleLogout}>
          <FiLogOut size={18} /> Logout
        </button>
      </div>
    )}
    </>
  );
}

export default Navbar;
