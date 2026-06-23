const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const emailController = require("../controllers/emailController");

router.use(authenticateToken);
router.use(adminMiddleware);

router.get("/search-users",      emailController.searchUsers);
router.get("/recipients-count",  emailController.getRecipientsCount);
router.post("/send",             emailController.sendEmail);
router.get("/history",           emailController.getEmailHistory);

module.exports = router;