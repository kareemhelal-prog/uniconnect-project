import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import api from "../api/axios";
import "../styles/PostDetails.css";

// Parse "#comment-123" → 123
function parseHighlightId(hash) {
  const m = /#comment-(\d+)/.exec(hash || "");
  return m ? Number(m[1]) : null;
}

export default function PostDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [post,    setPost]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null); // "notfound" | "error" | null

  const highlightCommentId = parseHighlightId(location.hash);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api.get(`/posts/${id}`)
      .then((res) => {
        if (!active) return;
        const data = res.data.data || res.data;
        if (!data || !data.id) { setError("notfound"); return; }
        setPost({
          ...data,
          author: data.name,
          time: new Date(data.created_at).toLocaleString(),
        });
      })
      .catch((err) => {
        if (!active) return;
        const status = err.response?.status;
        console.error(`Failed to load post ${id}:`, status, err.response?.data?.message || err.message);
        setError(status === 404 ? "notfound" : "error");
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [id]);

  const handleUpdate = (updated) => {
    if (updated._deleted) navigate("/home");
    else setPost((p) => ({ ...p, ...updated }));
  };

  return (
    <div className="pd-page">
      <Navbar />

      <div className="pd-container">
        {loading && <div className="pd-state pd-loading">Loading post…</div>}

        {!loading && error && (
          <div className="pd-state pd-error">
            <div className="pd-error-icon">🔍</div>
            <h2 className="pd-error-title">
              {error === "notfound" ? "This post is no longer available" : "Something went wrong"}
            </h2>
            <p className="pd-error-text">
              {error === "notfound"
                ? "The post may have been deleted or never existed."
                : "We couldn't load this post. Please try again."}
            </p>
            <div className="pd-error-actions">
              <button className="pd-btn pd-btn-primary" onClick={() => navigate("/home")}>← Back to Home</button>
              <button className="pd-btn pd-btn-ghost" onClick={() => navigate(-1)}>Go Back</button>
            </div>
          </div>
        )}

        {!loading && !error && post && (
          <PostCard
            post={post}
            onUpdate={handleUpdate}
            defaultShowComments
            highlightCommentId={highlightCommentId}
          />
        )}
      </div>
    </div>
  );
}
