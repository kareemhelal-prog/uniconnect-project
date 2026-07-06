import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Notifications.css";
import Navbar from "../components/Navbar";
import { FiHeart, FiMessageSquare, FiUserPlus } from "react-icons/fi";
import axios from "../api/axios";

const iconMap = {
  like: <FiHeart className="action-icon icon-heart" />,
  comment: <FiMessageSquare className="action-icon icon-comment" />,
  follow: <FiUserPlus className="action-icon icon-follow" />,
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Notifications | UniConnect";
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/notifications");
      const list = Array.isArray(res.data) ? res.data : res.data.data || [];
      setNotifications(list);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    axios.patch(`/notifications/${id}/read`).catch((err) =>
      console.error("Failed to mark as read:", err)
    );
  };

  // Zone 1 — actor name / avatar → their profile
  const goToActor = (notif) => {
    markRead(notif.id);
    if (notif.sender_id) navigate(`/profile/${notif.sender_username || notif.sender_id}`);
  };

  // Zone 2 — message text → the relevant content
  const goToContent = (notif) => {
    markRead(notif.id);
    if (notif.type === "follow") {
      navigate(`/profile?tab=followers`);
    } else if (notif.type === "project" && notif.reference_id) {
      navigate(`/projects?open=${notif.reference_id}`);
    } else if (notif.type === "group" && notif.reference_id) {
      navigate(`/groups/${notif.reference_id}`);
    } else if (notif.reference_id) {
      const hash = notif.type === "comment" && notif.reference_comment_id
        ? `#comment-${notif.reference_comment_id}` : "";
      navigate(`/posts/${notif.reference_id}${hash}`);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const filtered = notifications.filter((n) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !n.is_read) ||
      (filter === "read" && n.is_read);
    const fullText = `${n.sender_name || ""} ${n.message || ""}`.toLowerCase();
    const matchesSearch = fullText.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notif-page">
      <Navbar
        activePage="notifications"
        searchValue={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        notifications={notifications.map((n) => ({
          id: n.id,
          title: n.message,
          body: "",
          time: n.created_at,
          icon: iconMap[n.type] || <FiHeart />,
        }))}
      />

      <div className="main-content">
        <div className="notif-page-header">
          <h1 className="page-title">Notifications</h1>
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

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
            Unread {unreadCount > 0 && <span className="filter-count">{unreadCount}</span>}
          </button>
          <button
            className={`filter-btn ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Read
          </button>
        </div>

        {loading ? (
          <div className="no-results">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="no-results">No notifications found.</div>
        ) : (
          <div className="notification-list">
            {filtered.map((notif, index) => {
              const senderVerified =
                notif.sender_role === "doctor" || notif.sender_role === "admin";
              return (
                <div
                  key={notif.id}
                  className={`notification-card ${!notif.is_read ? "unread" : ""}`}
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  <div
                    className="avatar-placeholder notif-zone"
                    onClick={() => goToActor(notif)}
                    title="View profile"
                  >
                    {notif.sender_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  {iconMap[notif.type] || iconMap["like"]}
                  <div className="content">
                    <p>
                      <strong
                        className="notif-zone notif-actor-link"
                        onClick={() => goToActor(notif)}
                      >
                        {notif.sender_name || "Someone"}
                        {senderVerified && (
                          <span className="notif-verified-badge" title="Verified">✓</span>
                        )}
                      </strong>{" "}
                      <span
                        className="notif-zone notif-msg-link"
                        onClick={() => goToContent(notif)}
                      >
                        {notif.message}
                      </span>
                    </p>
                    <span
                      className="time-text notif-zone"
                      onClick={() => goToContent(notif)}
                    >
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  {!notif.is_read && <div className="unread-dot" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}