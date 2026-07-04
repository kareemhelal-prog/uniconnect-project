import React, { useState, useMemo, useCallback, useEffect } from "react";
import "../styles/GroupsManagement.css";
import api from "../api/axios";

const YEAR_OPTIONS = ["All", "1st Year", "2nd Year", "3rd Year", "4th Year"];
const TYPE_OPTIONS = ["All", "subject", "other"];
const ROWS_OPTIONS = [10, 25, 50, 100];

function Avatar({ letter, size = 36 }) {
  return (
    <div className="gm-avatar" style={{ background: "linear-gradient(135deg,#6c47ff,#a855f7)", width: size, height: size, fontSize: size * 0.38 }}>
      {letter}
    </div>
  );
}

function YearBadge({ year }) {
  const cls = year === "1" ? "badge-year1" : year === "2" ? "badge-year2" : year === "3" ? "badge-year3" : year === "4" ? "badge-year4" : "badge-yearall";
  return <span className={`gm-year-badge ${cls}`}>{year ? `Year ${year}` : "All Years"}</span>;
}

function TypeBadge({ type }) {
  return <span className={`gm-type-badge ${type === "subject" ? "badge-subject" : "badge-other"}`}>{type}</span>;
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return <div className="gm-toast">✅ {msg}</div>;
}

function ConfirmDialog({ group, onConfirm, onCancel }) {
  return (
    <div className="gm-overlay" onClick={onCancel}>
      <div className="gm-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="gm-confirm-icon">🗑️</div>
        <h3>Delete Group</h3>
        <p>Are you sure you want to delete <strong>"{group.name}"</strong>?</p>
        <div className="gm-confirm-btns">
          <button className="gm-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="gm-btn-delete-confirm" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function ViewModal({ group, onClose }) {
  const [members, setMembers] = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get(`/groups/${group.id}/members`);
        setMembers(res.data.data || res.data || []);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [group.id]);

  const filtered = members.filter((m) => m.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="gm-overlay" onClick={onClose}>
      <div className="gm-modal-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="gm-modal">
          <div className="gm-modal-header">
            <div className="gm-modal-icon" style={{ background: "linear-gradient(135deg,#6c47ff,#a855f7)" }}>
              <span>👥</span>
            </div>
            <div className="gm-modal-title-area">
              <div className="gm-modal-title-row">
                <h2 className="gm-modal-title">{group.name}</h2>
                <TypeBadge type={group.group_type} />
              </div>
            </div>
            <button className="gm-x-btn" onClick={onClose}>✕</button>
          </div>

          <div className="gm-modal-body">
            <div className="gm-modal-row"><span className="gm-modal-key">👤 Creator</span><span className="gm-modal-val">{group.creator_name || "—"}</span></div>
            <div className="gm-modal-row"><span className="gm-modal-key">📅 Academic Year</span><YearBadge year={group.academic_year} /></div>
            <div className="gm-modal-row"><span className="gm-modal-key">👥 Members</span><span className="gm-modal-val">👥 {group.members_count || 0}</span></div>
            <div className="gm-modal-row"><span className="gm-modal-key">📆 Created</span><span className="gm-modal-val">{new Date(group.created_at).toLocaleDateString()}</span></div>
            <div className="gm-modal-row gm-modal-desc-row"><span className="gm-modal-key">📋 Description</span><span className="gm-modal-desc">{group.description}</span></div>

            <div style={{ marginTop: 16 }}>
              <h4 style={{ color: "var(--text-strong)", marginBottom: 8 }}>Members ({members.length})</h4>
              <input className="gm-members-search" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
              <div className="gm-members-list">
                {loading ? (
                  <p style={{ color: "var(--text-muted)" }}>Loading...</p>
                ) : filtered.map((m) => (
                  <div key={m.id} className="gm-member-row">
                    <Avatar letter={m.name?.[0]?.toUpperCase() || "U"} size={38} />
                    <span className="gm-member-name">{m.name}</span>
                    <span className={`gm-role-badge ${m.role === "admin" ? "badge-admin" : "badge-member"}`}>{m.role}</span>
                  </div>
                ))}
                {!loading && filtered.length === 0 && <p className="gm-no-results">No members found</p>}
              </div>
            </div>
          </div>

          <div className="gm-modal-footer">
            <button className="gm-btn-close-modal" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GroupsManagement() {
  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [yearFilter,  setYearFilter]  = useState("All");
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [total,       setTotal]       = useState(0);
  const [viewGroup,   setViewGroup]   = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [toast,       setToast]       = useState(null);
  const [showYearDD,  setShowYearDD]  = useState(false);
  const [showTypeDD,  setShowTypeDD]  = useState(false);
  const [showRowsDD,  setShowRowsDD]  = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:  currentPage,
        limit: rowsPerPage,
        ...(search && { search }),
        ...(yearFilter !== "All" && { academic_year: yearFilter.replace(" Year", "") }),
        ...(typeFilter !== "All" && { group_type: typeFilter }),
      });
      const res = await api.get(`/admin/groups?${params}`);
      setGroups(res.data.groups || res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, search, yearFilter, typeFilter]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);
  useEffect(() => { setCurrentPage(1); }, [search, yearFilter, typeFilter, rowsPerPage]);

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/groups/${confirmDel.id}`);
      setGroups((prev) => prev.filter((g) => g.id !== confirmDel.id));
      setToast("Group deleted successfully");
      setConfirmDel(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  const pageNums = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, "...", totalPages];
    if (currentPage >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", currentPage, "...", totalPages];
  }, [totalPages, currentPage]);

  return (
    <div className="gm-page" onClick={() => { setShowYearDD(false); setShowTypeDD(false); setShowRowsDD(false); }}>
      <div className="gm-blob gm-blob1" /><div className="gm-blob gm-blob2" />

      <div className="gm-inner">
        <div className="gm-page-header">
          <h1 className="gm-page-title">Groups Management</h1>
        </div>

        <div className="gm-toolbar">
          <div className="gm-search-wrap">
            <span className="gm-search-ico">🔍</span>
            <input className="gm-search-input" placeholder="Search group name, creator..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            {search && <button className="gm-search-clear" onClick={() => setSearch("")}>✕</button>}
          </div>

          <div className="gm-filters">
            {/* Year filter */}
            <div className="gm-filter-group">
              <span className="gm-filter-label">Academic Year</span>
              <div className="gm-dropdown-wrap" onClick={(e) => e.stopPropagation()}>
                <button className={`gm-dropdown-btn ${showYearDD ? "open" : ""}`} onClick={() => { setShowYearDD((v) => !v); setShowTypeDD(false); }}>
                  {yearFilter} <span className="gm-chevron">{showYearDD ? "▲" : "▼"}</span>
                </button>
                {showYearDD && (
                  <div className="gm-dropdown-menu">
                    {YEAR_OPTIONS.map((y) => (
                      <div key={y} className={`gm-dropdown-item ${yearFilter === y ? "active" : ""}`} onClick={() => { setYearFilter(y); setShowYearDD(false); }}>{y}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Type filter */}
            <div className="gm-filter-group">
              <span className="gm-filter-label">Type</span>
              <div className="gm-dropdown-wrap" onClick={(e) => e.stopPropagation()}>
                <button className={`gm-dropdown-btn ${showTypeDD ? "open" : ""}`} onClick={() => { setShowTypeDD((v) => !v); setShowYearDD(false); }}>
                  {typeFilter} <span className="gm-chevron">{showTypeDD ? "▲" : "▼"}</span>
                </button>
                {showTypeDD && (
                  <div className="gm-dropdown-menu">
                    {TYPE_OPTIONS.map((t) => (
                      <div key={t} className={`gm-dropdown-item ${typeFilter === t ? "active" : ""}`} onClick={() => { setTypeFilter(t); setShowTypeDD(false); }}>{t}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="gm-table-panel">
          <div className="gm-table-wrap">
            <table className="gm-table">
              <thead>
                <tr><th>Group</th><th>Creator</th><th>Members</th><th>Type</th><th>Year</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#00e5ff" }}>Loading...</td></tr>
                ) : groups.length === 0 ? (
                  <tr><td colSpan={7} className="gm-empty-row">No groups found</td></tr>
                ) : (
                  groups.map((group) => (
                    <tr key={group.id} className="gm-table-row">
                      <td>
                        <div className="gm-group-cell">
                          <div className="gm-group-icon" style={{ background: "linear-gradient(135deg,#6c47ff,#a855f7)" }}>
                            <span>👥</span>
                          </div>
                          <div>
                            <div className="gm-group-name">{group.name}</div>
                            <div className="gm-group-sub">{group.group_type}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="gm-creator-cell">
                          <Avatar letter={group.creator_name?.[0]?.toUpperCase() || "U"} size={34} />
                          <span className="gm-creator-name">{group.creator_name || "Unknown"}</span>
                        </div>
                      </td>
                      <td><span className="gm-members-count">👥 {group.members_count || 0}</span></td>
                      <td><TypeBadge type={group.group_type} /></td>
                      <td><YearBadge year={group.academic_year} /></td>
                      <td className="gm-date-cell">{new Date(group.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="gm-actions">
                          <button className="gm-view-btn"   onClick={() => setViewGroup(group)}>👁 View</button>
                          <button className="gm-delete-btn" onClick={() => setConfirmDel(group)}>🗑 Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="gm-table-footer">
            <div className="gm-rows-wrap" onClick={(e) => e.stopPropagation()}>
              <span className="gm-rows-label">Rows per page:</span>
              <div className="gm-dropdown-wrap">
                <button className={`gm-dropdown-btn gm-rows-btn ${showRowsDD ? "open" : ""}`} onClick={() => setShowRowsDD((v) => !v)}>
                  {rowsPerPage} <span className="gm-chevron">{showRowsDD ? "▲" : "▼"}</span>
                </button>
                {showRowsDD && (
                  <div className="gm-dropdown-menu gm-rows-menu">
                    {ROWS_OPTIONS.map((r) => (
                      <div key={r} className={`gm-dropdown-item ${rowsPerPage === r ? "active" : ""}`} onClick={() => { setRowsPerPage(r); setShowRowsDD(false); }}>{r}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="gm-pagination">
              <button className="gm-page-nav" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>‹ Previous</button>
              {pageNums.map((p, i) =>
                p === "..." ? (
                  <span key={i} className="gm-page-dots">…</span>
                ) : (
                  <button key={i} className={`gm-page-num ${currentPage === p ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                )
              )}
              <button className="gm-page-nav" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next ›</button>
            </div>
          </div>
        </div>
      </div>

      {viewGroup  && <ViewModal group={viewGroup} onClose={() => setViewGroup(null)} />}
      {confirmDel && <ConfirmDialog group={confirmDel} onConfirm={handleDelete} onCancel={() => setConfirmDel(null)} />}
      {toast      && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}