import React, { useState } from "react";
import "./NavbarDashboard.css";
import {
  MdDashboard,
  MdPeople,
  MdFolder,
  MdBarChart,
  MdSettings,
} from "react-icons/md";
import {
  FiBell,
  FiSearch,
  FiX,
  FiChevronRight,
  FiLogOut,
  FiRefreshCw,
} from "react-icons/fi";
import { RiAdminLine } from "react-icons/ri";
import { HiOutlineLink } from "react-icons/hi";

// ✅ IDs خارج الـ component — بتتعمل مرة واحدة بس
const NAV_IDS = {
  dashboard: "DASH_01",
  users: "USR_02",
  projects: "PRJ_03",
  search: "SRCH_04",
  notifications: "NOTIF_05",
  reports: "RPT_06",
  settings: "SET_07",
};

function Navbar({ activePage, onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellRing, setBellRing] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifications = [
    {
      id: 1,
      icon: "📚",
      title: "Quantum Physics Q&A",
      body: "Prof. Anya بدأت session جديدة",
      time: "منذ 5 دقائق",
    },
    {
      id: 2,
      icon: "👥",
      title: "Group Project Update",
      body: "تم إضافتك لمجموعة AI in Medicine",
      time: "منذ 2 ساعة",
    },
    {
      id: 3,
      icon: "🔔",
      title: "Campus News",
      body: "Fall Break يبدأ الأسبوع القادم",
      time: "منذ 4 ساعات",
    },
  ];

  const handleBell = () => {
    setBellRing(true);
    setNotifOpen((prev) => !prev);
    setTimeout(() => setBellRing(false), 600);
  };

  const markRead = (id) => {
    setReadNotifs((prev) => [...prev, id]);
  };

  const markAllRead = () => {
    setReadNotifs(notifications.map((n) => n.id));
    setNotifOpen(false);
  };

  const unreadCount = notifications.filter(
    (n) => !readNotifs.includes(n.id)
  ).length;

  const handleSearch = (value, id) => {
    console.log(`Searching for: ${value} in area ID: ${id}`);
  };

  const handleLogout = () => {
    console.log("تسجيل الخروج...");
    setProfileOpen(false);
    setSidebarOpen(false);
  };

  const handleSwitchAccount = () => {
    console.log("تبديل الحساب...");
    setProfileOpen(false);
    setSidebarOpen(false);
  };

  const handleProfileSettings = () => {
    onNavigate("settings", NAV_IDS.settings);
    setProfileOpen(false);
    setSidebarOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <button
          className="hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className={`ham-line ${sidebarOpen ? "open" : ""}`}></span>
          <span className={`ham-line ${sidebarOpen ? "open" : ""}`}></span>
          <span className={`ham-line ${sidebarOpen ? "open" : ""}`}></span>
        </button>

        <div className="nav-logo">
          <HiOutlineLink className="logo-icon" />
          <span className="logo-text">UniConnect</span>
        </div>

        <div className="nav-links">
          <div className="tooltip-wrap">
            <button
              className={`nav-link ${
                activePage === "dashboard" ? "active" : ""
              }`}
              onClick={() => onNavigate("dashboard", NAV_IDS.dashboard)}
            >
              <MdDashboard size={16} /> Dashboard
            </button>
            <span className="tooltip">الصفحة الرئيسية</span>
          </div>

          <div className="tooltip-wrap">
            <button
              className={`nav-link ${activePage === "users" ? "active" : ""}`}
              onClick={() => onNavigate("users", NAV_IDS.users)}
            >
              <MdPeople size={16} /> Users
            </button>
            <span className="tooltip">إدارة المستخدمين</span>
          </div>

          <div className="tooltip-wrap">
            <button
              className={`nav-link ${
                activePage === "projects" ? "active" : ""
              }`}
              onClick={() => onNavigate("projects", NAV_IDS.projects)}
            >
              <MdFolder size={16} /> Projects
            </button>
            <span className="tooltip">المشاريع</span>
          </div>
        </div>

        <div className="nav-search-wrap">
          <FiSearch className="search-icon" />
          <input
            className="nav-search"
            placeholder="Search..."
            type="text"
            onChange={(e) => handleSearch(e.target.value, NAV_IDS.search)}
          />
        </div>

        <div className="notif-wrap">
          <div
            className={`nav-bell ${bellRing ? "ring" : ""}`}
            onClick={handleBell}
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="bell-badge">{unreadCount}</span>
            )}
            {unreadCount > 0 && <span className="bell-pulse"></span>}
          </div>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-title">الإشعارات</span>
                <button className="notif-mark-all" onClick={markAllRead}>
                  تحديد الكل كمقروء
                </button>
              </div>

              <div className="notif-list">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item ${
                      readNotifs.includes(n.id) ? "read" : "unread"
                    }`}
                    onClick={() => markRead(n.id)}
                  >
                    <span className="notif-icon">{n.icon}</span>
                    <div className="notif-body">
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-body">{n.body}</div>
                      <div className="notif-item-time">{n.time}</div>
                    </div>
                    {!readNotifs.includes(n.id) && (
                      <span className="notif-dot"></span>
                    )}
                  </div>
                ))}
              </div>

              {unreadCount === 0 && (
                <div className="notif-empty">✅ كل الإشعارات مقروءة</div>
              )}
            </div>
          )}
        </div>

        <div className="tooltip-wrap">
          <div
            className="nav-avatar"
            onClick={() => onNavigate("users", NAV_IDS.users)}
            style={{ cursor: "pointer" }}
          >
            SJ
            <span className="avatar-dot"></span>
            <span className="avatar-ring"></span>
          </div>
          <span className="tooltip">Sarah J. — اضغط للبروفايل</span>
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
            <HiOutlineLink size={18} /> UniConnect
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="sidebar-menu">
          <button
            className={`sidebar-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => {
              onNavigate("dashboard", NAV_IDS.dashboard);
              setSidebarOpen(false);
            }}
          >
            <MdDashboard className="sidebar-icon" size={20} />
            Dashboard
            <FiChevronRight className="sidebar-arrow" size={16} />
          </button>

          <button
            className={`sidebar-item ${activePage === "users" ? "active" : ""}`}
            onClick={() => {
              onNavigate("users", NAV_IDS.users);
              setSidebarOpen(false);
            }}
          >
            <MdPeople className="sidebar-icon" size={20} />
            Users
            <FiChevronRight className="sidebar-arrow" size={16} />
          </button>

          <button
            className={`sidebar-item ${
              activePage === "projects" ? "active" : ""
            }`}
            onClick={() => {
              onNavigate("projects", NAV_IDS.projects);
              setSidebarOpen(false);
            }}
          >
            <MdFolder className="sidebar-icon" size={20} />
            Projects
            <FiChevronRight className="sidebar-arrow" size={16} />
          </button>

          <button
            className={`sidebar-item ${
              activePage === "reports" ? "active" : ""
            }`}
            onClick={() => {
              onNavigate("reports", NAV_IDS.reports);
              setSidebarOpen(false);
            }}
          >
            <MdBarChart className="sidebar-icon" size={20} />
            Reports
            <FiChevronRight className="sidebar-arrow" size={16} />
          </button>

          <button
            className={`sidebar-item ${
              activePage === "settings" ? "active" : ""
            }`}
            onClick={() => {
              onNavigate("settings", NAV_IDS.settings);
              setSidebarOpen(false);
            }}
          >
            <MdSettings className="sidebar-icon" size={20} />
            Settings
            <FiChevronRight className="sidebar-arrow" size={16} />
          </button>
        </div>

        {/* ✅ Footer + Profile Card */}
        <div className="sidebar-footer-wrap">
          {profileOpen && (
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-card-avatar">
                  <RiAdminLine size={20} />
                </div>
                <div className="profile-card-info">
                  <div className="profile-card-name">Sarah J.</div>
                  <div className="profile-card-email">
                    sarah.j@uniconnect.edu
                  </div>
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
                  handleProfileSettings();
                }}
              >
                <MdSettings
                  size={16}
                  className="profile-card-icon settings-icon"
                />
                <span>الإعدادات</span>
                <FiChevronRight size={14} className="profile-card-arrow" />
              </button>

              <button
                className="profile-card-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitchAccount();
                }}
              >
                <FiRefreshCw
                  size={16}
                  className="profile-card-icon switch-icon"
                />
                <span>تبديل الحساب</span>
                <FiChevronRight size={14} className="profile-card-arrow" />
              </button>

              <div className="profile-card-divider" />

              <button
                className="profile-card-item logout"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
              >
                <FiLogOut size={16} className="profile-card-icon" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}

          <div
            className={`sidebar-footer ${profileOpen ? "footer-active" : ""}`}
            onClick={() => setProfileOpen((prev) => !prev)}
            style={{ cursor: "pointer" }}
          >
            <div className="sidebar-avatar">
              <RiAdminLine size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="sidebar-username">Sarah J.</div>
              <div className="sidebar-role">⬤ Online · Admin</div>
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
