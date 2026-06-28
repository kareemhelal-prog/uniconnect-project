import React, { useState, useEffect, Suspense } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import "../styles/Dashboard.css";
import Navbar from "./NavbarDashboard.jsx";
import NotFound from "./NotFound.jsx";
import api from "../api/axios.js";

const SafeLogin = React.lazy(() =>
  import("./Login.jsx").catch(() => ({ default: NotFound }))
);

const ROUTES = {
  dashboard: "dashboard",
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
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
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

function DashboardHeader() {
  return (
    <div className="academic-header-wrapper">
      <div className="academic-main-icon">&#127891;</div>
      <h1 className="academic-welcome-title">Welcome, Admin</h1>
      <p className="academic-subtitle">
        Here's an overview of your academic social platform.
      </p>
    </div>
  );
}

function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    groups: 0,
    projects: 0,
    pendingReports: 0,
    pendingAccounts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Dashboard - UniConnect Admin";
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get("/admin/stats");
      if (statsRes.data.success) setStats(statsRes.data.stats);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading-box">
          <div className="neon-spinner"></div>
          <p>Fetching Platform Data...</p>
        </div>
      </div>
    );
  }

  const cardsConfig = [
    {
      id: "card-pending-accounts",
      label: "Pending Review",
      value: stats.pendingAccounts,
      iconCode: "&#128100;",
      colorType: stats.pendingAccounts > 0 ? "pink" : "green",
      page: ROUTES.review,
    },
    {
      id: "card-total-users",
      label: "Total Users",
      value: stats.users,
      iconCode: "&#128101;",
      colorType: "cyan",
      page: ROUTES.users,
    },
    {
      id: "card-total-posts",
      label: "Total Posts",
      value: stats.posts,
      iconCode: "&#128221;",
      colorType: "purple",
      page: ROUTES.posts,
    },
    {
      id: "card-total-groups",
      label: "Total Groups",
      value: stats.groups,
      iconCode: "&#128102;",
      colorType: "pink",
      page: ROUTES.groups,
    },
    {
      id: "card-total-projects",
      label: "Total Projects",
      value: stats.projects,
      iconCode: "&#127891;",
      colorType: "green",
      page: ROUTES.projects,
    },
    {
      id: "card-pending-reports",
      label: "Pending Reports",
      value: stats.pendingReports,
      iconCode: "&#9888;",
      colorType: stats.pendingReports > 0 ? "red" : "green",
      page: ROUTES.reports,
    },
  ];

  return (
    <div id="dashboard-main" className="dashboard-container">
      <DashboardHeader />
      <div id="dashboard-cards-grid" className="neon-cards-container">
        {cardsConfig.map((card) => (
          <div
            key={card.id}
            id={card.id}
            className={`academic-glass-card glow-${card.colorType} card-clickable`}
            onClick={() => onNavigate(card.page)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onNavigate(card.page)}
            aria-label={`Go to ${card.label} page`}
          >
            <div
              className="card-neon-icon"
              dangerouslySetInnerHTML={{ __html: card.iconCode }}
            />
            <h2 className="card-counter-value">
              {card.value.toLocaleString()}
            </h2>
            <p className="card-bottom-label">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-loading-box">
        <div className="neon-spinner"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState(ROUTES.dashboard);
  const [loggedOut, setLoggedOut] = useState(false);

  const handleNavigate = (page) => setActivePage(page ?? "not-found");
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
    <>
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      {renderPage()}
    </>
  );
}

export default App;
