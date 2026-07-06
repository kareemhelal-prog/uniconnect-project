const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

router.get("/", authenticateToken, profileController.getProfile);
router.get("/:id", authenticateToken, profileController.getUserById);

module.exports = router;
