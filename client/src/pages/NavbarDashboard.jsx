import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NavbarDashboard.css";
import { MdSettings } from "react-icons/md";
import {
  FiBell,
  FiX,
  FiChevronRight,
  FiLogOut,
  FiRefreshCw,
  FiHome,
  FiUsers,
  FiFileText,
  FiFlag,
  FiBriefcase,
  FiLayers,
  FiStar,
  FiFolder,
  FiMail,
  FiActivity,
  FiBook,
  FiUserCheck,
  FiUserPlus,
  FiRadio,
  FiMessageSquare,
} from "react-icons/fi";
import { RiAdminLine } from "react-icons/ri";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import axios from "../api/axios";

const ROUTES = {
  dashboard: "dashboard",
  feed: "feed",
  live: "live",
  review: "review",
  users: "users",
  posts: "posts",
  reports: "reports",
  projects: "projects",
  groups: "groups",
  reviews: "reviews",
  files: "files",
  courses: "courses",
  groupRequests: "group-requests",
  announcements: "announcements",
  emailAlerts: "email-alerts",
  activityLogs: "activity-logs",
};

const MENU_ITEMS = [
  { label: "Dashboard", icon: FiHome, pageKey: ROUTES.dashboard },
  { label: "Home Feed", icon: FiMessageSquare, pageKey: ROUTES.feed },
  { label: "Live Monitor", icon: FiRadio, pageKey: ROUTES.live },
  { label: "Account Review", icon: FiUserCheck, pageKey: ROUTES.review },
  { label: "Users", icon: FiUsers, pageKey: ROUTES.users },
  { label: "Posts", icon: FiFileText, pageKey: ROUTES.posts },
  { label: "Reports", icon: FiFlag, pageKey: ROUTES.reports },
  { label: "Projects", icon: FiBriefcase, pageKey: ROUTES.projects },
  { label: "Groups", icon: FiLayers, pageKey: ROUTES.groups },
  { label: "Group Requests", icon: FiUserPlus, pageKey: ROUTES.groupRequests },
  { label: "Reviews", icon: FiStar, pageKey: ROUTES.reviews },
  { label: "Courses", icon: FiBook, pageKey: ROUTES.courses },
  { label: "Files", icon: FiFolder, pageKey: ROUTES.files },
  { label: "Announcements", icon: HiOutlineSpeakerphone, pageKey: ROUTES.announcements },
  { label: "Email Alerts", icon: FiMail, pageKey: ROUTES.emailAlerts },
  { label: "Activity Logs", icon: FiActivity, pageKey: ROUTES.activityLogs },
];

const NOTIF_ICON_MAP = {
  like: FiStar,
  comment: FiFileText,
  follow: FiUsers,
  post: FiFileText,
  review: FiStar,
  mention: FiBell,
  account: FiUserPlus,
};

const NOTIF_TITLE_MAP = {
  like: "New Like",
  comment: "New Comment",
  follow: "New Follower",
  post: "New Post",
  review: "New Review",
  mention: "You were mentioned",
  account: "New Account — Review",
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Navbar({ activePage, onNavigate, onLogout }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellRing, setBellRing] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);

  const [adminUser, setAdminUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/auth/profile");
        if (res.data.success) setAdminUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await axios.get("/notifications");
        setNotifications(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoadingNotifs(false);
      }
    };
    fetchNotifs();
  }, []);

  // Pending-account count for the sidebar badge. Re-checked when the admin
  // navigates (e.g. after approving/rejecting on the review page).
  useEffect(() => {
    let alive = true;
    api_fetchPending();
    async function api_fetchPending() {
      try {
        const res = await axios.get("/admin/pending");
        if (alive) setPendingCount((res.data.users || []).length);
      } catch (_) { /* non-admin or error — ignore */ }
    }
    return () => { alive = false; };
  }, [activePage]);

  const unreadCount = notifications.filter(
    (n) => !readNotifs.includes(n.id) && !n.is_read
  ).length;

  const handleBell = () => {
    setBellRing(true);
    setNotifOpen((prev) => !prev);
    setTimeout(() => setBellRing(false), 600);
  };

  const markRead = (id) => setReadNotifs((prev) => [...prev, id]);

  const markAllRead = async () => {
    try {
      await axios.patch("/notifications/read-all");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setReadNotifs(notifications.map((n) => n.id));
      setNotifOpen(false);
    }
  };

  const navigateTo = (pageKey) => {
    onNavigate(pageKey ?? "not-found");
    setSidebarOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  };

  const handleNotifClick = async (id, type) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
    markRead(id);
    // Account-review notifications deep-link to the review page.
    navigateTo(type === "account" ? ROUTES.review : null);
  };

  const handleLogoutClick = () => {
    localStorage.removeItem("token");
    setProfileOpen(false);
    setSidebarOpen(false);
    onLogout();
  };

  const displayName = loadingUser ? "Loading..." : adminUser?.name ?? "Admin";
  const displayEmail = loadingUser ? "" : adminUser?.email ?? "";
  const displayStatus = "Online";
  const displayAvatar = adminUser?.profile_picture;

  return (
    <>
      <nav className="navbar">
        <button
          className="hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <span className={`ham-line ${sidebarOpen ? "open" : ""}`} />
          <span className={`ham-line ${sidebarOpen ? "open" : ""}`} />
          <span className={`ham-line ${sidebarOpen ? "open" : ""}`} />
        </button>

        <div className="nav-logo">
          <img src="/logo.png" className="logo-img" alt="UniConnect logo" />
          <span className="logo-text">UniConnect</span>
        </div>

        <div className="nav-links" />

        <div className="notif-wrap">
          <div
            className={`nav-bell ${bellRing ? "ring" : ""}`}
            onClick={handleBell}
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="bell-badge">{unreadCount}</span>
            )}
            {unreadCount > 0 && <span className="bell-pulse" />}
          </div>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-title">Notifications</span>
                {notifications.length > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>
                    Mark all as read
                  </button>
                )}
              </div>

              {loadingNotifs ? (
                <div className="notif-empty">
                  <span>Loading...</span>
                </div>
              ) : notifications.length > 0 ? (
                <div className="notif-list">
                  {notifications.map((n) => {
                    const Icon = NOTIF_ICON_MAP[n.type] || FiBell;
                    const title = NOTIF_TITLE_MAP[n.type] || "Notification";
                    const isUnread = !readNotifs.includes(n.id) && !n.is_read;
                    return (
                      <div
                        key={n.id}
                        className={`notif-item ${isUnread ? "unread" : "read"}`}
                        onClick={() => handleNotifClick(n.id, n.type)}
                      >
                        <div className="notif-icon-wrap">
                          <Icon size={18} />
                        </div>
                        <div className="notif-body">
                          <div className="notif-item-title">{title}</div>
                          <div className="notif-item-body">{n.message}</div>
                          <div className="notif-item-time">{timeAgo(n.created_at)}</div>
                        </div>
                        {isUnread && <span className="notif-dot" />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="notif-empty">
                  <FiBell size={28} className="notif-empty-icon" />
                  <span>No notifications</span>
                </div>
              )}

              <button
                className="notif-view-all"
                onClick={() => navigateTo(null)}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      </nav>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logo.png" className="sidebar-logo-img" alt="" /> UniConnect
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={16} />
          </button>
        </div>

        <nav className="sidebar-menu">
          {MENU_ITEMS.map(({ label, icon: Icon, pageKey }) => {
            const isActive = activePage === pageKey;
            return (
              <button
                key={label}
                className={`sidebar-menu-item ${isActive ? "active" : ""}`}
                onClick={() => navigateTo(pageKey)}
              >
                <Icon size={16} className="sidebar-menu-icon" />
                <span>{label}</span>
                {pageKey === ROUTES.review && pendingCount > 0 && (
                  <span className="sidebar-menu-badge">{pendingCount}</span>
                )}
                {isActive && <span className="sidebar-menu-indicator" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer-wrap">
          {profileOpen && (
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-card-avatar">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt="avatar"
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <RiAdminLine size={20} />
                  )}
                </div>
                <div className="profile-card-info">
                  <div className="profile-card-name">{displayName}</div>
                  <div className="profile-card-email">{displayEmail}</div>
                </div>
                <button
                  className="profile-card-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen(false);
                  }}
                >
                  <FiX size={14} />
                </button>
              </div>

              <div className="profile-card-divider" />

              <button
                className="profile-card-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileOpen(false);
                  setSidebarOpen(false);
                  navigate("/settings");
                }}
              >
                <MdSettings size={16} className="profile-card-icon" />
                <span>Settings</span>
                <FiChevronRight size={14} className="profile-card-arrow" />
              </button>

              <button
                className="profile-card-item"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo(null);
                }}
              >
                <FiRefreshCw size={16} className="profile-card-icon" />
                <span>Switch Account</span>
                <FiChevronRight size={14} className="profile-card-arrow" />
              </button>

              <div className="profile-card-divider" />

              <button
                className="profile-card-item logout"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogoutClick();
                }}
              >
                <FiLogOut size={16} className="profile-card-icon" />
                <span>Log Out</span>
              </button>
            </div>
          )}

          <div
            className={`sidebar-footer ${profileOpen ? "footer-active" : ""}`}
            onClick={() => setProfileOpen((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            <div className="sidebar-avatar">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <RiAdminLine size={18} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="sidebar-username">{displayName}</div>
              <div className="sidebar-role">⬤ {displayStatus} · Admin</div>
            </div>
            <FiChevronRight
              size={14}
              className={`footer-chevron ${profileOpen ? "chevron-up" : ""}`}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;