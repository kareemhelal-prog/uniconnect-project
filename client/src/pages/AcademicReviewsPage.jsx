import React, { useState } from "react";
import "../styles/AcademicReviewsPage.css";

const SUBJECTS = [
  { id:1, name:"Artificial Intelligence",    icon:"🤖", color:"#a78bfa", code:"CS401" },
  { id:2, name:"Data Structures",            icon:"🏛️", color:"#60a5fa", code:"CS201" },
  { id:3, name:"Chemistry",                  icon:"⚗️", color:"#34d399", code:"SC101" },
  { id:4, name:"Statistics",                 icon:"📊", color:"#fbbf24", code:"MT301" },
  { id:5, name:"Engineering Mathematics",    icon:"📐", color:"#f87171", code:"MT201" },
  { id:6, name:"Electric Circuits",          icon:"⚡", color:"#38bdf8", code:"EE301" },
];

const SEED_REVIEWS = [
  { id:1, subjectId:1, author:"Kareem Mohamed", initials:"KM", color:"#a855f7", rating:5, text:"Excellent course! The ML section is very practical and the projects are well structured.", date:"May 18, 2025" },
  { id:2, subjectId:1, author:"Ayesha Khan",    initials:"AK", color:"#00e5ff", rating:4, text:"Good content but the workload is heavy. Recommended for anyone serious about AI.", date:"May 16, 2025" },
  { id:3, subjectId:2, author:"Muhammad Ali",   initials:"MA", color:"#f87171", rating:4, text:"Clear explanations of trees and graphs. Labs help a lot.", date:"May 14, 2025" },
  { id:4, subjectId:3, author:"Sara Ahmed",     initials:"SA", color:"#34d399", rating:3, text:"Solid fundamentals but some topics move too fast.", date:"May 12, 2025" },
  { id:5, subjectId:6, author:"Usman Badar",    initials:"UB", color:"#fbbf24", rating:5, text:"Best course this semester! Dr. Sherif's explanations are crystal clear.", date:"May 10, 2025" },
];

function Stars({ rating, onClick }) {
  return (
    <div className="ar-stars">
      {[1,2,3,4,5].map((n) => (
        <button key={n} className={`ar-star ${rating >= n ? "filled" : ""}`} onClick={() => onClick && onClick(n)}>★</button>
      ))}
    </div>
  );
}

export default function AcademicReviewsPage() {
  const [reviews, setReviews]   = useState(SEED_REVIEWS);
  const [active, setActive]     = useState(SUBJECTS[0]);
  const [editingId, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [newText, setNewText]   = useState("");
  const [newRating, setNewRating] = useState(5);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, c = "#a855f7") => {
    setToast({ msg, c });
    setTimeout(() => setToast(null), 2000);
  };

  const subjectReviews = reviews.filter((r) => r.subjectId === active.id);
  const avg = subjectReviews.length
    ? (subjectReviews.reduce((s, r) => s + r.rating, 0) / subjectReviews.length).toFixed(1)
    : "—";

  const addReview = () => {
    if (!newText.trim()) return;
    setReviews((prev) => [
      { id: Date.now(), subjectId: active.id, author:"Kareem Mohamed", initials:"KM", color:"#a855f7", rating:newRating, text:newText.trim(), date:"Just now" },
      ...prev,
    ]);
    setNewText(""); setNewRating(5);
    showToast("Review added! ✅");
  };

  const saveEdit = (id) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, text:editText, rating:editRating } : r));
    setEditing(null);
    showToast("Review updated! ✏️", "#00e5ff");
  };

  const deleteReview = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    showToast("Review deleted.", "#f87171");
  };

  return (
    <div className="ar-page">
      {toast && <div className="ar-toast" style={{ background:toast.c }}>{toast.msg}</div>}

      <h1 className="ar-title">Academic Reviews</h1>

      <div className="ar-layout">
        {/* Subject list */}
        <aside className="ar-subjects">
          {SUBJECTS.map((s) => (
            <button key={s.id} className={`ar-subj-btn ${active.id === s.id ? "ar-subj-active" : ""}`}
              onClick={() => setActive(s)} style={{ "--sc": s.color }}>
              <span className="ar-subj-icon">{s.icon}</span>
              <span className="ar-subj-name">{s.name}</span>
              <span className="ar-subj-code">{s.code}</span>
            </button>
          ))}
        </aside>

        {/* Reviews panel */}
        <main className="ar-main">
          <div className="ar-main-header">
            <div>
              <h2 className="ar-subj-title" style={{ color:active.color }}>{active.icon} {active.name}</h2>
              <span className="ar-avg">⭐ {avg} avg · {subjectReviews.length} review{subjectReviews.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Add review */}
          <div className="ar-add-review">
            <Stars rating={newRating} onClick={setNewRating}/>
            <textarea className="ar-textarea" placeholder="Share your experience with this subject..." value={newText} onChange={(e) => setNewText(e.target.value)} rows={3}/>
            <button className="ar-submit-btn" onClick={addReview}>Post Review</button>
          </div>

          {/* Reviews list */}
          <div className="ar-reviews-list">
            {subjectReviews.length === 0 && (
              <div className="ar-empty">No reviews yet — be the first to review!</div>
            )}
            {subjectReviews.map((r) => (
              <div key={r.id} className="ar-review-card">
                <div className="ar-review-header">
                  <div className="ar-review-avatar" style={{ background:r.color }}>{r.initials}</div>
                  <div className="ar-review-meta">
                    <span className="ar-review-author">{r.author}</span>
                    <span className="ar-review-date">{r.date}</span>
                  </div>
                  <Stars rating={r.rating} />
                  {r.author === "Kareem Mohamed" && editingId !== r.id && (
                    <div className="ar-review-actions">
                      <button className="ar-action-btn" onClick={() => { setEditing(r.id); setEditText(r.text); setEditRating(r.rating); }}>✏️</button>
                      <button className="ar-action-btn del" onClick={() => deleteReview(r.id)}>🗑</button>
                    </div>
                  )}
                </div>
                {editingId === r.id ? (
                  <div className="ar-edit-form">
                    <Stars rating={editRating} onClick={setEditRating}/>
                    <textarea className="ar-textarea" value={editText} onChange={(e) => setEditText(e.target.value)} rows={3}/>
                    <div className="ar-edit-btns">
                      <button className="ar-cancel-btn" onClick={() => setEditing(null)}>Cancel</button>
                      <button className="ar-submit-btn" onClick={() => saveEdit(r.id)}>Save</button>
                    </div>
                  </div>
                ) : (
                  <p className="ar-review-text">{r.text}</p>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
