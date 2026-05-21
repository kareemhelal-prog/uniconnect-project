const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");

const {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require("../controllers/notificationController");

// كل الـ routes محتاجة login
router.use(auth);

// GET /api/notifications         — جيب كل الإشعارات
router.get("/", getNotifications);

// GET /api/notifications/unread  — جيب الغير مقروءة بس
router.get("/unread", getUnreadNotifications);

// PATCH /api/notifications/read-all     — علّم كلهم كمقروءين
router.patch("/read-all", markAllAsRead);

// PATCH /api/notifications/:id/read     — علّم إشعار معين كمقروء
router.patch("/:id/read", markAsRead);

// DELETE /api/notifications/:id  — احذف إشعار
router.delete("/:id", deleteNotification);

module.exports = router;
