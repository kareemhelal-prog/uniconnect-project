// server/utils/notify.js
//
// Single source of truth for creating a notification: inserts the row, then
// emits it in real-time to the recipient's personal room. Always persists
// first, then emits — so a missed socket never loses the notification.

const { promisePool } = require("../config/db");
const { emitToUser } = require("../config/socket");

/**
 * @param {Object}  opts
 * @param {number}  opts.userId       recipient
 * @param {number}  opts.senderId     who triggered it
 * @param {string}  opts.type         'like' | 'comment' | 'follow' | ...
 * @param {string}  opts.message      human text
 * @param {number} [opts.referenceId]        e.g. post id
 * @param {number} [opts.referenceCommentId] e.g. comment id (for deep-link)
 * @returns {Promise<Object|null>} the full notification row (or null if skipped)
 */
async function notify({ userId, senderId, type, message, referenceId = null, referenceCommentId = null }) {
  // Never notify yourself
  if (!userId || Number(userId) === Number(senderId)) return null;

  const [result] = await promisePool.query(
    "INSERT INTO Notifications (user_id, sender_id, type, message, reference_id, reference_comment_id) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, senderId, type, message, referenceId, referenceCommentId]
  );

  // Re-fetch with sender details so the client can render it directly —
  // same shape as GET /api/notifications.
  const [[row]] = await promisePool.query(
    `SELECT n.*,
            u.username        AS sender_username,
            u.name            AS sender_name,
            u.role            AS sender_role,
            u.profile_picture AS sender_avatar
     FROM Notifications n
     LEFT JOIN Users u ON n.sender_id = u.id
     WHERE n.id = ?`,
    [result.insertId]
  );

  emitToUser(userId, "new_notification", row);
  return row;
}

module.exports = { notify };
