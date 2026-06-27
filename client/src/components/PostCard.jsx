import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket, joinPost, leavePost } from "../socket";
import "./PostCard.css";

const API_BASE = "/api";
const token = () => localStorage.getItem("token");
const currentUserId = () => {
  const t = token();
  if (!t) return null;
  try { return JSON.parse(atob(t.split(".")[1])).id; } catch { return null; }
};
const currentUserRole = () => {
  const t = token();
  if (!t) return null;
  try { return JSON.parse(atob(t.split(".")[1])).role; } catch { return null; }
};

const resolveImg = (pic) => {
  if (!pic) return "";
  if (pic.startsWith("data:") || pic.startsWith("http")) return pic;
  return `/${pic.replace(/^\//, "")}`;
};

function VerifiedBadge() {
  return <span className="verified-badge" title="Verified account">✓</span>;
}

function CommentItem({ comment, postId, onReply, onDelete, onEdit, navigate, depth = 0, highlightCommentId }) {
  const myId   = currentUserId();
  const myRole = currentUserRole();
  const isHighlighted = highlightCommentId != null && Number(comment.id) === Number(highlightCommentId);
  const highlightRef = React.useRef(null);

  useEffect(() => {
    if (isHighlighted && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);
  const isCommentOwner = myId != null && comment.user?.id != null && Number(comment.user.id) === Number(myId);
  const canDelete = isCommentOwner || myRole === "doctor" || myRole === "admin";

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText,      setReplyText]      = useState("");
  const [sending,        setSending]        = useState(false);
  const [showMenu,       setShowMenu]       = useState(false);
  const [editing,        setEditing]        = useState(false);
  const [editText,       setEditText]       = useState(comment.content);

  const pic        = resolveImg(comment.user?.profile_picture || "");
  const isVerified = comment.user?.role === "doctor" || comment.user?.role === "admin";

  const submitReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ post_id: postId, content: replyText.trim(), parent_id: comment.id }),
      });
      const data = await res.json();
      onReply(comment.id, data);
      setReplyText("");
      setShowReplyInput(false);
    } catch {} finally { setSending(false); }
  };

  const handleDeleteComment = async () => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await fetch(`${API_BASE}/comments/${comment.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      onDelete(comment.id);
    } catch {}
    setShowMenu(false);
  };

  const handleEditSave = async () => {
    if (!editText.trim()) return;
    try {
      await fetch(`${API_BASE}/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ content: editText.trim() }),
      });
      onEdit(comment.id, editText.trim());
      setEditing(false);
    } catch {}
  };

  return (
    <div
      ref={highlightRef}
      id={`comment-${comment.id}`}
      className={`comment-item${depth > 0 ? " comment-reply" : ""}${isHighlighted ? " comment-highlight" : ""}`}
    >
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
        <div className="comment-bubble-header">
          <span
            className="comment-author clickable-name"
            onClick={() => comment.user?.id && navigate(`/profile/${comment.user.id}`)}
          >
            {comment.user?.name || "Unknown"}
            {isVerified && <VerifiedBadge />}
          </span>
          {canDelete && (
            <div className="comment-menu-wrap">
              <button className="comment-menu-btn" onClick={() => setShowMenu(m => !m)}>⋯</button>
              {showMenu && (
                <div className="comment-menu-dropdown">
                  {isCommentOwner && (
                    <button onClick={() => { setEditing(true); setShowMenu(false); }}>✏ Edit</button>
                  )}
                  <button onClick={handleDeleteComment} className="comment-delete-btn">🗑 Delete</button>
                </div>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <>
            <input
              className="comment-edit-input"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleEditSave(); if (e.key === "Escape") setEditing(false); }}
              autoFocus
            />
            <div className="comment-edit-actions">
              <button className="comment-edit-save" onClick={handleEditSave}>Save</button>
              <button className="comment-edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <p className="comment-text">{comment.content}</p>
        )}

        <div className="comment-footer">
          <span className="comment-time">{new Date(comment.created_at).toLocaleString()}</span>
          {depth === 0 && (
            <button className="reply-toggle-btn" onClick={() => setShowReplyInput(s => !s)}>Reply</button>
          )}
        </div>

        {showReplyInput && (
          <div className="reply-input-row">
            <input
              className="comment-input reply-input"
              placeholder={`Reply to ${comment.user?.name || "comment"}...`}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitReply()}
              autoFocus
            />
            <button className="comment-send-btn" onClick={submitReply} disabled={sending}>
              {sending ? "..." : "Send"}
            </button>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="replies-list">
            {comment.replies.map(r => (
              <CommentItem
                key={r.id}
                comment={r}
                postId={postId}
                onReply={onReply}
                onDelete={onDelete}
                onEdit={onEdit}
                navigate={navigate}
                depth={depth + 1}
                highlightCommentId={highlightCommentId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const PostCard = ({ post, onUpdate, defaultShowComments = false, highlightCommentId = null }) => {
  const navigate = useNavigate();
  const myId = currentUserId();
  const isOwner = post.user_id != null && myId != null && Number(post.user_id) === Number(myId);
  const isVerified = post.role === "doctor" || post.role === "admin";
  const postPic = resolveImg(post.profile_picture || "");

  const [liked, setLiked]               = useState(!!post.liked);
  const [likesCount, setLikesCount]     = useState(Number(post.likes || post.likes_count) || 0);
  const [showComments, setShowComments] = useState(!!defaultShowComments);
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

  // ── Real-time: live likes & comments for this post ──
  useEffect(() => {
    if (post.id == null) return;
    const socket = getSocket();
    joinPost(post.id);

    const onReaction = (data) => {
      if (Number(data.post_id) !== Number(post.id)) return;
      if (typeof data.likes === "number") setLikesCount(data.likes);
    };

    const onNewComment = (c) => {
      if (Number(c.post_id) !== Number(post.id)) return;
      setComments(prev => {
        // dedupe — the actor already appended it locally
        const exists = (list) =>
          list.some(x => x.id === c.id || (x.replies && exists(x.replies)));
        if (exists(prev)) return prev;
        if (c.parent_id) {
          const addReply = (list) =>
            list.map(p =>
              p.id === c.parent_id
                ? { ...p, replies: [...(p.replies || []), { ...c, replies: [] }] }
                : { ...p, replies: p.replies ? addReply(p.replies) : [] }
            );
          return addReply(prev);
        }
        return [...prev, { ...c, replies: [] }];
      });
    };

    socket.on("post_reaction", onReaction);
    socket.on("new_comment", onNewComment);
    return () => {
      socket.off("post_reaction", onReaction);
      socket.off("new_comment", onNewComment);
      leavePost(post.id);
    };
  }, [post.id]);

  const handleLike = async () => {
    // Optimistic update first
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount(c => wasLiked ? c - 1 : c + 1);
    try {
      const res  = await fetch(`${API_BASE}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ post_id: post.id }),
      });
      const data = await res.json();
      // Sync to real DB count
      if (typeof data.likes === "number") setLikesCount(data.likes);
      if (typeof data.liked === "boolean") setLiked(data.liked);
    } catch {
      // Revert on error
      setLiked(wasLiked);
      setLikesCount(c => wasLiked ? c + 1 : c - 1);
    }
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
      setComments(prev => [...prev, { ...data, replies: data.replies || [] }]);
      setCommentText("");
    } catch {}
  };

  const handleReply = (parentId, newReply) => {
    setComments(prev =>
      prev.map(c =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies || []), { ...newReply, replies: [] }] }
          : c
      )
    );
  };

  const handleCommentDelete = (commentId) => {
    const removeFromTree = (list) =>
      list.filter(c => c.id !== commentId)
          .map(c => ({ ...c, replies: c.replies ? removeFromTree(c.replies) : [] }));
    setComments(prev => removeFromTree(prev));
  };

  const handleCommentEdit = (commentId, newContent) => {
    const updateInTree = (list) =>
      list.map(c => ({
        ...c,
        content: c.id === commentId ? newContent : c.content,
        replies: c.replies ? updateInTree(c.replies) : [],
      }));
    setComments(prev => updateInTree(prev));
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
                {(post.author || post.name || "U").slice(0, 2).toUpperCase()}
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
        <span className="post-stat">
          {comments.length > 0 ? comments.length : (post.comments_count || 0)} comments
        </span>
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
            <CommentItem
              key={c.id}
              comment={c}
              postId={post.id}
              onReply={handleReply}
              onDelete={handleCommentDelete}
              onEdit={handleCommentEdit}
              navigate={navigate}
              depth={0}
              highlightCommentId={highlightCommentId}
            />
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
