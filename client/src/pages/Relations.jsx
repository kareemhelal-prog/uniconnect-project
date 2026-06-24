import React, { useState, useEffect } from "react";
import "../styles/Relations.css";
import api from "../api/axios";

const TABS = [
  { key: "followers", label: "Followers" },
  { key: "following", label: "Following" },
];

const actionLabel = {
  followers: "Remove",
  following: "Unfollow",
};

const Users = () => {
  const [activeTab,    setActiveTab]    = useState("followers");
  const [data,         setData]         = useState({ followers: [], following: [] });
  const [loading,      setLoading]      = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [query,        setQuery]        = useState("");

  useEffect(() => {
    fetchRelations();
  }, []);

  const fetchRelations = async () => {
    setLoading(true);
    try {
      const [followersRes, followingRes] = await Promise.all([
        api.get("/followers"),
        api.get("/following"),
      ]);
      setData({
        followers: followersRes.data.data || followersRes.data || [],
        following: followingRes.data.data  || followingRes.data  || [],
      });
    } catch (err) {
      console.error("Failed to fetch relations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId) => {
    try {
      if (activeTab === "following") {
        await api.delete(`/follow/${userId}`);
        setData((prev) => ({
          ...prev,
          following: prev.following.filter((u) => u.id !== userId),
        }));
      } else {
        await api.delete(`/followers/${userId}`);
        setData((prev) => ({
          ...prev,
          followers: prev.followers.filter((u) => u.id !== userId),
        }));
      }
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  const list = (data[activeTab] || []).filter(
    (u) =>
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.username?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="users-container">
      <h1 className="admin-title">Relations</h1>

      <div className="tabs-row">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "tab-active" : ""}`}
            onClick={() => { setActiveTab(tab.key); setQuery(""); }}
          >
            {tab.label}
            <span className="tab-count">{data[tab.key]?.length || 0}</span>
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
      </div>

      <div className="users-list">
        {loading ? (
          <p className="no-results">Loading...</p>
        ) : list.length === 0 ? (
          <p className="no-results">No results found</p>
        ) : (
          list.map((user) => (
            <div key={user.id} className="user-card">
              <div className="avatar-wrap" onClick={() => setSelectedUser(user)}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#6c47ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              </div>

              <div className="user-info" onClick={() => setSelectedUser(user)}>
                <h3>{user.name}</h3>
                <p>{user.username}</p>
              </div>

              <span className={`role-tag ${user.role === "doctor" ? "role-doctor" : "role-student"}`}>
                {user.role}
              </span>

              <button className="action-btn" onClick={() => handleAction(user.id)}>
                {actionLabel[activeTab]}
              </button>
            </div>
          ))
        )}
      </div>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedUser(null)}>×</button>
            <div className="modal-header">
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#6c47ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 700 }}>
                {selectedUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2>{selectedUser.name}</h2>
                <p className="modal-username">{selectedUser.username}</p>
                <span className="role-badge">{selectedUser.role}</span>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span>Email</span>
                <p>{selectedUser.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;