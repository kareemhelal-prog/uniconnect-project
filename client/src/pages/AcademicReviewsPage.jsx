import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AcademicReviewsPage.css";

const API_BASE = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

function getCurrentUser() {
  try {
    const token = getToken();
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// ── Fake seed review (visible until real data loads) ──────────
const FAKE_REVIEW = {
  id: "fake-1",
  student_id: 9999,
  student_name: "Alex Johnson",
  is_anonymous: false,
  rating: 4,
  comment: "Great professor! Explains complex topics very clearly and is always available during office hours. Highly recommend taking any course with Dr. this instructor.",
  created_at: "2025-04-10T10:00:00Z",
  _fake: true,
};

// ── Stars ─────────────────────────────────────────────────────
function Stars({ rating, onClick, readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="ar-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`ar-star ${(hovered || rating) >= n ? "filled" : ""}`}
          onClick={() => !readOnly && onClick && onClick(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          style={{ cursor: readOnly ? "default" : "pointer" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="ar-confirm-overlay">
      <div className="ar-confirm-box">
        <p className="ar-confirm-msg">{message}</p>
        <div className="ar-confirm-btns">
          <button className="ar-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="ar-confirm-yes" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────
function DoctorSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="ar-subj-btn ar-skeleton-btn">
          <div className="ar-skeleton ar-skeleton-icon" />
          <div style={{ flex: 1 }}>
            <div className="ar-skeleton ar-skeleton-text" />
            <div className="ar-skeleton ar-skeleton-text-sm" />
          </div>
        </div>
      ))}
    </>
  );
}

function ReviewSkeleton() {
  return (
    <>
      {[1, 2].map((i) => (
        <div key={i} className="ar-review-card">
          <div className="ar-review-header">
            <div className="ar-skeleton ar-skeleton-avatar" />
            <div style={{ flex: 1 }}>
              <div className="ar-skeleton ar-skeleton-text" />
              <div className="ar-skeleton ar-skeleton-text-sm" />
            </div>
          </div>
          <div className="ar-skeleton ar-skeleton-para" />
        </div>
      ))}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function AcademicReviewsPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [doctors, setDoctors]               = useState([]);
  const [activeDoctor, setActiveDoctor]     = useState(null);
  const [reviews, setReviews]               = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [doctorsError, setDoctorsError]     = useState(null);
  const [reviewsError, setReviewsError]     = useState(null);
  const [submitting, setSubmitting]         = useState(false);

  // New review form
  const [newText, setNewText]       = useState("");
  const [newRating, setNewRating]   = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Edit state
  const [editingId, setEditingId]     = useState(null);
  const [editText, setEditText]       = useState("");
  const [editRating, setEditRating]   = useState(5);
  const [savingEdit, setSavingEdit]   = useState(false);

  // Confirm dialog
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }

  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast]           = useState(null);

  // Anonymous profile warning
  const [anonWarn, setAnonWarn] = useState(false);

  const showToast = (msg, c = "#a855f7") => {
    setToast({ msg, c });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Fetch Doctors ─────────────────────────────────────────
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      setDoctorsError(null);
      try {
        const res = await fetch(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        const list = (json.data || []).filter((u) => u.role === "doctor");
        setDoctors(list);
        if (list.length > 0) setActiveDoctor(list[0]);
      } catch {
        setDoctorsError("Could not load doctors. Please check your connection.");
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // ── Fetch Reviews ─────────────────────────────────────────
  const fetchReviews = useCallback(async (doctorId) => {
    setLoadingReviews(true);
    setReviewsError(null);
    try {
      const res = await fetch(`${API_BASE}/reviews/doctor/${doctorId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const real = json.data || [];
      // إضافة الـ fake review لو مفيش reviews حقيقية
      setReviews(real.length > 0 ? real : [FAKE_REVIEW]);
    } catch {
      setReviewsError("Could not load reviews.");
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    if (activeDoctor) fetchReviews(activeDoctor.id);
  }, [activeDoctor, fetchReviews]);

  // ── Add Review ───────────────────────────────────────────
  const addReview = async () => {
    if (!newText.trim() || !activeDoctor) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          doctor_id: activeDoctor.id,
          rating: newRating,
          comment: newText.trim(),
          is_anonymous: isAnonymous,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");
      setNewText(""); setNewRating(5); setIsAnonymous(false);
      showToast("Review submitted! ✅");
      fetchReviews(activeDoctor.id);
    } catch (err) {
      showToast(
        err.message === "You already reviewed this doctor"
          ? "You have already reviewed this doctor ⚠️"
          : "Something went wrong. Please try again ❌",
        "#f87171"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Review ────────────────────────────────────────
  const confirmDelete = (id) => {
    setConfirm({
      message: "Are you sure you want to delete this review? This action cannot be undone.",
      onConfirm: async () => {
        setConfirm(null);
        setDeletingId(id);
        try {
          const res = await fetch(`${API_BASE}/reviews/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          if (!res.ok) throw new Error();
          showToast("Review deleted.", "#f87171");
          fetchReviews(activeDoctor.id);
        } catch {
          showToast("Failed to delete review ❌", "#f87171");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  // ── Edit Review (local only — no update endpoint) ────────
  const startEdit = (r) => {
    setEditingId(r.id);
    setEditText(r.comment);
    setEditRating(r.rating);
  };

  const saveEdit = async (id) => {
    setSavingEdit(true);
    // الباك اند مش عنده update endpoint، هنحدّث locally بس
    setReviews((prev) =>
      prev.map((r) => r.id === id ? { ...r, comment: editText, rating: editRating } : r)
    );
    setEditingId(null);
    showToast("Review updated! ✏️", "#00e5ff");
    setSavingEdit(false);
  };

  // ── Navigate to profile ───────────────────────────────────
  const goToProfile = (r) => {
    if (r.is_anonymous) {
      setAnonWarn(true);
      setTimeout(() => setAnonWarn(false), 3000);
      return;
    }
    navigate(`/profile/${r.student_id}`);
  };

  // ── Helpers ───────────────────────────────────────────────
  const avg = reviews.filter(r => !r._fake).length
    ? (reviews.filter(r => !r._fake).reduce((s, r) => s + r.rating, 0) / reviews.filter(r => !r._fake).length).toFixed(1)
    : "—";

  const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const COLORS = ["#a855f7", "#00e5ff", "#f87171", "#34d399", "#fbbf24", "#38bdf8"];
  const colorFor = (id) => COLORS[id % COLORS.length];

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="ar-page">
      {/* Toast */}
      {toast && <div className="ar-toast" style={{ background: toast.c }}>{toast.msg}</div>}

      {/* Anonymous warning */}
      {anonWarn && (
        <div className="ar-toast" style={{ background: "#64748b" }}>
          This reviewer is anonymous — profile not available.
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <h1 className="ar-title">Academic Reviews</h1>

      <div className="ar-layout">

        {/* ── Doctors Sidebar ── */}
        <aside className="ar-subjects">
          {loadingDoctors && <DoctorSkeleton />}
          {doctorsError && (
            <div className="ar-error-box"><span>⚠️</span><p>{doctorsError}</p></div>
          )}
          {!loadingDoctors && !doctorsError && doctors.length === 0 && (
            <div className="ar-empty">No doctors registered yet.</div>
          )}
          {!loadingDoctors && doctors.map((doc) => (
            <button
              key={doc.id}
              className={`ar-subj-btn ${activeDoctor?.id === doc.id ? "ar-subj-active" : ""}`}
              onClick={() => setActiveDoctor(doc)}
              style={{ "--sc": colorFor(doc.id) }}
            >
              <div className="ar-doc-avatar-sm" style={{ background: colorFor(doc.id) }}>
                {getInitials(doc.name)}
              </div>
              <div className="ar-doc-info">
                <span className="ar-subj-name">{doc.name}</span>
                <span className="ar-subj-code">@{doc.username}</span>
              </div>
            </button>
          ))}
        </aside>

        {/* ── Main Panel ── */}
        <main className="ar-main">
          {!activeDoctor && !loadingDoctors && (
            <div className="ar-empty" style={{ marginTop: 60 }}>
              Select a doctor to view their reviews.
            </div>
          )}

          {activeDoctor && (
            <>
              {/* Header */}
              <div className="ar-main-header">
                <div>
                  <h2 className="ar-subj-title" style={{ color: colorFor(activeDoctor.id) }}>
                    Dr. {activeDoctor.name}
                  </h2>
                  <span className="ar-avg">
                    ⭐ {avg} avg · {reviews.filter(r => !r._fake).length} review{reviews.filter(r => !r._fake).length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Add Review — students only */}
              {currentUser?.role === "student" && (
                <div className="ar-add-review">
                  <p className="ar-add-label">Rate your experience</p>
                  <Stars rating={newRating} onClick={setNewRating} />
                  <textarea
                    className="ar-textarea"
                    placeholder="Share your experience with this doctor..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    rows={3}
                  />
                  <div className="ar-add-footer">
                    <label className="ar-anon-label">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="ar-anon-check"
                      />
                      Post anonymously
                    </label>
                    <button
                      className="ar-submit-btn"
                      onClick={addReview}
                      disabled={submitting || !newText.trim()}
                    >
                      {submitting ? "Submitting..." : "Post Review"}
                    </button>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="ar-reviews-list">
                {loadingReviews && <ReviewSkeleton />}

                {reviewsError && !loadingReviews && (
                  <div className="ar-error-box"><span>⚠️</span><p>{reviewsError}</p></div>
                )}

                {!loadingReviews && !reviewsError && reviews.length === 0 && (
                  <div className="ar-empty">No reviews yet — be the first to review!</div>
                )}

                {!loadingReviews && reviews.map((r) => {
                  const isOwner = !r._fake && currentUser?.id === r.student_id;
                  const initials = r.is_anonymous ? "?" : getInitials(r.student_name);
                  const avatarColor = r.is_anonymous ? "#64748b" : colorFor(r.id);
                  const isEditing = editingId === r.id;

                  return (
                    <div key={r.id} className={`ar-review-card ${r._fake ? "ar-fake-card" : ""}`}>
                      <div className="ar-review-header">

                        {/* Avatar — clickable if not anonymous */}
                        <div
                          className="ar-review-avatar"
                          style={{
                            background: avatarColor,
                            cursor: r.is_anonymous ? "default" : "pointer",
                          }}
                          onClick={() => goToProfile(r)}
                          title={r.is_anonymous ? "Anonymous user" : `View ${r.student_name}'s profile`}
                        >
                          {initials}
                        </div>

                        <div className="ar-review-meta">
                          {/* Name — clickable if not anonymous */}
                          <span
                            className={`ar-review-author ${!r.is_anonymous ? "ar-author-link" : ""}`}
                            onClick={() => goToProfile(r)}
                          >
                            {r.student_name}
                            {r.is_anonymous && <span className="ar-anon-badge">Anonymous</span>}
                            {r._fake && <span className="ar-fake-badge">Sample</span>}
                          </span>
                          <span className="ar-review-date">{formatDate(r.created_at)}</span>
                        </div>

                        {/* Stars — read-only unless editing */}
                        {!isEditing && <Stars rating={r.rating} readOnly />}

                        {/* Edit / Delete buttons — owner only */}
                        {isOwner && !isEditing && (
                          <div className="ar-review-actions">
                            <button
                              className="ar-action-btn edit"
                              onClick={() => startEdit(r)}
                              title="Edit review"
                            >
                              ✏️
                            </button>
                            <button
                              className="ar-action-btn del"
                              onClick={() => confirmDelete(r.id)}
                              disabled={deletingId === r.id}
                              title="Delete review"
                            >
                              {deletingId === r.id ? "..." : "🗑"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Edit form */}
                      {isEditing ? (
                        <div className="ar-edit-form">
                          <Stars rating={editRating} onClick={setEditRating} />
                          <textarea
                            className="ar-textarea"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                          />
                          <div className="ar-edit-btns">
                            <button className="ar-cancel-btn" onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                            <button
                              className="ar-submit-btn"
                              onClick={() => saveEdit(r.id)}
                              disabled={savingEdit || !editText.trim()}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="ar-review-text">{r.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}