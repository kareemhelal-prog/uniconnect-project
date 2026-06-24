import { useState, useMemo, useEffect } from "react";
import api from "../api/axios";
import "../styles/ReviewsManagement.css";

const Stars = ({ rating, size = 16 }) => (
  <div className="rm-stars">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= rating ? "#FACC15" : "#374151"}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const Avatar = ({ src, name, size = 36 }) => (
  src
    ? <img src={src} alt={name} className="rm-avatar-img" width={size} height={size} />
    : <div className="rm-avatar-placeholder" style={{ width: size, height: size }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="#60a5fa">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </div>
);

const TypeBadge = ({ type }) => (
  <span className={`rm-badge ${type === "Public" ? "public" : "anonymous"}`}>{type}</span>
);

const yearLabel = (y) => {
  const map = { "1": "1st Year", "2": "2nd Year", "3": "3rd Year", "4": "4th Year" };
  return map[String(y)] || null;
};

const formatDate = (dt) =>
  new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatDateTime = (dt) =>
  new Date(dt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

// بتحول صفوف الداتابيز للشكل اللي الصفحة شغالة عليه
const mapReview = (r) => ({
  id: r.id,
  doctorId: r.doctor_id,
  doctorName: r.doctor_name,
  doctorSpecialty: r.doctor_specialty || "—",
  doctorAvatar: r.doctor_avatar,
  doctorRating: r.doctor_avg_rating ? Number(r.doctor_avg_rating) : 0,
  doctorReviews: r.doctor_review_count || 0,
  studentName: r.is_anonymous ? null : r.student_name,
  studentYear: r.is_anonymous ? null : yearLabel(r.student_year),
  studentAvatar: r.is_anonymous ? null : r.student_avatar,
  rating: r.rating,
  comment: r.comment || "", // مهم: comment ممكن يكون NULL في الداتابيز
  type: r.is_anonymous ? "Anonymous" : "Public",
  date: formatDate(r.created_at),
  dateTime: formatDateTime(r.created_at),
});

export default function ReviewsManagement() {

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewModal, setViewModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);

  const [ratingOpen, setRatingOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [rowsOpen, setRowsOpen] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/reviews/admin/all");
      setReviews((res.data.data || []).map(mapReview));
    } catch (err) {
      setError("فشل تحميل المراجعات، حاول تاني");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filtered = useMemo(() => reviews.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.doctorName.toLowerCase().includes(q) || (r.studentName || "").toLowerCase().includes(q);
    const matchRating = ratingFilter === "All" || r.rating === parseInt(ratingFilter);
    const matchType = typeFilter === "All" || r.type === typeFilter;
    return matchSearch && matchRating && matchType;
  }), [reviews, search, ratingFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      setDeleteConfirm(null);
      showToast("Review deleted successfully");
    } catch (err) {
      showToast("فشل حذف المراجعة");
    } finally {
      setDeleting(false);
    }
  };

  const pageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, "...", totalPages];
    if (page >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page, "...", totalPages];
  };

  const closeDropdowns = () => {
    setRatingOpen(false);
    setTypeOpen(false);
    setRowsOpen(false);
  };

  return (
    <div className="rm-page" onClick={closeDropdowns}>

      {toast && (
        <div className="rm-toast">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
          {toast}
        </div>
      )}

      <div className="rm-header">
        <h1 className="rm-title">Reviews Management</h1>
      </div>

      <div className="rm-filters">
        <div className="rm-search-wrap">
          <svg className="rm-search-icon" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            className="rm-search-input"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search doctor name or student..."
          />
        </div>

        <div className="rm-filter-group">
          <span className="rm-filter-label">Rating</span>
          <div className="rm-dropdown-wrap" onClick={e => e.stopPropagation()}>
            <button className="rm-dropdown-btn" onClick={() => { setRatingOpen(o => !o); setTypeOpen(false); setRowsOpen(false); }}>
              {ratingFilter === "All" ? "All" : `${ratingFilter} Star${ratingFilter === "1" ? "" : "s"}`}
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {ratingOpen && (
              <div className="rm-dropdown-menu">
                {["All", "1", "2", "3", "4", "5"].map(v => (
                  <div key={v} className={`rm-dropdown-item ${ratingFilter === v ? "active" : ""}`} onClick={() => { setRatingFilter(v); setRatingOpen(false); setPage(1); }}>
                    {v === "All" ? "All" : `${v} Star${v === "1" ? "" : "s"}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rm-filter-group">
          <span className="rm-filter-label">Type</span>
          <div className="rm-dropdown-wrap" onClick={e => e.stopPropagation()}>
            <button className="rm-dropdown-btn" onClick={() => { setTypeOpen(o => !o); setRatingOpen(false); setRowsOpen(false); }}>
              {typeFilter}
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {typeOpen && (
              <div className="rm-dropdown-menu">
                {["All", "Anonymous", "Public"].map(v => (
                  <div key={v} className={`rm-dropdown-item ${typeFilter === v ? "active" : ""}`} onClick={() => { setTypeFilter(v); setTypeOpen(false); setPage(1); }}>
                    {v}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rm-table-wrap">
        <table className="rm-table">
          <thead>
            <tr>
              {["Doctor", "Student", "Rating", "Comment", "Date", "Actions"].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="rm-empty">جاري التحميل...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="rm-empty">{error}</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} className="rm-empty">No reviews found</td></tr>
            ) : paginated.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="rm-doctor-cell">
                    <Avatar src={r.doctorAvatar} name={r.doctorName} />
                    <div>
                      <div className="rm-doctor-name">{r.doctorName}</div>
                      <div className="rm-doctor-specialty">{r.doctorSpecialty}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={`rm-student-cell ${!r.studentName ? "anonymous" : ""}`}>
                    <Avatar src={r.studentAvatar} name={r.studentName || "Anonymous"} size={32} />
                    {r.studentName || "Anonymous"}
                  </div>
                </td>
                <td><Stars rating={r.rating} /></td>
                <td><span className="rm-comment">{r.comment.slice(0, 60)}{r.comment.length > 60 ? "..." : ""}</span></td>
                <td><span className="rm-date">{r.date}</span></td>
                <td>
                  <div className="rm-actions">
                    <button className="rm-btn-view" onClick={() => setViewModal(r)}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View
                    </button>
                    <button className="rm-btn-delete" onClick={() => setDeleteConfirm(r)}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rm-pagination">
        <div className="rm-rows-group">
          Rows per page:
          <div className="rm-dropdown-wrap" onClick={e => e.stopPropagation()}>
            <button className="rm-rows-btn" onClick={() => { setRowsOpen(o => !o); setRatingOpen(false); setTypeOpen(false); }}>
              {rowsPerPage}
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2}><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {rowsOpen && (
              <div className="rm-rows-menu">
                {[10, 25, 50, 100].map(v => (
                  <div key={v} className={`rm-dropdown-item ${rowsPerPage === v ? "active" : ""}`} onClick={() => { setRowsPerPage(v); setRowsOpen(false); setPage(1); }}>{v}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rm-pages">
          <button className="rm-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m15 18-6-6 6-6"/></svg>
            Previous
          </button>
          {pageNums().map((n, i) => (
            <button key={i} className={`rm-page-num ${page === n ? "active" : ""} ${n === "..." ? "dots" : ""}`} onClick={() => typeof n === "number" && setPage(n)}>
              {n}
            </button>
          ))}
          <button className="rm-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>
            Next
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {viewModal && (
        <div className="rm-backdrop" onClick={() => setViewModal(null)}>
          <div className="rm-modal rm-view-modal" onClick={e => e.stopPropagation()}>
            <button className="rm-modal-close" onClick={() => setViewModal(null)}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>

            <div className="rm-view-body">
              <div className="rm-doctor-card">
                <Avatar src={viewModal.doctorAvatar} name={viewModal.doctorName} size={56} />
                <div className="rm-doctor-card-name">{viewModal.doctorName}</div>
                <div className="rm-doctor-card-specialty">{viewModal.doctorSpecialty}</div>
                <div className="rm-doctor-rating-box">
                  <div className="rm-doctor-rating-num">{viewModal.doctorRating}</div>
                  <Stars rating={Math.round(viewModal.doctorRating)} size={14} />
                  <div className="rm-doctor-rating-count">({viewModal.doctorReviews} Reviews)</div>
                </div>
              </div>

              <div className="rm-view-details">
                <div className="rm-detail-label">Review by</div>
                <div className="rm-reviewer-row">
                  <Avatar src={viewModal.studentAvatar} name={viewModal.studentName || "Anonymous"} size={36} />
                  <div>
                    <div className="rm-reviewer-name">{viewModal.studentName || "Anonymous"}</div>
                    {viewModal.studentYear && <div className="rm-reviewer-year">{viewModal.studentYear}</div>}
                  </div>
                </div>

                <div className="rm-meta-row">
                  <div>
                    <div className="rm-detail-label">Type</div>
                    <TypeBadge type={viewModal.type} />
                  </div>
                  <div>
                    <div className="rm-detail-label">Date</div>
                    <div className="rm-date-row">
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {viewModal.dateTime}
                    </div>
                  </div>
                </div>

                <div className="rm-rating-row">
                  <div className="rm-detail-label">Rating</div>
                  <Stars rating={viewModal.rating} size={18} />
                </div>

                <div>
                  <div className="rm-detail-label">Comment</div>
                  <p className="rm-comment-text">{viewModal.comment || "—"}</p>
                </div>
              </div>
            </div>

            <div className="rm-modal-footer">
              <div className="rm-review-id">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Review ID: {viewModal.id}
              </div>
              <button className="rm-btn-close" onClick={() => setViewModal(null)}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6 6 18M6 6l12 12"/></svg>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="rm-backdrop" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="rm-modal rm-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="rm-delete-icon">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <h3 className="rm-delete-title">Delete Review</h3>
            <p className="rm-delete-msg">
              Are you sure you want to delete this review by <strong>{deleteConfirm.studentName || "Anonymous"}</strong> for <strong>{deleteConfirm.doctorName}</strong>? This action cannot be undone.
            </p>
            <div className="rm-delete-actions">
              <button className="rm-btn-cancel" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button className="rm-btn-confirm-delete" onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}