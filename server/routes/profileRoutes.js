const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

router.get("/", authMiddleware, profileController.getProfile);
router.get("/:id", authMiddleware, profileController.getUserById);

module.exports = router;