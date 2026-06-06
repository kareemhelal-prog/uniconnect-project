const { promisePool } = require("../config/db");
const bcrypt = require("bcrypt");

// =======================
// HELPER: ADMIN CHECK
// =======================
const isAdmin = (req, res) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return false;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({ success: false, message: "Admin only" });
    return false;
  }

  return true;
};

// =======================
// GET STATS
// =======================
exports.getStats = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const [rows] = await promisePool.query(`
      SELECT
        (SELECT COUNT(*) FROM Users) as users,
        (SELECT COUNT(*) FROM Posts) as posts,
        (SELECT COUNT(*) FROM \`Groups\`) as groups,
        (SELECT COUNT(*) FROM Projects) as projects,
        (SELECT COUNT(*) FROM Reports WHERE status = 'pending') as pendingReports
    `);

    res.json({
      success: true,
      stats: rows[0]
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =======================
// SEARCH
// =======================
exports.search = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search required"
      });
    }

    const term = `%${q.trim()}%`;

    const [users] = await promisePool.query(
      `SELECT id, name, username, email, role, is_active FROM Users
       WHERE name LIKE ? OR username LIKE ?
       LIMIT 20`,
      [term, term]
    );

    const [groups] = await promisePool.query(
      `SELECT id, name, description FROM \`Groups\`
       WHERE name LIKE ?
       LIMIT 20`,
      [term]
    );

    const [posts] = await promisePool.query(
      `SELECT p.id, p.content, u.name
       FROM Posts p
       LEFT JOIN Users u ON u.id = p.user_id
       WHERE p.content LIKE ?
       LIMIT 20`,
      [term]
    );

    res.json({
      success: true,
      results: { users, groups, posts }
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// =======================
// USERS
// =======================
exports.getAllUsers = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const [users] = await promisePool.query(
      `SELECT id, name, email, username, role, is_active FROM Users`
    );

    res.json({ success: true, users });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    await promisePool.query(
      "UPDATE Users SET is_active = 0 WHERE id = ?",
      [req.params.id]
    );

    res.json({ success: true, message: "User deactivated" });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.activateUser = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    await promisePool.query(
      "UPDATE Users SET is_active = 1 WHERE id = ?",
      [req.params.id]
    );

    res.json({ success: true, message: "User activated" });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    await promisePool.query(
      "DELETE FROM Users WHERE id = ?",
      [req.params.id]
    );

    res.json({ success: true, message: "User deleted" });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { role } = req.body;

    await promisePool.query(
      "UPDATE Users SET role = ? WHERE id = ?",
      [role, req.params.id]
    );

    res.json({ success: true, message: "Role updated" });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const newPassword = Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(newPassword, 10);

    await promisePool.query(
      "UPDATE Users SET password = ? WHERE id = ?",
      [hashed, req.params.id]
    );

    res.json({
      success: true,
      newPassword
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// =======================
// REPORTS
// =======================
exports.getAllReports = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const [reports] = await promisePool.query(
      `SELECT * FROM Reports ORDER BY created_at DESC`
    );

    res.json({ success: true, reports });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    await promisePool.query(
      "UPDATE Reports SET status='resolved' WHERE id=?",
      [req.params.id]
    );

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.dismissReport = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    await promisePool.query(
      "UPDATE Reports SET status='dismissed' WHERE id=?",
      [req.params.id]
    );

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.deleteReportedContent = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { content_type, content_id } = req.body;

    if (content_type === "post") {
      await promisePool.query("DELETE FROM Posts WHERE id=?", [content_id]);
    }

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};