import React, { useState } from "react";
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

const lineData = {
  labels: ["1am", "5am", "10am", "3pm", "8pm", "11pm"],
  datasets: [
    {
      label: "Activity",
      data: [300, 600, 400, 800, 500, 900],
      borderColor: "#00e5ff",
      backgroundColor: "rgba(0, 229, 255, 0.2)",
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    },
  ],
};

const barData = {
  labels: ["S1", "S2", "S3", "S4", "S5", "S6"],
  datasets: [
    {
      label: "Subjects",
      data: [40, 60, 30, 80, 50, 70],
      backgroundColor: "#bd00ff",
      borderRadius: 5,
    },
  ],
};

const doughnutData = {
  datasets: [
    {
      data: [550, 450],
      backgroundColor: ["#ff33cc", "#1a1a3a"],
      borderWidth: 0,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

const reportsData = [
  {
    user: "Kareem_Admin",
    report: "1535 000",
    type: "Type A",
    status: "Active",
  },
  { user: "User_Test", report: "1255 500", type: "Type B", status: "Inactive" },
];

function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <div className="logo">🌀 UniConnect</div>
      <h1 className="admin-title">Admin Dashboard</h1>
      <button className="create-btn">Create Admin</button>
    </header>
  );
}

function UserStatisticsColumn() {
  return (
    <div>
      <h3 className="section-title">User Statistics</h3>
      <div className="card neon-blue mb">
        <div className="stat-label">Total Users</div>
        <div className="big-number">15,000</div>
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

function NewUsersColumn() {
  return (
    <div className="col-offset">
      <div className="card neon-pink mb new-users-card">
        <div className="new-users-text">
          <div className="stat-label">New Users</div>
          <div className="new-users-count">60 this Month</div>
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

const moderationActions = [
  { id: 1, action: "review", label: "👁️ Review Reports" },
  { id: 2, action: "suspend", label: "🚫 Suspend Tier" },
  { id: 3, action: "problem", label: "problems" },
];

function ModerationColumn() {
  const handleAction = (id, action) => {
    console.log("Moderation action:", { id, action });
  };

  return (
    <div>
      <h3 className="section-title">Moderation Controls</h3>
      <div className="card">
        {moderationActions.map(({ id, action, label }) => (
          <button
            key={id}
            className="create-btn"
            onClick={() => handleAction(id, action)}
          >
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReportsTable() {
  return (
    <div className="card mt">
      <h3>Recent Reports</h3>
      <table className="reports-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Report</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reportsData.map((row) => (
            <tr key={row.user}>
              <td>{row.user}</td>
              <td>{row.report}</td>
              <td>{row.type}</td>
              <td>
                <span
                  className={
                    row.status === "Active"
                      ? "status-active"
                      : "status-inactive"
                  }
                >
                  ● {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="dashboard-container">
      <DashboardHeader />
      <div className="main-grid">
        <UserStatisticsColumn />
        <NewUsersColumn />
        <ModerationColumn />
      </div>
      <ReportsTable />
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [activeId, setActiveId] = useState(null);

  const handleNavigate = (page, id) => {
    setActivePage(page);
    setActiveId(id);
  };

  return (
    <>
      <Navbar activePage={activePage} onNavigate={handleNavigate} />

      {activePage === "dashboard" && <Dashboard />}
      {activePage === "users" && <OwnersPage />}
      {activePage === "projects" && (
        <div style={{ padding: 40, color: "#fff" }}>Projects — قريباً</div>
      )}
      {activePage === "reports" && (
        <div style={{ padding: 40, color: "#fff" }}>Reports — قريباً</div>
      )}
      {activePage === "settings" && (
        <div style={{ padding: 40, color: "#fff" }}>Settings — قريباً</div>
      )}
    </>
  );
}

export default App;
