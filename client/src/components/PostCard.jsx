import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PostCard.css";

const API_BASE = "http://localhost:5000/api";
const token = () => localStorage.getItem("token");
const currentUserId = () => {
  const t = token();
  if (!t) return null;
  try { return JSON.parse(atob(t.split(".")[1])).id; } catch { return null; }
};

const resolveImg = (pic) => {
  if (!pic) return "";
  if (pic.startsWith("data:") || pic.startsWith("http")) return pic;
  return `http://localhost:5000/${pic.replace(/^\//, "")}`;
};

function VerifiedBadge() {
  return <span className="verified-badge" title="Verified account">✓</span>;
}

function CommentItem({ comment, postId, navigate }) {
  const pic = resolveImg(comment.user?.profile_picture || "");
  const isVerified = comment.user?.role === "doctor" || comment.user?.role === "admin";
  return (
    <div className="comment-item">
      <div
        className="comment-avatar-wrap"
        onClick={() => comment.user?.id && navigate(`/profile/${comment.user.id}`)}
        style={{ cursor: "pointer" }}
      >
        {pic
          ? <img src={pic} alt="" className="comment-avatar-img" onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          : null}
        <span className="comment-avatar-fallback" style={{ display: pic ? "none" : "flex" }}>
          {(comment.user?.name || "U").slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="comment-bubble">
        <span
          className="comment-author clickable-name"
          onClick={() => comment.user?.id && navigate(`/profile/${comment.user.id}`)}
        >
          {comment.user?.name || "Unknown"}
          {isVerified && <VerifiedBadge />}
        </span>
        <p className="comment-text">{comment.content}</p>
        <span className="comment-time">{new Date(comment.created_at).toLocaleString()}</span>
        {comment.replies && comment.replies.map(r => (
          <CommentItem key={r.id} comment={r} postId={postId} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}

const PostCard = ({ post, onUpdate }) => {
  const navigate = useNavigate();
  const myId = currentUserId();
  const isOwner = post.user_id != null && myId != null && Number(post.user_id) === Number(myId);
  const isVerified = post.role === "doctor" || post.role === "admin";
  const postPic = resolveImg(post.profile_picture || "");

  const [liked, setLiked]               = useState(!!post.liked);
  const [likesCount, setLikesCount]     = useState(Number(post.likes) || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText]   = useState("");
  const [comments, setComments]         = useState(post.comments || []);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showMenu, setShowMenu]         = useState(false);
  const [editing, setEditing]           = useState(false);
  const [editContent, setEditContent]   = useState(post.content || "");
  const [imgError, setImgError]         = useState(false);

  useEffect(() => {
    if (isOwner || !post.user_id) return;
    fetch(`${API_BASE}/follow/is-following/${post.user_id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => r.json())
      .then(d => setIsFollowing(!!d.isFollowing))
      .catch(() => {});
  }, [post.user_id, isOwner]);

  const handleLike = async () => {
    try {
      await fetch(`${API_BASE}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ post_id: post.id }),
      });
      const newLiked = !liked;
      setLiked(newLiked);
      setLikesCount(c => newLiked ? c + 1 : c - 1);
    } catch {}
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ post_id: post.id, content: commentText.trim() }),
      });
      const data = await res.json();
      setComments(prev => [...prev, data]);
      setCommentText("");
    } catch {}
  };

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      await fetch(`${API_BASE}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ following_id: post.user_id }),
      });
      setIsFollowing(f => !f);
    } catch {} finally {
      setFollowLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await fetch(`${API_BASE}/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (onUpdate) onUpdate({ ...post, _deleted: true });
    } catch {}
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await fetch(`${API_BASE}/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ content: editContent, title: post.title }),
      });
      setEditing(false);
      if (onUpdate) onUpdate({ ...post, content: editContent });
    } catch {}
  };

  return (
    <div className="post-card" data-post-id={post.id}>
      <div className="post-header">
        <div
          className="post-avatar-wrap"
          onClick={() => post.user_id && navigate(`/profile/${post.user_id}`)}
          style={{ cursor: "pointer" }}
        >
          {postPic && !imgError
            ? <img src={postPic} alt="" className="post-avatar-img" onError={() => setImgError(true)} />
            : <span className="post-avatar-fallback" style={{ background: post.avatarColor || "#6c47ff" }}>
                {(post.author || "U").slice(0, 2).toUpperCase()}
              </span>
          }
        </div>
        <div className="post-meta-info">
          <span
            className="post-author-name clickable-name"
            onClick={() => post.user_id && navigate(`/profile/${post.user_id}`)}
          >
            {post.author || post.name}
            {isVerified && <VerifiedBadge />}
          </span>
          <span className="post-role">{post.role}</span>
          <span className="post-time">{post.time || new Date(post.created_at).toLocaleString()}</span>
        </div>

        <div className="post-header-right">
          {!isOwner && (
            <button
              className={`post-follow-btn${isFollowing ? " following" : ""}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {isFollowing ? "✓ Following" : "+ Follow"}
            </button>
          )}
          {isOwner && (
            <div className="post-menu-wrap">
              <button className="more-btn" onClick={() => setShowMenu(m => !m)}>•••</button>
              {showMenu && (
                <div className="post-menu-dropdown">
                  <button onClick={() => { setEditing(true); setShowMenu(false); }}>✏ Edit</button>
                  <button onClick={handleDelete} style={{ color: "#ef4444" }}>🗑 Delete</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="post-body">
        <h3 className="post-title">{post.title}</h3>
        {editing
          ? <>
              <textarea className="post-edit-textarea" value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} />
              <div className="post-edit-actions">
                <button className="post-edit-save" onClick={handleEdit}>Save</button>
                <button className="post-edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </>
          : <p className="post-content">{post.content}</p>
        }
      </div>

      <div className="post-stats-row">
        <span className="post-stat">{likesCount} likes</span>
        <span className="post-stat">{comments.length} comments</span>
      </div>

      <div className="post-divider" />

      <div className="post-actions">
        <button className={`action-btn like-btn${liked ? " liked" : ""}`} onClick={handleLike}>
          {liked ? "❤️" : "🤍"} Like
        </button>
        <button className="action-btn comment-btn" onClick={() => setShowComments(s => !s)}>
          💬 Comment
        </button>
        <button className="action-btn share-btn">↗ Share</button>
      </div>

      {showComments && (
        <div className="comments-section">
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} postId={post.id} navigate={navigate} />
          ))}
          <div className="comment-input-row">
            <input
              className="comment-input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleComment()}
            />
            <button className="comment-send-btn" onClick={handleComment}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
