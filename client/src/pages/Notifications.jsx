import { useState } from "react";
import "../styles/Notifications.css";
import { useEffect } from "react";

const notificationsData = [
  {
    id: 1,
    user: "Ahmed Hassan",
    avatar: "https://i.pravatar.cc/150?u=ahmed",
    type: "like",
    text: "liked your post",
    subText: null,
    time: "2 minutes ago",
    isUnread: true,
  },
  {
    id: 2,
    user: "Sara Khan",
    avatar: "https://i.pravatar.cc/150?u=sara",
    type: "comment",
    text: "commented on your file",
    subText: "Operating Systems Question Bank",
    time: "15 minutes ago",
    isUnread: true,
  },
  {
    id: 3,
    user: "Rohan Verma",
    avatar: "https://i.pravatar.cc/150?u=rohan",
    type: "follow",
    text: "started following you",
    subText: null,
    time: "28 minutes ago",
    isUnread: true,
  },
  {
    id: 4,
    user: "Priya Sharma",
    avatar: "https://i.pravatar.cc/150?u=priya",
    type: "like",
    text: "liked your file",
    subText: "Data Structures Summary Notes",
    time: "1 hour ago",
    isUnread: false,
  },
  {
    id: 5,
    user: "Karan Mehta",
    avatar: "https://i.pravatar.cc/150?u=karan",
    type: "comment",
    text: "commented on your post",
    subText: "What are the best resources for ML?",
    time: "2 hours ago",
    isUnread: false,
  },
  {
    id: 6,
    user: "Ananya Singh",
    avatar: "https://i.pravatar.cc/150?u=ananya",
    type: "follow",
    text: "started following you",
    subText: null,
    time: "3 hours ago",
    isUnread: false,
  },
];

const iconMap = {
  like: { className: "fa-solid fa-heart icon-heart", colorClass: "icon-heart" },
  comment: { className: "fa-solid fa-comment icon-comment", colorClass: "icon-comment" },
  follow: { className: "fa-solid fa-user-plus icon-follow", colorClass: "icon-follow" },
};

export default function Notifications() {
  useEffect(() => {
    document.title = "Notifications | UniConnect";
}, []);
  const [notifications, setNotifications] = useState(notificationsData);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const handleCardClick = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };

  const filtered = notifications.filter((n) => {
    const matchesFilter = filter === "all" || n.isUnread;
    const query = search.toLowerCase();
    const matchesSearch = n.user.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="notif-page">
      {/* Navbar */}
      <nav className="navbar">
        <a href="#" className="logo">
          <div className="logo-icon">U</div>
          UniConnect
        </a>

        <div className="search-container">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search for people, subjects, or posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="nav-right">
          <i className="fa-solid fa-th nav-icon"></i>
          <div className="nav-icon bell-wrapper">
            <i className="fa-regular fa-bell"></i>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
          <div className="user-profile">
            <img
              src="https://i.pravatar.cc/150?u=myprofile"
              className="user-avatar-nav"
              alt="profile"
            />
            <i className="fa-solid fa-chevron-down chevron-icon"></i>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        <h1 className="page-title">Notifications</h1>

        <div className="filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="no-results">
            <i className="fa-solid fa-magnifying-glass-minus"></i> No notifications found.
          </div>
        ) : (
          <div className="notification-list">
            {filtered.map((notif, index) => (
              <div
                key={notif.id}
                className={`notification-card ${notif.isUnread ? "unread" : ""}`}
                style={{ animationDelay: `${index * 0.07}s` }}
                onClick={() => handleCardClick(notif.id)}
              >
                <img src={notif.avatar} className="avatar" alt={notif.user} />
                <i className={`fa-solid ${notif.type === "like" ? "fa-heart icon-heart" : notif.type === "comment" ? "fa-comment icon-comment" : "fa-user-plus icon-follow"} action-icon`}></i>
                <div className="content">
                  <p>
                    <strong>{notif.user}</strong> {notif.text}
                  </p>
                  {notif.subText && (
                    <span className="sub-text">{notif.subText}</span>
                  )}
                  <span className="time-text">{notif.time}</span>
                </div>
                {notif.isUnread && <div className="unread-dot"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}