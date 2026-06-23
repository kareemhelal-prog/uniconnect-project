const { promisePool } = require("../config/db");
const { logActivity } = require("./activityLogController");
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
exports.deactivateUser = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const [users] = await promisePool.query(
      "SELECT name FROM Users WHERE id = ?", [req.params.id]
    );

    await promisePool.query(
      "UPDATE Users SET is_active = 0 WHERE id = ?",
      [req.params.id]
    );

    await logActivity(req.user.id, "ban_user", users[0]?.name || `User #${req.params.id}`, "Banned account");

    res.json({ success: true, message: "User deactivated" });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const [users] = await promisePool.query(
      "SELECT name FROM Users WHERE id = ?", [req.params.id]
    );

    await promisePool.query(
      "DELETE FROM Users WHERE id = ?",
      [req.params.id]
    );

    await logActivity(req.user.id, "delete", users[0]?.name || `User #${req.params.id}`, "Deleted user account");

    res.json({ success: true, message: "User deleted" });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// =======================
// REPORTS
// =======================
exports.resolveReport = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    await promisePool.query(
      "UPDATE Reports SET status='resolved' WHERE id=?",
      [req.params.id]
    );

    await logActivity(req.user.id, "resolve", `Report #${req.params.id}`, "Resolved report");

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

    await logActivity(req.user.id, "dismiss", `Report #${req.params.id}`, "Dismissed report as invalid");

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

    await logActivity(req.user.id, "delete", `${content_type} #${content_id}`, `Deleted ${content_type}`);

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// =======================
// ANNOUNCEMENTS
// =======================
exports.getAllAnnouncements = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const [rows] = await promisePool.query(
      `SELECT a.*, u.name AS admin_name
       FROM Announcements a
       JOIN Users u ON a.admin_id = u.id
       ORDER BY a.created_at DESC`
    );

    res.json({ success: true, announcements: rows });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { title, content, target } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required" });
    }

    const [result] = await promisePool.query(
      "INSERT INTO Announcements (admin_id, title, content, target) VALUES (?, ?, ?, ?)",
      [req.user.id, title, content, target || "Everyone"]
    );

    res.status(201).json({
      success: true,
      message: "Announcement published",
      announcementId: result.insertId
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    await promisePool.query("DELETE FROM Announcements WHERE id = ?", [req.params.id]);

    res.json({ success: true, message: "Announcement deleted" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
