import React, { useState } from 'react';
import '../styles/GroupDetails.css';

const GroupDetails = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('feed');
  const [isJoined, setIsJoined] = useState(false);
  const [newPost, setNewPost] = useState('');

  // Group Info with images
  const groupInfo = {
    name: 'Data Structures — CS301',
    members: 128,
    instructors: 2,
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=300&fit=crop'
  };

  // About Info
  const aboutInfo = {
    college: 'College of Engineering',
    school: 'School of Computing',
    department: 'Computer Science Department',
    academicYear: '2023 - 2024',
    description: 'A place for CS301 students to discuss Data Structures concepts, share resources, ask questions, and collaborate on problem solving.'
  };

  // Upcoming Events with full details
  const upcomingEvents = [
    { 
      name: 'Quiz 2', 
      date: 'May 18, 2026', 
      time: '10:00 AM', 
      location: 'Room 201, Engineering Hall' 
    },
    { 
      name: 'Assignment 2 Deadline', 
      date: 'May 25, 2026', 
      time: '11:59 PM', 
      location: 'Online Submission' 
    },
    { 
      name: 'Final Exam Registration', 
      date: 'June 1, 2026', 
      time: 'All day', 
      location: 'Student Portal' 
    }
  ];

  // Posts data
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'Ananya Sharma',
      timeAgo: '2 hours ago',
      content: 'Just uploaded my notes on Time Complexity. Hope this helps!',
      likes: 24,
      comments: 6,
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg'
    },
    {
      id: 2,
      author: 'Rohan Mehta',
      timeAgo: 'Yesterday at 9:30 PM',
      content: 'Does anyone have a good explanation of AVL tree rotations? Struggling with the LL and RR cases.',
      likes: 18,
      comments: 12,
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      id: 3,
      author: 'Ishita Verma',
      timeAgo: 'May 8 at 6:15 PM',
      content: 'Reminder: Quiz 2 will be held this Saturday. Covers chapters 5 to 7.',
      likes: 31,
      comments: 4,
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
    }
  ]);

  // Top Contributors with real avatars
  const topContributors = [
    { name: 'Ananya Sharma', points: 48, avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { name: 'Rohan Mehta', points: 42, avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { name: 'Ishita Verma', points: 36, avatar: 'https://randomuser.me/api/portraits/women/2.jpg' }
  ];

  const handleCreatePost = () => {
    if (newPost.trim()) {
      const newPostObj = {
        id: Date.now(),
        author: 'You',
        timeAgo: 'Just now',
        content: newPost,
        likes: 0,
        comments: 0,
        avatar: 'https://randomuser.me/api/portraits/lego/1.jpg'
      };
      setPosts([newPostObj, ...posts]);
      setNewPost('');
    }
  };

  const handleJoinGroup = () => {
    setIsJoined(!isJoined);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleLike = (postId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, likes: post.likes + 1 };
      }
      return post;
    }));
  };

  return (
    <div className="group-details-container">
      {/* Main Content */}
      <div className="group-main-content">
        {/* Group Header with Cover Image */}
        <div className="group-header">
          <div className="group-cover">
            <img src={groupInfo.coverImage} alt="Group Cover" className="cover-image" />
          </div>
          <div className="group-profile-section">
            <div className="group-profile-image">
              <div className="profile-icon">
                <span className="code-icon">&lt;/&gt;</span>
              </div>
            </div>
            <div className="group-info-text">
              <h1 className="group-name">{groupInfo.name}</h1>
              <div className="group-stats">
                <span className="stat">👥 {groupInfo.members} members</span>
                <span className="stat">👨‍🏫 Instructors: +{groupInfo.instructors}</span>
              </div>
              <div className="group-actions">
                <button 
                  className={`join-btn ${isJoined ? 'joined' : ''}`} 
                  onClick={handleJoinGroup}
                >
                  {isJoined ? '✓ Joined' : '+ Join Group'}
                </button>
                <button className="share-btn" onClick={handleShare}>
                  🔗 Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="group-tabs">
          <button 
            className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            Feed
          </button>
          <button 
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files
          </button>
          <button 
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
          <button 
            className={`tab-btn ${activeTab === 'instructors' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructors')}
          >
            Instructors
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'feed' && (
            <>
              {/* Create Post Box */}
              <div className="create-post-box">
                <div className="post-avatar">U</div>
                <div className="post-input-area">
                  <textarea
                    placeholder="What's on your mind?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows="3"
                  />
                  <button onClick={handleCreatePost} className="create-post-btn">
                    Create Post
                  </button>
                </div>
              </div>

              {/* Posts Feed */}
              <div className="posts-feed">
                {posts.map(post => (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <img src={post.avatar} alt={post.author} className="post-avatar-img" />
                      <div className="post-info">
                        <h4 className="post-author">{post.author}</h4>
                        <span className="post-time">{post.timeAgo}</span>
                      </div>
                    </div>
                    <p className="post-content">{post.content}</p>
                    <div className="post-actions">
                      <button 
                        className="action-btn like-btn" 
                        onClick={() => handleLike(post.id)}
                      >
                        👍 Like ({post.likes})
                      </button>
                      <button className="action-btn comment-btn">
                        💬 Comment ({post.comments})
                      </button>
                      <button className="action-btn share-btn">
                        🔗 Share
                      </button>
                    </div>
                  </div>
                ))}
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
        {/* About Section */}
        <div className="about-section">
          <h3>📖 About</h3>
          <p className="about-description">{aboutInfo.description}</p>
          <div className="about-details">
            <div className="about-item">
              <span className="about-label">College:</span>
              <span className="about-value">{aboutInfo.college}</span>
            </div>
            <div className="about-item">
              <span className="about-label">School:</span>
              <span className="about-value">{aboutInfo.school}</span>
            </div>
            <div className="about-item">
              <span className="about-label">Department:</span>
              <span className="about-value">{aboutInfo.department}</span>
            </div>
            <div className="about-item">
              <span className="about-label">Academic Year:</span>
              <span className="about-value">{aboutInfo.academicYear}</span>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="events-section">
          <h3>📅 Upcoming Events</h3>
          <div className="events-table">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="event-row">
                <div className="event-info">
                  <span className="event-name">{event.name}</span>
                  <div className="event-details">
                    <span className="event-date">📅 {event.date}</span>
                    <span className="event-time">⏰ {event.time}</span>
                    <span className="event-location">📍 {event.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Contributors */}
        <div className="top-contributors">
          <h3>🏆 Top Contributors</h3>
          <div className="contributors-list">
            {topContributors.map((contributor, index) => (
              <div key={index} className="contributor-item">
                <img src={contributor.avatar} alt={contributor.name} className="contributor-avatar" />
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