import React, { useState, useEffect } from 'react';
import '../styles/GroupDetails.css';

const GroupDetails = () => {
  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Active Tab State
  const [activeTab, setActiveTab] = useState('feed');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  // New Post States
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Comments States
  const [commentInputs, setCommentInputs] = useState({});
  const [showComments, setShowComments] = useState({});

  // Liked posts state
  const [likedPosts, setLikedPosts] = useState({});

  // Posts Data
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'Ananya Sharma',
      authorId: 'current-user', // ده عشان نعرف مين اللي يقدر يعدل/يحذف
      timeAgo: '2 hours ago',
      content: 'Just uploaded my notes on Time Complexity. Hope this helps!',
      image: null,
      likes: 24,
      comments: [
        { id: 1, author: 'Priya Singh', content: 'Thank you so much!', likes: 5, timeAgo: '1 hour ago' },
        { id: 2, author: 'Rahul Verma', content: 'Very helpful 👍', likes: 3, timeAgo: '30 mins ago' }
      ],
      avatar: 'A'
    },
    {
      id: 2,
      author: 'Rohan Mehta',
      authorId: 'other-user',
      timeAgo: 'Yesterday at 9:30 PM',
      content: 'Does anyone have a good explanation of AVL tree rotations? Struggling with the LL and RR cases.',
      image: null,
      likes: 18,
      comments: [
        { id: 1, author: 'Prof. Sharma', content: 'Check the pinned resources!', likes: 8, timeAgo: 'Yesterday' }
      ],
      avatar: 'R'
    },
    {
      id: 3,
      author: 'Ishita Verma',
      authorId: 'other-user',
      timeAgo: 'May 8 at 6:15 PM',
      content: 'Reminder: Quiz 2 will be held this Saturday. Covers chapters 5 to 7.',
      image: 'https://via.placeholder.com/600x300?text=Quiz+Reminder',
      likes: 31,
      comments: [],
      avatar: 'I'
    }
  ]);

  // Editing state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Group Info
  const groupInfo = {
    name: 'Data Structures — CS301',
    members: 128,
    instructors: 2
  };

  // Top Contributors
  const topContributors = [
    { name: 'Ananya Sharma', points: 48 },
    { name: 'Rohan Mehta', points: 42 },
    { name: 'Ishita Verma', points: 36 }
  ];

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Handle Like
  const handleLike = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: likedPosts[postId] ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  // Handle Comment Like
  const handleCommentLike = (postId, commentId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
                liked: !comment.liked
              };
            }
            return comment;
          })
        };
      }
      return post;
    }));
  };

  // Handle Add Comment
  const handleAddComment = (postId) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    const newComment = {
      id: Date.now(),
      author: 'You',
      content: commentText,
      likes: 0,
      timeAgo: 'Just now',
      liked: false
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [newComment, ...post.comments]
        };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  // Handle Create Post
  const handleCreatePost = () => {
    if (!newPostContent.trim() && !newPostImage) return;

    const newPost = {
      id: Date.now(),
      author: 'You',
      authorId: 'current-user',
      timeAgo: 'Just now',
      content: newPostContent,
      image: imagePreview,
      likes: 0,
      comments: [],
      avatar: 'Y'
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostImage(null);
    setImagePreview(null);
  };

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setNewPostImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Delete Post
  const handleDeletePost = (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts(prev => prev.filter(post => post.id !== postId));
    }
  };

  // Handle Edit Post
  const handleEditPost = (post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const handleSaveEdit = (postId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, content: editContent };
      }
      return post;
    }));
    setEditingPostId(null);
    setEditContent('');
  };

  // Filter and Sort Posts
  const getFilteredAndSortedPosts = () => {
    let filtered = posts.filter(post =>
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (sortBy) {
      case 'mostLiked':
        return [...filtered].sort((a, b) => b.likes - a.likes);
      case 'mostCommented':
        return [...filtered].sort((a, b) => b.comments.length - a.comments.length);
      default:
        return filtered;
    }
  };

  const filteredPosts = getFilteredAndSortedPosts();

  return (
    <div className={`group-details-container ${darkMode ? 'dark' : ''}`}>
      {/* Dark Mode Toggle */}
      <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Main Content */}
      <div className="group-main-content">
        {/* Group Header */}
        <div className="group-header">
          <h1 className="group-name">{groupInfo.name}</h1>
          <div className="group-stats">
            <span className="stat">👥 {groupInfo.members} members</span>
            <span className="stat">👨‍🏫 Instructors: +{groupInfo.instructors}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="group-tabs">
          {['feed', 'files', 'members', 'instructors'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'feed' && (
            <>
              {/* Search and Filter Bar */}
              <div className="search-filter-bar">
                <div className="search-wrapper">
                  <input
                    type="text"
                    placeholder="🔍 Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="latest">Latest</option>
                  <option value="mostLiked">Most Liked</option>
                  <option value="mostCommented">Most Commented</option>
                </select>
              </div>

              {/* Create Post Box */}
              <div className="create-post-box">
                <div className="post-avatar">Y</div>
                <div className="post-input-area">
                  <textarea
                    placeholder="What's on your mind?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows="3"
                  />
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button onClick={() => {
                        setImagePreview(null);
                        setNewPostImage(null);
                      }}>✖</button>
                    </div>
                  )}
                  
                  <div className="post-actions-bar">
                    <label className="upload-image-btn">
                      📷 Upload Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                    </label>
                    <button onClick={handleCreatePost} className="create-post-btn">
                      Create Post
                    </button>
                  </div>
                </div>
              </div>

              {/* Posts Feed */}
              <div className="posts-feed">
                {filteredPosts.length === 0 ? (
                  <div className="empty-state">
                    📭 No posts found
                  </div>
                ) : (
                  filteredPosts.map(post => (
                    <div key={post.id} className="post-card">
                      <div className="post-header">
                        <div className="post-avatar-circle">{post.avatar}</div>
                        <div className="post-info">
                          <h4 className="post-author">{post.author}</h4>
                          <span className="post-time">{post.timeAgo}</span>
                        </div>
                        {post.authorId === 'current-user' && (
                          <div className="post-actions-menu">
                            <button onClick={() => handleEditPost(post)} className="menu-btn">✏️</button>
                            <button onClick={() => handleDeletePost(post.id)} className="menu-btn delete">🗑️</button>
                          </div>
                        )}
                      </div>

                      {editingPostId === post.id ? (
                        <div className="edit-post-area">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows="3"
                          />
                          <div className="edit-actions">
                            <button onClick={() => handleSaveEdit(post.id)}>Save</button>
                            <button onClick={() => setEditingPostId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="post-content">{post.content}</p>
                          {post.image && (
                            <div className="post-image">
                              <img src={post.image} alt="Post content" />
                            </div>
                          )}
                        </>
                      )}

                      <div className="post-actions">
                        <button
                          className={`action-btn like-btn ${likedPosts[post.id] ? 'liked' : ''}`}
                          onClick={() => handleLike(post.id)}
                        >
                          {likedPosts[post.id] ? '❤️' : '👍'} Like ({post.likes})
                        </button>
                        <button
                          className="action-btn comment-btn"
                          onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                        >
                          💬 Comment ({post.comments.length})
                        </button>
                        <button className="action-btn share-btn">
                          🔗 Share
                        </button>
                      </div>

                      {/* Comments Section */}
                      {showComments[post.id] && (
                        <div className="comments-section">
                          <div className="add-comment">
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            />
                            <button onClick={() => handleAddComment(post.id)}>Post</button>
                          </div>

                          <div className="comments-list">
                            {post.comments.map(comment => (
                              <div key={comment.id} className="comment-item">
                                <div className="comment-header">
                                  <strong>{comment.author}</strong>
                                  <span className="comment-time">{comment.timeAgo}</span>
                                </div>
                                <p className="comment-content">{comment.content}</p>
                                <button
                                  className={`comment-like-btn ${comment.liked ? 'liked' : ''}`}
                                  onClick={() => handleCommentLike(post.id, comment.id)}
                                >
                                  ❤️ {comment.likes}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab !== 'feed' && (
            <div className="coming-soon">
              <p>📌 {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} section coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="group-sidebar">
        <div className="top-contributors">
          <h3>🏆 Top Contributors</h3>
          <div className="contributors-list">
            {topContributors.map((contributor, index) => (
              <div key={index} className="contributor-item">
                <div className="contributor-rank">{index + 1}</div>
                <div className="contributor-info">
                  <span className="contributor-name">{contributor.name}</span>
                  <span className="contributor-points">{contributor.points} points</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;