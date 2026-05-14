import React, { useState } from "react";
import "./PostCard.css";

const PostCard = ({ post }) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="post-card">
      <div className="post-header">
        <div
          className="post-avatar"
          style={{ background: post.avatarColor }}
        >
          {post.avatar}
        </div>
        <div className="post-meta">
          <h4>{post.author}</h4>
          <span>{post.time}</span>
        </div>
        <button className="more-btn">•••</button>
      </div>

      <div className="post-body">
        <h3>{post.title}</h3>
        <p>{post.content}</p>
      </div>

      <div className="post-divider"></div>

      <div className="post-actions">
        <button
          className={`action-btn like-btn ${liked ? "liked" : ""}`}
          onClick={() => setLiked(!liked)}
        >
          {liked ? "❤️" : "🤍"} Like
        </button>
        <button className="action-btn comment-btn">💬 Comment</button>
        <button className="action-btn share-btn">↗ Share</button>
      </div>
    </div>
  );
};

export default PostCard;
