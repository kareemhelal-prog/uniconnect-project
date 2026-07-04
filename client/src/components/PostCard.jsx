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

// Facebook-style reaction set. `key` is what the API stores; emoji + label +
// colour drive the UI. The neutral default is "like".
const REACTIONS = [
  { key: "like",  emoji: "👍", label: "Like",  color: "#2e81f4" },
  { key: "love",  emoji: "❤️", label: "Love",  color: "#f33e58" },
  { key: "haha",  emoji: "😆", label: "Haha",  color: "#f7b125" },
  { key: "wow",   emoji: "😮", label: "Wow",   color: "#f7b125" },
  { key: "sad",   emoji: "😢", label: "Sad",   color: "#f7b125" },
  { key: "angry", emoji: "😡", label: "Angry", color: "#e9710f" },
];
const REACT_MAP = Object.fromEntries(REACTIONS.map((r) => [r.key, r]));

// Clean line icons (no emoji) for the neutral Like / Comment / Share actions.
const ThumbIcon = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M7 10.5V21H4a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1h3Z" /><path d="M7 10.5l4.2-7a1.8 1.8 0 0 1 3.3 1.3L13.5 9H20a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 18.8 20H7" />
  </svg>
);
const CommentIcon = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.4-4.5A8.3 8.3 0 0 1 3.5 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
  </svg>
);
const ShareIcon = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" />
  </svg>
);

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
        onClick={() => comment.user?.id && navigate(`/profile/${comment.user.username || comment.user.id}`)}
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
            onClick={() => comment.user?.id && navigate(`/profile/${comment.user.username || comment.user.id}`)}
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
              dir="auto"
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
          <p className="comment-text" dir="auto">{comment.content}</p>
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
              dir="auto"
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

  const [myReaction, setMyReaction]     = useState(post.my_reaction || (post.liked ? "like" : null));
  const [likesCount, setLikesCount]     = useState(Number(post.likes || post.likes_count) || 0);
  const [reactionTypes, setReactionTypes] = useState(Array.isArray(post.reaction_types) ? post.reaction_types.filter(Boolean) : []);
  const [showReactions, setShowReactions] = useState(false);
  const pressTimer    = React.useRef(null);
  const hoverTimer    = React.useRef(null);
  const suppressClick = React.useRef(false);
  const isTouch       = React.useRef(false);
  const reactWrapRef  = React.useRef(null);
  const [showComments, setShowComments] = useState(!!defaultShowComments);
  const [commentText, setCommentText]   = useState("");
  const [comments, setComments]         = useState(post.comments || []);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showMenu, setShowMenu]         = useState(false);
  const [editing, setEditing]           = useState(false);
  const [editContent, setEditContent]   = useState(post.content || "");
  const [imgError, setImgError]         = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [shared, setShared]             = useState(false);

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
      if (Array.isArray(data.reaction_types)) setReactionTypes(data.reaction_types.filter(Boolean));
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

  // Apply / switch / remove a reaction. Tapping the same reaction removes it.
  const applyReaction = async (reactionKey) => {
    const prevReaction = myReaction;
    const prevCount = likesCount;
    const prevTypes = reactionTypes;

    const next = myReaction === reactionKey ? null : reactionKey;
    // Optimistic UI
    setMyReaction(next);
    setLikesCount(c => (!prevReaction && next) ? c + 1 : (prevReaction && !next) ? Math.max(0, c - 1) : c);
    setReactionTypes(t => (next && !t.includes(next)) ? [next, ...t] : t);
    setShowReactions(false);

    try {
      const res = await fetch(`${API_BASE}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ post_id: post.id, reaction: reactionKey }),
      });
      const data = await res.json();
      if (typeof data.likes === "number") setLikesCount(data.likes);
      if ("reaction" in data) setMyReaction(data.reaction || null);
      // Authoritative breakdown → corrects the cluster (incl. removals) exactly.
      if (Array.isArray(data.reaction_types)) setReactionTypes(data.reaction_types.filter(Boolean));
    } catch {
      setMyReaction(prevReaction); setLikesCount(prevCount); setReactionTypes(prevTypes);
    }
  };

  // Plain button click: react with "like", or remove whatever reaction you have.
  // Swallowed right after a long-press (that press opened the palette instead).
  const handleLikeClick = () => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    applyReaction(myReaction || "like");
  };

  const openPalette = () => setShowReactions(true);

  // ── Press (mouse or touch, via Pointer Events) — long-hold opens the palette ──
  const onPressStart = (e) => {
    if (e.pointerType === "touch") isTouch.current = true;
    suppressClick.current = false;
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => { suppressClick.current = true; openPalette(); }, 380);
  };
  const onPressEnd = () => clearTimeout(pressTimer.current);

  // ── Desktop hover — open on dwell, close on leave (disabled on touch so an
  //    emulated mouseenter after a tap can't pop the palette open) ──
  const onLikeEnter = () => {
    if (isTouch.current) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(openPalette, 300);
  };
  const onLikeLeave = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setShowReactions(false), 220);
  };

  useEffect(() => () => { clearTimeout(hoverTimer.current); clearTimeout(pressTimer.current); }, []);

  // Dismiss the palette on an interaction OUTSIDE the reaction area (taps inside
  // — i.e. on a reaction — must NOT be swallowed) or on scroll.
  useEffect(() => {
    if (!showReactions) return;
    const onDocDown = (e) => { if (reactWrapRef.current && !reactWrapRef.current.contains(e.target)) setShowReactions(false); };
    const onScroll = () => setShowReactions(false);
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [showReactions]);

  const handleComment = async () => {
    if (!commentText.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      await fetch(`${API_BASE}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ post_id: post.id, content: commentText.trim() }),
      });
      // Don't add to list here — the socket 'new_comment' event handles it for
      // everyone in the room (including the sender), preventing double-render.
      setCommentText("");
    } catch {}
    finally { setSendingComment(false); }
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

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    const shareData = {
      title: post.title || "UniConnect post",
      text: post.content ? String(post.content).slice(0, 120) : "Check out this post on UniConnect",
      url,
    };
    // Native share sheet (mobile / supported browsers); fall back to copying
    // the link to the clipboard.
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      throw new Error("no-native-share");
    } catch (err) {
      // User cancelling the native sheet throws too — don't show "copied" then.
      if (err && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Very old browsers: last-resort prompt so the user can copy manually.
        window.prompt("Copy this link:", url);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
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
          onClick={() => post.user_id && navigate(`/profile/${post.username || post.user_id}`)}
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
            onClick={() => post.user_id && navigate(`/profile/${post.username || post.user_id}`)}
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
        <h3 className="post-title" dir="auto">{post.title}</h3>
        {editing
          ? <>
              <textarea className="post-edit-textarea" dir="auto" value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} />
              <div className="post-edit-actions">
                <button className="post-edit-save" onClick={handleEdit}>Save</button>
                <button className="post-edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </>
          : <p className="post-content" dir="auto">{post.content}</p>
        }
      </div>

      <div className="post-stats-row">
        <span className="post-stat">
          {likesCount > 0 && (
            <span className="reaction-cluster">
              {(reactionTypes.length ? reactionTypes : ["like"]).slice(0, 3).map((k, i) => (
                <span key={k} className="reaction-chip" style={{ zIndex: 3 - i }}>{(REACT_MAP[k] || REACT_MAP.like).emoji}</span>
              ))}
            </span>
          )}
          <span className="reaction-count">{likesCount > 0 ? likesCount : "Be the first to react"}</span>
        </span>
        <span className="post-stat">
          {comments.length > 0 ? comments.length : (post.comments_count || 0)} comments
        </span>
      </div>

      <div className="post-divider" />

      <div className="post-actions">
        {(() => {
          const cur = myReaction ? REACT_MAP[myReaction] : null;
          return (
            <div className="reaction-wrap" ref={reactWrapRef} onMouseEnter={onLikeEnter} onMouseLeave={onLikeLeave}>
              {showReactions && (
                <div className="reaction-palette" role="menu">
                  {REACTIONS.map((r, i) => (
                    <button key={r.key} className="reaction-opt" style={{ animationDelay: `${i * 30}ms` }}
                      title={r.label} onClick={() => applyReaction(r.key)}>
                      <span className="reaction-emoji">{r.emoji}</span>
                      <span className="reaction-tip">{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
              <button
                className={`action-btn like-btn${cur ? " reacted" : ""}`}
                style={cur ? { color: cur.color } : undefined}
                onClick={handleLikeClick}
                onPointerDown={onPressStart}
                onPointerUp={onPressEnd}
                onPointerLeave={onPressEnd}
                onPointerCancel={onPressEnd}
              >
                {cur ? <span className="reaction-emoji">{cur.emoji}</span> : <ThumbIcon />}
                <span className="btn-label">{cur ? cur.label : "Like"}</span>
              </button>
            </div>
          );
        })()}
        <button className="action-btn comment-btn" onClick={() => setShowComments(s => !s)}>
          <CommentIcon /> <span className="btn-label">Comment</span>
        </button>
        <button className={`action-btn share-btn${shared ? " shared" : ""}`} onClick={handleShare}>
          <ShareIcon /> <span className="btn-label">{shared ? "Copied!" : "Share"}</span>
        </button>
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
              dir="auto"
              placeholder="Write a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleComment()}
            />
            <button className="comment-send-btn" onClick={handleComment} disabled={sendingComment}>
              {sendingComment ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
