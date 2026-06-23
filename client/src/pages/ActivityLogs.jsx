import { useState, useMemo, useEffect } from "react";
import api from "../api/axios";
import "./ActivityLogs.css";

// إعدادات كل نوع عملية: لون الـ badge + أيقونة + الاسم المعروض
const ACTION_CONFIG = {
  delete:     { label: "Delete",     cls: "delete",     icon: <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg> },
  resolve:    { label: "Resolve",    cls: "resolve",    icon: <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6 9 17l-5-5"/></svg> },
  dismiss:    { label: "Dismiss",    cls: "dismiss",    icon: <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6 6 18M6 6l12 12"/></svg> },
  send_email: { label: "Send Email", cls: "send-email", icon: <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  ban_user:   { label: "Ban User",   cls: "ban-user",   icon: <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
};

const STAT_TYPES = ["delete", "resolve", "dismiss", "send_email", "ban_user"];
const DEFAULT_AVATAR = "https://i.pravatar.cc/40?img=1";

export default function ActivityLogs() {

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // States الخاصة بالفلاتر والبحث
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  // States الخاصة بالـ Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // التحكم في فتح/غلق الـ Dropdowns
  const [actionOpen, setActionOpen] = useState(false);
  const [rowsOpen, setRowsOpen] = useState(false);

  // جيب اللوجز من الباك اند
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get("/admin/activity-logs");
        setLogs(res.data.data || []);
      } catch (error) {
        console.error("fetchLogs error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // بيفلتر الـ Logs بناءً على البحث واسم الأدمن ونوع العملية
  const filtered = useMemo(() => logs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch = !q || log.admin_name.toLowerCase().includes(q);
    const matchAction = actionFilter === "All" || log.action_type === actionFilter;
    return matchSearch && matchAction;
  }), [logs, search, actionFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const pageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, "...", totalPages];
    if (page >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page, "...", totalPages];
  };

  const closeDropdowns = () => {
    setActionOpen(false);
    setRowsOpen(false);
  };

  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
  };

  return (
    <div className="al-page" onClick={closeDropdowns}>

      {/* Header */}
      <div className="al-header">
        <h1 className="al-title">Activity Logs</h1>
        <div className="al-header-actions">
          <button className="al-icon-btn">
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <button className="al-icon-btn">
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </button>
        </div>
      </div>

      {/* Stats Bar — إجمالي كل نوع عملية */}
      <div className="al-stats">
        {STAT_TYPES.map(type => {
          const count = logs.filter(l => l.action_type === type).length;
          const cfg = ACTION_CONFIG[type];
          return (
            <div className="al-stat-card" key={type}>
              <div className={`al-stat-icon al-badge ${cfg.cls}`}>{cfg.icon}</div>
              <div>
                <div className="al-stat-num">{count}</div>
                <div className="al-stat-label">{cfg.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="al-filters">
        <div className="al-search-wrap">
          <svg className="al-search-icon" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            className="al-search-input"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search admin name..."
          />
        </div>

        <div className="al-filter-group">
          <span className="al-filter-label">Action Type</span>
          <div className="al-dropdown-wrap" onClick={e => e.stopPropagation()}>
            <button className="al-dropdown-btn" onClick={() => { setActionOpen(o => !o); setRowsOpen(false); }}>
              {actionFilter === "All" ? "All" : ACTION_CONFIG[actionFilter].label}
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {actionOpen && (
              <div className="al-dropdown-menu">
                <div className={`al-dropdown-item ${actionFilter === "All" ? "active" : ""}`} onClick={() => { setActionFilter("All"); setActionOpen(false); setPage(1); }}>
                  All
                </div>
                {STAT_TYPES.map(v => (
                  <div key={v} className={`al-dropdown-item ${actionFilter === v ? "active" : ""}`} onClick={() => { setActionFilter(v); setActionOpen(false); setPage(1); }}>
                    <span className={`al-badge ${ACTION_CONFIG[v].cls}`}>{ACTION_CONFIG[v].icon}</span>
                    {ACTION_CONFIG[v].label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="al-table-wrap">
        <table className="al-table">
          <thead>
            <tr>
              {["Admin", "Action", "Details", "Date & Time"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="al-empty">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={4} className="al-empty">No logs found</td></tr>
            ) : paginated.map(log => {
              const cfg = ACTION_CONFIG[log.action_type];
              const { date, time } = formatDate(log.created_at);
              return (
                <tr key={log.id}>
                  <td>
                    <div className="al-admin-cell">
                      <img src={log.admin_avatar || DEFAULT_AVATAR} alt={log.admin_name} className="al-admin-avatar" width={38} height={38} />
                      <div>
                        <div className="al-admin-name">{log.admin_name}</div>
                        <div className="al-admin-role">{log.admin_role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`al-badge ${cfg.cls}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </td>
                  <td>
                    <div className="al-details">
                      {log.details}
                      {log.target_label && <> — <span className="al-details-target">{log.target_label}</span></>}
                    </div>
                  </td>
                  <td className="al-date-cell">
                    <div className="al-date">{date}</div>
                    <div className="al-time">{time}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="al-pagination">
        <div className="al-rows-group">
          Rows per page:
          <div className="al-dropdown-wrap" onClick={e => e.stopPropagation()}>
            <button className="al-rows-btn" onClick={() => { setRowsOpen(o => !o); setActionOpen(false); }}>
              {rowsPerPage}
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {rowsOpen && (
              <div className="al-rows-menu">
                {[10, 25, 50, 100].map(v => (
                  <div key={v} className={`al-dropdown-item ${rowsPerPage === v ? "active" : ""}`} onClick={() => { setRowsPerPage(v); setRowsOpen(false); setPage(1); }}>{v}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="al-pages">
          <button className="al-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m15 18-6-6 6-6"/></svg>
            Previous
          </button>
          {pageNums().map((n, i) => (
            <button key={i} className={`al-page-num ${page === n ? "active" : ""} ${n === "..." ? "dots" : ""}`} onClick={() => typeof n === "number" && setPage(n)}>
              {n}
            </button>
          ))}
          <button className="al-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>
            Next
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}