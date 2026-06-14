import React, { useState, useEffect } from "react";
import api from "../api/axios.js";
import "../styles/ReportsPage.css";

const STATUS_FILTERS = ["All", "pending", "resolved", "rejected"];

function ReportsPage() {
  const [reports,       setReports]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reports");
      if (res.data.success) setReports(res.data.reports);
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/reports/${id}`, { status });
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      if (selectedReport?.id === id) {
        setSelectedReport((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = activeFilter === "All"
    ? reports
    : reports.filter((r) => r.status === activeFilter);

  const counts = {
    All:      reports.length,
    pending:  reports.filter((r) => r.status === "pending").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
  };

  const statusClass = (s) =>
    s === "pending"  ? "rp-badge pending"  :
    s === "resolved" ? "rp-badge resolved" :
                       "rp-badge rejected";

  return (
    <div className="rp-page">
      {/* ── Header ── */}
      <div className="rp-header">
        <div className="rp-header-left">
          <h1 className="rp-title">🚨 Reports</h1>
          <p className="rp-subtitle">Review and manage platform reports</p>
        </div>
        <button className="rp-refresh-btn" onClick={fetchReports} disabled={loading}>
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="rp-filters">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            className={`rp-filter-btn ${activeFilter === f ? "active" : ""}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
            <span className="rp-filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rp-table-wrap">
        {loading ? (
          <div className="rp-loading">
            <div className="rp-spinner" />
            <p>Loading reports...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rp-empty">
            <span>📭</span>
            <p>No reports found</p>
          </div>
        ) : (
          <table className="rp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Reporter</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  className={selectedReport?.id === r.id ? "rp-row selected" : "rp-row"}
                  onClick={() => setSelectedReport(r)}
                >
                  <td className="rp-id">{i + 1}</td>
                  <td>{r.reporter_name ?? "Unknown"}</td>
                  <td><span className="rp-type">{r.reported_type}</span></td>
                  <td className="rp-reason">{r.reason ?? "—"}</td>
                  <td><span className={statusClass(r.status)}>● {r.status}</span></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="rp-actions">
                      {r.status !== "resolved" && (
                        <button
                          className="rp-action-btn resolve"
                          onClick={() => updateStatus(r.id, "resolved")}
                          disabled={actionLoading}
                        >
                          ✓
                        </button>
                      )}
                      {r.status !== "rejected" && (
                        <button
                          className="rp-action-btn reject"
                          onClick={() => updateStatus(r.id, "rejected")}
                          disabled={actionLoading}
                        >
                          ✕
                        </button>
                      )}
                      {r.status !== "pending" && (
                        <button
                          className="rp-action-btn reset"
                          onClick={() => updateStatus(r.id, "pending")}
                          disabled={actionLoading}
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Detail Panel ── */}
      {selectedReport && (
        <div className="rp-detail-overlay" onClick={() => setSelectedReport(null)}>
          <div className="rp-detail-panel" onClick={(e) => e.stopPropagation()}>
            <button className="rp-detail-close" onClick={() => setSelectedReport(null)}>✕</button>
            <h2 className="rp-detail-title">Report Details</h2>
            <div className="rp-detail-grid">
              <div className="rp-detail-item">
                <span className="rp-detail-label">Reporter</span>
                <span className="rp-detail-value">{selectedReport.reporter_name ?? "Unknown"}</span>
              </div>
              <div className="rp-detail-item">
                <span className="rp-detail-label">Type</span>
                <span className="rp-detail-value">{selectedReport.reported_type}</span>
              </div>
              <div className="rp-detail-item">
                <span className="rp-detail-label">Reason</span>
                <span className="rp-detail-value">{selectedReport.reason ?? "—"}</span>
              </div>
              <div className="rp-detail-item">
                <span className="rp-detail-label">Status</span>
                <span className={statusClass(selectedReport.status)}>● {selectedReport.status}</span>
              </div>
            </div>
            <div className="rp-detail-actions">
              {selectedReport.status !== "resolved" && (
                <button className="rp-detail-btn resolve"
                  onClick={() => updateStatus(selectedReport.id, "resolved")}
                  disabled={actionLoading}>
                  ✓ Resolve
                </button>
              )}
              {selectedReport.status !== "rejected" && (
                <button className="rp-detail-btn reject"
                  onClick={() => updateStatus(selectedReport.id, "rejected")}
                  disabled={actionLoading}>
                  ✕ Reject
                </button>
              )}
              {selectedReport.status !== "pending" && (
                <button className="rp-detail-btn reset"
                  onClick={() => updateStatus(selectedReport.id, "pending")}
                  disabled={actionLoading}>
                  ↺ Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
