import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/PostDetails.css";
import api from "../api/axios";

const PostDetails = () => {
  const { id } = useParams();
  const [post,       setPost]       = useState(null);
  const [comments,   setComments]   = useState([]);
  const [isLiked,    setIsLiked]    = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const [postRes, commentsRes] = await Promise.all([
          api.get(`/posts/${id}`),
          api.get(`/posts/${id}/comments`),
        ]);
        setPost(postRes.data.data || postRes.data);
        setLikesCount(postRes.data.data?.likes_count || 0);
        setIsLiked(postRes.data.data?.is_liked || false);
        setComments(commentsRes.data.data || commentsRes.data || []);
      } catch (err) {
        console.error("Failed to fetch post:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await api.delete(`/posts/${id}/like`);
        setLikesCount((c) => c - 1);
      } else {
        await api.post(`/posts/${id}/like`);
        setLikesCount((c) => c + 1);
      }
      setIsLiked(!isLiked);
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/posts/${id}/comments`, { content: newComment });
      setComments((prev) => [...prev, res.data.data || res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Comment failed:", err);
    }
  };

  if (loading) return <div style={{ color: "#00e5ff", padding: "2rem" }}>Loading...</div>;
  if (!post)   return <div style={{ color: "#f87171", padding: "2rem" }}>Post not found.</div>;

  return (
    <div className="uniconnect-page-wrapper">
      <nav className="breadcrumb-navigation">
        <span>Feed</span> &gt; <span className="active">Post</span>
      </nav>

      <div className="layout-container">
        <main className="main-content-area">
          <div className="post-card-node">
            <header className="post-card-header">
              <div className="author-metadata">
                <div className="profile-avatar" style={{ background: "#6c47ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                  {post.author_name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3>{post.author_name || "Unknown"}</h3>
                  <p className="post-sub-context">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button className="options-trigger-btn">•••</button>
            </header>

            <article className="post-card-body">
              {post.title && <h2 style={{ marginBottom: "0.75rem" }}>{post.title}</h2>}
              <p className="main-paragraph">{post.content}</p>
              {post.image_url && (
                <img src={post.image_url} alt="post" style={{ width: "100%", borderRadius: 8, marginTop: 12 }} />
              )}
            </article>

            <footer className="post-card-actions-bar">
              <button className={`interactive-action-btn ${isLiked ? "has-liked" : ""}`} onClick={handleLike}>
                👍 {likesCount}
              </button>
              <button className="interactive-action-btn">💬 {comments.length}</button>
            </footer>
          </div>

          <div className="comments-module-block">
            <h3>Comments ({comments.length})</h3>
            <div className="comments-scroller-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-row-node">
                  <div className="commenter-avatar" style={{ background: "#6c47ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, borderRadius: "50%", width: 36, height: 36, flexShrink: 0 }}>
                    {comment.author_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="comment-bubble-wrapper">
                    <div className="comment-bubble-header">
                      <span className="commenter-username">{comment.author_name || "Unknown"}</span>
                      <span className="comment-timestamp-label">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="comment-bubble-body">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="input-comment-composer">
              <input
                type="text"
                placeholder="Write a comment..."
                className="composer-text-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <button className="composer-submit-btn" onClick={handleAddComment}>Post</button>
            </div>
          </div>
        </main>

        <aside className="sidebar-content-area">
          <div className="sidebar-widget-card">
            <h4>Post Stats</h4>
            <div className="metrics-dashboard-grid">
              <div className="metric-cell">
                <span className="metric-emoji">👍</span>
                <b className="metric-value">{likesCount}</b>
                <small className="metric-title">Likes</small>
              </div>
              <div className="metric-cell">
                <span className="metric-emoji">💬</span>
                <b className="metric-value">{comments.length}</b>
                <small className="metric-title">Comments</small>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PostDetails;