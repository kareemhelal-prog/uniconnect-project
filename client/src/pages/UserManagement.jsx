import "../styles/UserManagement.css";
import { useState, useEffect, useMemo, useCallback } from "react";
import { FaUsers, FaUserGraduate, FaChalkboardTeacher, FaBriefcase } from "react-icons/fa";
import api from "../api/axios";

const ROLE_COLORS = {
  student:  "role-student",
  doctor:   "role-doctor",
  investor: "role-investor",
  admin:    "role-admin",
};

/* ── Toast ── */
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className={`um-toast um-toast-${type}`}>{message}</div>;
}

/* ── Stat Card ── */
function StatCard({ icon, value, label, accent }) {
  return (
    <div className={`um-stat-card um-stat-${accent}`}>
      <div className="um-stat-icon-wrap">
        <span className="um-stat-icon">{icon}</span>
      </div>
      <div className="um-stat-body">
        <span className="um-stat-value">{value.toLocaleString()}</span>
        <span className="um-stat-label">{label}</span>
      </div>
    </div>
  );
}

/* ── User Modal ── */
function UserModal({ user, onClose, onRoleChange, onResetPassword, onToggleStatus, onDelete }) {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    await onRoleChange(user.id, newRole);
  };

  const handleReset = async () => {
    setLoading(true);
    await onResetPassword(user);
    setLoading(false);
  };

  return (
    <div className="um-modal-overlay" onClick={onClose}>
      <div className="um-modal" onClick={e => e.stopPropagation()}>
        <div className="um-modal-header">
          <div className="um-modal-user-info">
            <div className="um-modal-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="um-modal-name-row">
                <h3 className="um-modal-name">{user.name}</h3>
              </div>
              <span className={`um-role-badge ${ROLE_COLORS[user.role]}`}>
                {user.role}
              </span>
            </div>
          </div>
          <button className="um-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="um-modal-body">
          <div className="um-modal-section">
            <h4 className="um-modal-section-title">User Information</h4>
            <div className="um-modal-info-grid">
              {[
                ["Full Name", user.name],
                ["Email",     user.email],
                ["Username",  user.username],
                ["Role",      user.role],
                ["Status",    user.is_active ? "Active" : "Inactive"],
                ["Joined",    new Date(user.created_at).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k} className="um-info-row">
                  <span className="um-info-key">{k}</span>
                  <span className={`um-info-val ${k === "Status" ? (user.is_active ? "text-active" : "text-inactive") : ""}`}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="um-modal-section">
            <div className="um-modal-role-box">
              <h4 className="um-modal-section-title">Role Management</h4>
              <select className="um-role-select" value={role} onChange={handleRoleChange}>
                <option value="student">Student</option>
                <option value="doctor">Doctor</option>
                <option value="investor">Investor</option>
                <option value="admin">Admin</option>
              </select>
              <p className="um-modal-hint-sm">Change user role to update permissions.</p>
            </div>

            <div className="um-modal-security-box">
              <h4 className="um-modal-section-title">Actions</h4>
              <button
                className={`um-toggle-btn ${user.is_active ? "deactivate" : "activate"}`}
                onClick={() => onToggleStatus(user)}
              >
                {user.is_active ? "🚫 Deactivate User" : "✅ Activate User"}
              </button>
              <button
                className="um-reset-btn"
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? "Sending..." : "🔒 Reset Password"}
              </button>
              <button
                className="um-delete-btn"
                onClick={() => { onDelete(user.id); onClose(); }}
              >
                🗑️ Delete User
              </button>
            </div>
          </div>
        </div>

        <div className="um-modal-footer">
          <button className="um-btn-close-modal" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function UserManagement() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast,        setToast]        = useState(null);
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const LIMIT = 10;

  const showToast = (text, type = "success") => setToast({ text, type });

  /* Fetch users */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        ...(search   && { search }),
        ...(roleFilter !== "all" && { role: roleFilter }),
      });
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users);
      setTotal(res.data.pagination.total);
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* Reset page on filter/search change */
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  /* Stats */
  const stats = useMemo(() => ({
    total:     users.length,
    students:  users.filter(u => u.role === "student").length,
    doctors:   users.filter(u => u.role === "doctor").length,
    investors: users.filter(u => u.role === "investor").length,
  }), [users]);

  /* Actions */
  const toggleStatus = async (user) => {
    try {
      const endpoint = user.is_active
        ? `/admin/users/${user.id}/deactivate`
        : `/admin/users/${user.id}/activate`;
      await api.put(endpoint);
      showToast(`${user.name} ${user.is_active ? "deactivated" : "activated"}`);
      fetchUsers();
    } catch {
      showToast("Action failed", "error");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showToast("User deleted successfully");
      fetchUsers();
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const verifyInvestor = async (user) => {
    try {
      await api.post(`/projects/investors/${user.id}/verify`, { verified: true });
      showToast(`${user.name} marked as a verified investor`);
    } catch {
      showToast("Could not verify", "error");
    }
  };

  const changeRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      showToast(`Role updated to ${role}`);
      fetchUsers();
    } catch {
      showToast("Role update failed", "error");
    }
  };

  const resetPassword = async (user) => {
    try {
      const res = await api.post(`/admin/users/${user.id}/reset-password`);
      showToast(`New password: ${res.data.newPassword}`);
    } catch {
      showToast("Reset failed", "error");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="um-page">
      {/* Header */}
      <div className="um-page-header">
        <div>
          <h1 className="um-page-title">User Management</h1>
          <p className="um-page-sub">Manage and monitor all users on the platform.</p>
        </div>
        <div className="um-page-header-badge">
          <span className="um-live-dot" />
          Live
        </div>
      </div>

      {/* Stats */}
      <div className="um-stats-bar">
        <StatCard icon={<FaUsers />}             value={total}          label="Total Users" accent="cyan"   />
        <StatCard icon={<FaUserGraduate />}      value={stats.students}  label="Students"    accent="blue"   />
        <StatCard icon={<FaChalkboardTeacher />} value={stats.doctors}   label="Doctors"     accent="purple" />
        <StatCard icon={<FaBriefcase />}         value={stats.investors} label="Investors"   accent="green"  />
      </div>

      {/* Table Panel */}
      <div className="um-table-panel">
        {/* Toolbar */}
        <div className="um-toolbar">
          <div className="um-search-wrap">
            <span className="um-search-icon">🔍</span>
            <input
              className="um-search-input"
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="um-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          <div className="um-filter-row">
            <span className="um-filter-label">Filter:</span>
            {["all", "student", "doctor", "investor"].map(r => (
              <button
                key={r}
                className={`um-filter-btn ${roleFilter === r ? "active" : ""}`}
                onClick={() => setRoleFilter(r)}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="um-table-wrap">
          {loading ? (
            <div className="um-loading">Loading...</div>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="um-table-empty">No users found</td>
                  </tr>
                )}
                {users.map(user => (
                  <tr
                    key={user.id}
                    className="um-table-row"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="um-user-cell">
                      <div className="um-user-avatar">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="um-user-name">{user.name}</span>
                    </td>
                    <td className="um-email-cell">{user.email}</td>
                    <td>
                      <span className={`um-role-badge ${ROLE_COLORS[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="um-date-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`um-status ${user.is_active ? "active" : "inactive"}`}>
                        <span className="um-status-led" />
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="um-actions">
                        {user.role === "investor" && (
                          <button
                            className="um-act-btn activate"
                            title="Mark as verified investor"
                            onClick={() => verifyInvestor(user)}
                          >
                            ✔
                          </button>
                        )}
                        <button
                          className={`um-act-btn ${user.is_active ? "deactivate" : "activate"}`}
                          title={user.is_active ? "Deactivate" : "Activate"}
                          onClick={() => toggleStatus(user)}
                        >
                          {user.is_active ? "✏️" : "✓"}
                        </button>
                        <button
                          className="um-act-btn delete"
                          title="Delete user"
                          onClick={() => deleteUser(user.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer + Pagination */}
        <div className="um-table-footer">
          <span>Showing {users.length} of {total} users</span>
          {totalPages > 1 && (
            <div className="um-pagination">
              <button
                className="um-page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ←
              </button>
              <span className="um-page-info">{page} / {totalPages}</span>
              <button
                className="um-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedUser && (
        <UserModal
          user={users.find(u => u.id === selectedUser.id) || selectedUser}
          onClose={() => setSelectedUser(null)}
          onRoleChange={changeRole}
          onResetPassword={resetPassword}
          onToggleStatus={toggleStatus}
          onDelete={deleteUser}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}