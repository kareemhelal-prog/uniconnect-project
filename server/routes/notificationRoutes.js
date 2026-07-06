const express = require("express");
const router  = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require("../controllers/notificationController");

// ÙƒÙ„ Ø§Ù„Ù€ routes Ù…Ø­ØªØ§Ø¬Ø© login
router.use(authenticateToken);

// GET /api/notifications         â€” Ø¬ÙŠØ¨ ÙƒÙ„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª
router.get("/", getNotifications);

// GET /api/notifications/unread  â€” Ø¬ÙŠØ¨ Ø§Ù„ØºÙŠØ± Ù…Ù‚Ø±ÙˆØ¡Ø© Ø¨Ø³
router.get("/unread", getUnreadNotifications);

// PATCH /api/notifications/read-all     â€” Ø¹Ù„Ù‘Ù… ÙƒÙ„Ù‡Ù… ÙƒÙ…Ù‚Ø±ÙˆØ¡ÙŠÙ†
router.patch("/read-all", markAllAsRead);

// PATCH /api/notifications/:id/read     â€” Ø¹Ù„Ù‘Ù… Ø¥Ø´Ø¹Ø§Ø± Ù…Ø¹ÙŠÙ† ÙƒÙ…Ù‚Ø±ÙˆØ¡
router.patch("/:id/read", markAsRead);

// DELETE /api/notifications/:id  â€” Ø§Ø­Ø°Ù Ø¥Ø´Ø¹Ø§Ø±
router.delete("/:id", deleteNotification);

module.exports = router;

