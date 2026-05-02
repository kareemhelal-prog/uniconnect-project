const { promisePool } = require("../config/db");

// =======================
// GET USER NOTIFICATIONS
// =======================
exports.getNotifications = async (req, res) => {
  try {
    const [notifications] = await promisePool.query(
      `SELECT Notifications.*, Users.username AS sender_name
       FROM Notifications
       LEFT JOIN Users ON Notifications.sender_id = Users.id
       WHERE Notifications.user_id = ?
       ORDER BY Notifications.created_at DESC`,
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
// MARK AS READ
// =======================
exports.markAsRead = async (req, res) => {
  try {
    await promisePool.query(
      "UPDATE Notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

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