const { promisePool } = require("../config/db");

// =======================
// GET ALL NOTIFICATIONS
// =======================
exports.getNotifications = async (req, res) => {
  try {
    const [notifications] = await promisePool.query(
      `SELECT 
         n.*,
         u.username AS sender_username,
         u.name     AS sender_name,
         u.role     AS sender_role,
         u.profile_picture AS sender_avatar
       FROM Notifications n
       LEFT JOIN Users u ON n.sender_id = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: "Notifications fetched",
      data: notifications
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// GET UNREAD NOTIFICATIONS
// =======================
exports.getUnreadNotifications = async (req, res) => {
  try {
    const [notifications] = await promisePool.query(
      `SELECT 
         n.*,
         u.username AS sender_username,
         u.name     AS sender_name,
         u.role     AS sender_role,
         u.profile_picture AS sender_avatar
       FROM Notifications n
       LEFT JOIN Users u ON n.sender_id = u.id
       WHERE n.user_id = ? AND n.is_read = 0
       ORDER BY n.created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: "Unread notifications fetched",
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// MARK ONE AS READ
// =======================
exports.markAsRead = async (req, res) => {
  try {
    const [result] = await promisePool.query(
      "UPDATE Notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      message: "Notification marked as read"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// MARK ALL AS READ
// =======================
exports.markAllAsRead = async (req, res) => {
  try {
    await promisePool.query(
      "UPDATE Notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
      [req.user.id]
    );

    res.json({
      message: "All notifications marked as read"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// =======================
// DELETE NOTIFICATION
// =======================
exports.deleteNotification = async (req, res) => {
  try {
    const [result] = await promisePool.query(
      "DELETE FROM Notifications WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      message: "Notification deleted"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
