const express = require("express");

const router = express.Router();

const groupPostController = require("../controllers/groupPostController");

const { authenticateToken } = require("../middleware/authMiddleware");

// protect routes
router.use(authenticateToken);

// CREATE POST
router.post("/", groupPostController.createGroupPost);

// GET POSTS
router.get("/:groupId", groupPostController.getGroupPosts);

module.exports = router;

