import React, { useState } from "react";
import "../styles/Relations.css";

const data = {
  followers: [],
  following: [],
  friends: [],
};

const tabs = [
  { key: "followers", label: "Followers" },
  { key: "following", label: "Following" },
  { key: "friends", label: "Friends" },
];

const actionLabel = {
  followers: "Remove",
  following: "Unfollow",
  friends: "Unfriend",
};

const Users = () => {
  const [activeTab, setActiveTab] = useState("followers");
  const [selectedUser, setSelectedUser] = useState(null);
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState(false);

  const list = data[activeTab].filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="users-container">
      <h1 className="admin-title">Relations</h1>

      <div className="tabs-row">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "tab-active" : ""}`}
            onClick={() => {
              setActiveTab(tab.key);
              setQuery("");
            }}
          >
            {tab.label}
            <span className="tab-count">{data[tab.key].length}</span>
          </button>
        ))}
      </div>

      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`search-btn ${hovered ? "search-btn-hovered" : ""}`}
        >
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Search
        </button>
      </div>

      {/* List */}
      <div className="users-list">
        {list.length === 0 ? (
          <p className="no-results">No results found</p>
        ) : (
          list.map((user) => (
            <div key={user.id} className="user-card">
              <div
                className="avatar-wrap"
                onClick={() => setSelectedUser(user)}
              >
                <img src={user.image} alt={user.name} className="user-avatar" />
                <span
                  className={`status-dot ${
                    user.status === "Active" ? "dot-active" : "dot-inactive"
                  }`}
                />
              </div>

              <div className="user-info" onClick={() => setSelectedUser(user)}>
                <h3>{user.name}</h3>
                <p>{user.username}</p>
                <p className="user-id-label">{user.id}</p>
              </div>

              <span
                className={`role-tag ${
                  user.role === "Doctor" ? "role-doctor" : "role-student"
                }`}
              >
                {user.role}
              </span>

              <button className="action-btn">{actionLabel[activeTab]}</button>
            </div>
          ))
        )}
      </div>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>

            <div className="modal-header">
              <img
                src={selectedUser.image}
                alt={selectedUser.name}
                className="modal-image"
              />
              <div>
                <h2>{selectedUser.name}</h2>
                <p className="modal-username">{selectedUser.username}</p>
                <p className="modal-id-label">{selectedUser.id}</p>
                <span className="role-badge">{selectedUser.role}</span>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <span>Email</span>
                <p>{selectedUser.email}</p>
              </div>
              <div className="info-item">
                <span>Phone</span>
                <p>{selectedUser.phone}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
