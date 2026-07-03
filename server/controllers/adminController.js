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
        (SELECT COUNT(*) FROM Users WHERE account_status = 'pending' AND (needs_profile IS NULL OR needs_profile = 0)) as pendingAccounts
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
// LIVE FEED  (real-time site activity, polled by the admin Live page)
// =======================
// Returns the most recent site_events. Supports incremental polling via
// ?after=<id> so the client only fetches events newer than the last one it saw.
exports.getLiveFeed = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const after = parseInt(req.query.after) || 0;
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 40, 1), 100);
    const type  = (req.query.type || "").trim();

    const where  = [];
    const params = [];
    if (after) { where.push("e.id > ?");          params.push(after); }
    if (type)  { where.push("e.event_type = ?");  params.push(type); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [events] = await promisePool.query(
      `SELECT e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
              e.summary, e.created_at,
              COALESCE(u.name, e.actor_name) AS actor_name,
              u.role AS actor_role, u.profile_picture AS actor_avatar
       FROM site_events e
       LEFT JOIN Users u ON u.id = e.actor_id
       ${whereSql}
       ORDER BY e.id DESC
       LIMIT ?`,
      [...params, limit]
    );

    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Users seen within the last N minutes (default 5) → "online now".
exports.getOnlineUsers = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const minutes = Math.min(Math.max(parseInt(req.query.minutes) || 5, 1), 60);

    const [users] = await promisePool.query(
      `SELECT id, name, username, role, profile_picture, last_seen
       FROM Users
       WHERE last_seen IS NOT NULL
         AND last_seen > (NOW() - INTERVAL ? MINUTE)
       ORDER BY last_seen DESC
       LIMIT 100`,
      [minutes]
    );

    res.json({ success: true, online: users, count: users.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Aggregated series for the dashboard charts.
exports.getAnalytics = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const [usersByDay] = await promisePool.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM Users
      WHERE created_at > (NOW() - INTERVAL 30 DAY)
      GROUP BY DATE(created_at) ORDER BY day
    `);

    const [postsByDay] = await promisePool.query(`
      SELECT DATE(created_at) AS day, COUNT(*) AS count
      FROM Posts
      WHERE created_at > (NOW() - INTERVAL 30 DAY)
      GROUP BY DATE(created_at) ORDER BY day
    `);

    const [roleDist] = await promisePool.query(`
      SELECT role, COUNT(*) AS count FROM Users GROUP BY role
    `);

    const [eventsByType] = await promisePool.query(`
      SELECT event_type, COUNT(*) AS count
      FROM site_events
      WHERE created_at > (NOW() - INTERVAL 7 DAY)
      GROUP BY event_type ORDER BY count DESC
    `);

    res.json({ success: true, analytics: { usersByDay, postsByDay, roleDist, eventsByType } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// OVERVIEW  (single round-trip payload for the premium dashboard)
// =======================
// Bundles totals, period-over-period deltas, 14-day sparklines, role
// distribution, online count and the latest events so the dashboard renders
// from one request instead of fanning out to /stats + /analytics + /online.
exports.getOverview = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const win = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);

    const [[totals]] = await promisePool.query(`
      SELECT
        (SELECT COUNT(*) FROM Users)                                            AS users,
        (SELECT COUNT(*) FROM Posts)                                            AS posts,
        (SELECT COUNT(*) FROM \`Groups\`)                                       AS \`groups\`,
        (SELECT COUNT(*) FROM Projects)                                         AS projects,
        (SELECT COUNT(*) FROM Reports WHERE status = 'pending')                 AS pendingReports,
        (SELECT COUNT(*) FROM Users   WHERE account_status = 'pending' AND (needs_profile IS NULL OR needs_profile = 0)) AS pendingAccounts,
        (SELECT COUNT(*) FROM Users   WHERE last_seen > (NOW() - INTERVAL 5 MINUTE)) AS online
    `);

    // Current window vs the immediately preceding window, per metric.
    const deltaFor = async (table) => {
      const [[r]] = await promisePool.query(
        `SELECT
           SUM(created_at > (NOW() - INTERVAL ? DAY)) AS cur,
           SUM(created_at <= (NOW() - INTERVAL ? DAY) AND created_at > (NOW() - INTERVAL ? DAY)) AS prev
         FROM ${table}`,
        [win, win, win * 2]
      );
      return { cur: Number(r.cur || 0), prev: Number(r.prev || 0) };
    };

    const seriesFor = async (table) => {
      const [rows] = await promisePool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM ${table}
         WHERE created_at > (NOW() - INTERVAL 14 DAY)
         GROUP BY DATE(created_at) ORDER BY day`
      );
      return rows;
    };

    const [dUsers, dPosts, dGroups, dProjects, sUsers, sPosts, roleRes, recentRes] =
      await Promise.all([
        deltaFor("Users"), deltaFor("Posts"), deltaFor("`Groups`"), deltaFor("Projects"),
        seriesFor("Users"), seriesFor("Posts"),
        promisePool.query(`SELECT role, COUNT(*) AS count FROM Users GROUP BY role`),
        promisePool.query(`
          SELECT e.id, e.event_type, e.summary, e.created_at,
                 COALESCE(u.name, e.actor_name) AS actor_name,
                 u.profile_picture AS actor_avatar
          FROM site_events e LEFT JOIN Users u ON u.id = e.actor_id
          ORDER BY e.id DESC LIMIT 8`),
      ]);

    res.json({
      success: true,
      overview: {
        totals,
        window: win,
        deltas:   { users: dUsers, posts: dPosts, groups: dGroups, projects: dProjects },
        spark:    { users: sUsers, posts: sPosts },
        roleDist: roleRes[0],
        recent:   recentRes[0],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    // Keep curriculum courses — just unassign this doctor from them (the rest
    // of the user's data is removed automatically by ON DELETE CASCADE).
    await promisePool.query("UPDATE Courses SET doctor_id = NULL WHERE doctor_id = ?", [req.params.id]);

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
        COALESCE(ps.academic_id, sr.academic_id) AS academic_id,
        sr.full_name AS registry_name,
        sr.academic_year AS registry_year, sr.track AS registry_track
      FROM Users u
      LEFT JOIN Profile_Studies  ps ON ps.user_id   = u.id
      LEFT JOIN student_registry sr ON sr.claimed_by = u.id
      WHERE u.account_status = 'pending'
        AND (u.needs_profile IS NULL OR u.needs_profile = 0)
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
    await promisePool.query("UPDATE Courses SET doctor_id = NULL WHERE doctor_id = ?", [req.params.id]);
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

// =======================
// CONTENT MANAGEMENT (Posts / Projects / Groups)
// =======================

// Unified posts+comments feed for the Posts moderation page.
// Returns rows shaped { id, title, author, type, created_at } with pagination.
exports.getAdminPosts = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit  = Math.max(parseInt(req.query.limit) || 10, 1);
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const type   = (req.query.type || "").trim();

    const base = `
      FROM (
        SELECT p.id,
               COALESCE(NULLIF(TRIM(p.title), ''), LEFT(p.content, 80)) AS title,
               u.name AS author, 'post' AS type, p.created_at
        FROM Posts p JOIN Users u ON u.id = p.user_id
        UNION ALL
        SELECT c.id, LEFT(c.content, 80) AS title,
               u.name AS author, 'comment' AS type, c.created_at
        FROM Comments c JOIN Users u ON u.id = c.user_id
      ) x`;

    const where = [], params = [];
    if (type === "post" || type === "comment") { where.push("x.type = ?"); params.push(type); }
    if (search) { where.push("(x.title LIKE ? OR x.author LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await promisePool.query(`SELECT COUNT(*) AS total ${base} ${whereSql}`, params);
    const [posts] = await promisePool.query(
      `SELECT x.* ${base} ${whereSql} ORDER BY x.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ success: true, posts, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAdminPost = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;
    const [r] = await promisePool.query("DELETE FROM Posts WHERE id = ?", [req.params.id]);
    await logActivity(req.user.id, "delete", `Post #${req.params.id}`, "Deleted post");
    res.json({ success: true, deleted: r.affectedRows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePostComments = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;
    const [r] = await promisePool.query("DELETE FROM Comments WHERE post_id = ?", [req.params.id]);
    await logActivity(req.user.id, "delete", `Post #${req.params.id}`, `Deleted ${r.affectedRows} comment(s)`);
    res.json({ success: true, deleted: r.affectedRows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminProjects = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit  = Math.max(parseInt(req.query.limit) || 10, 1);
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const category = (req.query.category || "").trim();

    const where = ["1=1"], params = [];
    if (search)   { where.push("(p.title LIKE ? OR p.description LIKE ? OR u.name LIKE ?)"); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (category && category.toLowerCase() !== "all") { where.push("LOWER(p.category) = ?"); params.push(category.toLowerCase()); }
    const whereSql = `WHERE ${where.join(" AND ")}`;

    const [[{ total }]] = await promisePool.query(
      `SELECT COUNT(*) AS total FROM Projects p LEFT JOIN Users u ON u.id = p.creator_id ${whereSql}`, params
    );
    const [projects] = await promisePool.query(
      `SELECT p.id, p.title, p.description, p.category, p.created_at,
              COALESCE(u.name, 'Unknown') AS creator_name,
              COALESCE(u.username, '—')   AS creator_username,
              (SELECT COUNT(*) FROM Project_Members pm WHERE pm.project_id = p.id) AS members_count
       FROM Projects p LEFT JOIN Users u ON u.id = p.creator_id
       ${whereSql}
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ success: true, projects, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAdminProject = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;
    await promisePool.query("DELETE FROM Projects WHERE id = ?", [req.params.id]);
    await logActivity(req.user.id, "delete", `Project #${req.params.id}`, "Deleted project");
    res.json({ success: true, message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdminGroups = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;

    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit  = Math.max(parseInt(req.query.limit) || 10, 1);
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const groupType = (req.query.group_type || "").trim().toLowerCase();

    const where = ["1=1"], params = [];
    if (search) { where.push("(g.name LIKE ? OR g.description LIKE ? OR u.name LIKE ?)"); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (groupType === "private") where.push("g.is_private = 1");
    else if (groupType === "public") where.push("g.is_private = 0");
    const whereSql = `WHERE ${where.join(" AND ")}`;

    const [[{ total }]] = await promisePool.query(
      `SELECT COUNT(*) AS total FROM \`Groups\` g LEFT JOIN Users u ON u.id = g.creator_id ${whereSql}`, params
    );
    const [groups] = await promisePool.query(
      `SELECT g.id, g.name, g.description, g.created_at,
              COALESCE(u.name, 'Unknown') AS creator_name,
              CASE WHEN g.is_private THEN 'private' ELSE 'public' END AS group_type,
              NULL AS academic_year,
              (SELECT COUNT(*) FROM Group_Members gm WHERE gm.group_id = g.id) AS members_count
       FROM \`Groups\` g LEFT JOIN Users u ON u.id = g.creator_id
       ${whereSql}
       ORDER BY g.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ success: true, groups, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAdminGroup = async (req, res) => {
  try {
    if (!isAdmin(req, res)) return;
    await promisePool.query("DELETE FROM `Groups` WHERE id = ?", [req.params.id]);
    await logActivity(req.user.id, "delete", `Group #${req.params.id}`, "Deleted group");
    res.json({ success: true, message: "Group deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
