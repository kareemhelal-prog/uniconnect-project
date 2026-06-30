const { promisePool } = require("../config/db");

// =======================
// SITE-WIDE EVENT LOGGER
// =======================
// Appends one row to `site_events` so the admin Live Feed can show what's
// happening across the platform in (near) real time. This is intentionally
// fire-and-forget: a logging failure must never break the user action that
// triggered it, so all errors are swallowed.
//
// Usage:
//   const { logEvent } = require("../utils/logEvent");
//   logEvent({ actorId: req.user.id, actorName: name, type: "post_create",
//              targetType: "post", targetId: postId, summary: "New post" });
//
// `type` is a free string (no enum) — common values:
//   login | signup | post_create | comment_create | group_join |
//   project_create | report_create | review_create | file_upload | follow
async function logEvent({ actorId = null, actorName = null, type, targetType = null, targetId = null, summary = null }) {
  try {
    if (!type) return;
    await promisePool.query(
      `INSERT INTO site_events (actor_id, actor_name, event_type, target_type, target_id, summary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [actorId, actorName, type, targetType, targetId, summary ? String(summary).slice(0, 255) : null]
    );
  } catch (err) {
    // Non-critical telemetry — log and move on.
    console.error("logEvent error:", err.message);
  }
}

module.exports = { logEvent };
