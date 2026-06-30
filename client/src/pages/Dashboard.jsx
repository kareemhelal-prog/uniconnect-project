import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import {
  FiUsers, FiFileText, FiGrid, FiBriefcase, FiFlag, FiUserCheck,
  FiTrendingUp, FiTrendingDown, FiRefreshCw, FiArrowRight, FiRadio,
  FiLogIn, FiUserPlus, FiMessageCircle, FiCornerDownRight, FiStar,
  FiPlusCircle, FiActivity,
} from "react-icons/fi";
import "../styles/AdminTheme.css";
import "../styles/Dashboard.css";
import "../styles/DashboardHome.css";
import Navbar from "./NavbarDashboard.jsx";
import NotFound from "./NotFound.jsx";
import api from "../api/axios.js";

const SafeLogin = React.lazy(() =>
  import("./Login.jsx").catch(() => ({ default: NotFound }))
);

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
  announcements: "announcements",
  emailAlerts: "email-alerts",
  activityLogs: "activity-logs",
};
const safeLazy = (importer) =>
  React.lazy(() => importer().catch(() => ({ default: NotFound })));

const PAGE_COMPONENTS = {
  [ROUTES.feed]:          safeLazy(() => import("./AdminFeed.jsx")),
  [ROUTES.live]:          safeLazy(() => import("./LiveMonitor.jsx")),
  [ROUTES.review]:        safeLazy(() => import("./AccountReview.jsx")),
  [ROUTES.users]:         safeLazy(() => import("./UserManagement.jsx")),
  [ROUTES.posts]:         safeLazy(() => import("./postsManagement.jsx")),
  [ROUTES.reports]:       safeLazy(() => import("./ReportsManagement.jsx")),
  [ROUTES.projects]:      safeLazy(() => import("./ProjectsManagement.jsx")),
  [ROUTES.groups]:        safeLazy(() => import("./GroupsManagement.jsx")),
  [ROUTES.reviews]:       safeLazy(() => import("./ReviewsManagement.jsx")),
  [ROUTES.files]:         safeLazy(() => import("./Files.jsx")),
  [ROUTES.announcements]: safeLazy(() => import("./Announcements.jsx")),
  [ROUTES.emailAlerts]:   safeLazy(() => import("./EmailAlerts.jsx")),
  [ROUTES.activityLogs]:  safeLazy(() => import("./ActivityLogs.jsx")),
};

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend
);

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <NotFound onBack={this.props.onBack} />;
    return this.props.children;
  }
}

/* ============================================================
   Small primitives
   ============================================================ */

// Animated number that eases from its previous value to the new one.
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const to = Number(target) || 0;
    if (from === to) { setVal(to); return; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// Lightweight inline SVG sparkline (area + line), no external lib.
function Sparkline({ data, color }) {
  if (!data || data.length === 0) return null;
  const w = 130, h = 40;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const denom = Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => [
    (i / denom) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ]);
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg className="dh-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polygon points={area} fill={color} opacity="0.13" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function pctDelta(delta) {
  if (!delta) return null;
  const { cur, prev } = delta;
  if (prev === 0) return cur > 0 ? { dir: "up", label: "New" } : { dir: "flat", label: "—" };
  const p = ((cur - prev) / prev) * 100;
  return { dir: p > 0 ? "up" : p < 0 ? "down" : "flat", label: `${p > 0 ? "+" : ""}${p.toFixed(0)}%` };
}

function KpiCard({ icon: Icon, label, value, accent, delta, spark, onClick }) {
  const shown = useCountUp(value);
  const d = pctDelta(delta);
  return (
    <button className="dh-kpi" style={{ "--accent": accent }} onClick={onClick}>
      <div className="dh-kpi-head">
        <span className="dh-kpi-icon"><Icon size={18} /></span>
        {d && (
          <span className={`dh-kpi-delta ${d.dir}`}>
            {d.dir === "up" && <FiTrendingUp size={12} />}
            {d.dir === "down" && <FiTrendingDown size={12} />}
            {d.label}
          </span>
        )}
      </div>
      <div className="dh-kpi-value">{shown.toLocaleString()}</div>
      <div className="dh-kpi-label">{label}</div>
      <div className="dh-kpi-spark">{spark && <Sparkline data={spark} color={accent} />}</div>
      <FiArrowRight className="dh-kpi-go" size={15} />
    </button>
  );
}

/* ============================================================
   Helpers
   ============================================================ */
function buildSeries(rows, days = 14) {
  const map = new Map((rows || []).map((r) => [String(r.day).slice(0, 10), Number(r.count)]));
  const labels = [], data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    data.push(map.get(key) || 0);
  }
  return { labels, data };
}

const ROLE_COLORS = { student: "#38bdf8", doctor: "#a78bfa", investor: "#f472b6", admin: "#34d399" };

const EVENT_META = {
  login:          { icon: FiLogIn,          color: "#60a5fa", label: "logged in" },
  signup:         { icon: FiUserPlus,       color: "#34d399", label: "signed up" },
  post_create:    { icon: FiFileText,       color: "#a78bfa", label: "posted" },
  comment_create: { icon: FiMessageCircle,  color: "#38bdf8", label: "commented" },
  comment_reply:  { icon: FiCornerDownRight,color: "#38bdf8", label: "replied" },
  group_create:   { icon: FiGrid,           color: "#f472b6", label: "created a group" },
  group_join:     { icon: FiUsers,          color: "#f472b6", label: "joined a group" },
  project_create: { icon: FiBriefcase,      color: "#fbbf24", label: "added a project" },
  report_create:  { icon: FiFlag,           color: "#f87171", label: "filed a report" },
  review_create:  { icon: FiStar,           color: "#facc15", label: "left a review" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function greeting(h) {
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ============================================================
   Dashboard home
   ============================================================ */
const EMPTY_OVERVIEW = {
  totals: { users: 0, posts: 0, groups: 0, projects: 0, pendingReports: 0, pendingAccounts: 0, online: 0 },
  deltas: {}, spark: { users: [], posts: [] }, roleDist: [], recent: [],
};

function DashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [range, setRange] = useState(7);
  const [now, setNow] = useState(new Date());
  const [adminName, setAdminName] = useState("Admin");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = "Dashboard - UniConnect Admin";
    api.get("/auth/profile")
      .then((r) => { if (r.data.success) setAdminName((r.data.user?.name || "Admin").split(" ")[0]); })
      .catch(() => {});
  }, []);

  const fetchOverview = useCallback(async (silent) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await api.get("/admin/overview", { params: { days: range } });
      if (res.data.success) { setData(res.data.overview); setError(false); }
      else setError(true);
    } catch (e) {
      console.error("overview error:", e);
      setError(true);
    } finally {
      setLoaded(true);
      if (!silent) setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    fetchOverview();
    const id = setInterval(() => fetchOverview(true), 20000);
    return () => clearInterval(id);
  }, [fetchOverview]);

  // Only block on the very first load; after that the page always renders
  // (with the last good data, or zeros) so it can never hang on the spinner.
  if (!loaded) {
    return (
      <div className="dh">
        <div className="dh-loader"><div className="dh-spinner" /></div>
      </div>
    );
  }

  const view = data || EMPTY_OVERVIEW;
  const t = view.totals;
  const usersSeries = buildSeries(view.spark?.users);
  const postsSeries = buildSeries(view.spark?.posts);

  const kpis = [
    { key: "pendingAccounts", icon: FiUserCheck, label: "Pending Review", accent: "#fbbf24", page: ROUTES.review },
    { key: "users",    icon: FiUsers,    label: "Total Users",    accent: "#38bdf8", page: ROUTES.users,    delta: view.deltas?.users,    spark: usersSeries.data },
    { key: "posts",    icon: FiFileText, label: "Total Posts",    accent: "#a78bfa", page: ROUTES.posts,    delta: view.deltas?.posts,    spark: postsSeries.data },
    { key: "groups",   icon: FiGrid,     label: "Total Groups",   accent: "#f472b6", page: ROUTES.groups,   delta: view.deltas?.groups },
    { key: "projects", icon: FiBriefcase,label: "Total Projects", accent: "#fb923c", page: ROUTES.projects, delta: view.deltas?.projects },
    { key: "pendingReports", icon: FiFlag, label: "Pending Reports", accent: "#f87171", page: ROUTES.reports },
  ];

  const lineData = {
    labels: usersSeries.labels,
    datasets: [
      { label: "New Users", data: usersSeries.data, borderColor: "#38bdf8", backgroundColor: "rgba(56,189,248,0.12)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: "New Posts", data: postsSeries.data, borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,0.10)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 },
    ],
  };
  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { labels: { color: "#9aa5b8", boxWidth: 10, usePointStyle: true, font: { size: 12 } } },
      tooltip: { backgroundColor: "#161d2e", borderColor: "rgba(148,163,184,0.18)", borderWidth: 1, padding: 10, titleColor: "#e7eaf1", bodyColor: "#9aa5b8" } },
    scales: {
      x: { ticks: { color: "#616b80", maxTicksLimit: 7, font: { size: 11 } }, grid: { display: false } },
      y: { ticks: { color: "#616b80", precision: 0, font: { size: 11 } }, grid: { color: "rgba(148,163,184,0.06)" }, beginAtZero: true },
    },
  };

  const roleRows = view.roleDist || [];
  const doughnutData = {
    labels: roleRows.map((r) => r.role),
    datasets: [{ data: roleRows.map((r) => Number(r.count)),
      backgroundColor: roleRows.map((r) => ROLE_COLORS[r.role] || "#94a3b8"),
      borderColor: "#111726", borderWidth: 3, hoverOffset: 6 }],
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: "68%",
    plugins: { legend: { position: "bottom", labels: { color: "#9aa5b8", boxWidth: 10, padding: 12, usePointStyle: true, font: { size: 12 } } } },
  };

  const pendingActions = [
    { n: t.pendingAccounts, label: "accounts awaiting approval", cta: "Review", page: ROUTES.review, tone: "warn" },
    { n: t.pendingReports,  label: "reports need moderation",    cta: "Resolve", page: ROUTES.reports, tone: "danger" },
  ].filter((a) => a.n > 0);

  return (
    <div className="dh">
      {error && (
        <div className="dh-banner">
          <span>Couldn't reach the server — showing the last available data. Make sure the backend is running.</span>
          <button onClick={() => fetchOverview()}>Retry</button>
        </div>
      )}
      {/* ===== Top bar ===== */}
      <header className="dh-top">
        <div className="dh-top-left">
          <h1 className="dh-greeting">{greeting(now.getHours())}, {adminName}</h1>
          <p className="dh-sub">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            <span className="dh-dot">·</span>
            <span className="dh-clock">{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </p>
        </div>
        <div className="dh-top-right">
          <button className="dh-online-pill" onClick={() => onNavigate(ROUTES.live)} title="Open Live Monitor">
            <span className="dh-online-dot" />
            <b>{t.online}</b> online now
            <FiRadio size={13} />
          </button>
          <div className="dh-range">
            {[7, 30, 90].map((d) => (
              <button key={d} className={range === d ? "active" : ""} onClick={() => setRange(d)}>{d}d</button>
            ))}
          </div>
          <button className={`dh-refresh ${refreshing ? "spinning" : ""}`} onClick={() => fetchOverview()} title="Refresh">
            <FiRefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* ===== KPI grid ===== */}
      <section className="dh-kpis">
        {kpis.map((k) => (
          <KpiCard key={k.key} icon={k.icon} label={k.label} value={t[k.key]}
            accent={k.accent} delta={k.delta} spark={k.spark}
            onClick={() => onNavigate(k.page)} />
        ))}
      </section>

      {/* ===== Main grid ===== */}
      <section className="dh-grid">
        <div className="dh-card dh-growth">
          <div className="dh-card-head">
            <div><h3>Platform Growth</h3><span>New users & posts · last 14 days</span></div>
            <div className="dh-legend-pills">
              <span className="dh-lp"><i style={{ background: "#38bdf8" }} />Users</span>
              <span className="dh-lp"><i style={{ background: "#a78bfa" }} />Posts</span>
            </div>
          </div>
          <div className="dh-growth-canvas"><Line data={lineData} options={lineOptions} /></div>
        </div>

        <div className="dh-side">
          {pendingActions.length > 0 && (
            <div className="dh-card dh-actions">
              <div className="dh-card-head"><div><h3>Needs your attention</h3></div></div>
              {pendingActions.map((a, i) => (
                <button key={i} className={`dh-action ${a.tone}`} onClick={() => onNavigate(a.page)}>
                  <span className="dh-action-n">{a.n}</span>
                  <span className="dh-action-label">{a.label}</span>
                  <span className="dh-action-cta">{a.cta} <FiArrowRight size={13} /></span>
                </button>
              ))}
            </div>
          )}

          <div className="dh-card dh-roles">
            <div className="dh-card-head"><div><h3>Users by role</h3></div></div>
            <div className="dh-roles-canvas"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
          </div>
        </div>
      </section>

      {/* ===== Bottom grid ===== */}
      <section className="dh-grid2">
        <div className="dh-card dh-recent">
          <div className="dh-card-head">
            <div><h3>Recent activity</h3></div>
            <button className="dh-link" onClick={() => onNavigate(ROUTES.live)}>Live Monitor <FiArrowRight size={13} /></button>
          </div>
          <div className="dh-recent-list">
            {(view.recent || []).length === 0 ? (
              <div className="dh-recent-empty"><FiActivity size={22} /><span>No activity yet</span></div>
            ) : (
              view.recent.map((e) => {
                const m = EVENT_META[e.event_type] || { icon: FiActivity, color: "#94a3b8", label: e.event_type };
                const Icon = m.icon;
                return (
                  <div key={e.id} className="dh-recent-item">
                    <span className="dh-recent-icon" style={{ color: m.color, background: `${m.color}22` }}><Icon size={14} /></span>
                    <span className="dh-recent-text">
                      <b>{e.actor_name || "Someone"}</b> {m.label}
                      {e.summary && <span className="dh-recent-sum"> — {e.summary}</span>}
                    </span>
                    <span className="dh-recent-time">{timeAgo(e.created_at)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="dh-card dh-quick">
          <div className="dh-card-head"><div><h3>Quick actions</h3></div></div>
          <div className="dh-quick-grid">
            <button onClick={() => onNavigate(ROUTES.announcements)}><FiPlusCircle size={18} /><span>New Announcement</span></button>
            <button onClick={() => onNavigate(ROUTES.users)}><FiUsers size={18} /><span>Manage Users</span></button>
            <button onClick={() => onNavigate(ROUTES.live)}><FiRadio size={18} /><span>Live Monitor</span></button>
            <button onClick={() => onNavigate(ROUTES.reports)}><FiFlag size={18} /><span>Moderate Reports</span></button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="dh">
      <div className="dh-loader"><div className="dh-spinner" /></div>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState(ROUTES.dashboard);
  const [loggedOut, setLoggedOut] = useState(false);

  // Bridge the internal (state-based) page switching to the browser history so
  // the Back/Forward buttons walk through admin sub-pages instead of jumping
  // straight out to the login route. Each navigation pushes a history entry;
  // popstate restores the page tagged on that entry. When the user backs out
  // past the first admin entry, the browser leaves the dashboard naturally.
  useEffect(() => {
    window.history.replaceState({ adminPage: activePage }, "");
    const onPop = (e) => {
      const page = e.state?.adminPage;
      if (page) setActivePage(page);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigate = (page) => {
    const next = page ?? "not-found";
    setActivePage(next);
    if (window.history.state?.adminPage !== next) {
      window.history.pushState({ adminPage: next }, "");
    }
  };
  const handleLogout = () => setLoggedOut(true);

  if (loggedOut) {
    return (
      <PageErrorBoundary onBack={handleNavigate}>
        <Suspense fallback={<PageLoading />}>
          <SafeLogin />
        </Suspense>
      </PageErrorBoundary>
    );
  }

  const renderPage = () => {
    if (activePage === ROUTES.dashboard) {
      return <DashboardPage onNavigate={handleNavigate} />;
    }
    const PageComponent = PAGE_COMPONENTS[activePage];
    if (!PageComponent) {
      return <NotFound onBack={handleNavigate} />;
    }
    return (
      <PageErrorBoundary onBack={handleNavigate}>
        <Suspense fallback={<PageLoading />}>
          <PageComponent onNavigate={handleNavigate} />
        </Suspense>
      </PageErrorBoundary>
    );
  };

  return (
    <div className="admin-shell">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <main className="admin-main">{renderPage()}</main>
    </div>
  );
}

export default App;
