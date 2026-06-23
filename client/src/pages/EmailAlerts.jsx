import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import "../styles/EmailAlerts.css";

const ROWS_OPTIONS = [10, 25, 50, 100];

const TYPE_CONFIG = {
  "Good News": { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)" },
  "Neutral":   { color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.3)" },
  "Warning":   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)" },
};

const TARGET_LABELS = { all_students: "All Students", all_doctors: "All Doctors", everyone: "Everyone" };
const GROUP_AVATARS = { all_students: "AS", all_doctors: "AD", everyone: "EV" };

// ── Avatar ───────────────────────────────────────────────────────
function Avatar({ initials, size = 36, gradient = false }) {
  return (
    <div className={`ea-avatar ${gradient ? "ea-avatar-gradient" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.33 }}>
      {initials}
    </div>
  );
}

// ── Type Badge ───────────────────────────────────────────────────
function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG["Neutral"];
  return (
    <span className="ea-type-badge"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {type}
    </span>
  );
}

// ── Pagination ───────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, rowsPerPage, onPageChange, onRowsChange }) {
  const [rowsOpen, setRowsOpen] = useState(false);

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
    <div className="ea-pagination">
      <div className="ea-rows-wrap">
        <span className="ea-rows-label">Rows per page:</span>
        <div className="ea-rows-dropdown" onBlur={() => setRowsOpen(false)} tabIndex={0}>
          <button className="ea-rows-btn" onClick={() => setRowsOpen(!rowsOpen)}>
            {rowsPerPage} <span className="ea-rows-arrow">▾</span>
          </button>
          {rowsOpen && (
            <div className="ea-rows-menu">
              {ROWS_OPTIONS.map((r) => (
                <button key={r}
                  className={`ea-rows-item ${rowsPerPage === r ? "active" : ""}`}
                  onMouseDown={() => { onRowsChange(r); setRowsOpen(false); }}>
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ea-page-nav">
        <button className="ea-nav-btn" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          ‹ Previous
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="ea-page-dots">···</span>
          ) : (
            <button key={p}
              className={`ea-page-num ${currentPage === p ? "active" : ""}`}
              onClick={() => onPageChange(p)}>{p}</button>
          )
        )}
        <button className="ea-nav-btn" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next ›
        </button>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
function EmailAlerts() {
  // Send Form State
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [selectedUser,   setSelectedUser]   = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(""); // all_students | all_doctors | everyone
  const [messageType,    setMessageType]    = useState("Good News");
  const [subject,        setSubject]        = useState("");
  const [message,        setMessage]        = useState("");
  const [sending,        setSending]        = useState(false);
  const [sentSuccess,    setSentSuccess]    = useState(false);
  const [formError,      setFormError]      = useState("");

  const [counts, setCounts] = useState({ students: null, doctors: null, everyone: null });

  // History State
  const [history,      setHistory]      = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [rowsPerPage,  setRowsPerPage]  = useState(10);

  // ── جلب عدد المستلمين + السجل عند فتح الصفحة ──
  const fetchCounts = useCallback(async () => {
    try {
      const res = await api.get("/admin/emails/recipients-count");
      setCounts(res.data.data);
    } catch (err) {
      console.error("fetchCounts error:", err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/admin/emails/history");
      setHistory(res.data.data);
    } catch (err) {
      console.error("fetchHistory error:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    fetchHistory();
  }, [fetchCounts, fetchHistory]);

  // Search Handler
  const handleSearch = async (val) => {
    setSearchQuery(val);
    setSelectedUser(null);
    if (val.trim().length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get("/admin/emails/search-users", { params: { q: val } });
      setSearchResults(res.data.data);
    } catch (err) {
      console.error("search error:", err);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.name);
    setSearchResults([]);
    setSelectedTarget("");
  };

  const selectTarget = (target) => {
    setSelectedTarget(target);
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    if (!selectedUser && !selectedTarget) return;

    setSending(true);
    setFormError("");

    try {
      await api.post("/admin/emails/send", {
        recipient_type: selectedUser ? "user" : selectedTarget,
        recipient_id: selectedUser ? selectedUser.id : undefined,
        subject,
        message,
        message_type: messageType,
      });

      setSentSuccess(true);
      setSubject("");
      setMessage("");
      setSelectedUser(null);
      setSelectedTarget("");
      setSearchQuery("");

      await fetchHistory();
      setCurrentPage(1);
      setTimeout(() => setSentSuccess(false), 3000);
    } catch (err) {
      console.error("send error:", err);
      setFormError(err.response?.data?.message || "حصل خطأ أثناء إرسال الإيميل");
    } finally {
      setSending(false);
    }
  };

  // Pagination (client-side على السجل الكامل القادم من السيرفر)
  const totalPages = Math.max(1, Math.ceil(history.length / rowsPerPage));
  const paginated  = history.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const canSend = subject.trim() && message.trim() && (selectedUser || selectedTarget);

  const targetOptions = [
    { value: "all_students", label: `All Students${counts.students != null ? ` (${counts.students})` : ""}` },
    { value: "all_doctors",  label: `All Doctors${counts.doctors != null ? ` (${counts.doctors})` : ""}` },
    { value: "everyone",     label: `Everyone${counts.everyone != null ? ` (${counts.everyone})` : ""}` },
  ];

  return (
    <div className="ea-page">

      {/* ── Send Email Section ── */}
      <div className="ea-section">
        <div className="ea-section-header">
          <div className="ea-section-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
          <div>
            <h2 className="ea-section-title">Send Email</h2>
          </div>
        </div>
        <div className="ea-section-divider" />

        {/* Recipient + Target Row */}
        <div className="ea-recipient-row">
          {/* 1. Select Recipient */}
          <div className="ea-recipient-col">
            <div className="ea-field-label">1. Select Recipient</div>
            <div className="ea-field-sub">Search for a user by name or email</div>
            <div className="ea-search-wrap">
              <svg className="ea-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="ea-search-input"
                placeholder="Search for user..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button className="ea-search-clear" onClick={clearSearch}>✕</button>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="ea-search-results">
                {searchResults.map((u) => (
                  <div key={u.id} className="ea-search-item" onClick={() => selectUser(u)}>
                    <Avatar initials={u.name.slice(0, 2).toUpperCase()} size={36} gradient />
                    <div>
                      <div className="ea-search-name">{u.name}</div>
                      <div className="ea-search-email">{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="ea-selected-card">
                <Avatar initials={selectedUser.name.slice(0, 2).toUpperCase()} size={40} gradient />
                <div className="ea-selected-info">
                  <div className="ea-selected-name">{selectedUser.name}</div>
                  <div className="ea-selected-email">{selectedUser.email}</div>
                </div>
                <div className="ea-selected-check">✓</div>
              </div>
            )}
          </div>

          {/* OR Divider */}
          <div className="ea-or-divider">
            <div className="ea-or-line" />
            <span className="ea-or-text">OR</span>
            <div className="ea-or-line" />
          </div>

          {/* 2. Choose Target */}
          <div className="ea-target-col">
            <div className="ea-field-label">2. Choose Target</div>
            <div className="ea-field-sub">Select a target group</div>
            <div className="ea-target-select-wrap">
              <select
                className="ea-target-select"
                value={selectedTarget}
                onChange={(e) => selectTarget(e.target.value)}
              >
                <option value="">-- اختر فئة --</option>
                {targetOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <span className="ea-target-arrow">▾</span>
            </div>
          </div>
        </div>

        {/* 3. Message Type */}
        <div className="ea-field-label ea-mt">3. Message Type</div>
        <div className="ea-field-sub">Choose the type of message</div>
        <div className="ea-type-row">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
            <button
              key={type}
              className={`ea-type-btn ${messageType === type ? "active" : ""}`}
              style={messageType === type ? {
                borderColor: cfg.color,
                background: cfg.bg,
                boxShadow: `0 0 16px ${cfg.bg}`,
              } : {}}
              onClick={() => setMessageType(type)}
            >
              <div className="ea-type-icon" style={messageType === type ? { color: cfg.color } : {}}>
                {type === "Good News" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                )}
                {type === "Neutral" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                )}
                {type === "Warning" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                )}
              </div>
              <div>
                <div className="ea-type-name" style={messageType === type ? { color: cfg.color } : {}}>{type}</div>
                <div className="ea-type-desc">
                  {type === "Good News" ? "Positive update" : type === "Neutral" ? "General information" : "Important alert"}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Subject */}
        <div className="ea-field-label ea-mt">Subject</div>
        <input
          className="ea-input"
          placeholder="Enter email subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        {/* Message */}
        <div className="ea-field-label ea-mt">Message</div>
        <div className="ea-textarea-wrap">
          <textarea
            className="ea-textarea"
            placeholder="Write your message here..."
            value={message}
            maxLength={5000}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
          />
          <div className="ea-char-count">{message.length} / 5000</div>
        </div>

        {formError && (
          <div className="ea-field-sub" style={{ color: "#ef4444", marginTop: 8 }}>{formError}</div>
        )}

        {/* Send Button */}
        <button
          className={`ea-send-btn ${!canSend ? "disabled" : ""} ${sentSuccess ? "success" : ""}`}
          onClick={handleSend}
          disabled={!canSend || sending}
        >
          {sending ? (
            <><div className="ea-send-spinner" /> Sending...</>
          ) : sentSuccess ? (
            <>✓ Email Sent!</>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send Email
            </>
          )}
        </button>
      </div>

      {/* ── Sent History Section ── */}
      <div className="ea-section ea-mt-section">
        <div className="ea-section-header">
          <div className="ea-section-icon ea-icon-purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <h2 className="ea-section-title">Sent History</h2>
            <p className="ea-section-sub">View previously sent emails.</p>
          </div>
        </div>
        <div className="ea-section-divider" />

        {loadingHistory ? (
          <p className="ea-field-sub">Loading...</p>
        ) : (
          <>
            <div className="ea-table-wrap">
              <table className="ea-table">
                <thead>
                  <tr>
                    <th>To</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Sent By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => {
                    const isGroup = row.recipient_type !== "user";
                    const toName = isGroup ? TARGET_LABELS[row.recipient_type] : row.recipient_user_name;
                    const toSub  = isGroup
                      ? `${(row.recipient_count ?? 0).toLocaleString()} recipients`
                      : row.recipient_user_email;
                    const avatarInitials = isGroup
                      ? GROUP_AVATARS[row.recipient_type]
                      : (row.recipient_user_name || "?").slice(0, 2).toUpperCase();
                    const dateObj = new Date(row.created_at);

                    return (
                      <tr key={row.id} className="ea-row">
                        <td>
                          <div className="ea-to-cell">
                            <div className={`ea-to-icon ${isGroup ? "ea-to-group" : "ea-to-user"}`}>
                              {isGroup
                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              }
                            </div>
                            <div>
                              <div className="ea-to-name">{toName}</div>
                              <div className="ea-to-recipients">{toSub}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="ea-subject">{row.subject}</div>
                          <div className="ea-preview">{row.message.slice(0, 40)}...</div>
                        </td>
                        <td><TypeBadge type={row.message_type} /></td>
                        <td>
                          <div className="ea-sentby-cell">
                            <div className="ea-sentby-avatar">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                              </svg>
                            </div>
                            <span className="ea-sentby-name">{row.sender_name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="ea-date">{dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                          <div className="ea-time">{dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr><td colSpan={5} className="ea-field-sub" style={{ padding: 20 }}>No emails sent yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              onPageChange={setCurrentPage}
              onRowsChange={(r) => { setRowsPerPage(r); setCurrentPage(1); }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default EmailAlerts;