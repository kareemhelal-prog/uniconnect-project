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
        (SELECT COUNT(*) FROM Reports WHERE status = 'pending') as pendingReports,
        (SELECT COUNT(*) FROM Users WHERE account_status = 'pending') as pendingAccounts
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

    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit  = Math.max(parseInt(req.query.limit) || 10, 1);
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const role   = (req.query.role || "").trim();

    const where  = [];
    const params = [];

    if (search) {
      where.push("(name LIKE ? OR username LIKE ? OR email LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (role && role !== "all") {
      where.push("role = ?");
      params.push(role);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await promisePool.query(
      `SELECT COUNT(*) AS total FROM Users ${whereSql}`,
      params
    );

    const [users] = await promisePool.query(
      `SELECT id, name, email, username, role, is_active, profile_picture, created_at
       FROM Users ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

exports.activateUser = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const [users] = await promisePool.query(
      "SELECT name FROM Users WHERE id = ?", [req.params.id]
    );

    await promisePool.query(
      "UPDATE Users SET is_active = 1 WHERE id = ?",
      [req.params.id]
    );

    await logActivity(req.user.id, "unban_user", users[0]?.name || `User #${req.params.id}`, "Activated account");

    res.json({ success: true, message: "User activated" });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const { role } = req.body;
    const allowed = ["student", "doctor", "investor", "admin"];

    if (!allowed.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const [users] = await promisePool.query(
      "SELECT name FROM Users WHERE id = ?", [req.params.id]
    );

    await promisePool.query(
      "UPDATE Users SET role = ? WHERE id = ?",
      [role, req.params.id]
    );

    await logActivity(req.user.id, "edit", users[0]?.name || `User #${req.params.id}`, `Changed role to ${role}`);

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

    const [users] = await promisePool.query(
      "SELECT name FROM Users WHERE id = ?", [req.params.id]
    );

    await promisePool.query(
      "UPDATE Users SET password = ? WHERE id = ?",
      [hashed, req.params.id]
    );

    await logActivity(req.user.id, "edit", users[0]?.name || `User #${req.params.id}`, "Reset password");

    res.json({ success: true, newPassword });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// =======================
// ACCOUNT APPROVAL
// =======================

// Pending signups awaiting review, with the data the admin needs to verify a
// student against the official registry record they claimed.
exports.getPendingUsers = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const [users] = await promisePool.query(`
      SELECT
        u.id, u.name, u.email, u.username, u.role, u.phone_number, u.created_at,
        ps.academic_year, ps.track,
        sr.academic_id, sr.full_name AS registry_name,
        sr.academic_year AS registry_year, sr.track AS registry_track
      FROM Users u
      LEFT JOIN Profile_Studies  ps ON ps.user_id   = u.id
      LEFT JOIN student_registry sr ON sr.claimed_by = u.id
      WHERE u.account_status = 'pending'
      ORDER BY u.created_at ASC
    `);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const [users] = await promisePool.query(
      "SELECT name, account_status FROM Users WHERE id = ?", [req.params.id]
    );
    if (users.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    await promisePool.query(
      `UPDATE Users
       SET account_status = 'approved', rejection_reason = NULL, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [req.user.id, req.params.id]
    );

    await logActivity(req.user.id, "approve_user", users[0].name || `User #${req.params.id}`, "Approved account");
    res.json({ success: true, message: "Account approved" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rejecting a pending account deletes it entirely (cascades to its profile,
// notifications, etc.) so we don't keep dead data, and releases the registry
// record so that academic ID can be registered again.
exports.rejectUser = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const reason = String(req.body.reason || "").trim().slice(0, 255);

    const [users] = await promisePool.query(
      "SELECT name FROM Users WHERE id = ?", [req.params.id]
    );
    if (users.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    await promisePool.query("UPDATE student_registry SET claimed_by = NULL WHERE claimed_by = ?", [req.params.id]);
    await promisePool.query("DELETE FROM Users WHERE id = ?", [req.params.id]);

    await logActivity(req.user.id, "reject_user", users[0].name || `User #${req.params.id}`, reason ? `Rejected & deleted: ${reason}` : "Rejected & deleted");
    res.json({ success: true, message: "Account rejected and removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// STUDENT REGISTRY
// =======================
const VALID_YEARS  = ["1", "2", "3", "4"];
const VALID_TRACKS = ["software", "networks"];

// Normalize+validate one registry row. Returns { row } or { error }.
function normalizeRegistryRow(raw) {
  const academic_id   = String(raw.academic_id ?? raw.id ?? "").trim();
  const full_name     = String(raw.full_name ?? raw.name ?? "").trim();
  const academic_year = String(raw.academic_year ?? raw.year ?? "").trim();
  let   track         = raw.track ? String(raw.track).trim().toLowerCase() : null;

  if (!academic_id || !full_name || !academic_year) return { error: "Missing academic_id, full_name or academic_year" };
  if (!VALID_YEARS.includes(academic_year)) return { error: `Invalid year "${academic_year}"` };

  if (academic_year === "3" || academic_year === "4") {
    if (!VALID_TRACKS.includes(track)) return { error: `Year ${academic_year} requires track software|networks` };
  } else {
    track = null; // years 1 & 2 have no track
  }
  return { row: { academic_id, full_name, academic_year, track } };
}

exports.getRegistry = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const search = (req.query.search || "").trim();
    const where  = [];
    const params = [];
    if (search) {
      where.push("(sr.academic_id LIKE ? OR sr.full_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await promisePool.query(
      `SELECT sr.id, sr.academic_id, sr.full_name, sr.academic_year, sr.track, sr.claimed_by,
              u.email AS claimed_email
       FROM student_registry sr
       LEFT JOIN Users u ON u.id = sr.claimed_by
       ${whereSql}
       ORDER BY sr.academic_year, sr.full_name
       LIMIT 500`,
      params
    );

    const [[counts]] = await promisePool.query(
      "SELECT COUNT(*) AS total, SUM(claimed_by IS NOT NULL) AS claimed FROM student_registry"
    );

    res.json({ success: true, registry: rows, counts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk upsert: accepts { entries: [{academic_id, full_name, academic_year, track}] }.
// Idempotent — re-importing the same academic_id updates the record (claimed
// rows keep their claim). Reports per-row errors without aborting the rest.
exports.importRegistry = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    if (entries.length === 0) return res.status(400).json({ success: false, message: "No entries provided" });
    if (entries.length > 5000) return res.status(400).json({ success: false, message: "Too many rows (max 5000 per import)" });

    const valid = [];
    const errors = [];
    const seen = new Set();
    entries.forEach((raw, i) => {
      const { row, error } = normalizeRegistryRow(raw);
      if (error) { errors.push({ line: i + 1, error }); return; }
      if (seen.has(row.academic_id)) { errors.push({ line: i + 1, error: `Duplicate academic_id "${row.academic_id}" in file` }); return; }
      seen.add(row.academic_id);
      valid.push(row);
    });

    let imported = 0;
    if (valid.length) {
      const values = valid.map((r) => [r.academic_id, r.full_name, r.academic_year, r.track]);
      // Don't clobber an existing claim; only update the descriptive fields.
      const [result] = await promisePool.query(
        `INSERT INTO student_registry (academic_id, full_name, academic_year, track)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           academic_year = VALUES(academic_year),
           track = VALUES(track)`,
        [values]
      );
      imported = result.affectedRows;
    }

    await logActivity(req.user.id, "import_registry", "Student registry", `Imported ${valid.length} rows`);
    res.json({ success: true, imported, validCount: valid.length, errorCount: errors.length, errors: errors.slice(0, 50) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRegistryEntry = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;
    await promisePool.query("DELETE FROM student_registry WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Registry entry deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
