const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const { authenticateToken } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.use(authenticateToken);

// Create Report (Ø£ÙŠ ÙŠÙˆØ²Ø±)
router.post("/", reportController.createReport);

// Admin only
router.get("/admin/all", adminMiddleware, reportController.getAllReports);
router.patch("/:id/status", adminMiddleware, reportController.updateStatus);
router.delete("/:id/content", adminMiddleware, reportController.deleteReportedContent);
router.post("/:id/warning", adminMiddleware, reportController.sendWarning);

module.exports = router;
