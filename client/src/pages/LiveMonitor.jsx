import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiLogIn, FiUserPlus, FiFileText, FiMessageCircle, FiCornerDownRight,
  FiUsers, FiUserCheck, FiBriefcase, FiFlag, FiStar, FiRadio, FiPause, FiPlay,
} from "react-icons/fi";
import api from "../api/axios";
import "../styles/LiveMonitor.css";

// Visual config per event_type emitted by the backend (utils/logEvent).
const EVENT_CONFIG = {
  login:          { label: "Login",        icon: FiLogIn,         cls: "ev-login" },
  signup:         { label: "Signup",       icon: FiUserPlus,      cls: "ev-signup" },
  post_create:    { label: "New Post",     icon: FiFileText,      cls: "ev-post" },
  comment_create: { label: "Comment",      icon: FiMessageCircle, cls: "ev-comment" },
  comment_reply:  { label: "Reply",        icon: FiCornerDownRight, cls: "ev-comment" },
  group_create:   { label: "New Group",    icon: FiUsers,         cls: "ev-group" },
  group_join:     { label: "Group Join",   icon: FiUserCheck,     cls: "ev-group" },
  project_create: { label: "New Project",  icon: FiBriefcase,     cls: "ev-project" },
  report_create:  { label: "Report",       icon: FiFlag,          cls: "ev-report" },
  review_create:  { label: "Review",       icon: FiStar,          cls: "ev-review" },
};

const FALLBACK = { label: "Event", icon: FiRadio, cls: "ev-default" };
const DEFAULT_AVATAR = "https://i.pravatar.cc/40?img=12";

const FEED_MS = 5000;     // poll new events every 5s
const ONLINE_MS = 15000;  // refresh online users every 15s
const MAX_EVENTS = 200;   // cap the in-memory stream

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function LiveMonitor() {
  const [events, setEvents] = useState([]);
  const [online, setOnline] = useState([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [justArrived, setJustArrived] = useState(new Set());

  const lastIdRef = useRef(0);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  // Fetch events newer than the last one we've seen and prepend them.
  const fetchFeed = useCallback(async () => {
    if (pausedRef.current) return;
    try {
      const res = await api.get("/admin/live", { params: { after: lastIdRef.current, limit: 50 } });
      const fresh = res.data.events || [];
      if (fresh.length) {
        lastIdRef.current = Math.max(lastIdRef.current, ...fresh.map((e) => e.id));
        setEvents((prev) => [...fresh, ...prev].slice(0, MAX_EVENTS));
        // Flash highlight on new rows for ~1.2s.
        const ids = new Set(fresh.map((e) => e.id));
        setJustArrived(ids);
        setTimeout(() => setJustArrived(new Set()), 1200);
      }
    } catch (err) {
      console.error("live feed error:", err);
    }
  }, []);

  const fetchOnline = useCallback(async () => {
    try {
      const res = await api.get("/admin/online", { params: { minutes: 5 } });
      setOnline(res.data.online || []);
    } catch (err) {
      console.error("online error:", err);
    }
  }, []);

  useEffect(() => {
    document.title = "Live Monitor - UniConnect Admin";
    (async () => {
      await Promise.all([fetchFeed(), fetchOnline()]);
      setLoading(false);
    })();
    const feedId = setInterval(fetchFeed, FEED_MS);
    const onlineId = setInterval(fetchOnline, ONLINE_MS);
    return () => { clearInterval(feedId); clearInterval(onlineId); };
  }, [fetchFeed, fetchOnline]);

  const visible = filter === "all" ? events : events.filter((e) => e.event_type === filter);
  const filterTypes = ["all", ...Object.keys(EVENT_CONFIG)];

  return (
    <div className="lm-page">
      {/* Header */}
      <div className="lm-header">
        <div className="lm-title-wrap">
          <span className={`lm-live-dot ${paused ? "paused" : ""}`} />
          <h1 className="lm-title">Live Monitor</h1>
          <span className="lm-subtitle">Everything happening across UniConnect, in real time</span>
        </div>
        <button className={`lm-pause-btn ${paused ? "is-paused" : ""}`} onClick={() => setPaused((p) => !p)}>
          {paused ? <><FiPlay size={15} /> Resume</> : <><FiPause size={15} /> Pause</>}
        </button>
      </div>

      <div className="lm-grid">
        {/* Event stream */}
        <div className="lm-stream-col">
          <div className="lm-filters">
            {filterTypes.map((t) => {
              const cfg = EVENT_CONFIG[t];
              return (
                <button
                  key={t}
                  className={`lm-chip ${filter === t ? "active" : ""}`}
                  onClick={() => setFilter(t)}
                >
                  {t === "all" ? "All" : cfg.label}
                </button>
              );
            })}
          </div>

          <div className="lm-stream">
            {loading ? (
              <div className="lm-empty">Connecting to live feed…</div>
            ) : visible.length === 0 ? (
              <div className="lm-empty">No activity yet. New events will appear here automatically.</div>
            ) : (
              visible.map((e) => {
                const cfg = EVENT_CONFIG[e.event_type] || FALLBACK;
                const Icon = cfg.icon;
                return (
                  <div key={e.id} className={`lm-event ${justArrived.has(e.id) ? "flash" : ""}`}>
                    <span className={`lm-event-icon ${cfg.cls}`}><Icon size={15} /></span>
                    <img
                      className="lm-event-avatar"
                      src={e.actor_avatar || DEFAULT_AVATAR}
                      alt=""
                      onError={(ev) => { ev.target.src = DEFAULT_AVATAR; }}
                    />
                    <div className="lm-event-body">
                      <div className="lm-event-line">
                        <span className="lm-event-actor">{e.actor_name || "Unknown"}</span>
                        <span className={`lm-event-badge ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                      {e.summary && <div className="lm-event-summary">{e.summary}</div>}
                    </div>
                    <span className="lm-event-time">{timeAgo(e.created_at)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Online users */}
        <div className="lm-online-col">
          <div className="lm-online-header">
            <span className="lm-online-pulse" />
            Online Now
            <span className="lm-online-count">{online.length}</span>
          </div>
          <div className="lm-online-list">
            {online.length === 0 ? (
              <div className="lm-empty small">No one online right now.</div>
            ) : (
              online.map((u) => (
                <div key={u.id} className="lm-online-item">
                  <div className="lm-online-avatar-wrap">
                    <img
                      className="lm-online-avatar"
                      src={u.profile_picture || DEFAULT_AVATAR}
                      alt=""
                      onError={(ev) => { ev.target.src = DEFAULT_AVATAR; }}
                    />
                    <span className="lm-online-status" />
                  </div>
                  <div className="lm-online-info">
                    <div className="lm-online-name">{u.name}</div>
                    <div className="lm-online-role">{u.role} · {timeAgo(u.last_seen)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
