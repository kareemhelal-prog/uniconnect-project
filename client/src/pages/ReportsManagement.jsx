import React, { useState } from "react";
import "../styles/ReportsManagement.css";

const MOCK_REPORTS = [
  { id: 1, content: "Post by James Carter", contentBody: "Exploring the impact of AI in modern education. What are your thoughts on how it will shape the future of learning?", contentPreview: "Exploring the impact of AI in modern education. What are your thoughts on...", type: "Post",    reason: "Inappropriate Content",  reportedBy: "Sophia Lee",    username: "@sophia.lee",    date: "May 20, 2025", time: "10:30 AM", status: "Pending",   avatar: "SL" },
  { id: 2, content: "Comment on Post",      contentBody: "I totally agree with this! AI will definitely change the future.",                                                                        contentPreview: "I totally agree with this! AI will definitely change the future.",           type: "Comment", reason: "Personal Harassment",   reportedBy: "Aarav Patel",   username: "@aarav.patel",   date: "May 19, 2025", time: "09:15 PM", status: "Pending",   avatar: "AP" },
  { id: 3, content: "File: Research-Paper.pdf", contentBody: 'Shared in group "Machine Learning Research"',                                                                                       contentPreview: 'Shared in group "Machine Learning Research"',                              type: "File",    reason: "False Information",     reportedBy: "Isabella Brown",username: "@isabella.brown",date: "May 19, 2025", time: "04:50 PM", status: "Resolved",  avatar: "IB" },
  { id: 4, content: "Group: Blockchain Enthusiasts", contentBody: "Description contains misleading information.",                                                                                 contentPreview: "Description contains misleading information.",                              type: "Group",   reason: "False Information",     reportedBy: "Ethan Wilson",  username: "@ethan.wilson",  date: "May 18, 2025", time: "11:20 AM", status: "Dismissed", avatar: "EW" },
  { id: 5, content: "Post by Olivia Martinez",  contentBody: "Check out this tool, it can hack any website easily.",                                                                              contentPreview: "Check out this tool, it can hack any website easily.",                     type: "Post",    reason: "Inappropriate Content", reportedBy: "Mia Thompson",  username: "@mia.thompson",  date: "May 17, 2025", time: "08:45 AM", status: "Pending",   avatar: "MT" },
  { id: 6, content: "Comment on Post",       contentBody: "You are wrong and don't know anything about this topic.",                                                                              contentPreview: "You are wrong and don't know anything about this topic.",                  type: "Comment", reason: "Personal Harassment",   reportedBy: "Liam Anderson", username: "@liam.anderson", date: "May 16, 2025", time: "07:30 PM", status: "Resolved",  avatar: "LA" },
  { id: 7, content: "Post by Ahmed Karim",   contentBody: "This is completely false news about the university exam results.",                                                                     contentPreview: "This is completely false news about the university exam results.",          type: "Post",    reason: "False Information",     reportedBy: "Sara Ahmed",    username: "@sara.ahmed",    date: "May 15, 2025", time: "03:20 PM", status: "Pending",   avatar: "SA" },
  { id: 8, content: "Comment on Group",      contentBody: "Stop posting this garbage here, nobody cares about your opinion.",                                                                     contentPreview: "Stop posting this garbage here, nobody cares about your opinion.",         type: "Comment", reason: "Personal Harassment",   reportedBy: "Omar Hassan",   username: "@omar.hassan",   date: "May 14, 2025", time: "01:10 PM", status: "Dismissed", avatar: "OH" },
];

const STATUS_OPTIONS = ["All Statuses", "Pending", "Resolved", "Dismissed"];
const TYPE_OPTIONS   = ["All Types",    "Post",    "Comment",  "File", "Group"];
const REASON_OPTIONS = ["All Reasons",  "Inappropriate Content", "Personal Harassment", "False Information", "Other"];
const ROWS_OPTIONS   = [10, 25, 50, 100];

const TYPE_COLORS = {
  Post:    { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.4)", color: "#a78bfa" },
  Comment: { bg: "rgba(0,229,255,0.1)",   border: "rgba(0,229,255,0.3)",  color: "#00e5ff" },
  File:    { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",  color: "#22c55e" },
  Group:   { bg: "rgba(255,51,204,0.1)",  border: "rgba(255,51,204,0.3)", color: "#ff33cc" },
};

const REASON_COLORS = {
  "Inappropriate Content": { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  color: "#f87171" },
  "Personal Harassment":   { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", color: "#fbbf24" },
  "False Information":     { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", color: "#60a5fa" },
  "Other":                 { bg: "rgba(107,114,128,0.12)",border: "rgba(107,114,128,0.3)", color: "#9ca3af" },
};

// ── أيقونات SVG ثابتة بدل الـ emoji ─────────────────────────────
const IconHeader = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
    <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconStatus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconType = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41 13.42 20.59a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconReason = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);
const IconDelete = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconWarning = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconResolve = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconDismiss = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
);

// ── Dropdown ────────────────────────────────────────────────────
function Dropdown({ icon, label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rm-dropdown" onBlur={() => setOpen(false)} tabIndex={0}>
      <button className="rm-dropdown-btn" onClick={() => setOpen(!open)}>
        <span className="rm-dropdown-icon">{icon}</span>
        <span className="rm-dropdown-label">{label}:</span>
        <span className="rm-dropdown-value">{value}</span>
        <span className={`rm-dropdown-arrow ${open ? "open" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="rm-dropdown-menu">
          {options.map((opt) => (
            <button key={opt} className={`rm-dropdown-item ${value === opt ? "active" : ""}`}
              onMouseDown={() => { onChange(opt); setOpen(false); }}>
              {opt}
              {value === opt && <span className="rm-dropdown-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = status === "Pending" ? "rm-status pending" : status === "Resolved" ? "rm-status resolved" : "rm-status dismissed";
  return <span className={cls}>{status}</span>;
}

function TypeBadge({ type }) {
  const s = TYPE_COLORS[type] || TYPE_COLORS.Post;
  return (
    <span className="rm-type-badge" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {type}
    </span>
  );
}

function ReasonBadge({ reason }) {
  const s = REASON_COLORS[reason] || REASON_COLORS["Other"];
  return (
    <span className="rm-reason-badge" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {reason}
    </span>
  );
}

function Avatar({ initials, size = 36 }) {
  return (
    <div className="rm-avatar" style={{ width: size, height: size, fontSize: size * 0.33 }}>
      {initials}
    </div>
  );
}

function ReportModal({ report, onClose, onAction }) {
  if (!report) return null;

  const handleAction = (action) => {
    onAction(report.id, action);
    if (action === "resolve")  onClose();
    if (action === "dismiss")  onClose();
    if (action === "delete")   onClose();
  };

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rm-modal-header">
          <div className="rm-modal-title-row">
            <div className="rm-modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2 className="rm-modal-title">Reported Content</h2>
          </div>
          <button className="rm-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="rm-modal-reporter">
          <Avatar initials={report.avatar} size={44} />
          <div>
            <div className="rm-modal-reporter-name">{report.reportedBy}</div>
            <div className="rm-modal-reporter-username">{report.username}</div>
            <div className="rm-modal-reporter-date">{report.date} at {report.time}</div>
          </div>
        </div>

        <div className="rm-modal-content-box">
          <p className="rm-modal-content-text">{report.contentBody}</p>
        </div>

        <div className="rm-modal-actions">
          <button className="rm-action-btn delete" onClick={() => handleAction("delete")}>
            <span className="rm-action-icon"><IconDelete /></span>
            Delete Content
          </button>
          <button className="rm-action-btn warning" onClick={() => handleAction("warning")}>
            <span className="rm-action-icon"><IconWarning /></span>
            Send Warning
          </button>
          <button className="rm-action-btn resolve" onClick={() => handleAction("resolve")}>
            <span className="rm-action-icon"><IconResolve /></span>
            Resolve
          </button>
          <button className="rm-action-btn dismiss" onClick={() => handleAction("dismiss")}>
            <span className="rm-action-icon"><IconDismiss /></span>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, rowsPerPage, onPageChange, onRowsChange }) {
  const pages = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="rm-pagination">
      <div className="rm-rows-per-page">
        <span>Rows per page:</span>
        {ROWS_OPTIONS.map((r) => (
          <button key={r} className={`rm-rows-btn ${rowsPerPage === r ? "active" : ""}`}
            onClick={() => onRowsChange(r)}>{r}</button>
        ))}
      </div>
      <div className="rm-page-nav">
        <button className="rm-nav-btn" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          ‹ Previous
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="rm-page-dots">···</span>
          ) : (
            <button key={p} className={`rm-page-btn ${currentPage === p ? "active" : ""}`}
              onClick={() => onPageChange(p)}>{p}</button>
          )
        )}
        <button className="rm-nav-btn" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next ›
        </button>
      </div>
    </div>
  );
}

function ReportsManagement() {
  const [reports,      setReports]      = useState(MOCK_REPORTS);
  const [loading,      setLoading]      = useState(false);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [typeFilter,   setTypeFilter]   = useState("All Types");
  const [reasonFilter, setReasonFilter] = useState("All Reasons");
  const [selectedRow,  setSelectedRow]  = useState(null);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [rowsPerPage,  setRowsPerPage]  = useState(10);

  const filtered = reports.filter((r) => {
    const matchStatus = statusFilter === "All Statuses" || r.status === statusFilter;
    const matchType   = typeFilter   === "All Types"    || r.type   === typeFilter;
    const matchReason = reasonFilter === "All Reasons"  || r.reason === reasonFilter;
    return matchStatus && matchType && matchReason;
  });

  const totalPages   = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated    = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleAction = (id, action) => {
    if (action === "resolve") {
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "Resolved"  } : r));
    } else if (action === "dismiss") {
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "Dismissed" } : r));
    } else if (action === "delete") {
      setReports((prev) => prev.filter((r) => r.id !== id));
    } else if (action === "warning") {
      alert(`⚠️ Warning email sent to ${reports.find((r) => r.id === id)?.reportedBy}`);
    }
  };

  const handleFilterChange = (setter) => (val) => {
    setter(val);
    setCurrentPage(1);
  };

  return (
    <div className="rm-page">
      <div className="rm-header">
        <div className="rm-header-icon"><IconHeader /></div>
        <div>
          <h1 className="rm-title">Reports Management</h1>
          <p className="rm-subtitle">View and manage user reports across the platform.</p>
        </div>
      </div>

      <div className="rm-filters">
        <Dropdown icon={<IconStatus />} label="Status" value={statusFilter} options={STATUS_OPTIONS} onChange={handleFilterChange(setStatusFilter)} />
        <Dropdown icon={<IconType />}   label="Type"   value={typeFilter}   options={TYPE_OPTIONS}   onChange={handleFilterChange(setTypeFilter)}   />
        <Dropdown icon={<IconReason />} label="Reason" value={reasonFilter} options={REASON_OPTIONS} onChange={handleFilterChange(setReasonFilter)} />
      </div>

      <div className="rm-table-wrap">
        {loading ? (
          <div className="rm-loading"><div className="rm-spinner" /><p>Loading reports...</p></div>
        ) : filtered.length === 0 ? (
          <div className="rm-empty"><span>📭</span><p>No reports match your filters</p></div>
        ) : (
          <table className="rm-table">
            <thead>
              <tr>
                <th>Reported Content</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Reported By</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.id} className="rm-row" onClick={() => setSelectedRow(r)}>
                  <td>
                    <div className="rm-content-cell">
                      <div className="rm-content-icon">
                        {r.type === "Post"    && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                        {r.type === "Comment" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                        {r.type === "File"    && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                        {r.type === "Group"   && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff33cc" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                      </div>
                      <div>
                        <div className="rm-content-title">{r.content}</div>
                        <div className="rm-content-preview">{r.contentPreview}</div>
                      </div>
                    </div>
                  </td>
                  <td><TypeBadge type={r.type} /></td>
                  <td><ReasonBadge reason={r.reason} /></td>
                  <td>
                    <div className="rm-reporter-cell">
                      <Avatar initials={r.avatar} size={32} />
                      <div>
                        <div className="rm-reporter-name">{r.reportedBy}</div>
                        <div className="rm-reporter-username">{r.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="rm-date">{r.date}</div>
                    <div className="rm-time">{r.time}</div>
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onRowsChange={(r) => { setRowsPerPage(r); setCurrentPage(1); }}
      />

      <ReportModal
        report={selectedRow}
        onClose={() => setSelectedRow(null)}
        onAction={handleAction}
      />
    </div>
  );
}

export default ReportsManagement;