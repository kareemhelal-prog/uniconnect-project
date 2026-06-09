import React, { useState, useEffect } from "react";
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
import { Line, Bar, Doughnut } from "react-chartjs-2";
import "../styles/Dashboard.css";
import Navbar from "./NavbarDashboard.jsx";
import OwnersPage from "./OwnersPage.jsx";
import api from "../api/axios.js";

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

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

// ── Placeholder charts (مش بتيجي من API) ──────────────────────
const lineData = {
  labels: ["1am", "5am", "10am", "3pm", "8pm", "11pm"],
  datasets: [{
    label: "Activity",
    data: [300, 600, 400, 800, 500, 900],
    borderColor: "#00e5ff",
    backgroundColor: "rgba(0, 229, 255, 0.2)",
    fill: true,
    tension: 0.4,
    pointRadius: 4,
  }],
};

const barData = {
  labels: ["S1", "S2", "S3", "S4", "S5", "S6"],
  datasets: [{
    label: "Subjects",
    data: [40, 60, 30, 80, 50, 70],
    backgroundColor: "#bd00ff",
    borderRadius: 5,
  }],
};

// ── Header ─────────────────────────────────────────────────────
function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <div className="logo">🌀 UniConnect</div>
      <h1 className="admin-title">Admin Dashboard</h1>
      <button className="create-btn">Create Admin</button>
    </header>
  );
}

// ── User Statistics (بيانات حقيقية) ───────────────────────────
function UserStatisticsColumn({ totalUsers, loading }) {
  return (
    <div>
      <h3 className="section-title">User Statistics</h3>
      <div className="card neon-blue mb">
        <div className="stat-label">Total Users</div>
        <div className="big-number">
          {loading ? "..." : totalUsers.toLocaleString()}
        </div>
      </div>
      <div className="card neon-blue chart-card">
        <p>Most Pled Activity (Hourly)</p>
        <div className="chart-wrapper">
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

// ── New Users (بيانات حقيقية) ──────────────────────────────────
function NewUsersColumn({ totalUsers, loading }) {
  const doughnutData = {
    datasets: [{
      data: [totalUsers, Math.max(1000 - totalUsers, 0)],
      backgroundColor: ["#ff33cc", "#1a1a3a"],
      borderWidth: 0,
    }],
  };

  return (
    <div className="col-offset">
      <div className="card neon-pink mb new-users-card">
        <div className="new-users-text">
          <div className="stat-label">Total Users</div>
          <div className="new-users-count">
            {loading ? "..." : `${totalUsers} Members`}
          </div>
        </div>
        <div className="doughnut-wrapper">
          <Doughnut data={doughnutData} />
        </div>
      </div>
      <div className="card neon-pink chart-card">
        <p>Most Popular Subjects</p>
        <div className="chart-wrapper">
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

// ── Stats Cards ────────────────────────────────────────────────
function StatsCards({ stats, loading }) {
  const cards = [
    { label: "Total Posts",    value: stats.posts         },
    { label: "Total Groups",   value: stats.groups        },
    { label: "Total Projects", value: stats.projects      },
    { label: "Pending Reports",value: stats.pendingReports},
  ];

  return (
    <div>
      <h3 className="section-title">Platform Stats</h3>
      <div className="card">
        {cards.map(({ label, value }) => (
          <div key={label} style={{ marginBottom: "1rem" }}>
            <div className="stat-label">{label}</div>
            <div className="big-number" style={{ fontSize: "1.4rem" }}>
              {loading ? "..." : (value ?? 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reports Table (بيانات حقيقية) ─────────────────────────────
function ReportsTable({ reports, loading }) {
  return (
    <div className="card mt">
      <h3>Recent Reports</h3>
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading reports...</p>
      ) : (
        <table className="reports-table">
          <thead>
            <tr>
              <th>Reporter</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  No reports found
                </td>
              </tr>
            ) : (
              reports.map((row) => (
                <tr key={row.id}>
                  <td>{row.reporter_name ?? "Unknown"}</td>
                  <td>{row.reported_type}</td>
                  <td>{row.reason ?? "—"}</td>
                  <td>
                    <span className={row.status === "pending" ? "status-active" : "status-inactive"}>
                      ● {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Dashboard Main ─────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats]     = useState({ users: 0, posts: 0, groups: 0, projects: 0, pendingReports: 0 });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Dashboard - UniConnect Admin";
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // جيب الإحصائيات
      const statsRes = await api.get("/admin/stats");
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // جيب الريبورتس
      const reportsRes = await api.get("/admin/reports?limit=5");
      if (reportsRes.data.success) {
        setReports(reportsRes.data.reports);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <DashboardHeader />
      <div className="main-grid">
        <UserStatisticsColumn totalUsers={stats.users} loading={loading} />
        <NewUsersColumn       totalUsers={stats.users} loading={loading} />
        <StatsCards           stats={stats}            loading={loading} />
      </div>
      <ReportsTable reports={reports} loading={loading} />
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────
function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const handleNavigate = (page) => setActivePage(page);

  return (
    <>
      <Navbar activePage={activePage} onNavigate={handleNavigate} />
      {activePage === "dashboard" && <Dashboard />}
      {activePage === "users"     && <OwnersPage />}
      {activePage === "projects"  && <div style={{ padding: 40, color: "#fff" }}>Projects — قريباً</div>}
      {activePage === "reports"   && <div style={{ padding: 40, color: "#fff" }}>Reports — قريباً</div>}
      {activePage === "settings"  && <div style={{ padding: 40, color: "#fff" }}>Settings — قريباً</div>}
    </>
  );
}

export default App;
