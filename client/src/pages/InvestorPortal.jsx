import { useState, useEffect } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import "../styles/InvestorPortal.css";

const FALLBACK_STATS = {
  totalProjects: 0,
  totalInvestors: 0,
  totalInterests: 0,
  projectsChange: "",
  investorsChange: "",
  interestsChange: "",
};

const CATEGORIES = ["All", "Software", "Hardware"];
const STATUSES    = ["All", "idea", "prototype", "mvp", "launched"];

// أيقونة ثابتة حسب الفئة بدل ما نتوقع إن السيرفر يبعتها
const CATEGORY_ICON = {
  Software: "fa-laptop-code",
  Hardware: "fa-microchip",
};

export default function InvestorPortal() {
  const navigate = useNavigate();

  const [stats, setStats]             = useState(FALLBACK_STATS);
  const [projects, setProjects]       = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]         = useState(true);

  const [activeTab, setActiveTab]           = useState("projects");
  const [searchQuery, setSearchQuery]       = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus]     = useState("All");

  useEffect(() => {
    fetchStats();
    fetchProjects();
    fetchLeaderboard();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/investor/stats");
      if (res.data.success) setStats(res.data.stats);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get("/projects");
      if (res.data.success) setProjects(res.data.projects);
    } catch (err) {
      console.error("Projects fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get("/investor/leaderboard");
      if (res.data.success) setLeaderboard(res.data.leaderboard);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = activeCategory === "All" || p.category === activeCategory;
    const matchStatus   = activeStatus === "All" || p.status === activeStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const categoryClass = (cat) => cat.toLowerCase();

  const rankClass = (rank) => {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "";
  };

  const interestClass = (rank) => {
    if (rank === 1) return "text-gold";
    if (rank === 2) return "text-silver";
    if (rank === 3) return "text-bronze";
    return "";
  };

  return (
    <div className="investor-page">
      <main className="investor-main">

        <section className="stats-bar">
          <div className="stat-card">
            <span className="stat-icon"><i className="fa-solid fa-folder-open"></i></span>
            <h2 className="stat-number">{stats.totalProjects.toLocaleString()}</h2>
            <p className="stat-label">Total Projects</p>
            <span className="stat-change positive">
              {stats.projectsChange} <i className="fa-solid fa-arrow-trend-up"></i>
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-icon"><i className="fa-solid fa-users-viewfinder"></i></span>
            <h2 className="stat-number">{stats.totalInvestors.toLocaleString()}</h2>
            <p className="stat-label">Total Investors</p>
            <span className="stat-change positive">
              {stats.investorsChange} <i className="fa-solid fa-arrow-trend-up"></i>
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-icon"><i className="fa-solid fa-star"></i></span>
            <h2 className="stat-number">{stats.totalInterests.toLocaleString()}</h2>
            <p className="stat-label">Total Interests</p>
            <span className="stat-change positive">
              {stats.interestsChange} <i className="fa-solid fa-arrow-trend-up"></i>
            </span>
          </div>
        </section>

        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "projects" ? "active" : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            <i className="fa-solid fa-briefcase"></i> Projects
          </button>
          <button
            className={`tab-btn ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
          >
            <i className="fa-solid fa-trophy"></i> Leaderboard
          </button>
        </div>

        {activeTab === "projects" && (
          <section className="projects-tab-content">

            <div className="filter-section">
              <div className="search-box">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Search projects by name or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <span className="filter-label">Category:</span>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`filter-tag ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="filter-group">
                <span className="filter-label">Status:</span>
                {STATUSES.map((st) => (
                  <button
                    key={st}
                    className={`filter-tag ${activeStatus === st ? "active" : ""} ${st !== "All" ? st : ""}`}
                    onClick={() => setActiveStatus(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="projects-grid">
              {loading ? (
                <p className="no-results">Loading projects...</p>
              ) : filteredProjects.length === 0 ? (
                <p className="no-results">No projects match your filters.</p>
              ) : (
                filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    categoryClass={categoryClass}
                    onView={() => navigate(`/projects/${project.id}`)}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "leaderboard" && (
          <section className="leaderboard-section">
            <div className="section-title">
              <h2><i className="fa-solid fa-trophy"></i> Leaderboard</h2>
              <p>Projects ranked by number of Express Interests</p>
            </div>

            <div className="leaderboard-table-wrap">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Project</th>
                    <th>Founder</th>
                    <th>Category</th>
                    <th>Express Interests</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr><td colSpan={5} className="no-results">No data yet</td></tr>
                  ) : leaderboard.map((item) => (
                    <tr key={item.rank} className={`rank-row rank-${item.rank}`}>
                      <td>
                        <span className={`rank-badge ${rankClass(item.rank)}`}>
                          {item.rank}
                        </span>
                      </td>
                      <td>
                        <div className="table-project">
                          <div className={`project-icon ${categoryClass(item.category)} small`}>
                            <i className={`fa-solid ${CATEGORY_ICON[item.category] || "fa-circle"}`}></i>
                          </div>
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-founder">
                          <img src={item.founderImg} alt={item.founderName} />
                          <span>{item.founderName}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-outline ${categoryClass(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className={`interests-count ${interestClass(item.rank)}`}>
                        {item.interests}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

function ProjectCard({ project, categoryClass, onView }) {
  const { name, category, status, description, founderName, founderImg } = project;
  const icon = CATEGORY_ICON[category] || "fa-circle";

  return (
    <div className="project-card">
      <div className="card-header">
        <div className={`project-icon ${categoryClass(category)}`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>

        <div className="project-title-area">
          <h3>{name}</h3>
          <div className="badges">
            <span className={`badge ${categoryClass(category)}`}>{category}</span>
            <span className={`badge ${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
        </div>
      </div>

      <p className="project-desc">{description}</p>

      <div className="project-founder">
        <img src={founderImg} alt={founderName} className="founder-img" />
        <div className="founder-info">
          <h4>{founderName}</h4>
          <p>Founder</p>
        </div>
      </div>

      <button className="btn-view-project" onClick={onView}>
        View Project
      </button>
    </div>
  );
}