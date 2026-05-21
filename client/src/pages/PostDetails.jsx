import React, { useState } from 'react';
import '../styles/PostDetails.css'; // استيراد ملف التنسيقات والأنيميشنز المتفجر بالألوان

const PostDetails = () => {
  // إدارة حالات الإعجاب والتعليقات والمدخلات
  const [likes, setLikes] = useState(48);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    {
      id: 1,
      author: "Ananya Sharma",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
      text: "This is super helpful, Rohan! The diagrams made the concept so much clearer. Thanks for sharing!",
      time: "May 8 at 9:45 PM",
      likes: 6,
      isReply: false
    },
    {
      id: 2,
      author: "Rohan Mehta",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      text: "Glad it helped! Let me know if you have any questions.",
      time: "May 8 at 9:48 PM",
      likes: 2,
      isReply: true
    }
  ]);

  const handleLike = () => {
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiked(!isLiked);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentObj = {
      id: Date.now(),
      author: "You (Student)",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
      text: newComment,
      time: "Just now",
      likes: 0,
      isReply: false
    };
    setComments([...comments, commentObj]);
    setNewComment("");
  };

  return (
    <div className="uniconnect-page-wrapper">
      <nav className="breadcrumb-navigation">
        <span>Feed</span> &gt; <span>Data Structures — CS301</span> &gt; <span className="active">Post</span>
      </nav>

      <div className="layout-container">
        <main className="main-content-area">
          {/* كارت المنشور الرئيسي */}
          <div className="post-card-node">
            <header className="post-card-header">
              <div className="author-metadata">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" alt="Rohan" className="profile-avatar" />
                <div>
                  <div className="name-badge-container">
                    <h3>Rohan Mehta</h3>
                    <span className="student-year-badge">3rd Year</span>
                  </div>
                  <p className="post-sub-context">Data Structures — CS301 • May 8 at 9:30 PM</p>
                </div>
              </div>
              <button className="options-trigger-btn">•••</button>
            </header>

            <article className="post-card-body">
              <p className="main-paragraph">
                Hey everyone! I've been working on implementing AVL trees in C++ and wanted to share my 
                understanding of the rotations (LL, RR, LR, RL) with some diagrams. These really helped things 
                click for me. Hope this helps someone else too!
              </p>

              {/* لوحة أشجار الـ AVL التفاعلية النيون */}
              <div className="avl-diagram-viewport">
                <div className="viewport-title">AVL Tree Rotations</div>
                <div className="diagrams-flex-grid">
                  <div className="avl-box-element">
                    <h4>LL Rotation</h4>
                    <div className="avl-tree-render">
                      <div className="node-circle green-node">30</div>
                      <div className="node-circle green-node">20</div>
                      <span className="flow-arrow">→</span>
                      <div className="node-circle green-node">20</div>
                      <div className="nodes-twin-row">
                        <div className="node-circle green-node">10</div>
                        <div className="node-circle green-node">30</div>
                      </div>
                    </div>
                  </div>

                  <div className="avl-box-element">
                    <h4>RR Rotation</h4>
                    <div className="avl-tree-render">
                      <div className="node-circle blue-node">10</div>
                      <div className="node-circle blue-node">20</div>
                      <span className="flow-arrow">→</span>
                      <div className="node-circle blue-node">20</div>
                      <div className="nodes-twin-row">
                        <div className="node-circle blue-node">10</div>
                        <div className="node-circle blue-node">30</div>
                      </div>
                    </div>
                  </div>

                  <div className="avl-box-element">
                    <h4>LR Rotation</h4>
                    <div className="avl-tree-render">
                      <div className="node-circle purple-node">30</div>
                      <div className="nodes-twin-row">
                        <div className="node-circle purple-node">10</div>
                        <div className="node-circle purple-node">20</div>
                      </div>
                      <span className="flow-arrow">→</span>
                      <div className="node-circle purple-node">20</div>
                      <div className="nodes-twin-row">
                        <div className="node-circle purple-node">10</div>
                        <div className="node-circle purple-node">30</div>
                      </div>
                    </div>
                  </div>

                  <div className="avl-box-element">
                    <h4>RL Rotation</h4>
                    <div className="avl-tree-render">
                      <div className="node-circle orange-node">10</div>
                      <div className="nodes-twin-row">
                        <div className="node-circle orange-node">20</div>
                        <div className="node-circle orange-node">30</div>
                      </div>
                      <span className="flow-arrow">→</span>
                      <div className="node-circle orange-node">20</div>
                      <div className="nodes-twin-row">
                        <div className="node-circle orange-node">10</div>
                        <div className="node-circle orange-node">30</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* بنر تحميل ملف الـ PDF */}
              <div className="pdf-attachment-banner">
                <div className="pdf-left-details">
                  <div className="pdf-thumbnail-icon">📄</div>
                  <div>
                    <span className="file-title-text">AVL_Rotations_Notes.pdf</span>
                    <span className="file-size-text">1.24 MB</span>
                  </div>
                </div>
                <button className="pdf-action-download-btn">Download</button>
              </div>
            </article>

            {/* أزرار الإجراءات السفلية */}
            <footer className="post-card-actions-bar">
              <button className={`interactive-action-btn ${isLiked ? 'has-liked' : ''}`} onClick={handleLike}>
                👍 {likes}
              </button>
              <button className="interactive-action-btn">💬 {comments.length}</button>
              <button className="interactive-action-btn">🔗 7</button>
            </footer>
          </div>

          {/* صندوق التعليقات */}
          <div className="comments-module-block">
            <h3>Comments ({comments.length})</h3>
            <div className="comments-scroller-list">
              {comments.map(comment => (
                <div key={comment.id} className={`comment-row-node ${comment.isReply ? 'is-nested-reply' : ''}`}>
                  <img src={comment.avatar} className="commenter-avatar" alt={comment.author} />
                  <div className="comment-bubble-wrapper">
                    <div className="comment-bubble-header">
                      <span className="commenter-username">{comment.author}</span>
                      <span className="comment-timestamp-label">{comment.time}</span>
                    </div>
                    <p className="comment-bubble-body">{comment.text}</p>
                    <div className="comment-bubble-footer-actions">
                      <button className="inline-action-trigger">👍 {comment.likes}</button>
                      <button className="inline-action-trigger">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* حقل إنشاء تعليق جديد */}
            <div className="input-comment-composer">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60" className="commenter-avatar" alt="User" />
              <input 
                type="text" 
                placeholder="Write a comment..." 
                className="composer-text-input" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button className="composer-submit-btn" onClick={handleAddComment}>Post</button>
            </div>
          </div>
        </main>

        {/* الشريط الجانبي (Sidebar) */}
        <aside className="sidebar-content-area">
          <div className="sidebar-widget-card">
            <h4>Post Author</h4>
            <div className="author-widget-profile">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" className="avatar-large-frame" alt="Author" />
              <div>
                <h5>Rohan Mehta</h5>
                <p>Computer Science</p>
                <span className="student-year-badge">3rd Year</span>
              </div>
            </div>
            <button className="widget-action-full-btn outline-variant">View Profile</button>
          </div>

          <div className="sidebar-widget-card">
            <h4>Post Stats</h4>
            <div className="metrics-dashboard-grid">
              <div className="metric-cell">
                <span className="metric-emoji">👍</span>
                <b className="metric-value">{likes}</b>
                <small className="metric-title">Likes</small>
              </div>
              <div className="metric-cell">
                <span className="metric-emoji">💬</span>
                <b className="metric-value">{comments.length}</b>
                <small className="metric-title">Comments</small>
              </div>
              <div className="metric-cell">
                <span className="metric-emoji">🔗</span>
                <b className="metric-value">7</b>
                <small className="metric-title">Shares</small>
              </div>
            </div>
          </div>

          <div className="sidebar-widget-card">
            <h4>Related Posts</h4>
            <div className="related-nodes-stack">
              <div className="related-item-row">
                <div className="related-icon-box dark-navy-bg">📈</div>
                <div className="related-text-meta">
                  <h6>Understanding Time Complexity (Big-O)</h6>
                  <p>May 5 at 7:10 PM</p>
                </div>
              </div>
              <div className="related-item-row">
                <div className="related-icon-box soft-slate-bg">📚</div>
                <div className="related-text-meta">
                  <h6>Stack vs Queue — Key Differences</h6>
                  <p>Apr 28 at 6:30 PM</p>
                </div>
              </div>
            </div>
            <button className="widget-action-full-btn ghost-variant" style={{ marginTop: '14px' }}>View All Posts &gt;</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PostDetails;