const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// get notifications
router.get("/", notificationController.getNotifications);

// mark as read
router.put("/:id", notificationController.markAsRead);

module.exports = router;