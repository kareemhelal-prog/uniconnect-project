const { promisePool } = require("../config/db");

// خرائط تحويل بين شكل الـ ENUM في الداتابيز وشكل العرض في الفرونت
const reasonToDb = {
  "Inappropriate Content": "inappropriate_content",
  "Personal Harassment": "personal_harassment",
  "False Information": "false_information",
  "Other": "other",
};
const reasonFromDb = {
  inappropriate_content: "Inappropriate Content",
  personal_harassment: "Personal Harassment",
  false_information: "False Information",
  other: "Other",
};

const statusToDb = {
  Pending: "pending",
  Resolved: "resolved",
  Dismissed: "dismissed",
};
const statusFromDb = {
  pending: "Pending",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

// =======================
// CREATE REPORT (أي يوزر يبلغ عن محتوى)
// =======================
exports.createReport = async (req, res) => {
  try {
    const { reported_type, reported_item_id, reason } = req.body;

    const validTypes = ["user", "post", "comment", "file", "group"];
    const validReasons = Object.keys(reasonToDb);

    if (!reported_type || !reported_item_id || !reason) {
      return res.status(400).json({
        message: "reported_type, reported_item_id and reason are required"
      });
    }

    if (!validTypes.includes(reported_type)) {
      return res.status(400).json({ message: "Invalid reported_type" });
    }

    if (!validReasons.includes(reason)) {
      return res.status(400).json({ message: "Invalid reason" });
    }

    const [result] = await promisePool.query(
      `INSERT INTO Reports (reporter_id, reported_type, reported_item_id, reason)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, reported_type, reported_item_id, reasonToDb[reason]]
    );

    res.status(201).json({
      message: "Report submitted successfully",
      reportId: result.insertId
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET ALL REPORTS (ADMIN)
// =======================
exports.getAllReports = async (req, res) => {
  try {

    const [rows] = await promisePool.query(`
      SELECT
        r.id,
        r.reported_type,
        r.reported_item_id,
        r.reason,
        r.status,
        r.created_at,

        reporter.id   AS reporter_id,
        reporter.name AS reporter_name,
        reporter.username AS reporter_username,
        reporter.profile_picture AS reporter_avatar,

        p.id AS post_id, p.content AS post_content, pu.name AS post_author, pu.id AS post_author_id,
        c.id AS comment_id, c.content AS comment_content, cu.name AS comment_author, cu.id AS comment_author_id,
        f.id AS file_id, f.file_name AS file_name, fu.name AS file_uploader, fu.id AS file_uploader_id,
        g.id AS group_id, g.name AS group_name, g.description AS group_description, g.creator_id AS group_creator_id,
        ru.id AS reported_user_id, ru.name AS reported_user_name

      FROM Reports r
      JOIN Users reporter ON r.reporter_id = reporter.id
      LEFT JOIN Posts p     ON r.reported_type = 'post'    AND p.id = r.reported_item_id
      LEFT JOIN Users pu    ON pu.id = p.user_id
      LEFT JOIN Comments c  ON r.reported_type = 'comment' AND c.id = r.reported_item_id
      LEFT JOIN Users cu    ON cu.id = c.user_id
      LEFT JOIN Files f     ON r.reported_type = 'file'    AND f.id = r.reported_item_id
      LEFT JOIN Users fu    ON fu.id = f.uploader_id
      LEFT JOIN \`Groups\` g ON r.reported_type = 'group'   AND g.id = r.reported_item_id
      LEFT JOIN Users ru    ON r.reported_type = 'user'    AND ru.id = r.reported_item_id
      ORDER BY r.created_at DESC
    `);

    const data = rows.map((r) => {
      let content = "—";
      let contentBody = "";

      if (r.reported_type === "post") {
        content = `Post by ${r.post_author || "Unknown"}`;
        contentBody = r.post_content || "";
      } else if (r.reported_type === "comment") {
        content = "Comment on Post";
        contentBody = r.comment_content || "";
      } else if (r.reported_type === "file") {
        content = `File: ${r.file_name || "Unknown"}`;
        contentBody = `Uploaded by ${r.file_uploader || "Unknown"}`;
      } else if (r.reported_type === "group") {
        content = `Group: ${r.group_name || "Unknown"}`;
        contentBody = r.group_description || "";
      } else if (r.reported_type === "user") {
        content = `User: ${r.reported_user_name || "Unknown"}`;
        contentBody = "Reported user profile";
      }

      return {
        id: r.id,
        type: r.reported_type.charAt(0).toUpperCase() + r.reported_type.slice(1),
        content,
        contentBody,
        contentPreview: contentBody.length > 80 ? contentBody.slice(0, 80) + "..." : contentBody,
        reason: reasonFromDb[r.reason] || r.reason,
        status: statusFromDb[r.status] || r.status,
        reportedBy: r.reporter_name,
        username: r.reporter_username ? `@${r.reporter_username}` : "",
        avatar: r.reporter_avatar,
        avatarInitials: (r.reporter_name || "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        date: r.created_at,
      };
    });

    res.json({ message: "Reports fetched successfully", data });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// UPDATE STATUS (Resolve / Dismiss)
// =======================
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // "Resolved" أو "Dismissed"

    if (!["Resolved", "Dismissed"].includes(status)) {
      return res.status(400).json({ message: "status must be Resolved or Dismissed" });
    }

    const dbStatus = statusToDb[status]; // 'resolved' / 'dismissed' -> لتحديث Reports
    const logAction = status === "Resolved" ? "resolve" : "dismiss"; // -> لتحديث Activity_Logs (ENUM مختلف)

    const [reports] = await promisePool.query(`SELECT * FROM Reports WHERE id = ?`, [req.params.id]);
    if (reports.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    await promisePool.query(`UPDATE Reports SET status = ? WHERE id = ?`, [dbStatus, req.params.id]);

    await promisePool.query(
      `INSERT INTO Activity_Logs (admin_id, action_type, target_id, details)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, logAction, req.params.id, `Report #${req.params.id} marked as ${dbStatus}`]
    );

    res.json({ message: `Report ${status.toLowerCase()} successfully` });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// =======================
// DELETE REPORTED CONTENT
// =======================
exports.deleteReportedContent = async (req, res) => {
  try {

    const [reports] = await promisePool.query(`SELECT * FROM Reports WHERE id = ?`, [req.params.id]);
    if (reports.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    const report = reports[0];
    let actionType = "delete";

    switch (report.reported_type) {
      case "post":
        await promisePool.query(`DELETE FROM Posts WHERE id = ?`, [report.reported_item_id]);
        break;
      case "comment":
        await promisePool.query(`DELETE FROM Comments WHERE id = ?`, [report.reported_item_id]);
        break;
      case "file":
        await promisePool.query(`DELETE FROM Files WHERE id = ?`, [report.reported_item_id]);
        break;
      case "group":
        await promisePool.query(`DELETE FROM \`Groups\` WHERE id = ?`, [report.reported_item_id]);
        break;
      case "user":
        // مش بنمسح حساب المستخدم نهائي، بنعمله تعطيل (Ban)
        await promisePool.query(`UPDATE Users SET is_active = FALSE WHERE id = ?`, [report.reported_item_id]);
        actionType = "ban_user";
        break;
      default:
        return res.status(400).json({ message: "Unknown reported_type" });
    }

    await promisePool.query(`UPDATE Reports SET status = 'resolved' WHERE id = ?`, [req.params.id]);

    await promisePool.query(
      `INSERT INTO Activity_Logs (admin_id, action_type, target_id, details)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, actionType, req.params.id, `Deleted content for report #${req.params.id} (${report.reported_type})`]
    );

    res.json({ message: "Content deleted and report resolved" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// SEND WARNING
// =======================
exports.sendWarning = async (req, res) => {
  try {

    const [reports] = await promisePool.query(`SELECT * FROM Reports WHERE id = ?`, [req.params.id]);
    if (reports.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    const report = reports[0];

    // نحدد مين هو صاحب المحتوى المخالف عشان نبعتله التحذير
    let recipientId = null;
    if (report.reported_type === "user") {
      recipientId = report.reported_item_id;
    } else if (report.reported_type === "post") {
      const [[row]] = await promisePool.query(`SELECT user_id FROM Posts WHERE id = ?`, [report.reported_item_id]);
      recipientId = row?.user_id || null;
    } else if (report.reported_type === "comment") {
      const [[row]] = await promisePool.query(`SELECT user_id FROM Comments WHERE id = ?`, [report.reported_item_id]);
      recipientId = row?.user_id || null;
    } else if (report.reported_type === "file") {
      const [[row]] = await promisePool.query(`SELECT uploader_id FROM Files WHERE id = ?`, [report.reported_item_id]);
      recipientId = row?.uploader_id || null;
    } else if (report.reported_type === "group") {
      const [[row]] = await promisePool.query(`SELECT creator_id FROM \`Groups\` WHERE id = ?`, [report.reported_item_id]);
      recipientId = row?.creator_id || null;
    }

    if (!recipientId) {
      return res.status(400).json({ message: "Could not determine content owner" });
    }

    const subject = "Content Policy Warning";
    const message = req.body.message ||
      "Your content has been reported and reviewed by our team. Please make sure your future posts follow the platform's community guidelines.";

    await promisePool.query(
      `INSERT INTO Email_Logs (admin_id, recipient_id, recipient_type, subject, message, type)
       VALUES (?, ?, 'individual', ?, ?, 'warning')`,
      [req.user.id, recipientId, subject, message]
    );

    await promisePool.query(
      `INSERT INTO Activity_Logs (admin_id, action_type, target_id, details)
       VALUES (?, 'send_email', ?, ?)`,
      [req.user.id, req.params.id, `Warning sent for report #${req.params.id}`]
    );

    res.json({ message: "Warning logged successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};