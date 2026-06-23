const { promisePool } = require("../config/db");

// =======================
// دالة مساعدة — تستخدم جوه أي controller تاني عشان تسجل عملية أدمن
// logActivity(adminId, "resolve" | "dismiss" | "delete" | "ban_user" | "send_email", targetLabel, details)
// =======================
exports.logActivity = async (adminId, actionType, targetLabel, details) => {
  try {
    await promisePool.query(
      `INSERT INTO Activity_Logs (admin_id, action_type, target_label, details) VALUES (?, ?, ?, ?)`,
      [adminId, actionType, targetLabel || null, details || null]
    );
  } catch (error) {
    console.error("logActivity error:", error);
  }
};

// =======================
// GET /api/admin/activity-logs
// =======================
exports.getActivityLogs = async (req, res) => {
  try {
    const [logs] = await promisePool.query(`
      SELECT
        al.id, al.action_type, al.target_label, al.details, al.created_at,
        u.id AS admin_id, u.name AS admin_name, u.role AS admin_role,
        u.profile_picture AS admin_avatar
      FROM Activity_Logs al
      JOIN Users u ON al.admin_id = u.id
      ORDER BY al.created_at DESC
    `);

    res.json({ success: true, data: logs });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
